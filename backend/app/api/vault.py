import random
import string
from datetime import datetime
from typing import Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db

router = APIRouter()

# In-memory vault state
class VaultState:
    def __init__(self):
        self.current_password = self.generate_random_password()
        self.last_rotation = datetime.now().isoformat()
        self.active_file = "C:\\Users\\Admin\\AppData\\Local\\Temp\\exfil_payload_staged.zip"
        self.source_ip = "10.17.122.35"
        self.destination_ip = "104.21.88.19 (Cloud Storage Vault)"
        self.protection_status = "AES-256 DYNAMICALLY LOCKED"

    def generate_random_password(self, length: int = 14) -> str:
        chars = string.ascii_letters + string.digits + "!@#$%^&*"
        return "EXFIL-SEC-" + "".join(random.choice(chars) for _ in range(length))

    def rotate_password(self) -> str:
        self.current_password = self.generate_random_password()
        self.last_rotation = datetime.now().isoformat()
        return self.current_password

vault_manager = VaultState()

@router.get("/vault/status")
def get_vault_status(db=Depends(get_db)):
    alerts_col = db.get_collection("alerts")
    recent_alerts = list(alerts_col.find(limit=5))
    
    # If there's a recent active alert, use its file & target info
    active_alert = next((a for a in recent_alerts if a.get("status") == "Active"), None)
    if not active_alert:
        active_alert = recent_alerts[0] if recent_alerts else None

    target_file = "C:\\Users\\FinanceAdmin\\Documents\\Confidential_Financial_Q3.zip"
    source_ip = "10.17.122.35"
    dest_ip = "104.21.88.19 (Remote Storage Server)"

    if active_alert:
        snapshot = active_alert.get("telemetry_snapshot", {})
        device_id = active_alert.get("device_id", "HOST-FIN-01")
        dest_ip = snapshot.get("dest_ip", "104.21.88.19 (Cloud Vault)")
        target_file = snapshot.get("staged_file_path", f"C:\\Staging\\{active_alert.get('alert_id', 'PAYLOAD')}_encrypted.zip")
        source_ip = snapshot.get("ip_address", "10.17.122.35")

    return {
        "status": "PROTECTED",
        "current_password": vault_manager.current_password,
        "last_rotation": vault_manager.last_rotation,
        "rotation_interval_seconds": 30,
        "encryption_algorithm": "AES-256-GCM (Dynamic Random Key Rotation)",
        "target_file": target_file,
        "source_ip": source_ip,
        "destination_ip": dest_ip,
        "transfer_path": [
            {
                "step": 1,
                "node": "Source Host Endpoint",
                "label": f"HOST: {source_ip}",
                "detail": "Local Monitored Workstation",
                "status": "Source Node"
            },
            {
                "step": 2,
                "node": "Local Staging Directory",
                "label": target_file,
                "detail": "Encrypted Staging Archive",
                "status": "Locked & Password Protected"
            },
            {
                "step": 3,
                "node": "Exfiltration Process CLI",
                "label": "rclone.exe / PID: 4812",
                "detail": "CLI Outbound Transfer Process",
                "status": "Process Terminated"
            },
            {
                "step": 4,
                "node": "Enterprise Gateway Proxy",
                "label": "192.168.1.1 (Port 443)",
                "detail": "Network Firewall Gateway",
                "status": "Socket Blocked"
            },
            {
                "step": 5,
                "node": "Destination Remote IP",
                "label": dest_ip,
                "detail": "Target Unauthorized Server",
                "status": "Connection Severed"
            }
        ]
    }

@router.post("/vault/rotate")
def rotate_vault_password():
    new_pw = vault_manager.rotate_password()
    return {
        "status": "password_rotated",
        "new_password": new_pw,
        "timestamp": vault_manager.last_rotation
    }
