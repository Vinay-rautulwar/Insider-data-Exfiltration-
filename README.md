<<<<<<< HEAD
# Insider-data-Exfiltration-
=======
# ExfilSentinel: Privacy-Preserving Insider Data Exfiltration Detection System

> **Cybersecurity System for Detecting Insider Data Exfiltration Without Inspecting User Files**

ExfilSentinel is an enterprise-grade Security Operations Center (SOC) platform and Telemetry Monitoring Agent engineered to detect insider data theft and exfiltration vectors using **non-invasive system metadata and behavioral telemetry**. 

By strictly analyzing metadata—such as file modification velocity, archive extension entropy, network outbound byte rates, process executions, USB mount events, and temporal access context—ExfilSentinel achieves high-precision threat detection **without ever opening, scanning, or reading sensitive document contents**, maintaining complete employee privacy and regulatory compliance (GDPR, HIPAA, CCPA).

---

## 🌟 Tech Stack

- **Frontend:** React, Tailwind CSS, Chart.js (`react-chartjs-2`), Lucide Icons, Vite
- **Backend:** FastAPI, Python 3.10+, Pydantic v2, Uvicorn
- **Database:** MongoDB (with dynamic zero-config in-memory/SQLite fallback for local testing)
- **AI / Machine Learning:** Scikit-learn, Isolation Forest, Random Forest Classifier, XGBoost, Joblib
- **Monitoring & Agent:** Windows Event Logs, Sysmon telemetry, `psutil`, `watchdog`, `pywin32`

---

## 🛡️ Privacy-First Telemetry Architecture (Zero File Content Inspection)

Instead of invasive Content-Based DLP (which inspects file text, breaking privacy and compliance), ExfilSentinel monitors 12 non-invasive behavioral telemetry metrics:

1. **File Modification Velocity (`file_mod_rate_per_sec`):** Frequency of file creation/modifications per second in user directories.
2. **Staging Storage Growth (`staging_folder_growth_mb_per_sec`):** Rapid storage accumulation rate in Temp/Staging paths.
3. **Archive Extension Entropy (`archive_ext_entropy_score`):** Ratio of compression extension activity (`.zip`, `.7z`, `.rar`, `.tar`, `.enc`).
4. **Outbound Network Velocity (`outbound_bytes_per_sec`):** Network upload burst rate (MB/s).
5. **Active Outbound Sockets (`active_network_sockets`):** Count of active remote network connections.
6. **Cloud & Paste Site DNS Queries (`cloud_domain_dns_query_count`):** Frequency of Mega, Dropbox, Google Drive, or paste-site DNS lookups.
7. **Archive Utility Execution (`archive_process_active`):** Active status of compression binaries (`7z.exe`, `winrar.exe`).
8. **CLI Exfiltration Tools (`cli_exfil_tool_active`):** Active status of CLI tools (`rclone`, `curl`, `scp`, `powershell`).
9. **USB Mount Event (`usb_drive_mounted`):** Presence of mounted removable drives.
10. **USB Removable Write Velocity (`usb_write_bytes_per_sec`):** Mass file copy rate to external drives (MB/s).
11. **Temporal Access Context (`off_hours_flag`):** Off-hours or weekend operation indicators.
12. **User Baseline Deviation Index (`user_baseline_dev_index`):** Ratio of current activity versus historical baseline.

---

## 🤖 Multi-Model AI Ensemble Engine

1. **Isolation Forest (Unsupervised Anomaly Detector):** Detects novel zero-day exfiltration patterns without requiring labeled historical attack logs.
2. **Random Forest (Supervised Signature Classifier):** Classifies specific exfiltration attack signatures (Mass Archiving, USB Theft, Cloud Upload Surge, Encrypted Staging).
3. **XGBoost Classifier (Composite Risk Scorer & XAI):** Generates a 0–100 Exfiltration Threat Score and calculates Explainable AI (XAI) feature contribution weights.

---

## 🚀 Getting Started

### 1. Backend Setup & Run

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Linux/macOS:
# source venv/bin/activate

pip install -r requirements.txt
python -m app.main
```
The FastAPI backend will run on `http://localhost:8000`. Open `http://localhost:8000/docs` to view interactive Swagger documentation.

---

### 2. Frontend Setup & Run

```bash
cd frontend
npm install
npm run dev
```
The React SOC Dashboard will launch on `http://localhost:5173`.

---

### 3. Monitoring Agent (Optional for Live Windows Telemetry)

```bash
cd agent
pip install -r requirements.txt
python agent.py
```
The agent monitors file system activity (`watchdog`), network transfers (`psutil`), and USB events (`pywin32`), posting real-time telemetry to the backend.

---

## 🎯 Features

- **Live SOC Telemetry Stream:** Real-time metrics overview, risk score gauge dial, and Chart.js outbound velocity graphs.
- **Incident Investigation Workbench:** Forensic breakdown modal showing Explainable AI feature contribution weights, telemetry snapshots, and response actions (*Isolate Endpoint*, *Kill Process*, *Block USB*).
- **1-Click Attack Simulator:** Built-in sandbox allowing users and evaluators to inject 4 simulated exfiltration attack vectors (*USB Mass Copy*, *Cloud Upload Burst*, *Mass Zip Staging*, *Off-Hours Encrypted Dump*) directly from the UI.
- **ML Model Workbench:** Inspect accuracy/precision metrics for Isolation Forest, Random Forest, and XGBoost, view feature gain analysis, and trigger 1-click model retraining.
>>>>>>> c19a174 (1st Push request)
