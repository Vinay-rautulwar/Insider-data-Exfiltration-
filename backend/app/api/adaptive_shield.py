from datetime import datetime
from typing import Dict, Any, List, Optional
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.config import settings
from app.db import get_db
from app.services.smtp_service import SMTPService

router = APIRouter()

# Schema for updating configuration
class ShieldConfigUpdate(BaseModel):
    admin_email: Optional[str] = None
    smtp_server: Optional[str] = None
    smtp_port: Optional[int] = None
    smtp_user: Optional[str] = None
    smtp_password: Optional[str] = None
    sender_email: Optional[str] = None
    smtp_use_tls: Optional[bool] = None
    auto_trigger_enabled: Optional[bool] = None

class ToggleBlockadeRequest(BaseModel):
    blockade_key: str  # usb_disabled, cloud_upload_blocked, sensitive_folders_locked, email_attachment_limited, external_file_sharing_blocked
    enabled: bool

class TriggerSimulatedAttackRequest(BaseModel):
    device_id: Optional[str] = "HOST-FIN-01"
    user_id: Optional[str] = "insider_suspect_99"
    attack_category: Optional[str] = "USB & Cloud Data Sharing Exfiltration"
    risk_score: Optional[float] = 94.5
    suspicious_action: Optional[str] = "Unauthorized Bulk Data Sharing & USB Dump Detected"

def get_shield_state_doc(db):
    col = db.get_collection("adaptive_shield_state")
    doc = col.find_one({"_id": "global_state"})
    if not doc:
        default_state = {
            "_id": "global_state",
            "shield_active": True,
            "auto_trigger_enabled": True,
            "last_triggered": None,
            "total_trigger_count": 0,
            "admin_email": settings.ADMIN_EMAIL,
            "smtp_server": settings.SMTP_SERVER,
            "smtp_port": settings.SMTP_PORT,
            "smtp_user": settings.SMTP_USER,
            "smtp_password": settings.SMTP_PASSWORD,
            "sender_email": settings.SENDER_EMAIL,
            "smtp_use_tls": settings.SMTP_USE_TLS,
            "blockades": {
                "usb_disabled": {
                    "key": "usb_disabled",
                    "title": "USB Automatically Disable",
                    "description": "Removable USB mass storage write access and mount interface disabled",
                    "icon": "Usb",
                    "status": "ARMED", # ARMED, ENFORCED, DISABLED
                    "auto_enforced": False
                },
                "cloud_upload_blocked": {
                    "key": "cloud_upload_blocked",
                    "title": "Cloud Upload Temporarily Block",
                    "description": "Outbound HTTP/S cloud storage uploads (Google Drive, Dropbox, Mega) blocked",
                    "icon": "CloudOff",
                    "status": "ARMED",
                    "auto_enforced": False
                },
                "sensitive_folders_locked": {
                    "key": "sensitive_folders_locked",
                    "title": "Sensitive Folders Lock",
                    "description": "Financial, IP & HR folder access locked with hardware-backed encryption",
                    "icon": "Lock",
                    "status": "ARMED",
                    "auto_enforced": False
                },
                "email_attachment_limited": {
                    "key": "email_attachment_limited",
                    "title": "Email Attachment Limit",
                    "description": "Email attachment size strictly capped at 0 MB (Zero Attachment Policy)",
                    "icon": "Paperclip",
                    "status": "ARMED",
                    "auto_enforced": False
                },
                "external_file_sharing_blocked": {
                    "key": "external_file_sharing_blocked",
                    "title": "External File Sharing Block",
                    "description": "Shareable external web link creation and pastebin uploads blocked",
                    "icon": "Share2",
                    "status": "ARMED",
                    "auto_enforced": False
                }
            }
        }
        col.insert_one(default_state)
        doc = default_state
    return doc

