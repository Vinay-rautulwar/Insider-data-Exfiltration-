import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Usb,
  CloudOff,
  Lock,
  Paperclip,
  Share2,
  Mail,
  Send,
  RefreshCw,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Server,
  Settings,
  Terminal,
  KeyRound,
  Bell
} from 'lucide-react';

export default function AdaptiveSecurityShield() {
  const [shieldState, setShieldState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [testEmailStatus, setTestEmailStatus] = useState(null);
  const [simStatus, setSimStatus] = useState(null);
  const [showConfig, setShowConfig] = useState(false);

  const [formInitialized, setFormInitialized] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState(null);

  const [configForm, setConfigForm] = useState({
    admin_email: '',
    smtp_server: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    sender_email: '',
    smtp_use_tls: true
  });

  const fetchStatus = async () => {
    try {
      const res = await fetch('/api/v1/adaptive-shield/status');
      if (res.ok) {
        const data = await res.json();
        setShieldState(data);
        if (!formInitialized) {
          setConfigForm({
            admin_email: data.admin_email || 'admin@company.com',
            smtp_server: data.smtp_server || 'smtp.gmail.com',
            smtp_port: data.smtp_port || 587,
            smtp_user: data.smtp_user || '',
            smtp_password: data.smtp_password || '',
            sender_email: data.sender_email || '',
            smtp_use_tls: data.smtp_use_tls !== undefined ? data.smtp_use_tls : true
          });
          setFormInitialized(true);
        }
      }
    } catch (e) {
      console.error("Failed to fetch adaptive shield status:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, [formInitialized]);

  const handleToggleBlockade = async (key, currentStatus) => {
    setActionLoading(true);
    try {
      const newEnabled = currentStatus !== 'ENFORCED';
      await fetch('/api/v1/adaptive-shield/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockade_key: key, enabled: newEnabled })
      });
      await fetchStatus();
    } catch (e) {
      console.error("Failed to toggle blockade:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendTestEmail = async () => {
    setTestEmailStatus({ loading: true, msg: 'Dispatching Real SMTP Email Alert...' });
    try {
      const res = await fetch('/api/v1/adaptive-shield/test-email', { method: 'POST' });
      const data = await res.json();
      const result = data.result || {};
      if (res.ok && result.status === 'SENT') {
        setTestEmailStatus({
          success: true,
          msg: `✅ Real email successfully sent to ${result.recipient || 'Admin'}! Check your inbox.`
        });
        fetchStatus();
      } else {
        const errorDetail = result.details || data.detail || 'SMTP delivery failed. Check your credentials.';
        setTestEmailStatus({
          success: false,
          msg: `❌ Delivery Failed: ${errorDetail}`
        });
        fetchStatus();
      }
    } catch (e) {
      setTestEmailStatus({ success: false, msg: '❌ Network error sending SMTP email alert.' });
    }
  };

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    setSaveSuccessMsg(null);
    try {
      const res = await fetch('/api/v1/adaptive-shield/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configForm)
      });
      if (res.ok) {
        setShieldState(prev => prev ? { ...prev, ...configForm } : prev);
        setSaveSuccessMsg(`✅ Admin Email & SMTP Settings updated successfully to "${configForm.admin_email}"!`);
        setTimeout(() => setSaveSuccessMsg(null), 5000);
        setShowConfig(false);
        fetchStatus();
      }
    } catch (e) {
      console.error("Failed to update config:", e);
    } finally {
      setActionLoading(false);
    }
  };

  const handleTriggerSimulatedAttack = async () => {
    setSimStatus({ loading: true, msg: 'Simulating Insider Threat Vector & Dispatching Threat Alert Email...' });
    try {
      const res = await fetch('/api/v1/adaptive-shield/trigger-simulated-attack', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: 'HOST-FIN-SEC01',
          user_id: 'suspect_insider_77',
          attack_category: 'USB Data Dump & Cloud Burst',
          risk_score: 96.8,
          suspicious_action: 'Bulk Data Exfiltration Attempt & Removable Copy'
        })
      });
      const data = await res.json();
      if (res.ok) {
        const emailRes = data.execution_summary?.email_alert_result || {};
        if (emailRes.status === 'SENT') {
          setSimStatus({
            success: true,
            msg: `🚨 AI Shield Engaged! All 5 Blockades Locked & Real Threat Alert Email delivered to ${emailRes.recipient}!`
          });
        } else {
          setSimStatus({
            success: false,
            msg: `🚨 Shield Engaged (5 Blockades Locked), but SMTP Email Failed: ${emailRes.details || 'Please check SMTP credentials.'}`
          });
        }
        fetchStatus();
      } else {
        setSimStatus({ success: false, msg: 'Failed to trigger attack simulation.' });
      }
    } catch (e) {
      setSimStatus({ success: false, msg: 'Network error triggering attack simulation.' });
    }
  };

  const blockadesList = shieldState?.blockades ? Object.values(shieldState.blockades) : [];

  const getIconComponent = (key) => {
    switch (key) {
      case 'usb_disabled':
        return Usb;
      case 'cloud_upload_blocked':
        return CloudOff;
      case 'sensitive_folders_locked':
        return Lock;
      case 'email_attachment_limited':
        return Paperclip;
      case 'external_file_sharing_blocked':
        return Share2;
      default:
        return ShieldAlert;
    }
  };

  if (loading && !shieldState) {
    return (
      <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
        <p className="text-slate-400 font-mono text-sm">Initializing AI Adaptive Security Shield Engine...</p>
      </div>
    );
  }

  const isAnyEnforced = blockadesList.some(b => b.status === 'ENFORCED');

  return (
    <div className="space-y-6 font-sans">
      {/* Top Banner Shield Status */}
      <div className={`p-6 rounded-2xl border transition-all duration-500 shadow-2xl relative overflow-hidden ${
        isAnyEnforced
          ? 'bg-gradient-to-r from-red-950/80 via-slate-900 to-red-950/80 border-red-500/50 shadow-[0_0_35px_rgba(239,68,68,0.25)]'
          : 'bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border-cyan-500/30 shadow-[0_0_25px_rgba(6,182,212,0.15)]'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-start gap-4">
            <div className={`p-3.5 rounded-2xl border ${
              isAnyEnforced
                ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
            }`}>
              {isAnyEnforced ? <ShieldAlert className="w-9 h-9" /> : <ShieldCheck className="w-9 h-9" />}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-white tracking-wider font-mono">
                  AI ADAPTIVE SECURITY SHIELD
                </h2>
                <span className={`px-3 py-1 text-xs font-black rounded-full border tracking-wider uppercase font-mono ${
                  isAnyEnforced
                    ? 'bg-red-950 text-red-300 border-red-800 shadow-[0_0_15px_rgba(239,68,68,0.5)]'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-800'
                }`}>
                  {isAnyEnforced ? '🚫 THREAT CONTAINMENT ACTIVE' : '🛡️ SHIELD ARMED & MONITORING'}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 max-w-2xl font-mono">
                Real-time AI insider threat detection triggers instant 5-layer system blockades and SMTP email notification dispatch to Admin.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleTriggerSimulatedAttack}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white shadow-lg shadow-red-950/50 transition-all hover:scale-105 active:scale-95"
            >
              <Zap className="w-4 h-4" />
              Simulate Insider Attack
            </button>

            <button
              onClick={() => setShowConfig(!showConfig)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold font-mono bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-all"
            >
              <Settings className="w-4 h-4 text-cyan-400" />
              SMTP Settings
            </button>
          </div>
        </div>

        {/* Save Success Notice */}
        {saveSuccessMsg && (
          <div className="mt-4 p-3 rounded-xl border border-emerald-500/40 bg-emerald-950/90 text-emerald-300 text-xs font-mono flex items-center justify-between shadow-lg animate-in fade-in">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{saveSuccessMsg}</span>
            </div>
            <button onClick={() => setSaveSuccessMsg(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}

        {/* Simulation Feedback Notice */}
        {simStatus && (
          <div className={`mt-4 p-3 rounded-xl border text-xs font-mono flex items-center justify-between ${
            simStatus.success
              ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-200'
              : 'bg-red-950/80 border-red-500/40 text-red-200'
          }`}>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{simStatus.msg}</span>
            </div>
            <button onClick={() => setSimStatus(null)} className="text-slate-400 hover:text-white">✕</button>
          </div>
        )}
      </div>

      {/* SMTP Configuration Drawer / Modal */}
      {showConfig && (
        <div className="glass-panel p-6 rounded-2xl border border-cyan-500/40 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold font-mono text-cyan-400 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Real SMTP Email Notification Configuration
            </h3>
            <button onClick={() => setShowConfig(false)} className="text-slate-400 hover:text-white text-sm">✕</button>
          </div>

          <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-[11px] font-mono text-cyan-300">
            <strong>ℹ️ Live Email Setup Tip:</strong> To receive actual alert emails on <strong>Gmail</strong>, use host <code>smtp.gmail.com</code>, port <code>587</code>, and generate a 16-character <strong>App Password</strong> from your Google Account settings (Security &gt; 2-Step Verification &gt; App Passwords).
          </div>

          <form onSubmit={handleSaveConfig} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold font-mono text-slate-400 mb-1">Recipient Admin Email (Alert Target)</label>
              <input
                type="email"
                value={configForm.admin_email}
                onChange={(e) => setConfigForm({ ...configForm, admin_email: e.target.value })}
                placeholder="admin@yourdomain.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-slate-400 mb-1">SMTP Server Host</label>
              <input
                type="text"
                value={configForm.smtp_server}
                onChange={(e) => setConfigForm({ ...configForm, smtp_server: e.target.value })}
                placeholder="smtp.gmail.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-slate-400 mb-1">SMTP Port (587 or 465)</label>
              <input
                type="number"
                value={configForm.smtp_port}
                onChange={(e) => setConfigForm({ ...configForm, smtp_port: parseInt(e.target.value) || 587 })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-slate-400 mb-1">Sender Email</label>
              <input
                type="text"
                value={configForm.sender_email}
                onChange={(e) => setConfigForm({ ...configForm, sender_email: e.target.value })}
                placeholder="alerts@yourdomain.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-slate-400 mb-1">SMTP Username / Email</label>
              <input
                type="text"
                value={configForm.smtp_user}
                onChange={(e) => setConfigForm({ ...configForm, smtp_user: e.target.value })}
                placeholder="your.email@gmail.com"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-slate-200 font-mono focus:border-cyan-500 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold font-mono text-cyan-400 mb-1">SMTP Password / App Password</label>
              <input
                type="password"
                value={configForm.smtp_password}
                onChange={(e) => setConfigForm({ ...configForm, smtp_password: e.target.value })}
                placeholder="••••••••••••••••"
                className="w-full px-3 py-2 text-xs rounded-xl bg-slate-950 border border-cyan-500/50 text-slate-200 font-mono focus:border-cyan-400 focus:outline-none"
                required
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="smtp_use_tls"
                checked={configForm.smtp_use_tls}
                onChange={(e) => setConfigForm({ ...configForm, smtp_use_tls: e.target.checked })}
                className="rounded border-slate-800 text-cyan-500 focus:ring-cyan-500"
              />
              <label htmlFor="smtp_use_tls" className="text-xs font-mono text-slate-300">
                Use STARTTLS Encryption (Default for port 587)
              </label>
            </div>

            <div className="sm:col-span-2 flex items-end gap-2">
              <button
                type="submit"
                disabled={actionLoading}
                className="w-full py-2.5 px-4 rounded-xl text-xs font-bold font-mono bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all shadow-md"
              >
                Save Real SMTP Settings
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 5 Blockade Controls Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
            <Lock className="w-4 h-4 text-fuchsia-400" />
            AI Automated Shield Protection Rules (5 Defense Layers)
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            Total Threat Triggers: <strong className="text-cyan-400">{shieldState?.total_trigger_count || 0}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {blockadesList.map((blockade) => {
            const IconComp = getIconComponent(blockade.key);
            const isEnforced = blockade.status === 'ENFORCED';

            return (
              <div
                key={blockade.key}
                className={`p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between space-y-4 ${
                  isEnforced
                    ? 'bg-slate-900/90 border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.2)]'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className={`p-2.5 rounded-xl border ${
                      isEnforced
                        ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse'
                        : 'bg-slate-800 border-slate-700 text-cyan-400'
                    }`}>
                      <IconComp className="w-6 h-6" />
                    </div>

                    <span className={`px-2.5 py-1 text-[10px] font-extrabold font-mono rounded-full border uppercase ${
                      isEnforced
                        ? 'bg-red-950 text-red-300 border-red-800'
                        : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                    }`}>
                      {isEnforced ? 'ENFORCED' : 'ARMED'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-sm font-black text-slate-100 font-mono flex items-center gap-1.5">
                      <span className="text-red-400">🚫</span> {blockade.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-1 leading-relaxed">
                      {blockade.description}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-slate-400">
                    Mode: <span className="text-slate-300 font-semibold">AI Automated</span>
                  </span>

                  <button
                    onClick={() => handleToggleBlockade(blockade.key, blockade.status)}
                    disabled={actionLoading}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold font-mono transition-all border ${
                      isEnforced
                        ? 'bg-red-950/60 hover:bg-slate-800 text-red-300 border-red-800'
                        : 'bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 border-cyan-800'
                    }`}
                  >
                    {isEnforced ? 'Disable Lock' : 'Enforce Now'}
                  </button>
                </div>
              </div>
            );
          })}

          {/* Card for Instant SMTP Email Alert Dispatcher */}
          <div className="p-5 rounded-2xl border border-cyan-500/40 bg-gradient-to-br from-cyan-950/30 to-slate-900 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="p-2.5 rounded-xl border bg-cyan-500/20 border-cyan-500/40 text-cyan-400">
                  <Mail className="w-6 h-6" />
                </div>

                <span className="px-2.5 py-1 text-[10px] font-extrabold font-mono rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  SMTP LIVE
                </span>
              </div>

              <div>
                <h4 className="text-sm font-black text-slate-100 font-mono flex items-center gap-1.5">
                  <Bell className="w-4 h-4 text-cyan-400" /> Instant Admin SMTP Alert
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-1">
                  Alert recipient: <strong className="text-slate-200">{shieldState?.admin_email || 'admin@company.com'}</strong>
                </p>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <button
                onClick={handleSendTestEmail}
                className="w-full py-2 px-3 rounded-xl text-xs font-bold font-mono bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-3.5 h-3.5" /> Send Test Email Alert
              </button>

              {testEmailStatus && (
                <p className={`text-[10px] font-mono text-center ${testEmailStatus.success ? 'text-emerald-400' : 'text-cyan-300'}`}>
                  {testEmailStatus.msg}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Email Alert Stream Log */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          SMTP Email Notification & Shield Execution Log Stream
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono text-slate-300">
            <thead className="bg-slate-900/80 text-slate-400 uppercase border-b border-slate-800">
              <tr>
                <th className="py-2.5 px-3">Timestamp</th>
                <th className="py-2.5 px-3">Event Type</th>
                <th className="py-2.5 px-3">Target Host / User</th>
                <th className="py-2.5 px-3">Recipient Admin Email</th>
                <th className="py-2.5 px-3">SMTP Status</th>
                <th className="py-2.5 px-3 text-right">Delivery Mode</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {shieldState?.recent_email_logs?.length > 0 ? (
                shieldState.recent_email_logs.map((log, i) => (
                  <tr key={i} className="hover:bg-slate-900/50">
                    <td className="py-2.5 px-3 text-slate-400">{log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : 'Just now'}</td>
                    <td className="py-2.5 px-3 font-bold text-fuchsia-400">{log.type || 'THREAT_ALERT'}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{log.device_id || 'SYSTEM'}{log.user_id ? ` / ${log.user_id}` : ''}</td>
                    <td className="py-2.5 px-3 text-slate-200">{log.recipient}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                        log.status === 'SENT' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-cyan-950 text-cyan-300 border border-cyan-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">{log.mode || 'LIVE_SMTP'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="py-6 text-center text-slate-500 font-mono">
                    No SMTP email dispatch logs recorded yet. Click "Send Test Email Alert" or "Simulate Insider Attack" above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
