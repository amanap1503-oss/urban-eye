import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

// Common Chart Types
interface DataPoint {
  label: string;
  reported: number;
  resolved: number;
}

const SEED_CHART_DATA: DataPoint[] = [
  { label: 'Mon', reported: 12, resolved: 8 },
  { label: 'Tue', reported: 19, resolved: 14 },
  { label: 'Wed', reported: 15, resolved: 17 },
  { label: 'Thu', reported: 25, resolved: 19 },
  { label: 'Fri', reported: 22, resolved: 24 },
  { label: 'Sat', reported: 30, resolved: 28 },
  { label: 'Sun', reported: 26, resolved: 27 },
];

export const AreaChartComponent: React.FC = () => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const padding = 40;
  const chartHeight = 200;
  const chartWidth = 500;

  // Calculate SVG dimensions
  const totalWidth = chartWidth + padding * 2;
  const totalHeight = chartHeight + padding * 2;

  // Max value for scaling
  const maxVal = Math.max(...SEED_CHART_DATA.map(d => Math.max(d.reported, d.resolved))) + 5;

  // X & Y scalers
  const getX = (index: number) => padding + (index / (SEED_CHART_DATA.length - 1)) * chartWidth;
  const getY = (value: number) => padding + chartHeight - (value / maxVal) * chartHeight;

  // Generate paths
  const reportedPoints = SEED_CHART_DATA.map((d, i) => `${getX(i)},${getY(d.reported)}`).join(' ');
  const resolvedPoints = SEED_CHART_DATA.map((d, i) => `${getX(i)},${getY(d.resolved)}`).join(' ');

  const reportedAreaPoints = `${getX(0)},${padding + chartHeight} ${reportedPoints} ${getX(SEED_CHART_DATA.length - 1)},${padding + chartHeight}`;
  const resolvedAreaPoints = `${getX(0)},${padding + chartHeight} ${resolvedPoints} ${getX(SEED_CHART_DATA.length - 1)},${padding + chartHeight}`;

  return (
    <div className="glass-card p-6 rounded-2xl relative overflow-hidden group">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h4 className="font-sans font-bold text-base text-white">Civic Response Balance</h4>
          <p className="text-xs text-slate-400">Weekly intake of reports vs resolutions</p>
        </div>
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block"></span>
            <span className="text-slate-300">Intake</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-400 inline-block"></span>
            <span className="text-slate-300">Resolved</span>
          </div>
        </div>
      </div>

      <div className="w-full overflow-x-auto scrollbar-none">
        <svg viewBox={`0 0 ${totalWidth} ${totalHeight}`} className="w-full h-auto min-w-[450px]">
          <defs>
            <linearGradient id="reportedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="resolvedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.0" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((p, i) => {
            const y = padding + chartHeight * p;
            const labelValue = Math.round(maxVal * (1 - p));
            return (
              <g key={i} className="opacity-20">
                <line x1={padding} y1={y} x2={padding + chartWidth} y2={y} stroke="#cbd5e1" strokeDasharray="4 4" strokeWidth={1} />
                <text x={padding - 10} y={y + 4} fill="#cbd5e1" fontSize={10} textAnchor="end" className="font-mono">{labelValue}</text>
              </g>
            );
          })}

          {/* Area under reported */}
          <polygon points={reportedAreaPoints} fill="url(#reportedGrad)" />

          {/* Area under resolved */}
          <polygon points={resolvedAreaPoints} fill="url(#resolvedGrad)" />

          {/* Reported Path Line */}
          <motion.polyline
            fill="none"
            stroke="#06b6d4"
            strokeWidth={3}
            points={reportedPoints}
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />

          {/* Resolved Path Line */}
          <motion.polyline
            fill="none"
            stroke="#8b5cf6"
            strokeWidth={3}
            points={resolvedPoints}
            filter="url(#glow)"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.5, ease: 'easeOut', delay: 0.2 }}
          />

          {/* Interaction vertical lines and nodes */}
          {SEED_CHART_DATA.map((d, i) => {
            const x = getX(i);
            const yReported = getY(d.reported);
            const yResolved = getY(d.resolved);
            const isHovered = hoveredIndex === i;

            return (
              <g key={i} className="cursor-pointer">
                {/* Hover hotspot column */}
                <rect
                  x={x - 20}
                  y={padding}
                  width={40}
                  height={chartHeight}
                  fill="transparent"
                  onMouseEnter={() => setHoveredIndex(i)}
                  onMouseLeave={() => setHoveredIndex(null)}
                />

                {/* Vertical hover line */}
                {isHovered && (
                  <line x1={x} y1={padding} x2={x} y2={padding + chartHeight} stroke="#cbd5e1" strokeOpacity={0.3} strokeWidth={1.5} />
                )}

                {/* Nodes */}
                <circle
                  cx={x}
                  cy={yReported}
                  r={isHovered ? 6 : 4}
                  fill="#06b6d4"
                  stroke="#050816"
                  strokeWidth={2}
                  className="transition-all duration-200"
                />
                <circle
                  cx={x}
                  cy={yResolved}
                  r={isHovered ? 6 : 4}
                  fill="#8b5cf6"
                  stroke="#050816"
                  strokeWidth={2}
                  className="transition-all duration-200"
                />

                {/* Bottom Labels */}
                <text x={x} y={padding + chartHeight + 20} fill="#94a3b8" fontSize={11} textAnchor="middle" className="font-sans">
                  {d.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* Dynamic Tooltip overlay */}
      <div className="h-10 mt-2 flex justify-center">
        <AnimatePresence>
          {hoveredIndex !== null && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="flex gap-6 items-center bg-slate-900/80 backdrop-blur border border-white/10 px-4 py-1.5 rounded-xl text-xs shadow-lg"
            >
              <span className="font-bold text-slate-200">{SEED_CHART_DATA[hoveredIndex].label} Metrics:</span>
              <span className="text-cyan-400">Intake: <strong>{SEED_CHART_DATA[hoveredIndex].reported}</strong></span>
              <span className="text-violet-400">Resolved: <strong>{SEED_CHART_DATA[hoveredIndex].resolved}</strong></span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export const CivicHealthGauge: React.FC = () => {
  const currentScore = 84.2;
  const radius = 60;
  const stroke = 8;
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (currentScore / 100) * circumference;

  return (
    <div className="glass-card p-6 rounded-2xl flex flex-col md:flex-row gap-6 items-center">
      <div className="relative flex items-center justify-center w-36 h-36">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            stroke="rgba(255,255,255,0.05)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius + stroke}
            cy={radius + stroke}
          />
          <motion.circle
            stroke="url(#gaugeGrad)"
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius + stroke}
            cy={radius + stroke}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
          <defs>
            <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#10b981" />
            </linearGradient>
          </defs>
        </svg>
        <div className="absolute text-center">
          <div className="text-3xl font-display font-bold text-white tracking-tighter">{currentScore}</div>
          <div className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider">HEALTHY</div>
        </div>
      </div>

      <div className="flex-1 space-y-4 w-full">
        <div>
          <h4 className="font-sans font-bold text-base text-white">Civic Health Indicator</h4>
          <p className="text-xs text-slate-400">Live health rating for administrative Sector-12</p>
        </div>

        <div className="space-y-2">
          {[
            { district: 'Soho Hub', score: 91, progress: 'w-[91%]', color: 'bg-emerald-400' },
            { district: 'Midtown East', score: 84, progress: 'w-[84%]', color: 'bg-cyan-400' },
            { district: 'Chelsea Sector', score: 79, progress: 'w-[79%]', color: 'bg-blue-500' },
          ].map((d, i) => (
            <div key={i} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-slate-300 font-medium">{d.district}</span>
                <span className="text-white font-mono font-bold">{d.score}%</span>
              </div>
              <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                <div className={`h-full ${d.color} ${d.progress} rounded-full`}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
