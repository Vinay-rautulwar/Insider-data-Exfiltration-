import React from 'react';
import { FileText, Printer, Download, EyeOff, ShieldAlert, CheckCircle2, X } from 'lucide-react';

export default function ReportExporter({ alert, onClose }) {
  if (!alert) return null;

  const handleDownloadPDF = () => {
    const link = document.createElement('a');
    link.href = `/api/v1/reports/pdf/${alert.alert_id}`;
    link.download = `ExfilSentinel_Incident_${alert.alert_id}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.open(`/api/v1/reports/executive_html/${alert.alert_id}?auto_print=true`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="glass-panel w-full max-w-2xl rounded-2xl border border-slate-700 p-6 space-y-6 relative shadow-2xl">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <FileText className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white font-mono">
              CISO EXECUTIVE FORENSICS REPORT EXPORTER
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Official audit documentation for incident {alert.alert_id}
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
            <div className="text-slate-400">Report Reference: <strong className="text-cyan-400">{alert.alert_id}</strong></div>
            <div className="text-slate-400">Monitored Device: <strong className="text-slate-200">{alert.device_id} ({alert.user_id})</strong></div>
            <div className="text-slate-400">Threat Severity: <strong className="text-red-400">{alert.severity} ({alert.risk_score}/100)</strong></div>
            <div className="text-slate-400">Classification: <strong className="text-emerald-400">{alert.attack_category}</strong></div>
          </div>

          <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 flex items-center gap-2 text-[11px]">
            <EyeOff className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>Includes Official Zero File Content Inspection Compliance Seal.</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 hover:bg-slate-800 text-cyan-400 font-bold text-xs flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            Print HTML Report
          </button>
          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Download PDF Report
          </button>
        </div>
      </div>
    </div>
  );
}
