from fastapi import APIRouter, HTTPException, Depends
from typing import Optional
from app.db import get_db

router = APIRouter()

@router.get("/alerts")
def list_alerts(status: Optional[str] = None, severity: Optional[str] = None, limit: int = 100, db=Depends(get_db)):
    alerts_col = db.get_collection("alerts")
    query = {}
    if status:
        query["status"] = status
    if severity:
        query["severity"] = severity
        
    docs = list(alerts_col.find(query=query, limit=limit))
    for d in docs:
        if "_id" in d:
            d["_id"] = str(d["_id"])
    return docs

@router.get("/alerts/summary")
def get_alerts_summary(db=Depends(get_db)):
    alerts_col = db.get_collection("alerts")
    endpoints_col = db.get_collection("endpoints")
    
    all_alerts = list(alerts_col.find(limit=5000))
    active_alerts = [a for a in all_alerts if a.get("status") == "Active"]
    
    critical_count = sum(1 for a in active_alerts if a.get("severity") == "Critical")
    high_count = sum(1 for a in active_alerts if a.get("severity") == "High")
    medium_count = sum(1 for a in active_alerts if a.get("severity") == "Medium")
    low_count = sum(1 for a in active_alerts if a.get("severity") == "Low")
    
    active_count = len(active_alerts)
    mitigated_count = sum(1 for a in all_alerts if a.get("status") in ["Mitigated", "Resolved"])
    
    # Endpoints summary
    endpoints = list(endpoints_col.find(limit=1000))
    total_endpoints = max(len(endpoints), 4)
    
    if active_alerts:
        avg_risk = round(sum(a.get("risk_score", 0) for a in active_alerts) / len(active_alerts), 1)
    else:
        avg_risk = 12.0

    return {
        "total_alerts": len(all_alerts),
        "active_alerts": active_count,
        "mitigated_alerts": mitigated_count,
        "severity_counts": {
            "Critical": critical_count,
            "High": high_count,
            "Medium": medium_count,
            "Low": low_count
        },
        "total_monitored_endpoints": total_endpoints,
        "avg_system_risk_score": avg_risk
    }

@router.put("/alerts/{alert_id}/status")
def update_alert_status(alert_id: str, payload: dict, db=Depends(get_db)):
    new_status = payload.get("status", "Resolved")
    alerts_col = db.get_collection("alerts")
    
    res = alerts_col.update_one({"alert_id": alert_id}, {"$set": {"status": new_status}})
    return {"status": "success", "alert_id": alert_id, "new_status": new_status}

@router.delete("/alerts/{alert_id}")
def delete_alert(alert_id: str, db=Depends(get_db)):
    alerts_col = db.get_collection("alerts")
    alerts_col.delete_one({"alert_id": alert_id})
    return {"status": "deleted", "alert_id": alert_id}
