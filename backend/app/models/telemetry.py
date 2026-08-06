from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class TelemetryPayload(BaseModel):
    device_id: str = Field(default="HOST-SEC-01", description="Unique identifier of monitored endpoint")
    user_id: str = Field(default="user_employee_402", description="Hashed/Anonymized User Account ID")
    timestamp: Optional[str] = None
    ip_address: Optional[str] = Field(default=None, description="Local IP address of endpoint")
    hostname: Optional[str] = Field(default=None, description="Host system hostname")
    cpu_usage_pct: Optional[float] = Field(default=None, description="Current CPU usage percentage")
    ram_usage_pct: Optional[float] = Field(default=None, description="Current RAM usage percentage")
    
    # File System Metadata Telemetry (NO FILE CONTENT INSPECTION)
    file_mod_rate_per_sec: float = Field(default=0.0, description="File creation/modification rate per second")
    staging_folder_growth_mb_per_sec: float = Field(default=0.0, description="Rate of folder size growth in temp/staging (MB/s)")
    archive_ext_entropy_score: float = Field(default=0.0, description="Proportion of zip/tar/rar/enc file extension activity (0.0 to 1.0)")
    
    # Process Telemetry
    archive_process_active: int = Field(default=0, description="Indicator if compression utility is executing (0 or 1)")
    cli_exfil_tool_active: int = Field(default=0, description="Indicator if CLI transfer tool like rclone/curl/powershell is active (0 or 1)")
    
    # Network Telemetry
    outbound_bytes_per_sec: float = Field(default=0.0, description="Network outbound transfer rate (MB/s)")
    active_network_sockets: int = Field(default=0, description="Count of active outbound remote connections")
    cloud_domain_dns_query_count: int = Field(default=0, description="DNS queries to cloud storage/paste services in last 60s")
    
    # USB & Removable Media Telemetry
    usb_drive_mounted: int = Field(default=0, description="Indicator if USB removable storage is mounted (0 or 1)")
    usb_write_bytes_per_sec: float = Field(default=0.0, description="Write velocity to mounted removable drives (MB/s)")
    
    # Behavioral & Contextual Telemetry
    off_hours_flag: int = Field(default=0, description="Activity occurring during off-hours (0 or 1)")
    user_baseline_dev_index: float = Field(default=1.0, description="Ratio of current activity vs 30-day historical baseline")

class ThreatAlert(BaseModel):
    alert_id: str
    timestamp: str
    device_id: str
    user_id: str
    risk_score: float  # 0 to 100
    severity: str      # Low, Medium, High, Critical
    anomaly_flag: bool # True if Isolation Forest flagged outlier
    attack_category: str # Normal, Mass Archiving, USB Exfiltration, Cloud Upload Surge, Encrypted Staging
    confidence: float   # 0.0 to 1.0
    feature_contributions: Dict[str, float]
    telemetry_snapshot: Dict[str, Any]
    status: str = "Active" # Active, Investigating, Resolved, Mitigated

class SimulationRequest(BaseModel):
    attack_type: str = Field(..., description="usb_exfiltration, cloud_upload_surge, mass_zip_staging, off_hours_bulk_dump")
    device_id: Optional[str] = "DEMO-HOST-WIN11"
    user_id: Optional[str] = "insider_suspect_09"
