import React, { useState, useEffect } from 'react';
import { Key, Lock, ShieldCheck, RefreshCw, Copy, Check, Eye, EyeOff, FileText, ArrowRight, ShieldAlert, Cpu } from 'lucide-react';

export default function DynamicVaultProtection({ activeAlert }) {
  const [vaultData, setVaultData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);
  const [countdown, setCountdown] = useState(30);

  const fetchVaultStatus = async () => {
    try {
      const res = await fetch('/api/v1/vault/status');
      if (res.ok) {
        const data = await res.json();
        setVaultData(data);
      }
    } catch (e) {
      console.error("Failed to fetch vault status", e);
    }
  };

  useEffect(() => {
    fetchVaultStatus();
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          fetchVaultStatus();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRotateKey = async () => {
    try {
      const res = await fetch('/api/v1/vault/rotate', { method: 'POST' });
      if (res.ok) {
        await fetchVaultStatus();
        setCountdown(30);
      }
    } catch (e) {
      console.error("Failed to rotate vault password", e);
    }
  };

  const handleCopyPassword = () => {
    if (vaultData?.current_password) {
      navigator.clipboard.writeText(vaultData.current_password);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const sourceIp = activeAlert?.telemetry_snapshot?.ip_address || vaultData?.source_ip || "10.17.122.35";
  const destIp = activeAlert?.telemetry_snapshot?.dest_ip || vaultData?.destination_ip || "104.21.88.19 (Cloud Storage Vault)";
  const targetFile = activeAlert?.telemetry_snapshot?.staged_file_path || vaultData?.target_file || "C:\\Staging\\Financial_Audit_2026.zip";

  return (
    <div className="perspective-3d w-full">
      <div className="card-3d glass-panel p-6 rounded-2xl border border-cyan-500/40 relative overflow-hidden glow-cyan space-y-6">
        
        {/* Top Header Badge */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 animate-pulse-glow">
              <Lock className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono tracking-wide">
                  AUTOMATIC ZERO-TRUST FILE ENCRYPTION VAULT
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                  AES-256-GCM LOCKED
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic Random Password Protection & Real-Time IP Interception
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Auto-Rotate:</span>
            <div className="px-2.5 py-1 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono text-xs font-bold">
              {countdown}s
            </div>
          </div>
        </div>

        {/* 3D Glass Password Box */}
        <div className="p-5 rounded-2xl bg-slate-950/90 border border-cyan-500/30 space-y-3 relative preserve-3d shadow-xl">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="flex items-center gap-1.5 font-bold text-cyan-300">
              <Key className="w-4 h-4 text-cyan-400" />
              DYNAMICALLY ROTATING FILE ACCESS PASSWORD:
            </span>
            <button
              onClick={() => setShowPassword(!showPassword)}
              className="hover:text-cyan-400 transition-colors flex items-center gap-1 text-[11px]"
            >
              {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-slate-900/90 border border-slate-800">
            <div className="font-mono text-xl sm:text-2xl font-extrabold tracking-wider text-cyan-400 select-all break-all">
              {showPassword ? (vaultData?.current_password || "EXFIL-SEC-9x7K2#P") : "••••••••••••••••"}
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleCopyPassword}
                className="flex-1 sm:flex-none px-4 py-2 rounded-xl bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 border border-cyan-500/40 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                {copied ? "Copied!" : "Copy Key"}
              </button>

              <button
                onClick={handleRotateKey}
                title="Force Rotate Password"
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-bold transition-all flex items-center justify-center"
              >
                <RefreshCw className="w-4 h-4 animate-spin-slow" />
              </button>
            </div>
          </div>

          {/* Countdown Progress Bar */}
          <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-slate-800">
            <div
              className="bg-cyan-400 h-full transition-all duration-1000 ease-linear shadow-[0_0_10px_#06b6d4]"
              style={{ width: `${(countdown / 30) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Protection & Path Metadata Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Intercepted Target File:</span>
            <div className="text-slate-200 font-bold truncate flex items-center gap-2">
              <FileText className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">{targetFile}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
            <span className="text-slate-500 uppercase text-[10px]">Interception IP Route:</span>
            <div className="text-slate-200 font-bold flex items-center gap-1.5 truncate">
              <span className="text-cyan-400">{sourceIp}</span>
              <ArrowRight className="w-3.5 h-3.5 text-red-400 shrink-0" />
              <span className="text-red-400 truncate">{destIp}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
