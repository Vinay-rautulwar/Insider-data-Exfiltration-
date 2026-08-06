import os
try:
    from dotenv import load_dotenv
    # Load .env from backend directory or parent root if present
    backend_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    root_dir = os.path.dirname(backend_dir)
    load_dotenv(os.path.join(backend_dir, ".env"))
    load_dotenv(os.path.join(root_dir, ".env"))
except ImportError:
    pass

class Settings:
    PROJECT_NAME: str = "Insider Data Exfiltration Detection System"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Database Settings
    MONGODB_URL: str = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "exfiltration_db")
    
    # ML Models Path
    MODEL_DIR: str = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "ml_artifacts")
    ISOLATION_FOREST_PATH: str = os.path.join(MODEL_DIR, "isolation_forest.joblib")
    RANDOM_FOREST_PATH: str = os.path.join(MODEL_DIR, "random_forest.joblib")
    XGBOOST_PATH: str = os.path.join(MODEL_DIR, "xgboost_model.joblib")
    SCALER_PATH: str = os.path.join(MODEL_DIR, "scaler.joblib")

    # SMTP Email Alert Settings
    SMTP_SERVER: str = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    SMTP_PORT: int = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER: str = os.getenv("SMTP_USER", "sec-alerts@insidershield.ai")
    SMTP_PASSWORD: str = os.getenv("SMTP_PASSWORD", "")
    SENDER_EMAIL: str = os.getenv("SENDER_EMAIL", "alerts@insidershield.ai")
    ADMIN_EMAIL: str = os.getenv("ADMIN_EMAIL", "admin@company.com")
    SMTP_USE_TLS: bool = os.getenv("SMTP_USE_TLS", "True").lower() == "true"

settings = Settings()

os.makedirs(settings.MODEL_DIR, exist_ok=True)

