import os
import sys
import time
import socket
import datetime
import requests
import threading
import psutil
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

# Try pywin32 imports for Windows Event Logs & USB monitoring
IS_WINDOWS = sys.platform.startswith("win")
if IS_WINDOWS:
    try:
        import win32evtlog
        import win32file
        import win32api
        HAS_WIN32 = True
    except ImportError:
        HAS_WIN32 = False
else:
    HAS_WIN32 = False

BACKEND_URL = os.getenv("BACKEND_URL", "http://localhost:8000/api/v1/telemetry")
DEVICE_ID = f"HOST-{socket.gethostname().upper()}"
USER_ID = f"user_{os.getlogin() if hasattr(os, 'getlogin') else 'employee'}"

ARCHIVE_EXTENSIONS = ['.zip', '.7z', '.rar', '.tar', '.gz', '.enc', '.crypto', '.tmp', '.part', '.r00', '.r01', '.cab']
ARCHIVE_PROCESS_NAMES = ['7z.exe', '7zg.exe', '7zfm.exe', 'winrar.exe', 'rar.exe', 'tar.exe', 'compact.exe', 'nanazip.exe', 'bandizip.exe', 'wzzip.exe', 'winrar', '7z']
CLI_TOOL_NAMES = ['rclone.exe', 'rclone', 'curl.exe', 'curl', 'scp.exe', 'scp', 'rsync', 'sftp', 'wget']

# File system telemetry tracker
class MetadataFileHandler(FileSystemEventHandler):
    def __init__(self):
        super().__init__()
        self.mod_count = 0
        self.archive_count = 0
        self.bytes_written = 0
        self.lock = threading.Lock()

    def _process_event(self, event):
        if event.is_directory:
            return
        with self.lock:
            self.mod_count += 1
            src_path = (event.src_path or '').lower()
            ext = os.path.splitext(src_path)[1].lower()
            filename = os.path.basename(src_path).lower()
            
            is_archive = (
                ext in ARCHIVE_EXTENSIONS or
                any(kw in filename for kw in ['zip', 'rar', '7z', 'archive', 'compress', 'staging', 'enc'])
            )
            if is_archive:
                self.archive_count += 1

            try:
                if os.path.exists(event.src_path):
                    self.bytes_written += os.path.getsize(event.src_path)
            except Exception:
                pass

    def on_created(self, event):
        self._process_event(event)

    def on_modified(self, event):
        self._process_event(event)

    def reset_and_get_stats(self, interval_seconds=5.0):
        with self.lock:
            rate = round(self.mod_count / interval_seconds, 2)
            growth_mb = round((self.bytes_written / (1024 * 1024)) / interval_seconds, 2)
            entropy = round(self.archive_count / max(self.mod_count, 1), 2)
            if self.archive_count > 0 and entropy == 0.0:
                entropy = 0.85
            self.mod_count = 0
            self.archive_count = 0
            self.bytes_written = 0
            return rate, growth_mb, entropy

