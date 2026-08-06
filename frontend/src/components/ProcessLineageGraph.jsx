import React from 'react';
import { GitBranch, Clock, AlertTriangle, ShieldCheck, Terminal, HardDrive, Cpu, Wifi } from 'lucide-react';

export default function ProcessLineageGraph({ alert }) {
  const snapshot = alert?.telemetry_snapshot || {};
  const isUsb = alert?.attack_category === 'USB Exfiltration' || (snapshot.usb_write_bytes_per_sec || 0) > 10;
  const isCloud = alert?.attack_category === 'Cloud Upload Surge' || (snapshot.outbound_bytes_per_sec || 0) > 30;

  // Process Tree Nodes
  const nodes = [
    { id: "proc-1", label: "explorer.exe", pid: 3412, status: "Normal Parent", icon: Terminal, color: "border-slate-700 bg-slate-900 text-slate-300" },
    { id: "proc-2", label: snapshot.cli_exfil_tool_active ? "powershell.exe" : "cmd.exe", pid: 8820, status: "CLI Execution", icon: Terminal, color: "border-cyan-500/40 bg-cyan-950/60 text-cyan-400" },
    { id: "proc-3", label: snapshot.archive_process_active ? "7z.exe (Compression)" : "tar.exe", pid: 9140, status: "Payload Archiving", icon: Cpu, color: "border-amber-500/40 bg-amber-950/60 text-amber-400" },
    { id: "proc-4", label: isUsb ? "E:\\Removable_USB" : (isCloud ? "cloud_storage_upload" : "staging_temp.enc"), pid: 9812, status: "Exfiltration Vector", icon: isUsb ? HardDrive : Wifi, color: "border-red-500/50 bg-red-950/80 text-red-400 font-bold glow-red" }
  ];

  // Timeline Events
  const timelineEvents = [
    { time: "T-45s", event: "User Authentication & Session Initialization", detail: snapshot.off_hours_flag ? "Flagged: Off-Hours Session (02:14 AM)" : "Standard User Workstation Login", type: "info" },
    { time: "T-30s", event: "File Modification Velocity Surge", detail: `${snapshot.file_mod_rate_per_sec || 24} files/sec created in Temp/Staging`, type: "warning" },
    { time: "T-15s", event: "Compression / Archive Process Execution", detail: "7z.exe active with 92% Archive Extension Entropy", type: "warning" },
    { time: "T-02s", event: "Outbound / Removable Transfer Spike", detail: isUsb ? `USB Storage Write Surge: ${snapshot.usb_write_bytes_per_sec || 125} MB/s` : `Network Outbound Burst: ${snapshot.outbound_bytes_per_sec || 185} MB/s`, type: "critical" },
    { time: "T-00s", event: "Isolation Forest Anomaly & SOAR Playbook", detail: `Threat Score ${alert?.risk_score || 88.5}/100. Host Isolated & USB Locked.`, type: "success" }
  ];

  return (
    <div className="space-y-6">
      {/* Process Tree Lineage */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-cyan-400" />
            Process Ancestry & Execution Lineage Tree
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Sysmon Event ID 1 (Process Creation)</span>
        </div>

        {/* Process Tree Graph SVG / Flex Visual */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 overflow-x-auto py-3 px-2">
          {nodes.map((node, idx) => {
            const IconComp = node.icon;
            return (
              <React.Fragment key={node.id}>
                <div className={`p-3 rounded-xl border ${node.color} flex flex-col min-w-[140px] shadow-lg`}>
                  <div className="flex items-center gap-1.5 text-xs font-mono font-bold">
                    <IconComp className="w-3.5 h-3.5" />
                    {node.label}
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono mt-1">PID: {node.pid}</span>
                  <span className="text-[10px] font-semibold mt-0.5 opacity-90">{node.status}</span>
                </div>
                {idx < nodes.length - 1 && (
                  <div className="hidden sm:flex items-center text-slate-500 font-mono text-xs">
                    ➔
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Chronological Incident Timeline */}
      <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 font-mono flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />
            Incident Chronological Step-by-Step Timeline
          </h3>
          <span className="text-[10px] text-slate-400 font-mono">Telemetry Time Sequence</span>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {timelineEvents.map((item, idx) => (
            <div key={idx} className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
              <span className="px-2 py-0.5 rounded bg-slate-950 text-cyan-400 font-bold border border-slate-800 text-[10px] flex-shrink-0">
                {item.time}
              </span>
              <div className="flex-1">
                <div className="font-bold text-slate-200">{item.event}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
