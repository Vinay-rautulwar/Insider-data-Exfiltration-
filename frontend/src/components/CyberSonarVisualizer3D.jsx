import React, { useState, useEffect, useRef } from 'react';
import { Radio, Zap, ShieldCheck, Globe, Volume2, Target, Sliders, Activity, Disc, Cpu, ArrowUpRight } from 'lucide-react';

export default function CyberSonarVisualizer3D({ activeAlert }) {
  const canvasRef = useRef(null);
  const [selectedTarget, setSelectedTarget] = useState(null);
  const [sonarMode, setSonarMode] = useState('ACTIVE_PULSE');
  const [scanRange, setScanRange] = useState('500m');

  const targets = [
    { id: 'TRG-01', label: 'US-EAST Vault Host', ip: activeAlert?.telemetry_snapshot?.dest_ip || '104.21.88.19', dist: 140, angle: 45, status: 'EXFIL TARGET', risk: '91.1%', speed: '125 MB/s' },
    { id: 'TRG-02', label: 'EU-PROXY Relay Node', ip: '185.190.140.2', dist: 90, angle: 135, status: 'MONITORED', risk: '12.0%', speed: '0.4 MB/s' },
    { id: 'TRG-03', label: 'LOCAL-STAGING Vault', ip: activeAlert?.telemetry_snapshot?.ip_address || '10.17.122.35', dist: 60, angle: 220, status: 'PASSWORD LOCKED', risk: '88.5%', speed: '42 MB/s' },
    { id: 'TRG-04', label: 'APAC Gateway Node', ip: '103.21.244.0', dist: 180, angle: 310, status: 'MONITORED', risk: '14.5%', speed: '1.2 MB/s' }
  ];

  // Real-time Canvas Sonar Animation Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let angle = 0;
    let ripples = [0, 50, 100, 150];

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const centerX = width / 2;
      const centerY = height / 2;
      const radius = Math.min(centerX, centerY) - 10;

      ctx.clearRect(0, 0, width, height);

      // Background Radial Grid
      ctx.fillStyle = '#030712';
      ctx.fillRect(0, 0, width, height);

      // Expanding Sonar Wave Ripples
      ripples = ripples.map((r) => {
        let nextR = r + 0.8;
        if (nextR > radius) nextR = 0;

        ctx.beginPath();
        ctx.arc(centerX, centerY, nextR, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(6, 182, 212, ${1 - nextR / radius})`;
        ctx.lineWidth = 1;
        ctx.stroke();

        return nextR;
      });

      // Concentric Distance Rings
      [0.25, 0.5, 0.75, 1.0].forEach((scale) => {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius * scale, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.2)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // Crosshair Axes
      ctx.beginPath();
      ctx.moveTo(centerX - radius, centerY);
      ctx.lineTo(centerX + radius, centerY);
      ctx.moveTo(centerX, centerY - radius);
      ctx.lineTo(centerX, centerY + radius);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Sweeping Sonar Beam with Fading Tail
      angle = (angle + 0.02) % (Math.PI * 2);

      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, angle - 0.4, angle);
      ctx.closePath();
      const beamGradient = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, radius);
      beamGradient.addColorStop(0, 'rgba(6, 182, 212, 0.6)');
      beamGradient.addColorStop(1, 'rgba(6, 182, 212, 0.05)');
      ctx.fillStyle = beamGradient;
      ctx.fill();

      // Beam Sweep Leading Edge Line
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(centerX + Math.cos(angle) * radius, centerY + Math.sin(angle) * radius);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Render Sonar Target Blips
      targets.forEach((target) => {
        const rad = (target.angle * Math.PI) / 180;
        const bx = centerX + Math.cos(rad) * (target.dist * (radius / 200));
        const by = centerY + Math.sin(rad) * (target.dist * (radius / 200));

        const isHighRisk = target.risk === '91.1%' || target.risk === '88.5%';
        const blipColor = isHighRisk ? '#ef4444' : '#10b981';

        // Blip Glow
        ctx.beginPath();
        ctx.arc(bx, by, 6, 0, Math.PI * 2);
        ctx.fillStyle = blipColor;
        ctx.shadowColor = blipColor;
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Target Label Text
        ctx.font = '10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#cbd5e1';
        ctx.fillText(target.id, bx + 10, by + 3);
      });

      // Transducer Center Pulse
      ctx.beginPath();
      ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 15;
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => cancelAnimationFrame(animationFrameId);
  }, [targets]);

  const activeTargetData = selectedTarget || targets[0];

  return (
    <div className="perspective-3d w-full">
      <div className="card-3d glass-panel p-6 rounded-2xl border border-cyan-500/40 relative overflow-hidden space-y-6 glow-cyan">
        
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-cyan-500/15 text-cyan-400 border border-cyan-500/40 animate-pulse-glow">
              <Disc className="w-6 h-6 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-white font-mono tracking-wide flex items-center gap-2">
                  3D CYBER SONAR VISUALIZER & ACOUSTIC THREAT MATRIX
                </h3>
                <span className="px-2.5 py-0.5 text-[10px] font-extrabold rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800">
                  REAL-TIME ACOUSTIC SONAR
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Sub-Surface Network Telemetry Waveform Analysis & Target Bearing Lock
              </p>
            </div>
          </div>

          {/* Sonar Control Buttons */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
            <div className="flex items-center bg-slate-900 rounded-xl p-1 border border-slate-800">
              <button
                onClick={() => setSonarMode('ACTIVE_PULSE')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  sonarMode === 'ACTIVE_PULSE' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                ACTIVE PULSE
              </button>
              <button
                onClick={() => setSonarMode('PASSIVE_ACOUSTIC')}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  sonarMode === 'PASSIVE_ACOUSTIC' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400 hover:text-white'
                }`}
              >
                PASSIVE
              </button>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 font-mono font-bold flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>SNR: 34 dB</span>
            </div>
          </div>
        </div>

        {/* Sonar Main Interactive Viewport */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-center">
          
          {/* HTML5 Canvas Animated Sonar Display */}
          <div className="lg:col-span-1 flex flex-col items-center justify-center relative preserve-3d py-2">
            <div className="relative rounded-full border-2 border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)] overflow-hidden">
              <canvas
                ref={canvasRef}
                width={260}
                height={260}
                className="w-64 h-64 rounded-full bg-slate-950 cursor-pointer"
              />
              
              {/* Compass Cardinal Marks */}
              <span className="absolute top-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-cyan-400">000° (N)</span>
              <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-cyan-400">180° (S)</span>
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-cyan-400">090° (E)</span>
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-mono font-bold text-cyan-400">270° (W)</span>
            </div>
          </div>

          {/* Sonar Target Contacts List & Telemetry HUD */}
          <div className="lg:col-span-2 space-y-4 text-xs font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-cyan-400" />
                ACOUSTIC SONAR CONTACT TARGETS ({targets.length}):
              </span>
              <span className="text-[11px] text-slate-400">Click target to lock crosshair</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {targets.map((t) => {
                const isSelected = activeTargetData.id === t.id;
                const isThreat = t.status === 'EXFIL TARGET' || t.status === 'PASSWORD LOCKED';

                return (
                  <div
                    key={t.id}
                    onClick={() => setSelectedTarget(t)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer space-y-1.5 ${
                      isSelected
                        ? 'bg-cyan-950/60 border-cyan-400 glow-cyan scale-[1.02]'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${isThreat ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`}></span>
                        {t.id}: {t.label}
                      </span>
                      <span className={`px-2 py-0.5 text-[9px] font-bold rounded border ${
                        isThreat ? 'bg-red-950 text-red-400 border-red-800' : 'bg-emerald-950 text-emerald-400 border-emerald-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Target IP: <strong className="text-slate-200">{t.ip}</strong></span>
                      <span>Risk: <strong className={isThreat ? 'text-red-400' : 'text-emerald-400'}>{t.risk}</strong></span>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/80">
                      <span>Bearing: {t.angle}°</span>
                      <span>Range: {t.dist}m</span>
                      <span>Velocity: {t.speed}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Live Audio Telemetry Signal Waveform Bar */}
            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-slate-400 flex items-center gap-1.5">
                  <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                  Live Acoustic Signal Frequency Spectrum (Packet Soundwave):
                </span>
                <span className="text-emerald-400 font-bold">24.5 kHz</span>
              </div>

              {/* Dynamic Equalizer Bars */}
              <div className="flex items-end gap-1 h-8 px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
                {[40, 70, 25, 90, 60, 30, 85, 95, 40, 65, 80, 50, 90, 75, 30, 85, 60, 45, 95, 70].map((h, i) => (
                  <div
                    key={i}
                    className="flex-1 bg-cyan-400/80 rounded-t transition-all duration-300 shadow-[0_0_6px_#06b6d4]"
                    style={{ height: `${h}%` }}
                  ></div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
