import os
import joblib
import datetime
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import precision_recall_fscore_support, accuracy_score
import xgboost as xgb

from app.config import settings
from app.ml.dataset_generator import generate_telemetry_dataset, FEATURE_COLUMNS, LABELS

def train_all_models(num_samples: int = 4000) -> dict:
    df = generate_telemetry_dataset(num_samples=num_samples)
    
    X = df[FEATURE_COLUMNS].values
    y_raw = df["label"].values
    
    # Label Encoding for Supervised Classifiers
    label_encoder = LabelEncoder()
    label_encoder.fit(LABELS)
    y = label_encoder.transform(y_raw)
    
    # Stratified Train/Test Split (75% Train, 25% Out-of-Sample Test)
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=42, stratify=y
    )
    
    # Feature Scaling (Fit on Train only to prevent data leakage)
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    # 1. Isolation Forest (Unsupervised Anomaly Detection)
    iso_forest = IsolationForest(
        n_estimators=120,
        contamination=0.22,
        random_state=42,
        n_jobs=-1
    )
    iso_forest.fit(X_train_scaled)
    iso_test_preds = iso_forest.predict(X_test_scaled)
    anomaly_ratio = float(np.mean(iso_test_preds == -1))
    
    # 2. Random Forest Classifier (Regularized to prevent overfitting)
    rf_model = RandomForestClassifier(
        n_estimators=100,
        max_depth=6,
        min_samples_leaf=4,
        max_features='sqrt',
        random_state=42,
        n_jobs=-1
    )
    rf_model.fit(X_train_scaled, y_train)
    rf_test_preds = rf_model.predict(X_test_scaled)
    
    rf_acc = float(accuracy_score(y_test, rf_test_preds))
    rf_p, rf_r, rf_f1, _ = precision_recall_fscore_support(y_test, rf_test_preds, average='macro')
    
    # 3. XGBoost Classifier (Regularized with weight decay & subsampling)
    xgb_model = xgb.XGBClassifier(
        n_estimators=80,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.1,
        reg_lambda=1.0,
        random_state=42,
        eval_metric='mlogloss',
        n_jobs=-1
    )
    xgb_model.fit(X_train_scaled, y_train)
    xgb_test_preds = xgb_model.predict(X_test_scaled)
    
    xgb_acc = float(accuracy_score(y_test, xgb_test_preds))
    xgb_p, xgb_r, xgb_f1, _ = precision_recall_fscore_support(y_test, xgb_test_preds, average='macro')
    
    # Feature Importances from XGBoost
    importances = xgb_model.feature_importances_
    feat_importance_dict = {feat: float(imp) for feat, imp in zip(FEATURE_COLUMNS, importances)}
    
    # Save artifacts
    os.makedirs(settings.MODEL_DIR, exist_ok=True)
    joblib.dump(scaler, settings.SCALER_PATH)
    joblib.dump(iso_forest, settings.ISOLATION_FOREST_PATH)
    joblib.dump(rf_model, settings.RANDOM_FOREST_PATH)
    joblib.dump(xgb_model, settings.XGBOOST_PATH)
    joblib.dump(label_encoder, os.path.join(settings.MODEL_DIR, "label_encoder.joblib"))
    
    metrics = {
        "isolation_forest": {
            "model_type": "Isolation Forest (Unsupervised)",
            "outlier_anomaly_ratio": round(anomaly_ratio, 4),
            "n_estimators": 120,
            "status": "Trained & Active"
        },
        "random_forest": {
            "model_type": "Random Forest Classifier (Out-of-Sample Test Evaluation)",
            "accuracy": round(rf_acc, 4),
            "precision": round(float(rf_p), 4),
            "recall": round(float(rf_r), 4),
            "f1_score": round(float(rf_f1), 4),
            "status": "Trained & Active"
        },
        "xgboost": {
            "model_type": "XGBoost Classifier (Out-of-Sample Test Evaluation)",
            "accuracy": round(xgb_acc, 4),
            "precision": round(float(xgb_p), 4),
            "recall": round(float(xgb_r), 4),
            "f1_score": round(float(xgb_f1), 4),
            "feature_importances": feat_importance_dict,
            "status": "Trained & Active"
        },
        "last_trained": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "feature_names": FEATURE_COLUMNS,
        "sample_count": num_samples,
        "test_sample_count": len(y_test)
    }
    
    return metrics
