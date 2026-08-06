import uuid
from datetime import datetime
from fastapi import APIRouter, HTTPException, Depends
from app.models.telemetry import TelemetryPayload, ThreatAlert
from app.ml.predictor import predictor
from app.db import get_db

router = APIRouter()

def build_suspicious_action_summary(payload: TelemetryPayload, prediction: dict) -> str:
    actions = []
    if payload.usb_write_bytes_per_sec > 1.0 or payload.usb_drive_mounted == 1:
        actions.append(f"Removable USB Copy Event ({payload.usb_write_bytes_per_sec:.1f} MB/s)")
    if payload.archive_ext_entropy_score > 0.05 or payload.archive_process_active == 1:
        actions.append(f"Payload Compressed (.zip/.7z entropy: {(payload.archive_ext_entropy_score * 100):.0f}%)")
    if payload.outbound_bytes_per_sec > 10.0 or payload.cli_exfil_tool_active == 1:
        actions.append(f"Cloud Upload Burst ({payload.outbound_bytes_per_sec:.1f} MB/s)")
    if payload.file_mod_rate_per_sec > 2.0:
        actions.append(f"File Mod Velocity ({payload.file_mod_rate_per_sec:.1f} files/sec)")
    if payload.off_hours_flag == 1:
        actions.append("Off-Hours Access")
    
    if not actions:
        return f"Behavioral Anomaly Event ({prediction['attack_category']})"
    return " | ".join(actions)

@router.post("/telemetry")
def ingest_telemetry(payload: TelemetryPayload, db=Depends(get_db)):
    if not payload.timestamp:
        payload.timestamp = datetime.now().isoformat()

    # 1. AI Real-Time Prediction
    prediction = predictor.predict(payload)
    
    # 2. Save Telemetry snapshot
    telemetry_col = db.get_collection("telemetry")
    telemetry_doc = payload.model_dump()
    telemetry_doc["prediction"] = prediction
    telemetry_col.insert_one(telemetry_doc)

    # 3. Update or Track Endpoint Status
    endpoints_col = db.get_collection("endpoints")
    existing_ep = endpoints_col.find_one({"device_id": payload.device_id})
    
    client_ip = payload.ip_address or (existing_ep.get("ip_address") if existing_ep else "192.168.1.105")
    hostname = payload.hostname or (existing_ep.get("hostname") if existing_ep else payload.device_id.replace("HOST-", ""))
    cpu_usage = payload.cpu_usage_pct if payload.cpu_usage_pct is not None else (existing_ep.get("cpu_usage_pct") if existing_ep else 24.5)
    ram_usage = payload.ram_usage_pct if payload.ram_usage_pct is not None else (existing_ep.get("ram_usage_pct") if existing_ep else 48.0)
    
    update_data = {
        "device_id": payload.device_id,
        "user_id": payload.user_id,
        "hostname": hostname,
        "department": existing_ep.get("department", "Live Agent Workstation") if existing_ep else "Live Agent Workstation",
        "ip_address": client_ip,
        "os": existing_ep.get("os", "Windows 11 (Sysmon Agent)") if existing_ep else "Windows 11 (Sysmon Agent)",
        "last_seen": payload.timestamp,
        "current_risk_score": prediction["risk_score"],
        "status": "Online",
        "agent_status": "Online",
        "severity": prediction["severity"],
        "isolation_status": existing_ep.get("isolation_status", "Standard Network") if existing_ep else "Standard Network",
        "usb_port_status": existing_ep.get("usb_port_status", "Active") if existing_ep else "Active",
        "cpu_usage_pct": cpu_usage,
        "ram_usage_pct": ram_usage
    }
    
    endpoints_col.update_one(
        {"device_id": payload.device_id},
        {"$set": update_data},
        upsert=True
    )

    # 4. Generate Alert ONLY if actual suspicious activity / anomaly occurred
    alert = None
    is_suspicious_event = (
        prediction["attack_category"] != "Normal" or
        prediction["risk_score"] >= 45.0 or
        prediction["anomaly_flag"] or
        payload.usb_write_bytes_per_sec > 2.0 or
        payload.file_mod_rate_per_sec > 3.0 or
        payload.archive_ext_entropy_score > 0.05 or
        payload.archive_process_active == 1 or
        payload.cli_exfil_tool_active == 1
    )

    if is_suspicious_event:
        alerts_col = db.get_collection("alerts")
        alert_id = f"ALT-{uuid.uuid4().hex[:8].upper()}"
        suspicious_action = build_suspicious_action_summary(payload, prediction)
        
        alert_data = {
            "alert_id": alert_id,
            "timestamp": payload.timestamp,
            "device_id": payload.device_id,
            "user_id": payload.user_id,
            "risk_score": prediction["risk_score"],
            "severity": prediction["severity"],
            "anomaly_flag": prediction["anomaly_flag"],
            "attack_category": prediction["attack_category"],
            "suspicious_action": suspicious_action,
            "confidence": prediction["confidence"],
            "feature_contributions": prediction["feature_contributions"],
            "telemetry_snapshot": payload.model_dump(),
            "status": "Active"
        }
        alerts_col.insert_one(alert_data)
        alert = alert_data

        # Automatically engage AI Adaptive Security Shield & dispatch instant SMTP email notification
        try:
            from app.api.adaptive_shield import trigger_adaptive_shield_and_email
            shield_res = trigger_adaptive_shield_and_email(
                db=db,
                device_id=payload.device_id,
                user_id=payload.user_id,
                risk_score=prediction["risk_score"],
                attack_category=prediction["attack_category"],
                suspicious_action=suspicious_action,
                telemetry_snapshot=payload.model_dump()
            )
            alert_data["adaptive_shield_engaged"] = True
            alert_data["shield_details"] = shield_res
        except Exception as ex:
            print(f"[Adaptive Shield Trigger Error] {ex}")

    if alert and "_id" in alert:
        alert["_id"] = str(alert["_id"])

    return {
        "status": "processed",
        "device_id": payload.device_id,
        "prediction": prediction,
        "alert_created": alert is not None,
        "alert": alert
    }

@router.get("/telemetry/recent")
def get_recent_telemetry(limit: int = 50, db=Depends(get_db)):
    telemetry_col = db.get_collection("telemetry")
    docs = list(telemetry_col.find(limit=limit))
    for d in docs:
        if "_id" in d:
            d["_id"] = str(d["_id"])
    return docs
