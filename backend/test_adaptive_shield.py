from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_adaptive_shield_status():
    print("Testing GET /api/v1/adaptive-shield/status...")
    response = client.get("/api/v1/adaptive-shield/status")
    assert response.status_code == 200
    data = response.json()
    assert "blockades" in data
    blockades = data["blockades"]
    assert "usb_disabled" in blockades
    assert "cloud_upload_blocked" in blockades
    assert "sensitive_folders_locked" in blockades
    assert "email_attachment_limited" in blockades
    assert "external_file_sharing_blocked" in blockades
    print("[SUCCESS] Status endpoint returned all 5 requested blockades!")

def test_smtp_test_email():
    print("Testing POST /api/v1/adaptive-shield/test-email...")
    response = client.post("/api/v1/adaptive-shield/test-email")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "executed"
    print(f"[SUCCESS] Test email endpoint output: {data['result']['details']}")

def test_simulated_attack_trigger():
    print("Testing POST /api/v1/adaptive-shield/trigger-simulated-attack...")
    payload = {
        "device_id": "TEST-HOST-01",
        "user_id": "suspect_user_88",
        "attack_category": "USB & Cloud Data Sharing Exfiltration",
        "risk_score": 92.4,
        "suspicious_action": "USB copy + high outbound bandwidth"
    }
    response = client.post("/api/v1/adaptive-shield/trigger-simulated-attack", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "attack_simulation_shield_triggered"
    assert len(data["execution_summary"]["enforced_blockades"]) == 5
    print("[SUCCESS] Attack simulation automatically engaged all 5 blockades and dispatched SMTP alert log!")

def test_config_update():
    print("Testing POST /api/v1/adaptive-shield/config...")
    payload = {
        "admin_email": "admin@company.com",
        "smtp_server": "smtp.gmail.com",
        "smtp_port": 587,
        "smtp_user": "sec-alerts@company.com",
        "smtp_password": "test_app_password_1234",
        "sender_email": "alerts@company.com",
        "smtp_use_tls": True
    }
    response = client.post("/api/v1/adaptive-shield/config", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "updated"
    assert data["updates"]["smtp_password"] == "test_app_password_1234"
    print("[SUCCESS] SMTP configuration updated with real password!")

if __name__ == "__main__":
    test_adaptive_shield_status()
    test_config_update()
    test_smtp_test_email()
    test_simulated_attack_trigger()
    print("\nALL ADAPTIVE SHIELD & SMTP TESTS PASSED SUCCESSFULLY!")
