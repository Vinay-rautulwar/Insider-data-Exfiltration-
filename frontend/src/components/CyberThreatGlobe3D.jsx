import React, { useState } from 'react';
import { ShieldCheck, Radio, Globe, Zap, Cpu, AlertTriangle, ShieldAlert, Wifi } from 'lucide-react';

export default function CyberThreatGlobe3D({ activeAlert }) {
  const [activeBlip, setActiveBlip] = useState(null);

  const blips = [
    { id: 1, label: 'US-EAST Vault', x: '28%', y: '35%', status: 'INTERCEPTED', ip: '104.21.88.19', risk: '91.1' },
    { id: 2, label: 'EU-CENTRAL Proxy', x: '52%', y: '28%', status: 'MONITORED', ip: '185.190.140.2', risk: '12.0' },
    { id: 3, label: 'APAC Gateway', x: '78%', y: '48%', status: 'MONITORED', ip: '103.21.244.0', risk: '14.5' },
    { id: 4, label: 'LOCAL-STAGING', x: '42%', y: '65%', status: 'LOCKED', ip: '10.17.122.35', risk: '88.5' }
  ];

  const hasActiveThreat = activeAlert && activeAlert.risk_score >= 50;

  return (
    <div className="perspective-3d w-full">
      <div className={`card-3d glass-panel p-6 rounded-2xl border transition-all relative overflow-hidden space-y-6 ${
        hasActiveThreat ? 'border-red-500/40 glow-red' : 'border-slate-800 glow-cyan'
      }`}>
        
        {/* Top Radar Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl border ${
              hasActiveThreat ? 'bg-red-500/15 text-red-400 border-red-500/40 glow-red' : 'bg-cyan-500/15 text-cyan-400 border-cyan-500/40 glow-cyan'
            }`}>
              <Radio className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono tracking-wide">
                  3D CYBER THREAT RADAR & GLOBAL INTERCEPTION MATRIX
                </h3>
                <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${
                  hasActiveThreat ? 'bg-red-950 text-red-300 border-red-800' : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {hasActiveThreat ? 'EXFILTRATION IN PROGRESS' : 'PERIMETER SAFE'}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-Time Outbound Network Packet Triangulation & Machine Learning Inference (0.4ms)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center gap-2 text-cyan-400 font-bold">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>AI Inference: 0.4ms</span>
            </div>
          </div>
        </div>

        {/* 3D Radar Screen Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* Circular Animated Radar Screen */}
          <div className="lg:col-span-1 flex justify-center py-2">
            <div className="relative w-56 h-56 rounded-full bg-slate-950/90 border-2 border-cyan-500/40 flex items-center justify-center overflow-hidden shadow-[0_0_40px_rgba(6,182,212,0.2)] preserve-3d">
              
              {/* Radar Grid Circles */}
              <div className="absolute inset-4 rounded-full border border-cyan-500/20"></div>
              <div className="absolute inset-12 rounded-full border border-cyan-500/25"></div>
              <div className="absolute inset-20 rounded-full border border-cyan-500/30"></div>
              
              {/* Radar Crosshair Lines */}
              <div className="absolute w-full h-[1px] bg-cyan-500/20"></div>
              <div className="absolute h-full w-[1px] bg-cyan-500/20"></div>
              
              {/* Rotating Radar Sweep Beam */}
              <div className="absolute w-full h-full animate-radar-sweep pointer-events-none">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-cyan-500/40 to-transparent origin-bottom-right rounded-tl-full"></div>
              </div>

              {/* Dynamic Threat Blips */}
              {blips.map((blip) => (
                <div
                  key={blip.id}
                  onClick={() => setActiveBlip(blip)}
                  style={{ top: blip.y, left: blip.x }}
                  className="absolute cursor-pointer transform -translate-x-1/2 -translate-y-1/2 group z-20"
                >
                  <div className={`w-3.5 h-3.5 rounded-full ${
                    blip.status === 'INTERCEPTED' || blip.status === 'LOCKED' ? 'bg-red-500 animate-ping' : 'bg-emerald-400'
                  }`}></div>
                  <div className={`w-3.5 h-3.5 rounded-full absolute inset-0 ${
                    blip.status === 'INTERCEPTED' || blip.status === 'LOCKED' ? 'bg-red-500' : 'bg-emerald-400'
                  }`}></div>

                  {/* Tooltip on Hover */}
                  <div className="hidden group-hover:block absolute bottom-5 left-1/2 -translate-x-1/2 px-2.5 py-1 rounded bg-slate-900 border border-slate-700 text-[10px] font-mono text-white whitespace-nowrap z-30 shadow-xl">
                    <div className="font-bold text-cyan-400">{blip.label}</div>
                    <div className="text-slate-300">IP: {blip.ip}</div>
                  </div>
                </div>
              ))}

              {/* Center Radar Node */}
              <div className="relative w-4 h-4 rounded-full bg-cyan-400 border-2 border-white shadow-[0_0_12px_#06b6d4] z-10"></div>
            </div>
          </div>

          {/* Right Metrics Grid */}
          <div className="lg:col-span-2 space-y-4 text-xs font-mono">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Zero-Trust Containment:</span>
                <div className="text-emerald-400 font-bold text-sm flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  AUTOMATIC SOAR ACTIVE
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Privacy Guarantee:</span>
                <div className="text-cyan-400 font-bold text-sm flex items-center gap-1.5">
                  <Globe className="w-4 h-4 text-cyan-400" />
                  100% METADATA INSPECTION
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">ML Model Ensemble:</span>
                <div className="text-slate-200 font-bold text-sm">
                  XGBoost + Isolation Forest + RF
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-slate-500 uppercase text-[10px]">Network Interception Latency:</span>
                <div className="text-amber-400 font-bold text-sm">
                  &lt; 500ms Edge Isolation
                </div>
              </div>
            </div>

            {activeBlip && (
              <div className="p-3 rounded-xl bg-slate-950 border border-cyan-500/40 text-xs font-mono flex items-center justify-between">
                <span>
                  <strong>Selected Target Node:</strong> {activeBlip.label} ({activeBlip.ip}) — Status: <span className="text-red-400 font-bold">{activeBlip.status}</span>
                </span>
                <button onClick={() => setActiveBlip(null)} className="text-slate-400 hover:text-white">✕</button>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
