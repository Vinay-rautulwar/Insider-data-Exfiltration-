import React, { useState } from 'react';
import { X, ShieldAlert, Cpu, HardDrive, Wifi, Lock, AlertTriangle, ShieldCheck, Terminal, Ban, EyeOff, FileText, Printer, Download, Key, Network } from 'lucide-react';
import ProcessLineageGraph from './ProcessLineageGraph';
import ReportExporter from './ReportExporter';
import DynamicVaultProtection from './DynamicVaultProtection';
import TransferPathVisualizer3D from './TransferPathVisualizer3D';

export default function IncidentModal({ alert, onClose, onUpdateStatus }) {
  if (!alert) return null;

  const [mitigationAction, setMitigationAction] = useState(null);
  const [showReportExporter, setShowReportExporter] = useState(false);
  const snapshot = alert.telemetry_snapshot || {};
  const contributions = alert.feature_contributions || {};

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = `/api/v1/reports/pdf/${alert.alert_id}`;
    link.download = `ExfilSentinel_Incident_${alert.alert_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAction = (actionName) => {
    setMitigationAction(actionName);
    if (onUpdateStatus) {
      onUpdateStatus(alert.alert_id, "Mitigated");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="glass-panel w-full max-w-5xl rounded-2xl border border-slate-700 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white font-mono">
                  INCIDENT FORENSICS WORKBENCH: {alert.alert_id}
                </h2>
                <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-red-950 text-red-400 border border-red-800">
                  {alert.severity} Risk ({alert.risk_score}/100)
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 flex items-center gap-2">
                <span>Device: <strong className="text-slate-200 font-mono">{alert.device_id}</strong></span>
                <span>•</span>
                <span>Account: <strong className="text-slate-200 font-mono">{alert.user_id}</strong></span>
                <span>•</span>
                <span>Detected: {new Date(alert.timestamp).toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
              title="Download Executive Report as PDF"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>
            <button
              onClick={() => setShowReportExporter(true)}
              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-cyan-400 font-bold text-xs transition-all flex items-center gap-1.5"
              title="Preview Forensic Report"
            >
              <FileText className="w-4 h-4" />
              Preview Report
            </button>
          </div>
        </div>

        {/* Privacy Preservation Banner */}
        <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800 text-cyan-300 text-xs font-mono flex items-center gap-2">
          <EyeOff className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <span>
            <strong>Privacy Preservation Mode Active:</strong> All metrics below are non-invasive system & process metadata. Zero document contents or private files were inspected.
          </span>
        </div>

        {/* 3D Dynamic Password Vault & Lineage Path Section */}
        <DynamicVaultProtection activeAlert={alert} />
        <TransferPathVisualizer3D activeAlert={alert} />

        {/* Grid Layout: Telemetry Metrics + XAI Feature Contributions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Telemetry Metadata Snapshot */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-cyan-400" />
              Non-Invasive Metadata Snapshot
            </h3>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">File Modification Rate:</span>
                <span className="text-slate-200 font-bold">{snapshot.file_mod_rate_per_sec || 0} files/sec</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Staging Folder Growth:</span>
                <span className="text-slate-200 font-bold">{snapshot.staging_folder_growth_mb_per_sec || 0} MB/sec</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Archive Extension Entropy:</span>
                <span className="text-amber-400 font-bold">{((snapshot.archive_ext_entropy_score || 0) * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Outbound Network Velocity:</span>
                <span className="text-cyan-400 font-bold">{snapshot.outbound_bytes_per_sec || 0} MB/sec</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">USB Removable Write Rate:</span>
                <span className="text-red-400 font-bold">{snapshot.usb_write_bytes_per_sec || 0} MB/sec</span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Active Compression Proc (7z/WinRAR):</span>
                <span className={snapshot.archive_process_active ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {snapshot.archive_process_active ? 'YES (Active)' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">CLI Exfiltration Tool (curl/rclone):</span>
                <span className={snapshot.cli_exfil_tool_active ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                  {snapshot.cli_exfil_tool_active ? 'YES (Active)' : 'NO'}
                </span>
              </div>
              <div className="flex justify-between p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                <span className="text-slate-400">Temporal Access Context:</span>
                <span className={snapshot.off_hours_flag ? 'text-amber-400 font-bold' : 'text-slate-300'}>
                  {snapshot.off_hours_flag ? 'OFF-HOURS (Non-Standard)' : 'Standard Work Hours'}
                </span>
              </div>
            </div>
          </div>

          {/* Explainable AI (XAI) Feature Importance */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Explainable AI (XAI) Risk Contributions
            </h3>

            <div className="space-y-3">
              {Object.entries(contributions).map(([feat, weight]) => (
                <div key={feat} className="space-y-1 text-xs">
                  <div className="flex justify-between text-slate-300 font-mono">
                    <span className="capitalize">{feat.replace(/_/g, ' ')}</span>
                    <span className="font-bold text-cyan-400">{weight}%</span>
                  </div>
                  <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-red-500 h-full rounded-full transition-all duration-700"
                      style={{ width: `${Math.min(100, weight)}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Process Lineage Tree & Chronological Timeline */}
        <ProcessLineageGraph alert={alert} />

        {/* Mitigation Status & Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span className="text-xs text-slate-400 font-mono">Current Incident Status:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-bold text-sm text-slate-200">{alert.status}</span>
              {mitigationAction && (
                <span className="text-xs text-emerald-400 font-mono">({mitigationAction})</span>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleDownloadPDF}
              className="px-3.5 py-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-slate-950 font-semibold text-xs border border-cyan-500/40 transition-all flex items-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              Download PDF Report
            </button>

            <button
              onClick={() => handleAction("Endpoint Network Isolated")}
              className="px-3.5 py-2 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 font-semibold text-xs border border-red-500/30 transition-all flex items-center gap-1.5"
            >
              <Wifi className="w-4 h-4" />
              Isolate Endpoint
            </button>

            <button
              onClick={() => handleAction("Suspicious Process Terminated")}
              className="px-3.5 py-2 rounded-xl bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-slate-950 font-semibold text-xs border border-orange-500/30 transition-all flex items-center gap-1.5"
            >
              <Ban className="w-4 h-4" />
              Kill Exfil Process
            </button>

            <button
              onClick={() => handleAction("USB Storage Blocked")}
              className="px-3.5 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 font-semibold text-xs border border-amber-500/30 transition-all flex items-center gap-1.5"
            >
              <HardDrive className="w-4 h-4" />
              Block USB Port
            </button>

            <button
              onClick={() => {
                if (onUpdateStatus) onUpdateStatus(alert.alert_id, "Resolved");
                onClose();
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition-all flex items-center gap-1.5"
            >
              <ShieldCheck className="w-4 h-4" />
              Mark Resolved
            </button>
          </div>
        </div>
      </div>

      {/* CISO Executive Report Exporter Modal */}
      {showReportExporter && (
        <ReportExporter
          alert={alert}
          onClose={() => setShowReportExporter(false)}
        />
      )}
    </div>
  );
}
