import React, { useState } from 'react';
import { Zap, HardDrive, CloudUpload, Archive, Moon, CheckCircle2, Play, AlertCircle } from 'lucide-react';

export default function AttackSimulator({ onSimulationTriggered }) {
  const [loadingType, setLoadingType] = useState(null);
  const [lastResult, setLastResult] = useState(null);

  const attacks = [
    {
      id: "usb_exfiltration",
      title: "USB Mass Copy Exfiltration",
      subtitle: "Simulates mounting a removable drive & writing 125 MB/s of data",
      icon: HardDrive,
      color: "border-red-500/40 bg-red-500/10 text-red-400 hover:border-red-500",
      badge: "USB Storage Vector"
    },
    {
      id: "cloud_upload_surge",
      title: "Cloud Storage Burst",
      subtitle: "Simulates 185 MB/s outbound transfer + 28 DNS queries to cloud sites",
      icon: CloudUpload,
      color: "border-cyan-500/40 bg-cyan-500/10 text-cyan-400 hover:border-cyan-500",
      badge: "Network Upload Vector"
    },
    {
      id: "mass_zip_staging",
      title: "Mass Zip Archive Staging",
      subtitle: "Simulates creating 88 zip/7z files/sec in temp directories",
      icon: Archive,
      color: "border-amber-500/40 bg-amber-500/10 text-amber-400 hover:border-amber-500",
      badge: "File System Vector"
    },
    {
      id: "off_hours_bulk_dump",
      title: "Off-Hours Encrypted Dump",
      subtitle: "Simulates 3:00 AM weekend encrypted payload staging & transfer",
      icon: Moon,
      color: "border-purple-500/40 bg-purple-500/10 text-purple-400 hover:border-purple-500",
      badge: "Behavioral Vector"
    }
  ];

  const handleRunSimulation = async (type) => {
    setLoadingType(type);
    try {
      const res = await fetch('/api/v1/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          attack_type: type,
          device_id: "SIM-ENDPOINT-09",
          user_id: "suspect_user_07"
        })
      });
      const data = await res.json();
      setLastResult(data);
      if (onSimulationTriggered) {
        onSimulationTriggered();
      }
    } catch (e) {
      console.error("Simulation trigger failed:", e);
    } finally {
      setLoadingType(null);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2 font-mono">
            <Zap className="w-5 h-5 text-cyan-400" />
            INSIDER THREAT ATTACK SIMULATOR
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Inject synthetic privacy-preserving telemetry streams to test AI detection models in real-time
          </p>
        </div>

        <button
          onClick={() => handleRunSimulation('normal_baseline')}
          className="px-3.5 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 font-bold text-xs border border-emerald-500/30 transition-all flex items-center gap-1.5"
        >
          <CheckCircle2 className="w-4 h-4" />
          Inject Normal Baseline
        </button>
      </div>

      {/* Grid of Simulation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {attacks.map((attack) => {
          const IconComp = attack.icon;
          const isRunning = loadingType === attack.id;
          return (
            <div
              key={attack.id}
              className={`p-5 rounded-2xl border ${attack.color} glass-panel-hover transition-all flex flex-col justify-between space-y-4`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                    <IconComp className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 font-mono">{attack.title}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-80">
                      {attack.badge}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-slate-300">{attack.subtitle}</p>

              <button
                disabled={isRunning}
                onClick={() => handleRunSimulation(attack.id)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-100 transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? (
                  <span className="animate-spin text-cyan-400">⏳</span>
                ) : (
                  <Play className="w-3.5 h-3.5 fill-current" />
                )}
                {isRunning ? "Simulating Telemetry..." : "Trigger Attack Vector"}
              </button>
            </div>
          );
        })}
      </div>

      {/* Simulation Result Output */}
      {lastResult && (
        <div className="p-4 rounded-xl bg-slate-900 border border-cyan-500/30 font-mono text-xs text-cyan-300 space-y-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="font-bold flex items-center gap-1.5 text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Simulation Payload Processed by AI Engine
            </span>
            <span className="text-[10px] text-slate-400">Vector: {lastResult.attack_type}</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-slate-300 pt-1">
            <div>Risk Score: <strong className="text-red-400">{lastResult.ingestion_result?.prediction?.risk_score}</strong></div>
            <div>Severity: <strong className="text-orange-400">{lastResult.ingestion_result?.prediction?.severity}</strong></div>
            <div>Isolation Forest: <strong className="text-cyan-400">{lastResult.ingestion_result?.prediction?.anomaly_flag ? "Anomaly" : "Normal"}</strong></div>
            <div>Classification: <strong className="text-emerald-400">{lastResult.ingestion_result?.prediction?.attack_category}</strong></div>
          </div>
        </div>
      )}
    </div>
  );
}
