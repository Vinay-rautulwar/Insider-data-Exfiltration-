import React, { useState } from 'react';
import { Network, Server, HardDrive, Cpu, ShieldCheck, ArrowRight, Lock, Zap, Activity, Info, CheckCircle2 } from 'lucide-react';

export default function TransferPathVisualizer3D({ activeAlert, transferPath }) {
  const [selectedNode, setSelectedNode] = useState(null);

  const defaultNodes = [
    {
      id: 'node-1',
      title: 'Source Host Endpoint',
      subtitle: activeAlert?.device_id || 'HOST-FIN-01',
      ip: activeAlert?.telemetry_snapshot?.ip_address || '10.17.122.35',
      icon: Server,
      color: 'border-cyan-500 text-cyan-400 bg-cyan-500/10',
      badge: 'MONITORED WORKSTATION',
      details: 'Workstation running ExfilSentinel Sysmon agent. Telemetry continuously evaluated.'
    },
    {
      id: 'node-2',
      title: 'Local Staging Directory',
      subtitle: activeAlert?.telemetry_snapshot?.staged_file_path || 'C:\\Staging\\financial_archive.zip',
      ip: 'Local Storage Path',
      icon: HardDrive,
      color: 'border-amber-500 text-amber-400 bg-amber-500/10',
      badge: 'PASSWORD LOCKED',
      details: 'File automatically encrypted with dynamic AES-256 random password key.'
    },
    {
      id: 'node-3',
      title: 'Exfiltration CLI Tool',
      subtitle: 'rclone.exe (PID: 4812)',
      ip: 'Process ID: 4812',
      icon: Cpu,
      color: 'border-red-500 text-red-400 bg-red-500/10',
      badge: 'PROCESS TERMINATED',
      details: 'SOAR Engine auto-killed process binary due to anomalous outbound transfer velocity.'
    },
    {
      id: 'node-4',
      title: 'Enterprise Gateway Proxy',
      subtitle: '192.168.1.1 (Port 443 SSL)',
      ip: 'Gateway IP: 192.168.1.1',
      icon: Network,
      color: 'border-purple-500 text-purple-400 bg-purple-500/10',
      badge: 'SOCKET SEVERED',
      details: 'Outbound TCP connection isolated at perimeter firewall gateway.'
    },
    {
      id: 'node-5',
      title: 'Destination Remote Target IP',
      subtitle: activeAlert?.telemetry_snapshot?.dest_ip || '104.21.88.19 (Remote Server)',
      ip: 'Target IP: 104.21.88.19',
      icon: Lock,
      color: 'border-emerald-500 text-emerald-400 bg-emerald-500/10',
      badge: 'DESTINATION BLOCKED',
      details: 'Data transfer blocked prior to payload reaching remote cloud repository.'
    }
  ];

  const nodes = transferPath && transferPath.length > 0 ? transferPath : defaultNodes;

  return (
    <div className="perspective-3d w-full space-y-4">
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 relative overflow-hidden space-y-6 glow-cyan">
        
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/40">
              <Network className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white font-mono tracking-wide flex items-center gap-2">
                3D DATA TRANSFER LINEAGE PATH & IP INTERCEPTION FLOW
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Hop-by-Hop Data Path Visualization from Source Host IP to Remote Target IP
              </p>
            </div>
          </div>

          <span className="px-3 py-1 text-xs font-mono font-bold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
            5-HOP INTERCEPTION ROUTE
          </span>
        </div>

        {/* 3D Interactive Lineage Flowchart */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative preserve-3d pt-2">
          {nodes.map((n, idx) => {
            const IconComp = n.icon || Network;
            const isSelected = selectedNode?.id === n.id;

            return (
              <div key={n.id || idx} className="relative flex flex-col items-center">
                {/* 3D Perspective Node Card */}
                <div
                  onClick={() => setSelectedNode(n)}
                  className={`card-3d w-full p-4 rounded-2xl bg-slate-900/90 border transition-all cursor-pointer space-y-3 relative preserve-3d ${
                    isSelected ? 'border-cyan-400 glow-cyan scale-105' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-500">
                      HOP {idx + 1}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded border ${n.color}`}>
                      {n.badge || n.status || 'ACTIVE'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className={`p-2.5 rounded-xl border ${n.color}`}>
                      <IconComp className="w-5 h-5" />
                    </div>
                    <div className="truncate">
                      <h4 className="text-xs font-bold text-slate-100 font-mono truncate">{n.title || n.node}</h4>
                      <p className="text-[11px] text-cyan-400 font-mono truncate">{n.subtitle || n.label}</p>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 border-t border-slate-800/80 pt-2 flex items-center justify-between">
                    <span className="truncate">{n.ip || n.detail}</span>
                    <Info className="w-3.5 h-3.5 text-slate-500 hover:text-cyan-400 shrink-0" />
                  </div>
                </div>

                {/* Animated Arrow Connector (for large screens) */}
                {idx < nodes.length - 1 && (
                  <div className="hidden lg:flex absolute -right-4 top-1/2 -translate-y-1/2 z-20 items-center justify-center">
                    <div className="relative w-8 flex items-center justify-center">
                      <div className="w-full h-0.5 bg-gradient-to-r from-cyan-500/40 via-cyan-400 to-cyan-500/40 animate-pulse"></div>
                      <div className="absolute w-2 h-2 rounded-full bg-cyan-400 animate-data-pulse shadow-[0_0_8px_#06b6d4]"></div>
                      <ArrowRight className="w-4 h-4 text-cyan-400 absolute right-0" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Node Details Drawer */}
        {selectedNode && (
          <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/40 text-xs font-mono space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-cyan-400 uppercase tracking-wide flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                Interception Node Audit Details: {selectedNode.title || selectedNode.node}
              </span>
              <button
                onClick={() => setSelectedNode(null)}
                className="text-slate-400 hover:text-white text-[11px]"
              >
                Close [✕]
              </button>
            </div>
            <p className="text-slate-300">{selectedNode.details || selectedNode.detail || 'Node metadata verified and logged in tamper-evident forensics audit trail.'}</p>
          </div>
        )}

      </div>
    </div>
  );
}
