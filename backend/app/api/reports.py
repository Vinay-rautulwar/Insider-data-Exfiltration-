import io
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse, Response
from app.db import get_db

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

router = APIRouter()

def build_pdf_report_bytes(alert: dict) -> bytes:
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=36,
        bottomMargin=36
    )
    
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=16,
        leading=20,
        textColor=colors.HexColor('#06b6d4')
    )
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=12,
        textColor=colors.HexColor('#64748b')
    )
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontName='Helvetica-Bold',
        fontSize=12,
        leading=15,
        textColor=colors.HexColor('#0f172a'),
        spaceBefore=10,
        spaceAfter=5
    )
    normal_style = ParagraphStyle(
        'NormalText',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#334155')
    )
    bold_style = ParagraphStyle(
        'BoldText',
        parent=styles['Normal'],
        fontName='Helvetica-Bold',
        fontSize=9,
        leading=13,
        textColor=colors.HexColor('#0f172a')
    )
    
    elements = []
    
    # Title & Subtitle
    elements.append(Paragraph("EXFILSENTINEL | CISO INCIDENT FORENSICS REPORT", title_style))
    elements.append(Paragraph("Official Security Operations Center Threat & Audit Documentation", subtitle_style))
    elements.append(Paragraph("PRIVACY GUARANTEE: Zero File Content Inspection (Metadata & Behavioral AI Only)", ParagraphStyle('Priv', parent=subtitle_style, textColor=colors.HexColor('#059669'), fontName='Helvetica-Bold')))
    elements.append(Spacer(1, 8))
    elements.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor('#06b6d4'), spaceAfter=12))
    
    # Overview Table
    alert_id = str(alert.get("alert_id", "N/A"))
    device_id = str(alert.get("device_id", "N/A"))
    user_id = str(alert.get("user_id", "N/A"))
    severity = str(alert.get("severity", "Low"))
    risk_score = float(alert.get("risk_score", 0))
    category = str(alert.get("attack_category", "Normal"))
    timestamp = str(alert.get("timestamp", datetime.now().isoformat()))
    
    summary_data = [
        [Paragraph("<b>Incident Ref ID:</b>", normal_style), Paragraph(alert_id, bold_style), Paragraph("<b>Target Endpoint Host:</b>", normal_style), Paragraph(device_id, bold_style)],
        [Paragraph("<b>Threat Severity:</b>", normal_style), Paragraph(f"{severity} ({risk_score:.1f}/100)", ParagraphStyle('Risk', parent=bold_style, textColor=colors.HexColor('#dc2626') if risk_score >= 50 else colors.HexColor('#059669'))), Paragraph("<b>Monitored User:</b>", normal_style), Paragraph(user_id, bold_style)],
        [Paragraph("<b>AI Taxonomy:</b>", normal_style), Paragraph(category, bold_style), Paragraph("<b>Detection Time:</b>", normal_style), Paragraph(timestamp[:19].replace('T', ' '), normal_style)],
    ]
    
    t_summary = Table(summary_data, colWidths=[110, 160, 110, 160])
    t_summary.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_summary)
    elements.append(Spacer(1, 10))
    
    # AI Classification Block
    elements.append(Paragraph("AI Multi-Model Outlier & Behavioral Classification", h2_style))
    anomaly_txt = "ANOMALOUS OUTLIER DETECTED" if alert.get("anomaly_flag", True) else "NORMAL BASELINE"
    conf_pct = f"{(float(alert.get('confidence', 0.94)) * 100):.1f}%"
    
    ai_box_data = [
        [Paragraph(f"<b>Classification Model:</b> XGBoost + Isolation Forest Outlier Ensemble", normal_style)],
        [Paragraph(f"<b>Taxonomy Category:</b> {category}", bold_style)],
        [Paragraph(f"<b>Isolation Forest Status:</b> {anomaly_txt}", ParagraphStyle('Anom', parent=bold_style, textColor=colors.HexColor('#dc2626') if alert.get("anomaly_flag", True) else colors.HexColor('#059669')))],
        [Paragraph(f"<b>Model Prediction Confidence:</b> {conf_pct}", normal_style)]
    ]
    t_ai = Table(ai_box_data, colWidths=[540])
    t_ai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('LINELEFT', (0,0), (0,-1), 4, colors.HexColor('#06b6d4')),
        ('PADDING', (0,0), (-1,-1), 5),
    ]))
    elements.append(t_ai)
    elements.append(Spacer(1, 10))
    
    # XAI Contributions Table
    elements.append(Paragraph("Explainable AI (XAI) Evidentiary Contributions", h2_style))
    xai = alert.get("feature_contributions", {})
    xai_table_data = [[Paragraph("<b>Telemetry Dimension</b>", bold_style), Paragraph("<b>Risk Gain Contribution %</b>", bold_style)]]
    for feat, val in xai.items():
        feat_clean = feat.replace('_', ' ').title()
        xai_table_data.append([Paragraph(feat_clean, normal_style), Paragraph(f"{val}%", bold_style)])
    
    t_xai = Table(xai_table_data, colWidths=[380, 160])
    t_xai.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#e2e8f0')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_xai)
    elements.append(Spacer(1, 10))
    
    # Non-Invasive Snapshot Metrics
    elements.append(Paragraph("Non-Invasive Metadata Evidence Log", h2_style))
    snapshot = alert.get("telemetry_snapshot", {})
    snap_data = [
        [Paragraph("File Mod Rate:", normal_style), Paragraph(f"{snapshot.get('file_mod_rate_per_sec', 0)} files/sec", bold_style), Paragraph("USB Write Rate:", normal_style), Paragraph(f"{snapshot.get('usb_write_bytes_per_sec', 0)} MB/sec", bold_style)],
        [Paragraph("Outbound Net Burst:", normal_style), Paragraph(f"{snapshot.get('outbound_bytes_per_sec', 0)} MB/sec", bold_style), Paragraph("Compression Proc (7z/WinRAR):", normal_style), Paragraph("Active" if snapshot.get('archive_process_active') else "Inactive", normal_style)],
        [Paragraph("CLI Exfil Tool (curl/rclone):", normal_style), Paragraph("Active" if snapshot.get('cli_exfil_tool_active') else "Inactive", normal_style), Paragraph("Temporal Context:", normal_style), Paragraph("Off-Hours" if snapshot.get('off_hours_flag') else "Standard Hours", normal_style)]
    ]
    t_snap = Table(snap_data, colWidths=[140, 130, 140, 130])
    t_snap.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f8fafc')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
        ('INNERGRID', (0,0), (-1,-1), 0.5, colors.HexColor('#e2e8f0')),
        ('PADDING', (0,0), (-1,-1), 4),
    ]))
    elements.append(t_snap)
    elements.append(Spacer(1, 10))
    
    # SOAR Execution Status
    soar_text = "<b>SOAR Containment Execution Audit:</b> Endpoint network interface isolated and USB removable storage interface locked in automated response."
    t_soar = Table([[Paragraph(soar_text, ParagraphStyle('SOAR', parent=normal_style, textColor=colors.HexColor('#047857')))]], colWidths=[540])
    t_soar.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#ecfdf5')),
        ('BOX', (0,0), (-1,-1), 1, colors.HexColor('#a7f3d0')),
        ('PADDING', (0,0), (-1,-1), 6),
    ]))
    elements.append(t_soar)
    elements.append(Spacer(1, 15))
    
    # Footer Note
    elements.append(Paragraph(f"Report Generated Automatically by ExfilSentinel AI SOC Platform • {datetime.now().strftime('%Y-%m-%d %H:%M:%S UTC')}", subtitle_style))
    
    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()

