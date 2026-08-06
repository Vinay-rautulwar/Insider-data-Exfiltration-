from datetime import datetime
from typing import List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException
from app.db import get_db

router = APIRouter()

DEFAULT_FLEET = [
    {
        "device_id": "HOST-FIN-01",
        "hostname": "FINANCE-DESK-01",
        "user_id": "finance_emp_88",
        "department": "Finance & Accounting",
        "ip_address": "192.168.10.45",
        "os": "Windows 11 Enterprise (Sysmon v15)",
        "agent_status": "Online",
        "current_risk_score": 12.5,
        "isolation_status": "Standard Network",
        "usb_port_status": "Active",
        "last_telemetry_time": datetime.now().isoformat(),
        "active_processes_count": 84,
        "cpu_usage_pct": 14.2,
        "ram_usage_pct": 38.5
    },
    {
        "device_id": "HOST-DEV-04",
        "hostname": "DEV-BUILD-NODE-04",
        "user_id": "dev_contractor_12",
        "department": "Engineering & DevOps",
        "ip_address": "192.168.20.112",
        "os": "Windows 10 Pro (Sysmon v14)",
        "agent_status": "Online",
        "current_risk_score": 14.0,
        "isolation_status": "Standard Network",
        "usb_port_status": "Active",
        "last_telemetry_time": datetime.now().isoformat(),
        "active_processes_count": 98,
        "cpu_usage_pct": 28.4,
        "ram_usage_pct": 42.1
    },
    {
        "device_id": "HOST-EXEC-09",
        "hostname": "EXEC-LAPTOP-09",
        "user_id": "exec_vp_sales",
        "department": "Executive Suite",
        "ip_address": "192.168.5.14",
        "os": "Windows 11 Enterprise (Sysmon v15)",
        "agent_status": "Online",
        "current_risk_score": 11.2,
        "isolation_status": "Standard Network",
        "usb_port_status": "Active",
        "last_telemetry_time": datetime.now().isoformat(),
        "active_processes_count": 62,
        "cpu_usage_pct": 12.1,
        "ram_usage_pct": 35.0
    },
    {
        "device_id": "HOST-HR-02",
        "hostname": "HR-RECORD-NODE-02",
        "user_id": "hr_recruiter_05",
        "department": "Human Resources",
        "ip_address": "192.168.30.88",
        "os": "Windows 11 Pro",
        "agent_status": "Online",
        "current_risk_score": 10.5,
        "isolation_status": "Standard Network",
        "usb_port_status": "Active",
        "last_telemetry_time": datetime.now().isoformat(),
        "active_processes_count": 54,
        "cpu_usage_pct": 10.5,
        "ram_usage_pct": 28.0
    }
]

@router.get("/endpoints/fleet")
def get_fleet_matrix(db=Depends(get_db)):
    ep_col = db.get_collection("endpoints")
    docs = ep_col.find(limit=100)
    
    if not docs:
        for item in DEFAULT_FLEET:
            ep_col.insert_one(item)
        docs = DEFAULT_FLEET
    return docs

@router.put("/endpoints/{device_id}/isolate")
def toggle_endpoint_isolation(device_id: str, payload: dict, db=Depends(get_db)):
    isolate = payload.get("isolate", True)
    ep_col = db.get_collection("endpoints")
    
    new_status = "Network Isolated" if isolate else "Standard Network"
    ep_col.update_one({"device_id": device_id}, {"$set": {"isolation_status": new_status}})
    return {
        "status": "success",
        "device_id": device_id,
        "isolation_status": new_status
    }
