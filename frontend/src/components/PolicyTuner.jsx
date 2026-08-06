import React, { useState } from 'react';
import { Sliders, ShieldCheck, Lock, EyeOff, Save, CheckCircle2, AlertTriangle } from 'lucide-react';

export default function PolicyTuner() {
  const [riskThreshold, setRiskThreshold] = useState(30);
  const [offHoursWeight, setOffHoursWeight] = useState(1.5);
  const [usbLimit, setUsbLimit] = useState(25);
  const [fileModLimit, setFileModLimit] = useState(20);
  const [savedStatus, setSavedStatus] = useState('');

  const handleSavePolicy = () => {
    setSavedStatus('Policy rules deployed to ExfilSentinel AI Inference Engine!');
    setTimeout(() => setSavedStatus(''), 3500);
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
              <Sliders className="w-5 h-5 text-cyan-400" />
              ZERO-TRUST POLICY & SENSITIVITY CONFIGURATOR
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Live AI Re-calibration
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Tune behavioral anomaly thresholds, temporal multipliers, and exfiltration velocity limits
          </p>
        </div>

        <button
          onClick={handleSavePolicy}
          className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          Deploy Policy Rules
        </button>
      </div>

      {savedStatus && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-800 text-xs text-emerald-300 font-mono flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          {savedStatus}
        </div>
      )}

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Risk Score Alert Threshold */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">Alert Sensitivity Threshold:</span>
            <span className="font-extrabold text-cyan-400">{riskThreshold} / 100</span>
          </div>
          <input
            type="range"
            min="10"
            max="90"
            value={riskThreshold}
            onChange={(e) => setRiskThreshold(Number(e.target.value))}
            className="w-full accent-cyan-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Telemetry snapshots with combined risk score &ge; {riskThreshold} will trigger active SOC alerts.
          </p>
        </div>

        {/* Off-Hours Multiplier */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">Off-Hours Risk Multiplier:</span>
            <span className="font-extrabold text-amber-400">{offHoursWeight}x</span>
          </div>
          <input
            type="range"
            min="1.0"
            max="3.0"
            step="0.1"
            value={offHoursWeight}
            onChange={(e) => setOffHoursWeight(Number(e.target.value))}
            className="w-full accent-amber-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Scales threat severity for actions occurring during non-standard hours (e.g. 02:00 AM weekends).
          </p>
        </div>

        {/* USB Transfer Limit */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">USB Write Velocity Limit:</span>
            <span className="font-extrabold text-red-400">{usbLimit} MB/sec</span>
          </div>
          <input
            type="range"
            min="5"
            max="150"
            value={usbLimit}
            onChange={(e) => setUsbLimit(Number(e.target.value))}
            className="w-full accent-red-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Triggers SOAR automated port isolation if removable storage writes exceed {usbLimit} MB/s.
          </p>
        </div>

        {/* File Modification Limit */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3">
          <div className="flex justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">File Mod Velocity Limit:</span>
            <span className="font-extrabold text-purple-400">{fileModLimit} files/sec</span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            value={fileModLimit}
            onChange={(e) => setFileModLimit(Number(e.target.value))}
            className="w-full accent-purple-500 cursor-pointer"
          />
          <p className="text-[11px] text-slate-400">
            Detects potential mass payload staging if creation rate exceeds {fileModLimit} files/second.
          </p>
        </div>
      </div>
    </div>
  );
}
