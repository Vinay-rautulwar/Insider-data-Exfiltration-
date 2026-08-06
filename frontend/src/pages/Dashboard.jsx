import React, { useState } from 'react';
import MetricsOverview from '../components/MetricsOverview';
import ThreatGauge from '../components/ThreatGauge';
import TelemetryCharts from '../components/TelemetryCharts';
import LiveAlertTable from '../components/LiveAlertTable';
import IncidentModal from '../components/IncidentModal';
import DynamicVaultProtection from '../components/DynamicVaultProtection';
import TransferPathVisualizer3D from '../components/TransferPathVisualizer3D';
import CyberSonarVisualizer3D from '../components/CyberSonarVisualizer3D';
import ScrollReveal from '../components/ScrollReveal';
import { Activity, Radio, HardDrive, Wifi, Cpu, Key, Lock, Network, Disc } from 'lucide-react';

export default function Dashboard({ alerts, summary, recentTelemetry = [], onUpdateStatus, onDeleteAlert, fetchAlerts }) {
  const [selectedAlert, setSelectedAlert] = useState(null);

  const latestTelemetry = recentTelemetry[0] || {};
  const latestPrediction = latestTelemetry.prediction || {};
  const latestAlert = (alerts && alerts.length > 0) ? alerts[0] : null;

  const activeAlerts = (alerts || []).filter(a => a.status === 'Active');
  const activeAlert = activeAlerts.reduce((max, alert) => {
    return (!max || (alert.risk_score > max.risk_score)) ? alert : max;
  }, null);

  // When active threat alerts exist, display the highest active threat alert score & details.
  // When active threats = 0 (all threats mitigated/resolved), Threat Gauge strictly displays normal baseline (12.0 Low Risk, Normal Baseline).
  const currentRiskScore = activeAlert ? activeAlert.risk_score : 12.0;
  const currentSeverity = activeAlert ? activeAlert.severity : 'Low';
  const currentAnomalyFlag = activeAlert ? (activeAlert.anomaly_flag ?? false) : false;
  const displayAlert = activeAlert || null;

  return (
    <div className="space-y-6">
      {/* Live Agent Telemetry Stream Banner */}
      {latestTelemetry.device_id && (
        <div className="p-4 rounded-2xl glass-panel border border-cyan-500/30 flex flex-wrap items-center justify-between gap-4 text-xs font-mono glow-cyan">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/40">
              <Radio className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">{latestTelemetry.device_id}</span>
                <span className="px-2 py-0.5 text-[10px] rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                  {latestTelemetry.user_id}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Live Host Telemetry Streaming • {new Date(latestTelemetry.timestamp || Date.now()).toLocaleTimeString()}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-slate-300">
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Mod Rate:</span>
              <div className="font-bold text-cyan-400">{latestTelemetry.file_mod_rate_per_sec || 0} /s</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">Outbound Net:</span>
              <div className="font-bold text-cyan-400">{latestTelemetry.outbound_bytes_per_sec || 0} MB/s</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">USB Write:</span>
              <div className="font-bold text-red-400">{latestTelemetry.usb_write_bytes_per_sec || 0} MB/s</div>
            </div>
            <div>
              <span className="text-slate-500 text-[10px] uppercase">AI Risk Score:</span>
              <div className="font-bold text-amber-400">{latestPrediction.risk_score || 0} ({latestPrediction.severity || 'Low'})</div>
            </div>
          </div>
        </div>
      )}

      {/* Top Cards Summary */}
      <ScrollReveal delay={100}>
        <MetricsOverview summary={summary} />
      </ScrollReveal>

      {/* 3D Real-Time Animated HTML5 Sonar Threat Visualizer */}
      <ScrollReveal delay={200}>
        <CyberSonarVisualizer3D activeAlert={displayAlert} />
      </ScrollReveal>

      {/* 3D Dynamic Password Protection Cyber-Vault */}
      <ScrollReveal delay={300}>
        <DynamicVaultProtection activeAlert={displayAlert} />
      </ScrollReveal>

      {/* 3D Hop-by-Hop Data Transfer Lineage Visualizer */}
      <ScrollReveal delay={400}>
        <TransferPathVisualizer3D activeAlert={displayAlert} />
      </ScrollReveal>

      {/* Main Monitoring Grid: Threat Gauge Dial + Telemetry Charts */}
      <ScrollReveal delay={500}>
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <ThreatGauge
              riskScore={currentRiskScore}
              severity={currentSeverity}
              anomalyFlag={currentAnomalyFlag}
              latestAlert={displayAlert}
            />
          </div>
          <div className="lg:col-span-3">
            <TelemetryCharts alerts={alerts} recentTelemetry={recentTelemetry} />
          </div>
        </div>
      </ScrollReveal>

      {/* Live Alert Feed Table */}
      <ScrollReveal delay={600}>
        <LiveAlertTable
          alerts={alerts}
          onSelectAlert={(alert) => setSelectedAlert(alert)}
          onUpdateStatus={onUpdateStatus}
          onDeleteAlert={onDeleteAlert}
        />
      </ScrollReveal>

      {/* Forensic Incident Workbench Modal */}
      {selectedAlert && (
        <IncidentModal
          alert={selectedAlert}
          onClose={() => setSelectedAlert(null)}
          onUpdateStatus={onUpdateStatus}
        />
      )}
    </div>
  );
}
