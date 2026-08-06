import numpy as np
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from app.models.telemetry import TelemetryPayload, SimulationRequest
from app.api.telemetry import ingest_telemetry
from app.db import get_db

router = APIRouter()

@router.post("/simulate")
def trigger_attack_simulation(request: SimulationRequest, db=Depends(get_db)):
    attack_type = request.attack_type.lower()
    device_id = request.device_id or "DEMO-HOST-WIN11"
    user_id = request.user_id or "insider_suspect_09"
    now_str = datetime.now().isoformat()

    if attack_type == "usb_exfiltration":
        telemetry = TelemetryPayload(
            device_id=device_id,
            user_id=user_id,
            timestamp=now_str,
            file_mod_rate_per_sec=18.5,
            staging_folder_growth_mb_per_sec=12.4,
            archive_ext_entropy_score=0.45,
            archive_process_active=1,
            cli_exfil_tool_active=0,
            outbound_bytes_per_sec=0.8,
            active_network_sockets=3,
            cloud_domain_dns_query_count=0,
            usb_drive_mounted=1,
            usb_write_bytes_per_sec=125.0, # High USB copy rate (125 MB/s)
            off_hours_flag=1,
            user_baseline_dev_index=8.4
        )
    elif attack_type == "cloud_upload_surge":
        telemetry = TelemetryPayload(
            device_id=device_id,
            user_id=user_id,
            timestamp=now_str,
            file_mod_rate_per_sec=4.2,
            staging_folder_growth_mb_per_sec=2.1,
            archive_ext_entropy_score=0.25,
            archive_process_active=0,
            cli_exfil_tool_active=1, # rclone / curl script
            outbound_bytes_per_sec=185.0, # Massive upload surge (185 MB/s)
            active_network_sockets=42,
            cloud_domain_dns_query_count=28, # High Mega/Dropbox DNS queries
            usb_drive_mounted=0,
            usb_write_bytes_per_sec=0.0,
            off_hours_flag=0,
            user_baseline_dev_index=9.1
        )
    elif attack_type == "mass_zip_staging":
        telemetry = TelemetryPayload(
            device_id=device_id,
            user_id=user_id,
            timestamp=now_str,
            file_mod_rate_per_sec=88.0, # 88 files created per sec
            staging_folder_growth_mb_per_sec=64.0,
            archive_ext_entropy_score=0.92, # Almost all .zip / .7z
            archive_process_active=1, # 7z.exe active
            cli_exfil_tool_active=1,
            outbound_bytes_per_sec=12.5,
            active_network_sockets=8,
            cloud_domain_dns_query_count=2,
            usb_drive_mounted=0,
            usb_write_bytes_per_sec=0.0,
            off_hours_flag=1,
            user_baseline_dev_index=7.8
        )
    elif attack_type == "off_hours_bulk_dump":
        telemetry = TelemetryPayload(
            device_id=device_id,
            user_id=user_id,
            timestamp=now_str,
            file_mod_rate_per_sec=45.0,
            staging_folder_growth_mb_per_sec=82.0,
            archive_ext_entropy_score=0.98, # Pure encrypted payload (.enc)
            archive_process_active=1,
            cli_exfil_tool_active=1,
            outbound_bytes_per_sec=95.0,
            active_network_sockets=18,
            cloud_domain_dns_query_count=14,
            usb_drive_mounted=1,
            usb_write_bytes_per_sec=85.0,
            off_hours_flag=1, # 3 AM access
            user_baseline_dev_index=9.9
        )
    elif attack_type == "normal_baseline":
        telemetry = TelemetryPayload(
            device_id=device_id,
            user_id="standard_user_12",
            timestamp=now_str,
            file_mod_rate_per_sec=1.2,
            staging_folder_growth_mb_per_sec=0.05,
            archive_ext_entropy_score=0.02,
            archive_process_active=0,
            cli_exfil_tool_active=0,
            outbound_bytes_per_sec=0.4,
            active_network_sockets=4,
            cloud_domain_dns_query_count=1,
            usb_drive_mounted=0,
            usb_write_bytes_per_sec=0.0,
            off_hours_flag=0,
            user_baseline_dev_index=1.05
        )
    else:
        raise HTTPException(status_code=400, detail=f"Unknown attack simulation vector: {attack_type}")

    # Process through telemetry pipeline
    res = ingest_telemetry(payload=telemetry, db=db)
    
    # Store simulation log
    sim_col = db.get_collection("simulations")
    sim_col.insert_one({
        "timestamp": now_str,
        "attack_type": attack_type,
        "device_id": device_id,
        "result": res
    })

    return {
        "status": "simulation_executed",
        "attack_type": attack_type,
        "ingestion_result": res
    }
