import os
import joblib
import numpy as np
from typing import Dict, Any

from app.config import settings
from app.models.telemetry import TelemetryPayload
from app.ml.dataset_generator import FEATURE_COLUMNS, LABELS
from app.ml.trainer import train_all_models

class ExfiltrationPredictor:
    def __init__(self):
        self.scaler = None
        self.iso_forest = None
        self.rf_model = None
        self.xgb_model = None
        self.label_encoder = None
        self.load_or_train_models()

    def load_or_train_models(self):
        try:
            if (os.path.exists(settings.SCALER_PATH) and 
                os.path.exists(settings.ISOLATION_FOREST_PATH) and 
                os.path.exists(settings.RANDOM_FOREST_PATH) and 
                os.path.exists(settings.XGBOOST_PATH)):
                
                self.scaler = joblib.load(settings.SCALER_PATH)
                self.iso_forest = joblib.load(settings.ISOLATION_FOREST_PATH)
                self.rf_model = joblib.load(settings.RANDOM_FOREST_PATH)
                self.xgb_model = joblib.load(settings.XGBOOST_PATH)
                self.label_encoder = joblib.load(os.path.join(settings.MODEL_DIR, "label_encoder.joblib"))
            else:
                print("[ML Predictor] Models missing. Executing initial model training pipeline...")
                train_all_models(num_samples=4000)
                self.load_or_train_models()
        except Exception as e:
            print(f"[ML Predictor] Error loading models ({e}). Retraining...")
            train_all_models(num_samples=4000)
            self.scaler = joblib.load(settings.SCALER_PATH)
            self.iso_forest = joblib.load(settings.ISOLATION_FOREST_PATH)
            self.rf_model = joblib.load(settings.RANDOM_FOREST_PATH)
            self.xgb_model = joblib.load(settings.XGBOOST_PATH)
            self.label_encoder = joblib.load(os.path.join(settings.MODEL_DIR, "label_encoder.joblib"))

    def predict(self, telemetry: TelemetryPayload) -> Dict[str, Any]:
        # Extract features array
        feat_vector = np.array([[
            telemetry.file_mod_rate_per_sec,
            telemetry.staging_folder_growth_mb_per_sec,
            telemetry.archive_ext_entropy_score,
            telemetry.archive_process_active,
            telemetry.cli_exfil_tool_active,
            telemetry.outbound_bytes_per_sec,
            telemetry.active_network_sockets,
            telemetry.cloud_domain_dns_query_count,
            telemetry.usb_drive_mounted,
            telemetry.usb_write_bytes_per_sec,
            telemetry.off_hours_flag,
            telemetry.user_baseline_dev_index
        ]])

        scaled_vector = self.scaler.transform(feat_vector)

        # 1. Isolation Forest Anomaly Detection
        iso_pred = self.iso_forest.predict(scaled_vector)[0] # -1 anomaly, 1 normal
        iso_score = float(self.iso_forest.decision_function(scaled_vector)[0]) # lower = more anomalous
        is_anomaly = bool(iso_pred == -1)

        # Normalize iso score to 0..1 scale (where 1 is highly anomalous)
        # typical decision_function is around -0.3 to +0.3
        iso_anomaly_weight = max(0.0, min(1.0, (0.25 - iso_score) / 0.5))

        # 2. XGBoost Prediction & Probabilities
        xgb_probs = self.xgb_model.predict_proba(scaled_vector)[0]
        xgb_class_idx = np.argmax(xgb_probs)
        predicted_category = str(self.label_encoder.inverse_transform([xgb_class_idx])[0])
        xgb_confidence = float(xgb_probs[xgb_class_idx])

        # 3. Random Forest Prediction & Probabilities
        rf_probs = self.rf_model.predict_proba(scaled_vector)[0]
        rf_class_idx = np.argmax(rf_probs)

        # Unified Risk Score Calculation (0 to 100)
        # Normal class index
        normal_idx = list(self.label_encoder.classes_).index("Normal")
        abnormal_prob_xgb = 1.0 - xgb_probs[normal_idx]
        abnormal_prob_rf = 1.0 - rf_probs[normal_idx]

        combined_prob = (0.50 * abnormal_prob_xgb) + (0.30 * abnormal_prob_rf) + (0.20 * iso_anomaly_weight)
        
        # Scale risk score
        risk_score = round(float(combined_prob * 100.0), 1)

        # Severity level assignment
        if risk_score >= 80.0:
            severity = "Critical"
        elif risk_score >= 55.0:
            severity = "High"
        elif risk_score >= 25.0:
            severity = "Medium"
        else:
            severity = "Low"

        # Calculate Explainable AI (XAI) Feature Contributions
        importances = self.xgb_model.feature_importances_
        # Feature impact scaled by Z-score deviation from 0
        z_scores = np.abs(scaled_vector[0])
        raw_contribs = importances * z_scores
        total_contrib = np.sum(raw_contribs) + 1e-6
        norm_contribs = raw_contribs / total_contrib

        feature_contributions = {
            feat: round(float(weight * 100), 1)
            for feat, weight in zip(FEATURE_COLUMNS, norm_contribs)
        }

        return {
            "risk_score": risk_score,
            "severity": severity,
            "anomaly_flag": is_anomaly,
            "attack_category": predicted_category,
            "confidence": round(xgb_confidence, 3),
            "feature_contributions": feature_contributions,
            "iso_score": round(iso_score, 4)
        }

predictor = ExfiltrationPredictor()
