import os
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.config import settings
from app.db import get_db
from app.api import telemetry, alerts, simulator, models_api, soar, endpoints, reports, vault, adaptive_shield
from app.ml.predictor import predictor

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: ensure models loaded and seed baseline alerts if DB is empty
    print("[Startup] Initializing Exfiltration Detection AI Engine...")
    db = get_db()
    alerts_col = db.get_collection("alerts")
    if alerts_col.count_documents({}) == 0:
        print("[Startup] Seeding initial clean baseline telemetry...")
        from app.api.simulator import trigger_attack_simulation
        from app.models.telemetry import SimulationRequest
        # Seed clean normal baseline state as initial system default
        trigger_attack_simulation(SimulationRequest(attack_type="normal_baseline", device_id="HOST-FIN-01", user_id="finance_emp_88"), db=db)
    yield
    print("[Shutdown] Exfiltration Detection System shutting down.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

# Enable CORS for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers
app.include_router(telemetry.router, prefix=settings.API_V1_STR, tags=["Telemetry"])
app.include_router(alerts.router, prefix=settings.API_V1_STR, tags=["Alerts"])
app.include_router(simulator.router, prefix=settings.API_V1_STR, tags=["Simulator"])
app.include_router(models_api.router, prefix=settings.API_V1_STR, tags=["ML Models"])
app.include_router(soar.router, prefix=settings.API_V1_STR, tags=["SOAR Engine"])
app.include_router(endpoints.router, prefix=settings.API_V1_STR, tags=["Endpoints Fleet"])
app.include_router(reports.router, prefix=settings.API_V1_STR, tags=["Reports Exporter"])
app.include_router(vault.router, prefix=settings.API_V1_STR, tags=["Vault Lock Engine"])
app.include_router(adaptive_shield.router, prefix=settings.API_V1_STR, tags=["AI Adaptive Security Shield"])

@app.get("/")
def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "privacy_guarantee": "Strict Metadata & Behavioral Monitoring (Zero File Content Inspection)",
        "docs_url": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