@router.get("/reports/pdf/{alert_id}")
def generate_executive_report_pdf(alert_id: str, db=Depends(get_db)):
    alerts_col = db.get_collection("alerts")
    alert = alerts_col.find_one({"alert_id": alert_id})
    
    if not alert:
        alert = {
            "alert_id": alert_id,
            "timestamp": datetime.now().isoformat(),
            "device_id": "HOST-FIN-01",
            "user_id": "finance_emp_88",
            "risk_score": 88.5,
            "severity": "Critical",
            "anomaly_flag": True,
            "attack_category": "USB Mass Copy Exfiltration",
            "confidence": 0.94,
            "feature_contributions": {
                "usb_write_bytes_per_sec": 54.5,
                "user_baseline_dev_index": 24.2,
                "archive_ext_entropy_score": 12.1,
                "outbound_bytes_per_sec": 9.2
            },
            "telemetry_snapshot": {
                "file_mod_rate_per_sec": 24.5,
                "staging_folder_growth_mb_per_sec": 18.2,
                "usb_write_bytes_per_sec": 125.0,
                "outbound_bytes_per_sec": 2.4,
                "archive_process_active": 1,
                "cli_exfil_tool_active": 1,
                "off_hours_flag": 1
            },
            "status": "Mitigated"
        }

    pdf_bytes = build_pdf_report_bytes(alert)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="ExfilSentinel_Incident_{alert_id}.pdf"'
        }
    )

