import smtplib
import traceback
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr, make_msgid, formatdate
from datetime import datetime
from app.config import settings

class SMTPService:
    @staticmethod
    def send_email(
        recipient_email: str,
        subject: str,
        html_body: str,
        text_body: str = None,
        smtp_server: str = None,
        smtp_port: int = None,
        smtp_user: str = None,
        smtp_password: str = None,
        sender_email: str = None,
        use_tls: bool = True
    ) -> dict:
        """
        Sends an email using real SMTP transport with High-Priority headers and
        anti-spam sender optimization to ensure primary inbox delivery.
        """
        server_host = smtp_server or settings.SMTP_SERVER
        server_port = int(smtp_port or settings.SMTP_PORT)
        user = smtp_user or settings.SMTP_USER
        password = smtp_password if smtp_password is not None else settings.SMTP_PASSWORD
        
        # Ensure sender address matches authenticated user to prevent Gmail/Outlook SPF spoofing spam flags
        if sender_email and "@" in sender_email and "insidershield.ai" not in sender_email:
            sender_addr = sender_email
        elif user and "@" in user:
            sender_addr = user
        else:
            sender_addr = sender_email or "alerts@insidershield.ai"

        recipient = recipient_email or settings.ADMIN_EMAIL or "admin@company.com"
        timestamp = datetime.now().isoformat()

        # Check for required real SMTP server details
        if not server_host:
            return {
                "status": "FAILED",
                "mode": "REAL_SMTP",
                "recipient": recipient,
                "subject": subject,
                "timestamp": timestamp,
                "details": "SMTP Host is missing. Please configure SMTP Server Host in SMTP Settings."
            }

        if not password:
            return {
                "status": "FAILED",
                "mode": "REAL_SMTP",
                "recipient": recipient,
                "subject": subject,
                "timestamp": timestamp,
                "details": "SMTP Password / App Password is missing. Please enter your SMTP Password in SMTP Settings."
            }

        formatted_sender = formataddr(("EXFILSENTINEL AI Security SOC", sender_addr))
        formatted_recipient = formataddr(("Security Administrator", recipient))

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = formatted_sender
        message["To"] = formatted_recipient
        message["Reply-To"] = sender_addr
        message["Date"] = formatdate(localtime=True)
        message["Message-ID"] = make_msgid()

        # Set High-Priority & Urgent Security Headers to highlight email in primary inbox and prevent spam filtering
        message["X-Priority"] = "1"
        message["X-MSMail-Priority"] = "High"
        message["Importance"] = "high"
        message["Priority"] = "urgent"
        message["X-Message-Flag"] = "HIGH PRIORITY SECURITY THREAT ALERT"
        message["Auto-Submitted"] = "auto-generated"

        if text_body:
            message.attach(MIMEText(text_body, "plain", "utf-8"))
        if html_body:
            message.attach(MIMEText(html_body, "html", "utf-8"))

        try:
            # Handle SSL vs TLS based on port or configuration
            if server_port == 465:
                server = smtplib.SMTP_SSL(server_host, server_port, timeout=12)
            else:
                server = smtplib.SMTP(server_host, server_port, timeout=12)
                if use_tls:
                    server.starttls()

            if user and password:
                server.login(user, password)

            server.sendmail(sender_addr, [recipient], message.as_string())
            server.quit()

            print(f"[SMTP Service] High-priority security email dispatched to {recipient}: '{subject}'")
            return {
                "status": "SENT",
                "mode": "REAL_SMTP",
                "recipient": recipient,
                "subject": subject,
                "timestamp": timestamp,
                "details": f"High-priority security email successfully delivered to {recipient} via {server_host}:{server_port}."
            }

        except Exception as e:
            err_msg = str(e)
            print(f"[SMTP Service Error] Real SMTP delivery failed: {err_msg}")
            traceback.print_exc()
            return {
                "status": "FAILED",
                "mode": "REAL_SMTP",
                "recipient": recipient,
                "subject": subject,
                "timestamp": timestamp,
                "details": f"SMTP real delivery failed: {err_msg}"
            }

    @classmethod
    def send_admin_threat_alert(
        cls,
        admin_email: str,
        device_id: str,
        user_id: str,
        risk_score: float,
        attack_category: str,
        suspicious_action: str,
        active_blockades: list,
        smtp_config: dict = None
    ) -> dict:
        subject = f"[HIGH PRIORITY SECURITY ALERT] AI Adaptive Shield Engaged: Insider Exfiltration on {device_id}"

        blockade_html = "".join([
            f"<li style='margin-bottom:6px; color:#ef4444; font-weight:bold;'>🚫 {b}</li>"
            for b in active_blockades
        ])

        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #090d16; color: #e2e8f0; margin: 0; padding: 20px; }}
            .container {{ max-width: 600px; margin: 0 auto; background: #0f172a; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; box-shadow: 0 0 30px rgba(239, 68, 68, 0.3); }}
            .header {{ display: flex; align-items: center; border-b: 1px solid #334155; padding-bottom: 16px; margin-bottom: 20px; }}
            .title {{ font-size: 20px; font-weight: bold; color: #f87171; text-transform: uppercase; margin: 0; }}
            .badge {{ background: #991b1b; color: #fecaca; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 6px; }}
            .data-grid {{ background: #1e293b; border-radius: 8px; padding: 16px; margin-bottom: 20px; }}
            .data-row {{ display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; border-bottom: 1px dashed #334155; padding-bottom: 6px; }}
            .data-row:last-child {{ border-bottom: none; margin-bottom: 0; padding-bottom: 0; }}
            .label {{ color: #94a3b8; font-weight: 600; }}
            .value {{ color: #f8fafc; font-weight: bold; font-family: monospace; }}
            .risk-high {{ color: #ef4444; font-size: 18px; }}
            .blockades-section {{ background: #18181b; border: 1px solid #71717a; border-radius: 8px; padding: 16px; }}
            .footer {{ font-size: 11px; color: #64748b; margin-top: 24px; text-align: center; font-family: monospace; }}
          </style>
        </head>
        <body>
          <div class="container">
            <h2 class="title">🚨 AI Adaptive Security Shield Active</h2>
            <div class="badge">INSIDER DATA EXFILTRATION DETECTED</div>
            <p style="color:#cbd5e1; font-size:14px; margin-top:16px;">
              The AI Defense Engine has detected high-risk insider data sharing / exfiltration activity. All 5 Adaptive Protection Blockades have been automatically engaged.
            </p>

            <div class="data-grid">
              <div class="data-row">
                <span class="label">Target Endpoint Host:</span>
                <span class="value">{device_id}</span>
              </div>
              <div class="data-row">
                <span class="label">User Account:</span>
                <span class="value">{user_id}</span>
              </div>
              <div class="data-row">
                <span class="label">Threat Category:</span>
                <span class="value" style="color:#facc15;">{attack_category}</span>
              </div>
              <div class="data-row">
                <span class="label">AI Risk Score:</span>
                <span class="value risk-high">{risk_score:.1f} / 100</span>
              </div>
              <div class="data-row">
                <span class="label">Detected Activity:</span>
                <span class="value" style="color:#38bdf8;">{suspicious_action}</span>
              </div>
              <div class="data-row">
                <span class="label">Detection Time:</span>
                <span class="value">{datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}</span>
              </div>
            </div>

            <div class="blockades-section">
              <h4 style="margin:0 0 10px 0; color:#f8fafc; text-transform:uppercase; font-size:12px; letter-spacing:1px;">
                🔒 Enforced Shield Blockades (Automated Containment):
              </h4>
              <ul style="margin:0; padding-left:20px; font-size:13px;">
                {blockade_html}
              </ul>
            </div>

            <div class="footer">
              EXFILSENTINEL AI SOC — Privacy-Preserving Insider Data Exfiltration Defense System
            </div>
          </div>
        </body>
        </html>
        """

        text_body = f"""
        🚨 CRITICAL ALERT: AI ADAPTIVE SECURITY SHIELD ENGAGED
        
        Host: {device_id}
        User: {user_id}
        Threat Vector: {attack_category}
        AI Risk Score: {risk_score:.1f} / 100
        Suspicious Action: {suspicious_action}
        
        Enforced Adaptive Blockades:
        - USB Automatically Disabled
        - Cloud Upload Temporarily Blocked
        - Sensitive Folders Locked
        - Email Attachment Limited
        - External File Sharing Blocked
        
        Time: {datetime.now().isoformat()}
        """

        smtp_params = smtp_config or {}
        return cls.send_email(
            recipient_email=admin_email,
            subject=subject,
            html_body=html_body,
            text_body=text_body,
            **smtp_params
        )

    @classmethod
    def send_test_email(cls, recipient_email: str, smtp_config: dict = None) -> dict:
        subject = "✅ AI Adaptive Security Shield - SMTP Alert Test"
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: sans-serif; background-color: #0f172a; color: #f8fafc; padding: 20px;">
          <div style="max-width: 500px; margin: 0 auto; border: 1px solid #38bdf8; border-radius: 8px; padding: 20px; background: #1e293b;">
            <h3 style="color: #38bdf8; margin-top: 0;">✅ SMTP Integration Verified</h3>
            <p>This test message confirms that your <strong>AI Adaptive Security Shield</strong> backend SMTP email notification pipeline is properly configured and operational.</p>
            <p style="font-size: 12px; color: #94a3b8;">Recipient: <strong>{recipient_email}</strong><br>Timestamp: {datetime.now().strftime("%Y-%m-%d %H:%M:%S")}</p>
          </div>
        </body>
        </html>
        """
        smtp_params = smtp_config or {}
        return cls.send_email(
            recipient_email=recipient_email,
            subject=subject,
            html_body=html_body,
            text_body="SMTP Integration Verified. AI Adaptive Security Shield backend email alert test successful.",
            **smtp_params
        )
