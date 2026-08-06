from fastapi import APIRouter, Depends
from app.ml.trainer import train_all_models
from app.ml.predictor import predictor
from app.db import get_db

router = APIRouter()

@router.get("/models/metrics")
def get_model_metrics():
    try:
        # Generate metrics on current models
        metrics = train_all_models(num_samples=2000)
        return metrics
    except Exception as e:
        return {"error": str(e)}

@router.post("/models/retrain")
def retrain_models(samples: int = 4000):
    metrics = train_all_models(num_samples=samples)
    predictor.load_or_train_models()
    return {
        "status": "success",
        "message": f"Successfully retrained Isolation Forest, Random Forest, and XGBoost models on {samples} telemetry samples.",
        "metrics": metrics
    }