@router.get("/adaptive-shield/status")
def get_adaptive_shield_status(db=Depends(get_db)):
    state = get_shield_state_doc(db)

    # Get recent email alerts log
    email_logs_col = db.get_collection("email_alerts_log")
    recent_logs = list(email_logs_col.find(limit=25))
    for log in recent_logs:
        if "_id" in log:
            log["_id"] = str(log["_id"])

    state.pop("_id", None)
    state["recent_email_logs"] = recent_logs
    return state

@router.post("/adaptive-shield/toggle")
def toggle_blockade(req: ToggleBlockadeRequest, db=Depends(get_db)):
    col = db.get_collection("adaptive_shield_state")
    state = get_shield_state_doc(db)
    
    blockades = state.get("blockades", {})
    if req.blockade_key in blockades:
        new_status = "ENFORCED" if req.enabled else "ARMED"
        blockades[req.blockade_key]["status"] = new_status
        blockades[req.blockade_key]["auto_enforced"] = req.enabled
        
        col.update_one(
            {"_id": "global_state"},
            {"$set": {f"blockades.{req.blockade_key}": blockades[req.blockade_key]}}
        )
        return {
            "status": "success",
            "blockade_key": req.blockade_key,
            "new_status": new_status,
            "enabled": req.enabled
        }
    else:
        raise HTTPException(status_code=400, detail=f"Invalid blockade key: {req.blockade_key}")

@router.post("/adaptive-shield/config")
def update_shield_config(config: ShieldConfigUpdate, db=Depends(get_db)):
    col = db.get_collection("adaptive_shield_state")
    state = get_shield_state_doc(db)
    
    updates = {}
    if config.admin_email is not None:
        updates["admin_email"] = config.admin_email
        settings.ADMIN_EMAIL = config.admin_email
    if config.smtp_server is not None:
        updates["smtp_server"] = config.smtp_server
        settings.SMTP_SERVER = config.smtp_server
    if config.smtp_port is not None:
        updates["smtp_port"] = config.smtp_port
        settings.SMTP_PORT = config.smtp_port
    if config.smtp_user is not None:
        updates["smtp_user"] = config.smtp_user
        settings.SMTP_USER = config.smtp_user
    if config.sender_email is not None:
        updates["sender_email"] = config.sender_email
        settings.SENDER_EMAIL = config.sender_email
    if config.smtp_password is not None:
        updates["smtp_password"] = config.smtp_password
        settings.SMTP_PASSWORD = config.smtp_password
    if config.smtp_use_tls is not None:
        updates["smtp_use_tls"] = config.smtp_use_tls
        settings.SMTP_USE_TLS = config.smtp_use_tls
    if config.auto_trigger_enabled is not None:
        updates["auto_trigger_enabled"] = config.auto_trigger_enabled

    if updates:
        col.update_one({"_id": "global_state"}, {"$set": updates})

    return {
        "status": "updated",
        "updates": updates
    }

@router.post("/adaptive-shield/test-email")
def send_test_email_alert(db=Depends(get_db)):
    state = get_shield_state_doc(db)
    recipient = state.get("admin_email", settings.ADMIN_EMAIL)
    
    smtp_config = {
        "smtp_server": state.get("smtp_server") or settings.SMTP_SERVER,
        "smtp_port": state.get("smtp_port") or settings.SMTP_PORT,
        "smtp_user": state.get("smtp_user") or settings.SMTP_USER,
        "smtp_password": state.get("smtp_password") if state.get("smtp_password") is not None else settings.SMTP_PASSWORD,
        "sender_email": state.get("sender_email") or settings.SENDER_EMAIL,
        "use_tls": state.get("smtp_use_tls") if state.get("smtp_use_tls") is not None else settings.SMTP_USE_TLS,
    }
    
    result = SMTPService.send_test_email(recipient_email=recipient, smtp_config=smtp_config)
    
    # Save log
    email_logs_col = db.get_collection("email_alerts_log")
    log_doc = {
        "timestamp": datetime.now().isoformat(),
        "type": "TEST_ALERT",
        "recipient": recipient,
        "subject": "✅ AI Adaptive Security Shield - SMTP Alert Test",
        "status": result.get("status", "FAILED"),
        "mode": result.get("mode", "REAL_SMTP"),
        "details": result.get("details", "")
    }
    email_logs_col.insert_one(log_doc)
    if "_id" in log_doc:
        log_doc["_id"] = str(log_doc["_id"])

    return {
        "status": "executed",
        "result": result,
        "log": log_doc
    }

