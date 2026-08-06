import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line as LineChart, Bar as BarChart, Radar as RadarChart } from 'react-chartjs-2';
import { Activity, BarChart3, Radio } from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function TelemetryCharts({ alerts = [], recentTelemetry = [] }) {
  // Use raw telemetry stream if available, otherwise fall back to alert snapshots
  const dataStream = recentTelemetry.length > 0 ? recentTelemetry : alerts.map(a => a.telemetry_snapshot || a);

  // Extract historical points for telemetry charts
  const labels = dataStream.slice(0, 10).reverse().map(item => {
    const d = new Date(item.timestamp || Date.now());
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  });

  const outboundData = dataStream.slice(0, 10).reverse().map(item => 
    item.outbound_bytes_per_sec ?? item.telemetry_snapshot?.outbound_bytes_per_sec ?? 0.5
  );

  const fileModData = dataStream.slice(0, 10).reverse().map(item => 
    item.file_mod_rate_per_sec ?? item.telemetry_snapshot?.file_mod_rate_per_sec ?? 1.0
  );

  const usbWriteData = dataStream.slice(0, 10).reverse().map(item => 
    item.usb_write_bytes_per_sec ?? item.telemetry_snapshot?.usb_write_bytes_per_sec ?? 0
  );

  // Line Chart Config for Outbound Velocity
  const lineChartData = {
    labels: labels.length ? labels : ['00:00', '00:05', '00:10', '00:15', '00:20'],
    datasets: [
      {
        label: 'Outbound Network Velocity (MB/s)',
        data: outboundData.length ? outboundData : [0.5, 1.2, 0.8, 120.0, 5.0],
        borderColor: '#06b6d4',
        backgroundColor: 'rgba(6, 182, 212, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#06b6d4',
      },
      {
        label: 'USB Write Velocity (MB/s)',
        data: usbWriteData.length ? usbWriteData : [0, 0, 0, 85.0, 10.0],
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.15)',
        fill: true,
        tension: 0.4,
        pointRadius: 4,
        pointBackgroundColor: '#f59e0b',
      }
    ]
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8', font: { family: 'monospace', size: 11 } }
      },
      tooltip: {
        backgroundColor: '#0f172a',
        borderColor: '#334155',
        borderWidth: 1,
        titleColor: '#38bdf8',
        bodyColor: '#f1f5f9'
      }
    },
    scales: {
      x: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } },
      y: { grid: { color: 'rgba(51, 65, 85, 0.3)' }, ticks: { color: '#64748b' } }
    }
  };

  // Bar Chart Config for File Mod Spikes
  const barChartData = {
    labels: labels.length ? labels : ['00:00', '00:05', '00:10', '00:15', '00:20'],
    datasets: [
      {
        label: 'File Modification Rate (files/sec)',
        data: fileModData.length ? fileModData : [2, 5, 80, 45, 3],
        backgroundColor: '#ef4444',
        borderRadius: 6,
      }
    ]
  };

  // Radar Chart Config for Exfiltration Attack Vector Balance
  const latestAlert = alerts[0];
  const snapshot = latestAlert?.telemetry_snapshot || {};
  const radarData = {
    labels: ['File Velocity', 'Folder Growth', 'Archive Entropy', 'Outbound Net', 'USB Activity', 'Off-Hours'],
    datasets: [
      {
        label: 'Active Incident Profile',
        data: [
          Math.min(100, (snapshot.file_mod_rate_per_sec || 10) * 2),
          Math.min(100, (snapshot.staging_folder_growth_mb_per_sec || 5) * 2),
          Math.min(100, (snapshot.archive_ext_entropy_score || 0.2) * 100),
          Math.min(100, (snapshot.outbound_bytes_per_sec || 1) * 2),
          Math.min(100, (snapshot.usb_write_bytes_per_sec || 0) * 1.5),
          snapshot.off_hours_flag ? 100 : 10
        ],
        backgroundColor: 'rgba(239, 68, 68, 0.25)',
        borderColor: '#ef4444',
        borderWidth: 2,
        pointBackgroundColor: '#ef4444',
      }
    ]
  };

  const radarOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { labels: { color: '#94a3b8', font: { family: 'monospace', size: 11 } } }
    },
    scales: {
      r: {
        angleLines: { color: 'rgba(51, 65, 85, 0.5)' },
        grid: { color: 'rgba(51, 65, 85, 0.5)' },
        pointLabels: { color: '#94a3b8', font: { size: 10 } },
        ticks: { backdropColor: 'transparent', color: '#64748b' }
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Network & USB Outbound Velocity Line Chart */}
      <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Outbound Network & USB Transfer Velocity
          </h3>
          <span className="text-xs text-slate-400 font-mono">Live Telemetry (MB/s)</span>
        </div>
        <div className="h-64 w-full">
          <LineChart data={lineChartData} options={lineOptions} />
        </div>
      </div>

      {/* Exfiltration Threat Vector Radar Chart */}
      <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Radio className="w-4 h-4 text-red-400" />
            Threat Vector Profile
          </h3>
          <span className="text-xs text-slate-400 font-mono">Radar Analysis</span>
        </div>
        <div className="h-64 w-full flex items-center justify-center">
          <RadarChart data={radarData} options={radarOptions} />
        </div>
      </div>
    </div>
  );
}
