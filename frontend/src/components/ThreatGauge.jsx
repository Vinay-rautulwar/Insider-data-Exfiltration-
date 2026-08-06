import React from 'react';
import { AlertCircle, Lock, ShieldAlert, Cpu } from 'lucide-react';

export default function ThreatGauge({ riskScore = 0, severity = "Low", anomalyFlag = false, latestAlert }) {
  // Determine dial color & glow
  let statusColor = "text-emerald-400";
  let strokeColor = "#10b981";
  let statusBg = "bg-emerald-950 text-emerald-300 border-emerald-800";
  let cardGlow = "card-3d-emerald glow-emerald";

  if (riskScore >= 80 || severity === "Critical") {
    statusColor = "text-red-400";
    strokeColor = "#f43f5e";
    statusBg = "bg-red-950 text-red-300 border-red-800 animate-pulse";
    cardGlow = "card-3d-red glow-red";
  } else if (riskScore >= 55 || severity === "High") {
    statusColor = "text-amber-400";
    strokeColor = "#f59e0b";
    statusBg = "bg-amber-950 text-amber-300 border-amber-800";
    cardGlow = "card-3d glow-amber";
  } else if (riskScore >= 25 || severity === "Medium") {
    statusColor = "text-amber-400";
    strokeColor = "#f59e0b";
    statusBg = "bg-amber-950 text-amber-300 border-amber-800";
    cardGlow = "card-3d glow-amber";
  }

  // Calculate SVG arc stroke-dasharray
  const circumference = 2 * Math.PI * 52;
  const strokeDashoffset = circumference - (riskScore / 100) * circumference;

  return (
    <div className={`glass-panel p-6 rounded-2xl border border-fuchsia-500/30 flex flex-col items-center justify-between preserve-3d ${cardGlow}`}>
      <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3 mb-4 font-mono">
        <h3 className="text-xs font-bold text-slate-200 flex items-center gap-2 tracking-wider uppercase">
          <ShieldAlert className="w-4 h-4 text-fuchsia-400" />
          Exfiltration Threat Index
        </h3>
        <span className={`px-2.5 py-0.5 text-[10px] font-extrabold rounded-full border ${statusBg}`}>
          {severity} Severity
        </span>
      </div>

      {/* SVG Radial Gauge with Multi-Layered Neon Rings */}
      <div className="relative w-48 h-48 flex items-center justify-center my-2 preserve-3d">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Outer Track Ring */}
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke="rgba(30, 41, 59, 0.8)"
            strokeWidth="10"
            className="fill-none"
          />
          {/* Animated Dynamic Arc */}
          <circle
            cx="60"
            cy="60"
            r="52"
            stroke={strokeColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            style={{ filter: `drop-shadow(0 0 10px ${strokeColor})` }}
            className="fill-none transition-all duration-1000 ease-out"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className={`text-4xl font-black font-mono tracking-tight ${statusColor} drop-shadow-[0_0_15px_rgba(217,70,239,0.5)]`}>
            {riskScore.toFixed(1)}
          </span>
          <span className="text-[10px] font-mono font-bold text-slate-400 tracking-widest uppercase mt-0.5">
            RISK SCORE
          </span>
        </div>
      </div>

      {/* Anomaly & AI Model Status */}
      <div className="w-full mt-4 space-y-2 text-xs font-mono">
        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Cpu className="w-3.5 h-3.5 text-cyan-400" />
            Isolation Forest Outlier:
          </span>
          <span className={`font-bold ${anomalyFlag ? 'text-red-400 animate-pulse' : 'text-emerald-400'}`}>
            {anomalyFlag ? 'ANOMALY DETECTED' : 'NORMAL'}
          </span>
        </div>

        <div className="flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-slate-950/90 border border-slate-800">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px]">
            <Lock className="w-3.5 h-3.5 text-fuchsia-400" />
            XGBoost Classification:
          </span>
          <span className="font-bold text-slate-200">
            {latestAlert ? (latestAlert.attack_category || latestAlert.attack_type) : "Normal Baseline"}
          </span>
        </div>
      </div>
    </div>
  );
}
