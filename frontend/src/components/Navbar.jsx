import React from 'react';
import { ShieldAlert, ShieldCheck, Cpu, Activity, Zap, Monitor, Sliders, EyeOff, Key, Sparkles } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, apiOnline }) {
  const tabs = [
    { id: 'dashboard', label: 'SOC Dashboard', icon: Activity },
    { id: 'adaptive_shield', label: 'AI Adaptive Shield', icon: ShieldCheck },
    { id: 'vault', label: '3D Cyber Vault', icon: Key },
    { id: 'soar', label: 'SOAR Engine', icon: Zap },
    { id: 'fleet', label: 'Endpoint Fleet', icon: Monitor },
    { id: 'policy', label: 'Zero-Trust Policy', icon: Sliders },
    { id: 'simulator', label: 'Attack Sandbox', icon: ShieldAlert },
    { id: 'models', label: 'AI Workbench', icon: Cpu }
  ];

  return (
    <header className="glass-panel border-b border-fuchsia-500/30 sticky top-0 z-40 px-6 py-4 flex flex-col xl:flex-row items-center justify-between gap-4 shadow-2xl">
      {/* Brand & Privacy Guarantee */}
      <div className="flex items-center gap-3">
        <div className="p-2.5 rounded-2xl bg-gradient-to-br from-fuchsia-500/20 to-cyan-500/20 border border-fuchsia-500/40 text-fuchsia-400 glow-violet animate-pulse-glow">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black tracking-wider font-mono text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-400 via-cyan-300 to-emerald-400">
              EXFIL<span className="text-white">SENTINEL</span>
            </h1>
            <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-gradient-to-r from-fuchsia-950 to-cyan-950 text-fuchsia-300 border border-fuchsia-800 tracking-wider shadow-md">
              v1.0 AI-SOC
            </span>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5 font-mono">
            <EyeOff className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-emerald-400 font-semibold">Privacy-First Telemetry:</span> Zero File Content Inspection
          </p>
        </div>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex flex-wrap items-center gap-1.5 bg-slate-950/90 p-1.5 rounded-2xl border border-fuchsia-500/30 shadow-inner">
        {tabs.map((t) => {
          const IconComp = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl transition-all duration-300 ${
                isActive
                  ? 'bg-gradient-to-r from-fuchsia-500 to-cyan-500 text-slate-950 shadow-[0_0_20px_rgba(217,70,239,0.5)] font-black scale-105'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900/80'
              }`}
            >
              <IconComp className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </nav>

      {/* API Connection Indicator */}
      <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-950 border border-slate-800 text-xs shadow-md">
        <span className={`w-2.5 h-2.5 rounded-full ${apiOnline ? 'bg-emerald-400 animate-ping shadow-[0_0_10px_#10b981]' : 'bg-red-500'}`}></span>
        <span className="text-slate-300 font-mono font-semibold">
          FastAPI Backend: {apiOnline ? 'Connected (8000)' : 'Offline'}
        </span>
      </div>
    </header>
  );
}
