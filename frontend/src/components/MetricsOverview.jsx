import React from 'react';
import { Monitor, AlertTriangle, ShieldCheck, Activity, Zap } from 'lucide-react';

export default function MetricsOverview({ summary }) {
  const cards = [
    {
      title: "Monitored Endpoints",
      value: summary?.total_monitored_endpoints || 4,
      subtitle: "Active Windows/Sysmon Agents",
      icon: Monitor,
      color: "cyan",
      glowClass: "card-3d hover:border-cyan-500/50 hover:shadow-[0_0_30px_rgba(6,182,212,0.2)]",
      textColor: "text-cyan-400",
      badge: "LIVE AGENTS"
    },
    {
      title: "Active Threat Alerts",
      value: summary?.active_alerts || 0,
      subtitle: `${summary?.severity_counts?.Critical || 0} Critical Exfiltrations`,
      icon: AlertTriangle,
      glowClass: summary?.active_alerts > 0 
        ? "card-3d-red border-red-500/50 glow-red" 
        : "card-3d hover:border-slate-700",
      textColor: summary?.active_alerts > 0 ? "text-red-400" : "text-emerald-400",
      badge: summary?.active_alerts > 0 ? "CRITICAL THREAT" : "PERIMETER SECURE"
    },
    {
      title: "Avg System Risk Score",
      value: `${summary?.avg_system_risk_score || 0.0}/100`,
      subtitle: "Multi-Model XGBoost Ensemble",
      icon: Activity,
      glowClass: "card-3d hover:border-amber-500/50 hover:shadow-[0_0_30px_rgba(245,158,11,0.2)]",
      textColor: summary?.avg_system_risk_score >= 50 ? "text-red-400" : "text-amber-400",
      badge: "AI INFERENCE"
    },
    {
      title: "Mitigated Incidents",
      value: summary?.mitigated_alerts || 0,
      subtitle: "Auto-isolated / Process Killed",
      icon: ShieldCheck,
      glowClass: "card-3d-emerald hover:border-emerald-500/50",
      textColor: "text-emerald-400",
      badge: "AUTO CONTAINED"
    }
  ];

  return (
    <div className="perspective-3d grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, idx) => {
        const IconComponent = card.icon;
        return (
          <div
            key={idx}
            className={`glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden preserve-3d transition-all ${card.glowClass}`}
          >
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-slate-400">
                {card.title}
              </span>
              <span className="px-2 py-0.5 text-[9px] font-mono font-extrabold rounded-md bg-slate-900 border border-slate-800 text-cyan-400">
                {card.badge}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-3xl font-extrabold font-mono tracking-tight ${card.textColor}`}>
                  {card.value}
                </h3>
                <p className="text-[11px] text-slate-400 mt-1 font-mono">{card.subtitle}</p>
              </div>
              <div className={`p-3 rounded-2xl bg-slate-900 border border-slate-800 ${card.textColor} shadow-lg`}>
                <IconComponent className="w-6 h-6" />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
