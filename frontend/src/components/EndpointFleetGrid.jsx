import React, { useState, useEffect } from 'react';
import { Monitor, Wifi, WifiOff, HardDrive, ShieldCheck, ShieldAlert, Cpu, Activity, RefreshCw } from 'lucide-react';

export default function EndpointFleetGrid() {
  const [fleet, setFleet] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchFleet = async () => {
    try {
      const res = await fetch('/api/v1/endpoints/fleet');
      if (res.ok) {
        setFleet(await res.json());
      }
    } catch (e) {
      console.error("Failed to fetch fleet matrix:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFleet();
    const interval = setInterval(fetchFleet, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleToggleIsolate = async (deviceId, currentStatus) => {
    const isolate = currentStatus !== "Network Isolated";
    try {
      await fetch(`/api/v1/endpoints/${deviceId}/isolate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isolate })
      });
      fetchFleet();
    } catch (e) {
      console.error("Failed to update host containment status:", e);
    }
  };

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
            <Monitor className="w-5 h-5 text-cyan-400" />
            ENTERPRISE ENDPOINT FLEET MATRIX
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time telemetry & network containment controls across enterprise host workstations
          </p>
        </div>

        <button
          onClick={fetchFleet}
          className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh Fleet Status
        </button>
      </div>

      {/* Endpoint Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {fleet.map((ep) => {
          const isIsolated = ep.isolation_status === "Network Isolated";
          const isHighRisk = ep.current_risk_score >= 75;

          return (
            <div
              key={ep.device_id}
              className={`p-5 rounded-2xl bg-slate-900/80 border transition-all flex flex-col justify-between space-y-4 ${
                isIsolated
                  ? 'border-red-500/40 glow-red'
                  : (isHighRisk ? 'border-amber-500/40' : 'border-slate-800')
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-cyan-400">{ep.device_id}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                    isIsolated ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                  }`}>
                    {ep.isolation_status}
                  </span>
                </div>

                <div>
                  <h3 className="text-sm font-bold text-slate-100 font-mono">{ep.hostname || ep.device_id}</h3>
                  <p className="text-xs text-slate-400">{ep.department || "Live Monitored Workstation"}</p>
                </div>

                <div className="space-y-1 text-xs font-mono pt-2 border-t border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">IP Address:</span>
                    <span className="text-slate-200 font-semibold">{ep.ip_address || "192.168.1.105"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Risk Score:</span>
                    <span className={`font-bold ${isHighRisk ? 'text-red-400' : 'text-emerald-400'}`}>
                      {ep.current_risk_score}/100
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">USB Interface:</span>
                    <span className={ep.usb_port_status === 'Blocked' ? 'text-red-400 font-bold' : 'text-emerald-400'}>
                      {ep.usb_port_status || "Active"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">CPU / RAM:</span>
                    <span className="text-slate-300 font-semibold">
                      {ep.cpu_usage_pct !== undefined ? ep.cpu_usage_pct : 18.5}% / {ep.ram_usage_pct !== undefined ? ep.ram_usage_pct : 45.0}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Toggle Button */}
              <button
                onClick={() => handleToggleIsolate(ep.device_id, ep.isolation_status)}
                className={`w-full py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center justify-center gap-1.5 ${
                  isIsolated
                    ? 'bg-emerald-500/10 hover:bg-emerald-500 text-emerald-400 hover:text-slate-950 border-emerald-500/30'
                    : 'bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-slate-950 border-red-500/30'
                }`}
              >
                {isIsolated ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
                {isIsolated ? "Rejoin Enterprise Network" : "Isolate Host Network"}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
