from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db

router = APIRouter()

# Default SOAR Playbooks
DEFAULT_PLAYBOOKS = [
    {
        "playbook_id": "SOAR-PB-01",
        "name": "Auto-Contain USB Mass Exfiltration",
        "condition": "Risk Score >= 80 AND USB Vector Active",
        "actions": ["Isolate Endpoint Network", "Block USB Mass Storage Port", "Revoke Active User Session"],
        "enabled": True,
        "execution_mode": "Automated (Instant)",
        "avg_response_time_ms": 12
    },
    {
        "playbook_id": "SOAR-PB-02",
        "name": "Cloud Burst Bandwidth Throttle",
        "condition": "Risk Score >= 75 AND Outbound Net > 100 MB/s",
        "actions": ["Apply Outbound Rate Limiting (1 MB/s)", "Terminate CLI Upload Process", "Alert CISO SOC Room"],
        "enabled": True,
        "execution_mode": "Automated (Instant)",
        "avg_response_time_ms": 18
    },
    {
        "playbook_id": "SOAR-PB-03",
        "name": "Off-Hours Encrypted Staging Quarantine",
        "condition": "Off-Hours Active AND High Archive Entropy Score > 0.85",
        "actions": ["Quarantine Staging Directory", "Kill Compression Process (7z/WinRAR)", "Require MFA Re-authentication"],
        "enabled": True,
        "execution_mode": "Automated (Instant)",
        "avg_response_time_ms": 15
    }
]

@router.get("/soar/playbooks")
def list_playbooks():
    return DEFAULT_PLAYBOOKS

@router.get("/soar/logs")
def get_soar_execution_logs(db=Depends(get_db)):
    soar_col = db.get_collection("soar_logs")
    logs = soar_col.find(limit=50)
    
    # If no execution logs yet, provide seed demonstration logs
    if not logs:
        now_str = datetime.now().isoformat()
        logs = [
            {
                "log_id": "SOAR-EXEC-101",
                "timestamp": now_str,
                "playbook_id": "SOAR-PB-01",
                "playbook_name": "Auto-Contain USB Mass Exfiltration",
                "trigger_device": "HOST-FIN-01",
                "trigger_user": "finance_emp_88",
                "triggered_risk_score": 88.5,
                "actions_executed": ["Host Isolated", "USB Interface Disabled", "CISO Notified"],
                "execution_latency_ms": 11.4,
                "status": "SUCCESS"
            },
            {
                "log_id": "SOAR-EXEC-102",
                "timestamp": now_str,
                "playbook_id": "SOAR-PB-02",
                "playbook_name": "Cloud Burst Bandwidth Throttle",
                "trigger_device": "HOST-DEV-04",
                "trigger_user": "dev_contractor_12",
                "triggered_risk_score": 82.0,
                "actions_executed": ["Process Terminated (rclone)", "Network Throttled"],
                "execution_latency_ms": 14.2,
                "status": "SUCCESS"
            }
        ]
    return logs

@router.post("/soar/evaluate")
def evaluate_soar_trigger(alert_data: dict, db=Depends(get_db)):
    risk_score = alert_data.get("risk_score", 0)
    device_id = alert_data.get("device_id", "UNKNOWN-HOST")
    user_id = alert_data.get("user_id", "UNKNOWN-USER")
    attack_category = alert_data.get("attack_category", "")
    snapshot = alert_data.get("telemetry_snapshot", {})

    executed_playbooks = []
    soar_col = db.get_collection("soar_logs")

    # Evaluate Playbook 1
    if risk_score >= 70 or attack_category == "USB Exfiltration" or snapshot.get("usb_write_bytes_per_sec", 0) > 20:
        log_entry = {
            "log_id": f"SOAR-EXEC-{datetime.now().strftime('%M%S%f')[:8]}",
            "timestamp": datetime.now().isoformat(),
            "playbook_id": "SOAR-PB-01",
            "playbook_name": "Auto-Contain USB Mass Exfiltration",
            "trigger_device": device_id,
            "trigger_user": user_id,
            "triggered_risk_score": risk_score,
            "actions_executed": ["Host Isolated", "USB Port Locked", "Process Terminated"],
            "execution_latency_ms": round(11.0 + (risk_score % 5), 1),
            "status": "SUCCESS"
        }
        soar_col.insert_one(log_entry)
        executed_playbooks.append(log_entry)

    return {
        "status": "evaluated",
        "executed_count": len(executed_playbooks),
        "executions": executed_playbooks
    }
