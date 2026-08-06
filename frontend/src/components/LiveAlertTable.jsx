import React, { useState } from 'react';
import { AlertCircle, Eye, ShieldAlert, CheckCircle2, Filter, Search, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';

export default function LiveAlertTable({ alerts = [], onSelectAlert, onUpdateStatus, onDeleteAlert }) {
  const [filterSeverity, setFilterSeverity] = useState('ALL');
  const [showResolved, setShowResolved] = useState(false); // Default: Auto-hide resolved
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const filteredAlerts = alerts.filter(alert => {
    const isResolvedOrMitigated = alert.status === 'Resolved' || alert.status === 'Mitigated';
    if (!showResolved && isResolvedOrMitigated) return false;

    const matchesSeverity = filterSeverity === 'ALL' || alert.severity.toUpperCase() === filterSeverity;
    const matchesSearch =
      alert.alert_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.device_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.user_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      alert.attack_category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  // Calculate Pagination Slices
  const totalPages = Math.ceil(filteredAlerts.length / itemsPerPage) || 1;
  const safePage = Math.min(currentPage, totalPages);
  const startIndex = (safePage - 1) * itemsPerPage;
  const paginatedAlerts = filteredAlerts.slice(startIndex, startIndex + itemsPerPage);

  const getSeverityBadge = (severity) => {
    switch (severity) {
      case 'Critical':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'High':
        return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
      case 'Medium':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      default:
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30';
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Active':
        return 'bg-red-950 text-red-400 border-red-800';
      case 'Investigating':
        return 'bg-amber-950 text-amber-400 border-amber-800';
      case 'Mitigated':
      case 'Resolved':
        return 'bg-emerald-950 text-emerald-400 border-emerald-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="glass-panel rounded-2xl border border-slate-800 p-6 flex flex-col gap-4">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400" />
              Live Insider Exfiltration Threat Feed
            </h3>
            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              Paginated & Auto-Purged
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time multi-model detection stream from Windows event & telemetry agents
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Toggle Hide/Show Resolved */}
          <button
            onClick={() => {
              setShowResolved(!showResolved);
              setCurrentPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all flex items-center gap-1.5 ${
              showResolved
                ? 'bg-slate-800 text-slate-200 border-slate-700'
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {showResolved ? "Showing All Alerts" : "Active Incidents Only"}
          </button>

          {/* Search Box */}
          <div className="relative flex-1 sm:w-44">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search host, user..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-1 rounded-xl text-xs font-semibold">
            {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM'].map((sev) => (
              <button
                key={sev}
                onClick={() => {
                  setFilterSeverity(sev);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all ${
                  filterSeverity === sev
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {sev}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-900/80 text-slate-400 uppercase font-mono font-semibold border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Alert ID</th>
              <th className="py-3 px-4">Timestamp</th>
              <th className="py-3 px-4">Monitored Device</th>
              <th className="py-3 px-4">Threat Classification & Suspicious Action</th>
              <th className="py-3 px-4 text-center">Risk Score</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {paginatedAlerts.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-8 text-slate-500 italic">
                  No active telemetry alerts matching criteria.
                </td>
              </tr>
            ) : (
              paginatedAlerts.map((alert) => (
                <tr key={alert.alert_id} className="hover:bg-slate-900/50 transition-all">
                  <td className="py-3 px-4 font-bold text-cyan-400">{alert.alert_id}</td>
                  <td className="py-3 px-4 text-slate-400">
                    {new Date(alert.timestamp).toLocaleTimeString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{alert.device_id}</div>
                    <div className="text-[10px] text-slate-500">{alert.user_id}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="font-semibold text-slate-200">{alert.attack_category}</div>
                    <div className="text-[11px] text-cyan-300 font-medium mt-0.5">
                      {alert.suspicious_action || "Behavioral Anomaly Recorded"}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      Conf: {((alert.confidence || 0.9) * 100).toFixed(0)}%
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-bold text-sm text-slate-100">{alert.risk_score}</span>
                    <span className="text-slate-500 text-[10px]">/100</span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getSeverityBadge(alert.severity)}`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadge(alert.status)}`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-right space-x-2">
                    <button
                      onClick={() => onSelectAlert(alert)}
                      className="px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500 text-cyan-400 hover:text-slate-950 font-sans font-semibold text-xs border border-cyan-500/30 transition-all inline-flex items-center gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Investigate
                    </button>

                    {onDeleteAlert && (
                      <button
                        onClick={() => onDeleteAlert(alert.alert_id)}
                        title="Delete Alert"
                        className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white border border-red-500/30 transition-all inline-flex items-center"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800 text-xs font-mono">
        <div className="text-slate-400 flex items-center gap-2">
          <span>
            Showing <strong className="text-slate-200">{filteredAlerts.length > 0 ? startIndex + 1 : 0}</strong> to <strong className="text-slate-200">{Math.min(startIndex + itemsPerPage, filteredAlerts.length)}</strong> of <strong className="text-cyan-400">{filteredAlerts.length}</strong> incidents
          </span>
          <span className="text-slate-600">|</span>
          <span className="flex items-center gap-1 text-slate-400">
            Per Page:
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-0.5 text-cyan-400 font-bold focus:outline-none"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
            </select>
          </span>
        </div>

        {/* Page Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            disabled={safePage <= 1}
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => setCurrentPage(pageNum)}
              className={`px-3 py-1 rounded-lg border text-xs font-bold transition-all ${
                safePage === pageNum
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {pageNum}
            </button>
          ))}

          <button
            disabled={safePage >= totalPages}
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