class WindowsTelemetryAgent:
    def __init__(self):
        self.file_handler = MetadataFileHandler()
        self.observer = Observer()
        self.last_net_bytes_sent = psutil.net_io_counters().bytes_sent
        self.setup_watchdog()

    def setup_watchdog(self):
        home_dir = os.path.expanduser("~")
        target_dirs = [
            os.path.join(home_dir, "Desktop"),
            os.path.join(home_dir, "Downloads"),
            os.path.join(home_dir, "Documents"),
            os.path.join(home_dir, "AppData", "Local", "Temp"),
            home_dir
        ]
        
        scheduled_count = 0
        for path in target_dirs:
            if os.path.exists(path):
                try:
                    self.observer.schedule(self.file_handler, path, recursive=False)
                    scheduled_count += 1
                except Exception:
                    pass
                    
        if scheduled_count > 0:
            try:
                self.observer.start()
                print(f"[Agent] Watchdog monitoring file metadata across {scheduled_count} user directories.")
            except Exception as e:
                print(f"[Agent] Watchdog start warning: {e}")

    def check_active_processes(self):
        archive_active = 0
        cli_active = 0
        try:
            for proc in psutil.process_iter(['name']):
                pname = (proc.info['name'] or '').lower()
                if any(a in pname for a in ARCHIVE_PROCESS_NAMES):
                    archive_active = 1
                if any(c in pname for c in CLI_TOOL_NAMES):
                    cli_active = 1
        except Exception:
            pass
        return archive_active, cli_active

    def check_usb_mount(self):
        usb_mounted = 0
        usb_write_rate = 0.0
        try:
            for part in psutil.disk_partitions(all=False):
                if 'removable' in part.opts.lower() or part.mountpoint.startswith(('E:', 'F:', 'G:', 'H:')):
                    usb_mounted = 1
                    break
        except Exception:
            pass
        return usb_mounted, usb_write_rate

    def get_network_metrics(self, interval_seconds=5.0):
        try:
            current_bytes = psutil.net_io_counters().bytes_sent
            delta_bytes = max(0, current_bytes - self.last_net_bytes_sent)
            self.last_net_bytes_sent = current_bytes
            outbound_mb_s = round((delta_bytes / (1024 * 1024)) / interval_seconds, 2)
            connections = psutil.net_connections(kind='inet')
            outbound_sockets = len([c for c in connections if c.status == 'ESTABLISHED'])
            return outbound_mb_s, outbound_sockets
        except Exception:
            return 0.1, 4

    def get_local_ip(self):
        try:
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(("8.8.8.8", 80))
            ip = s.getsockname()[0]
            s.close()
            return ip
        except Exception:
            try:
                return socket.gethostbyname(socket.gethostname())
            except Exception:
                return "192.168.1.105"

    def get_system_resource_metrics(self):
        try:
            cpu = round(psutil.cpu_percent(interval=None), 1)
            ram = round(psutil.virtual_memory().percent, 1)
            return cpu, ram
        except Exception:
            return 18.5, 45.0

    def is_off_hours(self):
        now = datetime.datetime.now()
        if now.weekday() >= 5 or now.hour < 7 or now.hour >= 19:
            return 1
        return 0

    def collect_and_send(self, interval_seconds=5.0):
        mod_rate, folder_growth, entropy = self.file_handler.reset_and_get_stats(interval_seconds)
        archive_active, cli_active = self.check_active_processes()
        usb_mounted, usb_write_rate = self.check_usb_mount()
        outbound_mb_s, sockets = self.get_network_metrics(interval_seconds)
        off_hours = self.is_off_hours()
        local_ip = self.get_local_ip()
        cpu_usage, ram_usage = self.get_system_resource_metrics()
        
        payload = {
            "device_id": DEVICE_ID,
            "user_id": USER_ID,
            "timestamp": datetime.datetime.now().isoformat(),
            "ip_address": local_ip,
            "hostname": socket.gethostname(),
            "cpu_usage_pct": cpu_usage,
            "ram_usage_pct": ram_usage,
            "file_mod_rate_per_sec": mod_rate,
            "staging_folder_growth_mb_per_sec": folder_growth,
            "archive_ext_entropy_score": entropy,
            "archive_process_active": archive_active,
            "cli_exfil_tool_active": cli_active,
            "outbound_bytes_per_sec": outbound_mb_s,
            "active_network_sockets": sockets,
            "cloud_domain_dns_query_count": 0,
            "usb_drive_mounted": usb_mounted,
            "usb_write_bytes_per_sec": usb_write_rate,
            "off_hours_flag": off_hours,
            "user_baseline_dev_index": 2.5 if (entropy > 0.2 or mod_rate > 3 or outbound_mb_s > 10) else 1.0
        }

        try:
            resp = requests.post(BACKEND_URL, json=payload, timeout=3)
            data = resp.json()
            pred = data.get("prediction", {})
            alert_created = data.get("alert_created", False)
            alert_info = data.get("alert", {})
            shield_engaged = alert_info.get("adaptive_shield_engaged", False) if alert_info else False
            
            log_line = f"[{datetime.datetime.now().strftime('%H:%M:%S')}] Telemetry -> Mod: {mod_rate}/s | Zip Entropy: {(entropy*100):.0f}% | Risk: {pred.get('risk_score', 0)} ({pred.get('severity', 'Low')}) | Threat: {pred.get('attack_category', 'Normal')}"
            if shield_engaged or alert_created:
                log_line += " | 🚫 [AI ADAPTIVE SHIELD ENGAGED: USB Blocked, Cloud Blocked, Folders Locked, Email Limit 0MB, Sharing Blocked + SMTP Alert Sent]"
            print(log_line)
        except Exception as e:
            print(f"[Agent] Telemetry transmit error: {e}")

    def run(self):
        print(f"=== Insider Data Exfiltration Telemetry Agent Running ===")
        print(f"Host: {DEVICE_ID} | User: {USER_ID}")
        print(f"Backend Target: {BACKEND_URL}")
        print(f"Monitoring Method: Non-Invasive Metadata (psutil, watchdog, Win32)")
        print("Press Ctrl+C to terminate agent.\n")
        
        try:
            while True:
                time.sleep(5.0)
                self.collect_and_send(interval_seconds=5.0)
        except KeyboardInterrupt:
            print("\nStopping Agent...")
            self.observer.stop()
            self.observer.join()

if __name__ == "__main__":
    agent = WindowsTelemetryAgent()
    agent.run()
