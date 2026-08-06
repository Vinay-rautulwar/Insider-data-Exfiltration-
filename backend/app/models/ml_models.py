from pydantic import BaseModel
from typing import Dict, Any, List

class ModelPerformanceMetrics(BaseModel):
    isolation_forest: Dict[str, Any]
    random_forest: Dict[str, Any]
    xgboost: Dict[str, Any]
    last_trained: str
    feature_names: List[str]
    sample_count: int

class RetrainResponse(BaseModel):
    status: str
    message: str
    metrics: ModelPerformanceMetrics
