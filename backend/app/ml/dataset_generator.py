import numpy as np
import pandas as pd

FEATURE_COLUMNS = [
    "file_mod_rate_per_sec",
    "staging_folder_growth_mb_per_sec",
    "archive_ext_entropy_score",
    "archive_process_active",
    "cli_exfil_tool_active",
    "outbound_bytes_per_sec",
    "active_network_sockets",
    "cloud_domain_dns_query_count",
    "usb_drive_mounted",
    "usb_write_bytes_per_sec",
    "off_hours_flag",
    "user_baseline_dev_index"
]

LABELS = ["Normal", "Mass Archiving", "USB Exfiltration", "Cloud Upload Surge", "Encrypted Staging"]

def generate_telemetry_dataset(num_samples: int = 4000, random_state: int = 42) -> pd.DataFrame:
    np.random.seed(random_state)
    data = []
    
    # 65% Normal Activity with realistic background noise & overlap
    n_normal = int(num_samples * 0.65)
    for _ in range(n_normal):
        # Developers & admins occasionally compress build artifacts or use CLI tools
        is_dev_user = np.random.rand() < 0.15
        row = {
            "file_mod_rate_per_sec": float(np.random.gamma(shape=2.0, scale=1.5) if is_dev_user else np.random.gamma(shape=1.2, scale=0.8)),
            "staging_folder_growth_mb_per_sec": float(np.random.exponential(scale=0.8) if is_dev_user else np.random.exponential(scale=0.2)),
            "archive_ext_entropy_score": float(np.random.uniform(0.1, 0.45) if is_dev_user else np.random.uniform(0.0, 0.25)),
            "archive_process_active": 1 if (is_dev_user and np.random.rand() < 0.35) else (1 if np.random.rand() < 0.08 else 0),
            "cli_exfil_tool_active": 1 if (is_dev_user and np.random.rand() < 0.25) else (1 if np.random.rand() < 0.05 else 0),
            "outbound_bytes_per_sec": float(np.random.gamma(shape=2.5, scale=2.0) if np.random.rand() < 0.2 else np.random.gamma(shape=1.5, scale=0.5)),
            "active_network_sockets": int(np.random.randint(2, 25)),
            "cloud_domain_dns_query_count": int(np.random.randint(0, 10)),
            "usb_drive_mounted": 1 if np.random.rand() < 0.20 else 0,
            "usb_write_bytes_per_sec": float(np.random.gamma(shape=1.5, scale=2.0) if np.random.rand() < 0.18 else 0.0),
            "off_hours_flag": 1 if np.random.rand() < 0.18 else 0, # Night shift workers
            "user_baseline_dev_index": float(np.random.normal(loc=1.2, scale=0.6)),
            "label": "Normal"
        }
        data.append(row)
        
    # 9% Mass Archiving Attack (overlapping boundary metrics)
    n_archiving = int(num_samples * 0.09)
    for _ in range(n_archiving):
        row = {
            "file_mod_rate_per_sec": float(np.random.uniform(12.0, 75.0) + np.random.normal(0, 8.0)),
            "staging_folder_growth_mb_per_sec": float(np.random.uniform(5.0, 50.0) + np.random.normal(0, 4.0)),
            "archive_ext_entropy_score": float(np.random.uniform(0.40, 0.90)),
            "archive_process_active": 1 if np.random.rand() < 0.75 else 0,
            "cli_exfil_tool_active": 1 if np.random.rand() < 0.40 else 0,
            "outbound_bytes_per_sec": float(np.random.uniform(0.5, 15.0)),
            "active_network_sockets": int(np.random.randint(3, 30)),
            "cloud_domain_dns_query_count": int(np.random.randint(0, 8)),
            "usb_drive_mounted": 1 if np.random.rand() < 0.30 else 0,
            "usb_write_bytes_per_sec": float(np.random.uniform(0.0, 15.0)),
            "off_hours_flag": 1 if np.random.rand() < 0.40 else 0,
            "user_baseline_dev_index": float(np.random.uniform(2.5, 8.0)),
            "label": "Mass Archiving"
        }
        data.append(row)

    # 9% USB Exfiltration Attack
    n_usb = int(num_samples * 0.09)
    for _ in range(n_usb):
        row = {
            "file_mod_rate_per_sec": float(np.random.uniform(2.0, 22.0)),
            "staging_folder_growth_mb_per_sec": float(np.random.uniform(1.0, 12.0)),
            "archive_ext_entropy_score": float(np.random.uniform(0.10, 0.50)),
            "archive_process_active": 1 if np.random.rand() < 0.30 else 0,
            "cli_exfil_tool_active": 1 if np.random.rand() < 0.20 else 0,
            "outbound_bytes_per_sec": float(np.random.uniform(0.2, 6.0)),
            "active_network_sockets": int(np.random.randint(2, 15)),
            "cloud_domain_dns_query_count": int(np.random.randint(0, 5)),
            "usb_drive_mounted": 1 if np.random.rand() < 0.85 else 0,
            "usb_write_bytes_per_sec": float(np.random.uniform(8.0, 95.0) + np.random.normal(0, 6.0)),
            "off_hours_flag": 1 if np.random.rand() < 0.50 else 0,
            "user_baseline_dev_index": float(np.random.uniform(3.0, 8.5)),
            "label": "USB Exfiltration"
        }
        data.append(row)

    # 9% Cloud Upload Surge
    n_cloud = int(num_samples * 0.09)
    for _ in range(n_cloud):
        row = {
            "file_mod_rate_per_sec": float(np.random.uniform(1.0, 10.0)),
            "staging_folder_growth_mb_per_sec": float(np.random.uniform(0.5, 6.0)),
            "archive_ext_entropy_score": float(np.random.uniform(0.08, 0.40)),
            "archive_process_active": 1 if np.random.rand() < 0.25 else 0,
            "cli_exfil_tool_active": 1 if np.random.rand() < 0.60 else 0,
            "outbound_bytes_per_sec": float(np.random.uniform(18.0, 140.0) + np.random.normal(0, 12.0)),
            "active_network_sockets": int(np.random.randint(8, 45)),
            "cloud_domain_dns_query_count": int(np.random.randint(5, 35)),
            "usb_drive_mounted": 1 if np.random.rand() < 0.20 else 0,
            "usb_write_bytes_per_sec": float(np.random.uniform(0.0, 8.0)),
            "off_hours_flag": 1 if np.random.rand() < 0.45 else 0,
            "user_baseline_dev_index": float(np.random.uniform(3.5, 9.0)),
            "label": "Cloud Upload Surge"
        }
        data.append(row)

    # 8% Encrypted Staging Attack
    n_enc = int(num_samples * 0.08)
    for _ in range(n_enc):
        row = {
            "file_mod_rate_per_sec": float(np.random.uniform(8.0, 45.0)),
            "staging_folder_growth_mb_per_sec": float(np.random.uniform(12.0, 70.0)),
            "archive_ext_entropy_score": float(np.random.uniform(0.60, 0.95)),
            "archive_process_active": 1 if np.random.rand() < 0.75 else 0,
            "cli_exfil_tool_active": 1 if np.random.rand() < 0.70 else 0,
            "outbound_bytes_per_sec": float(np.random.uniform(1.5, 20.0)),
            "active_network_sockets": int(np.random.randint(4, 20)),
            "cloud_domain_dns_query_count": int(np.random.randint(1, 10)),
            "usb_drive_mounted": 1 if np.random.rand() < 0.25 else 0,
            "usb_write_bytes_per_sec": float(np.random.uniform(0.0, 12.0)),
            "off_hours_flag": 1 if np.random.rand() < 0.75 else 0,
            "user_baseline_dev_index": float(np.random.uniform(4.0, 9.0)),
            "label": "Encrypted Staging"
        }
        data.append(row)

    df = pd.DataFrame(data)

    # Inject realistic ~4% label noise to prevent artificial 100% boundary separation
    n_noise = int(len(df) * 0.04)
    noise_indices = np.random.choice(len(df), size=n_noise, replace=False)
    all_labels = np.array(LABELS)
    for idx in noise_indices:
        current_lbl = df.at[idx, "label"]
        other_lbls = all_labels[all_labels != current_lbl]
        df.at[idx, "label"] = np.random.choice(other_lbls)

    # Ensure valid continuous range bounds
    for col in ["file_mod_rate_per_sec", "staging_folder_growth_mb_per_sec", 
                "archive_ext_entropy_score", "outbound_bytes_per_sec", 
                "usb_write_bytes_per_sec", "user_baseline_dev_index"]:
        df[col] = df[col].clip(lower=0.0)

    df["archive_ext_entropy_score"] = df["archive_ext_entropy_score"].clip(upper=1.0)

    # Shuffle dataframe
    df = df.sample(frac=1.0, random_state=random_state).reset_index(drop=True)
    return df
