import React, { useState, useEffect } from 'react';
import { Zap, ShieldAlert, CheckCircle2, Cpu, Activity, Clock, Terminal, Lock } from 'lucide-react';

export default function SOAREngine() {
  const [playbooks, setPlaybooks] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSOARData = async () => {
    try {
      const [pbRes, logRes] = await Promise.all([
        fetch('/api/v1/soar/playbooks'),
        fetch('/api/v1/soar/logs')
      ]);
      if (pbRes.ok && logRes.ok) {
        setPlaybooks(await pbRes.json());
        setLogs(await logRes.json());
      }
    } catch (e) {
      console.error("Failed to load SOAR data:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSOARData();
    const interval = setInterval(fetchSOARData, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-100 font-mono flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400 animate-pulse" />
              SOAR AUTOMATION & CONTAINMENT ENGINE
            </h2>
            <span className="px-2.5 py-0.5 text-xs font-bold rounded bg-yellow-950 text-yellow-300 border border-yellow-800">
              Micro-Latency Engine (&lt;20ms)
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Security Orchestration, Automation, and Response playbooks for immediate autonomous host isolation
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
          <Clock className="w-4 h-4 text-cyan-400" />
          Average Response: <strong className="text-emerald-400">13.2 ms</strong>
        </div>
      </div>

      {/* Active SOAR Playbooks Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {playbooks.map((pb) => (
          <div key={pb.playbook_id} className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-3 relative overflow-hidden">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-yellow-400">{pb.playbook_id}</span>
              <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                {pb.execution_mode}
              </span>
            </div>

            <h3 className="text-sm font-bold text-slate-100 font-mono">{pb.name}</h3>
            <p className="text-xs text-slate-400 font-mono bg-slate-950 p-2 rounded-lg border border-slate-800/80">
              IF: <span className="text-cyan-300 font-semibold">{pb.condition}</span>
            </p>

            <div className="space-y-1 text-xs font-mono pt-1">
              <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Automated Actions:</span>
              <ul className="space-y-1 mt-1">
                {pb.actions.map((act, idx) => (
                  <li key={idx} className="text-slate-300 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    {act}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {/* Live SOAR Execution Log Stream */}
      <div className="space-y-3 pt-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-1.5">
          <Terminal className="w-4 h-4 text-cyan-400" />
          Autonomous Response Execution Stream
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Execution ID</th>
                <th className="py-2.5 px-3">Trigger Host / User</th>
                <th className="py-2.5 px-3">Playbook</th>
                <th className="py-2.5 px-3 text-center">Risk Score</th>
                <th className="py-2.5 px-3">Containment Actions</th>
                <th className="py-2.5 px-3 text-right">Latency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {logs.map((log) => (
                <tr key={log.log_id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 font-bold text-yellow-400">{log.log_id}</td>
                  <td className="py-2.5 px-3">
                    <div className="font-semibold text-slate-200">{log.trigger_device}</div>
                    <div className="text-[10px] text-slate-500">{log.trigger_user}</div>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{log.playbook_name}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="font-bold text-red-400">{log.triggered_risk_score}</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <div className="flex flex-wrap gap-1">
                      {log.actions_executed.map((act, i) => (
                        <span key={i} className="px-2 py-0.5 text-[10px] rounded bg-slate-900 border border-slate-700 text-cyan-300">
                          {act}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-emerald-400">
                    {log.execution_latency_ms} ms
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