def trigger_adaptive_shield_and_email(
    db,
    device_id: str,
    user_id: str,
    risk_score: float,
    attack_category: str,
    suspicious_action: str,
    telemetry_snapshot: dict = None
) -> dict:
    """
    Called whenever AI detects insider threat or data exfiltration.
    Automatically locks down all 5 shield blockades and dispatches instant SMTP email alert.
    """
    col = db.get_collection("adaptive_shield_state")
    state = get_shield_state_doc(db)

    # Lock down all 5 blockades to ENFORCED
    blockades = state.get("blockades", {})
    enforced_titles = []
    for key in blockades:
        blockades[key]["status"] = "ENFORCED"
        blockades[key]["auto_enforced"] = True
        enforced_titles.append(blockades[key]["title"])

    now_str = datetime.now().isoformat()
    col.update_one(
        {"_id": "global_state"},
        {
            "$set": {
                "shield_active": True,
                "last_triggered": now_str,
                "blockades": blockades
            },
            "$inc": {"total_trigger_count": 1}
        }
    )

    # Dispatch SMTP Email Notification to Admin
    admin_email = state.get("admin_email", settings.ADMIN_EMAIL)
    smtp_config = {
        "smtp_server": state.get("smtp_server") or settings.SMTP_SERVER,
        "smtp_port": state.get("smtp_port") or settings.SMTP_PORT,
        "smtp_user": state.get("smtp_user") or settings.SMTP_USER,
        "smtp_password": state.get("smtp_password") if state.get("smtp_password") is not None else settings.SMTP_PASSWORD,
        "sender_email": state.get("sender_email") or settings.SENDER_EMAIL,
        "use_tls": state.get("smtp_use_tls") if state.get("smtp_use_tls") is not None else settings.SMTP_USE_TLS,
    }

    email_res = SMTPService.send_admin_threat_alert(
        admin_email=admin_email,
        device_id=device_id,
        user_id=user_id,
        risk_score=risk_score,
        attack_category=attack_category,
        suspicious_action=suspicious_action,
        active_blockades=enforced_titles,
        smtp_config=smtp_config
    )

    # Save to Email Audit Log
    email_logs_col = db.get_collection("email_alerts_log")
    email_log_doc = {
        "timestamp": now_str,
        "type": "AUTOMATED_THREAT_ALERT",
        "device_id": device_id,
        "user_id": user_id,
        "risk_score": risk_score,
        "attack_category": attack_category,
        "recipient": admin_email,
        "subject": f"🚨 [CRITICAL ALERT] AI Adaptive Shield Engaged: Insider Exfiltration on {device_id}",
        "status": email_res.get("status", "SENT"),
        "mode": email_res.get("mode", "LIVE_SMTP"),
        "details": email_res.get("details", "")
    }
    email_logs_col.insert_one(email_log_doc)
    if "_id" in email_log_doc:
        email_log_doc["_id"] = str(email_log_doc["_id"])

    return {
        "shield_engaged": True,
        "timestamp": now_str,
        "enforced_blockades": enforced_titles,
        "email_alert_result": email_res,
        "email_log": email_log_doc
    }

@router.post("/adaptive-shield/trigger-simulated-attack")
def trigger_simulated_attack(req: TriggerSimulatedAttackRequest, db=Depends(get_db)):
    res = trigger_adaptive_shield_and_email(
        db=db,
        device_id=req.device_id,
        user_id=req.user_id,
        risk_score=req.risk_score,
        attack_category=req.attack_category,
        suspicious_action=req.suspicious_action
    )
    return {
        "status": "attack_simulation_shield_triggered",
        "execution_summary": res
    }