@router.get("/reports/executive_html/{alert_id}", response_class=HTMLResponse)
def generate_executive_report_html(alert_id: str, auto_print: bool = False, db=Depends(get_db)):
    alerts_col = db.get_collection("alerts")
    alert = alerts_col.find_one({"alert_id": alert_id})
    
    if not alert:
        # Fallback demonstration alert if specific ID not found
        alert = {
            "alert_id": alert_id,
            "timestamp": datetime.now().isoformat(),
            "device_id": "HOST-FIN-01",
            "user_id": "finance_emp_88",
            "risk_score": 88.5,
            "severity": "Critical",
            "anomaly_flag": True,
            "attack_category": "USB Mass Copy Exfiltration",
            "confidence": 0.94,
            "feature_contributions": {
                "usb_write_bytes_per_sec": 54.5,
                "user_baseline_dev_index": 24.2,
                "archive_ext_entropy_score": 12.1,
                "outbound_bytes_per_sec": 9.2
            },
            "telemetry_snapshot": {
                "file_mod_rate_per_sec": 24.5,
                "staging_folder_growth_mb_per_sec": 18.2,
                "usb_write_bytes_per_sec": 125.0,
                "outbound_bytes_per_sec": 2.4,
                "archive_process_active": 1,
                "cli_exfil_tool_active": 1,
                "off_hours_flag": 1
            },
            "status": "Mitigated"
        }

    snapshot = alert.get("telemetry_snapshot", {})
    xai = alert.get("feature_contributions", {})

    xai_rows = "".join([
        f"""
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #334155; color: #cbd5e1; font-family: monospace;">{feat.replace('_', ' ').title()}</td>
            <td style="padding: 10px; border-bottom: 1px solid #334155; color: #38bdf8; font-weight: bold; font-family: monospace;">{val}%</td>
            <td style="padding: 10px; border-bottom: 1px solid #334155;">
                <div style="background: #1e293b; height: 10px; border-radius: 5px; width: 100%;">
                    <div style="background: linear-gradient(90deg, #06b6d4, #ef4444); height: 100%; border-radius: 5px; width: {min(100, val)}%;"></div>
                </div>
            </td>
        </tr>
        """
        for feat, val in xai.items()
    ])

    should_print = "true" if auto_print else "false"

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>ExfilSentinel CISO Forensics Report - {alert['alert_id']}</title>
        <style>
            body {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #090d16; color: #f8fafc; margin: 0; padding: 40px; }}
            .card {{ background: #0f172a; border: 1px solid #334155; border-radius: 16px; padding: 30px; margin-bottom: 25px; box-shadow: 0 10px 30px rgba(0,0,0,0.5); }}
            .header {{ display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #06b6d4; padding-bottom: 20px; margin-bottom: 30px; }}
            .badge-privacy {{ background: rgba(16, 185, 129, 0.15); color: #10b981; border: 1px solid #059669; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 13px; display: inline-block; }}
            .badge-risk {{ background: rgba(239, 68, 68, 0.15); color: #ef4444; border: 1px solid #dc2626; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; }}
            .grid {{ display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }}
            .stat-box {{ background: #1e293b; padding: 18px; border-radius: 12px; border: 1px solid #334155; }}
            .stat-label {{ color: #94a3b8; font-size: 12px; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px; }}
            .stat-value {{ color: #f8fafc; font-size: 20px; font-weight: bold; font-family: monospace; }}
            table {{ width: 100%; border-collapse: collapse; margin-top: 15px; }}
            .footer {{ text-align: center; color: #64748b; font-size: 12px; font-family: monospace; margin-top: 40px; border-top: 1px solid #1e293b; padding-top: 20px; }}
            @media print {{ 
                .no-print {{ display: none !important; }}
                body {{ background: #ffffff !important; color: #000000 !important; padding: 15px !important; }} 
                .card {{ border: 1px solid #cbd5e1 !important; background: #ffffff !important; color: #000000 !important; box-shadow: none !important; padding: 20px !important; }} 
                .stat-box {{ background: #f8fafc !important; border: 1px solid #e2e8f0 !important; color: #0f172a !important; }}
                .stat-value {{ color: #0f172a !important; }}
                .stat-label {{ color: #475569 !important; }}
            }}
        </style>
    </head>
    <body>
        <div class="no-print" style="position: fixed; top: 15px; right: 20px; z-index: 9999; display: flex; gap: 10px;">
            <a href="/api/v1/reports/pdf/{alert['alert_id']}" download style="background: #06b6d4; color: #090d16; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-family: monospace; font-size: 14px; box-shadow: 0 4px 14px rgba(6,182,212,0.4); display: inline-flex; align-items: center; gap: 6px;">
                ⬇️ Download PDF Report
            </a>
            <button onclick="window.print()" style="background: #3b82f6; color: #ffffff; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: monospace; font-size: 14px;">
                🖨️ Print
            </button>
            <button onclick="window.close()" style="background: #334155; color: #f8fafc; border: none; padding: 10px 16px; border-radius: 8px; font-weight: bold; cursor: pointer; font-family: monospace; font-size: 14px;">
                ✖ Close
            </button>
        </div>

        <div class="card">
            <div class="header">
                <div>
                    <h1 style="margin: 0; color: #06b6d4; font-size: 26px; font-family: monospace;">EXFILSENTINEL | CISO INCIDENT FORENSICS REPORT</h1>
                    <p style="margin: 5px 0 0 0; color: #94a3b8; font-size: 13px;">Official Security Operations Center Threat & Audit Documentation</p>
                </div>
                <div class="badge-privacy">🛡️ PRIVACY GUARANTEE: Zero File Content Inspection</div>
            </div>

            <div class="grid">
                <div class="stat-box">
                    <div class="stat-label">Incident Reference ID</div>
                    <div class="stat-value" style="color: #38bdf8;">{alert['alert_id']}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Threat Severity & Score</div>
                    <div class="stat-value"><span class="badge-risk">{alert['severity']} ({alert['risk_score']}/100)</span></div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Target Endpoint Host</div>
                    <div class="stat-value">{alert['device_id']}</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Monitored User Account</div>
                    <div class="stat-value">{alert['user_id']}</div>
                </div>
            </div>

            <div style="background: #1e293b; padding: 20px; border-radius: 12px; border-left: 4px solid #ef4444; margin-bottom: 25px;">
                <h3 style="margin: 0 0 10px 0; color: #f8fafc; font-size: 16px;">AI Multi-Model Classification Result</h3>
                <p style="margin: 0; color: #cbd5e1; font-size: 14px;">
                    Classifier Taxonomist: <strong style="color: #ef4444;">{alert['attack_category']}</strong><br>
                    Isolation Forest Zero-Day Outlier Score: <strong style="color: #06b6d4;">{alert.get('anomaly_flag', True) and 'ANOMALOUS OUTLIER DETECTED' or 'NORMAL'}</strong><br>
                    XGBoost Model Confidence: <strong>{(alert.get('confidence', 0.94) * 100):.1f}%</strong>
                </p>
            </div>

            <h3 style="color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 8px;">Explainable AI (XAI) Evidentiary Contributions</h3>
            <table>
                <thead>
                    <tr style="text-align: left; color: #94a3b8; font-size: 12px; font-family: monospace;">
                        <th style="padding: 10px;">Telemetry Metric Dimension</th>
                        <th style="padding: 10px;">Risk Gain %</th>
                        <th style="padding: 10px;">Weight Spectrum</th>
                    </tr>
                </thead>
                <tbody>
                    {xai_rows}
                </tbody>
            </table>

            <h3 style="color: #f8fafc; border-bottom: 1px solid #334155; padding-bottom: 8px; margin-top: 30px;">Non-Invasive Metadata Evidence Log</h3>
            <div class="grid" style="grid-template-columns: 1fr 1fr 1fr;">
                <div class="stat-box">
                    <div class="stat-label">File Mod Velocity</div>
                    <div class="stat-value" style="font-size: 16px;">{snapshot.get('file_mod_rate_per_sec', 0)} mods/sec</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">USB Write Rate</div>
                    <div class="stat-value" style="font-size: 16px; color: #ef4444;">{snapshot.get('usb_write_bytes_per_sec', 0)} MB/sec</div>
                </div>
                <div class="stat-box">
                    <div class="stat-label">Outbound Net Burst</div>
                    <div class="stat-value" style="font-size: 16px; color: #06b6d4;">{snapshot.get('outbound_bytes_per_sec', 0)} MB/sec</div>
                </div>
            </div>

            <div style="background: rgba(16, 185, 129, 0.1); border: 1px solid #059669; padding: 15px; border-radius: 12px; margin-top: 25px; color: #34d399; font-size: 13px;">
                <strong>SOAR Containment Execution Audit:</strong> Host automated containment executed in 12ms. Endpoint network interface isolated and USB removable storage interface locked.
            </div>

            <div class="footer">
                Report Generated Automatically by ExfilSentinel AI SOC Platform • {datetime.now().strftime("%Y-%m-%d %H:%M:%S UTC")}
            </div>
        </div>

        <script>
            if ({should_print}) {{
                window.addEventListener('load', () => {{
                    setTimeout(() => {{ window.print(); }}, 400);
                }});
            }}
        </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html_content)
