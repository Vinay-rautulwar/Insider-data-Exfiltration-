import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import SOAREngine from './components/SOAREngine';
import EndpointFleetGrid from './components/EndpointFleetGrid';
import PolicyTuner from './components/PolicyTuner';
import AttackSimulator from './components/AttackSimulator';
import ModelPerformance from './components/ModelPerformance';
import DynamicVaultProtection from './components/DynamicVaultProtection';
import TransferPathVisualizer3D from './components/TransferPathVisualizer3D';
import AdaptiveSecurityShield from './components/AdaptiveSecurityShield';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [alerts, setAlerts] = useState([]);
  const [summary, setSummary] = useState(null);
  const [apiOnline, setApiOnline] = useState(false);

  const [recentTelemetry, setRecentTelemetry] = useState([]);

  const fetchAlertsAndSummary = async () => {
    try {
      const [alertsRes, summaryRes, telemetryRes] = await Promise.all([
        fetch('/api/v1/alerts?limit=50'),
        fetch('/api/v1/alerts/summary'),
        fetch('/api/v1/telemetry/recent?limit=50')
      ]);

      if (alertsRes.ok && summaryRes.ok) {
        const alertsData = await alertsRes.json();
        const summaryData = await summaryRes.json();
        setAlerts(alertsData);
        setSummary(summaryData);
        if (telemetryRes.ok) {
          setRecentTelemetry(await telemetryRes.json());
        }
        setApiOnline(true);
      } else {
        setApiOnline(false);
      }
    } catch (e) {
      setApiOnline(false);
    }
  };

  useEffect(() => {
    fetchAlertsAndSummary();
    const interval = setInterval(fetchAlertsAndSummary, 4000); // Poll every 4s for live stream
    return () => clearInterval(interval);
  }, []);

  const handleUpdateStatus = async (alertId, newStatus) => {
    try {
      await fetch(`/api/v1/alerts/${alertId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      fetchAlertsAndSummary();
    } catch (e) {
      console.error("Failed to update alert status:", e);
    }
  };

  const handleDeleteAlert = async (alertId) => {
    try {
      await fetch(`/api/v1/alerts/${alertId}`, {
        method: 'DELETE'
      });
      fetchAlertsAndSummary();
    } catch (e) {
      console.error("Failed to delete alert:", e);
    }
  };

  const activeAlert = alerts.find(a => a.status === 'Active') || alerts[0] || null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Sticky Glass Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        apiOnline={apiOnline}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'dashboard' && (
          <Dashboard
            alerts={alerts}
            summary={summary}
            recentTelemetry={recentTelemetry}
            onUpdateStatus={handleUpdateStatus}
            onDeleteAlert={handleDeleteAlert}
            fetchAlerts={fetchAlertsAndSummary}
          />
        )}

        {activeTab === 'adaptive_shield' && (
          <AdaptiveSecurityShield />
        )}

        {activeTab === 'vault' && (
          <div className="space-y-6">
            <DynamicVaultProtection activeAlert={activeAlert} />
            <TransferPathVisualizer3D activeAlert={activeAlert} />
          </div>
        )}

        {activeTab === 'soar' && (
          <SOAREngine />
        )}

        {activeTab === 'fleet' && (
          <EndpointFleetGrid />
        )}

        {activeTab === 'policy' && (
          <PolicyTuner />
        )}

        {activeTab === 'simulator' && (
          <AttackSimulator
            onSimulationTriggered={fetchAlertsAndSummary}
          />
        )}

        {activeTab === 'models' && (
          <ModelPerformance />
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800 text-center py-4 text-xs text-slate-500 font-mono">
        EXFILSENTINEL © 2026 — Privacy-Preserving Insider Data Exfiltration Detection System (Metadata & Behavioral AI)
      </footer>
    </div>
  );
}
