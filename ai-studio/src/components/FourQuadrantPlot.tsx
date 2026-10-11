import React from 'react';
import { ConverterParameters, ConverterMetrics, InstantaneousValues } from '../types/rectifier';

interface FourQuadrantPlotProps {
  params: ConverterParameters;
  metrics: ConverterMetrics;
  instantaneous: InstantaneousValues;
  onUpdateParams: (newParams: Partial<ConverterParameters>) => void;
}

export const FourQuadrantPlot: React.FC<FourQuadrantPlotProps> = ({
  params,
  metrics,
  instantaneous,
  onUpdateParams,
}) => {
  const { firingAngleAlpha, firingAngleAlpha2, activeBridgeInDual, dualBridgeMode } = params;
  const { vDcAvg, iDcAvg } = metrics;

  // Determine current quadrant
  let quadrant = 1;
  if (vDcAvg >= 0 && iDcAvg >= 0) quadrant = 1;
  else if (vDcAvg < 0 && iDcAvg >= 0) quadrant = 2;
  else if (vDcAvg < 0 && iDcAvg < 0) quadrant = 3;
  else quadrant = 4;

  const maxV = 350;
  const maxI = 25;

  // Map to SVG coordinates (center 250, 200)
  const cx = 250;
  const cy = 200;
  const scaleX = 180 / maxI;
  const scaleY = 150 / maxV;

  const currentX = cx + Math.max(-maxI, Math.min(maxI, iDcAvg)) * scaleX;
  const currentY = cy - Math.max(-maxV, Math.min(maxV, vDcAvg)) * scaleY;

  return (
    <div className="flex-1 flex flex-col p-6 bg-white dark:bg-slate-900 overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            Four-Quadrant Operation (Dual Converter)
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Two anti-parallel thyristor bridges enable bidirectional voltage and current control
          </p>
        </div>

        {/* Quick Quadrant Presets */}
        <div className="flex items-center gap-1.5 text-xs">
          <button
            onClick={() => {
              onUpdateParams({
                firingAngleAlpha: 30,
                firingAngleAlpha2: 150,
                activeBridgeInDual: 1,
              });
            }}
            className={`px-2.5 py-1 rounded border font-mono font-medium transition-colors ${
              quadrant === 1
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Q1: Fwd Motoring (α1=30°)
          </button>
          <button
            onClick={() => {
              onUpdateParams({
                firingAngleAlpha: 120,
                firingAngleAlpha2: 60,
                activeBridgeInDual: 1,
              });
            }}
            className={`px-2.5 py-1 rounded border font-mono font-medium transition-colors ${
              quadrant === 2
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Q2: Fwd Regen (α1=120°)
          </button>
          <button
            onClick={() => {
              onUpdateParams({
                firingAngleAlpha: 150,
                firingAngleAlpha2: 30,
                activeBridgeInDual: 2,
              });
            }}
            className={`px-2.5 py-1 rounded border font-mono font-medium transition-colors ${
              quadrant === 3
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Q3: Rev Motoring (α2=30°)
          </button>
          <button
            onClick={() => {
              onUpdateParams({
                firingAngleAlpha: 60,
                firingAngleAlpha2: 120,
                activeBridgeInDual: 2,
              });
            }}
            className={`px-2.5 py-1 rounded border font-mono font-medium transition-colors ${
              quadrant === 4
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-slate-50 dark:bg-slate-850 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:bg-slate-800'
            }`}
          >
            Q4: Rev Regen (α2=120°)
          </button>
        </div>
      </div>

      {/* SVG Canvas for 4 Quadrants */}
      <div className="relative flex-1 flex items-center justify-center min-h-[340px]">
        <svg viewBox="0 0 500 400" className="w-full max-w-[550px] h-full drop-shadow-xs">
          {/* Quadrant Background Zones */}
          {/* Q1: Top Right */}
          <rect
            x={cx}
            y={50}
            width={200}
            height={150}
            fill={quadrant === 1 ? '#eff6ff' : '#fafafa'}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          {/* Q2: Bottom Right */}
          <rect
            x={cx}
            y={cy}
            width={200}
            height={150}
            fill={quadrant === 2 ? '#eff6ff' : '#fafafa'}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          {/* Q3: Bottom Left */}
          <rect
            x={50}
            y={cy}
            width={200}
            height={150}
            fill={quadrant === 3 ? '#eff6ff' : '#fafafa'}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />
          {/* Q4: Top Left */}
          <rect
            x={50}
            y={50}
            width={200}
            height={150}
            fill={quadrant === 4 ? '#eff6ff' : '#fafafa'}
            stroke="#e2e8f0"
            strokeDasharray="4 4"
          />

          {/* Coordinate Axes */}
          {/* Horizontal Axis: Current I_dc */}
          <line x1="30" y1={cy} x2="470" y2={cy} stroke="#334155" strokeWidth="2" />
          <polygon points="475,200 465,195 465,205" fill="#334155" />
          <polygon points="25,200 35,195 35,205" fill="#334155" />

          {/* Vertical Axis: Voltage V_dc */}
          <line x1={cx} y1="30" x2={cx} y2="370" stroke="#334155" strokeWidth="2" />
          <polygon points="250,25 245,35 255,35" fill="#334155" />
          <polygon points="250,375 245,365 255,365" fill="#334155" />

          {/* Axis Labels */}
          <text x="460" y="222" className="text-[12px] font-mono font-bold fill-slate-700">
            +Idc (A)
          </text>
          <text x="35" y="222" className="text-[12px] font-mono font-bold fill-slate-700">
            -Idc (A)
          </text>
          <text x="260" y="38" className="text-[12px] font-mono font-bold fill-slate-700">
            +Vdc (V)
          </text>
          <text x="260" y="370" className="text-[12px] font-mono font-bold fill-slate-700">
            -Vdc (V)
          </text>

          {/* Quadrant Explanatory Labels */}
          <g transform="translate(350, 110)">
            <text textAnchor="middle" className="text-[12px] font-bold fill-blue-700">
              QUADRANT I
            </text>
            <text textAnchor="middle" y="16" className="text-[10px] font-mono fill-slate-500">
              Forward Motoring
            </text>
            <text textAnchor="middle" y="30" className="text-[9px] font-mono fill-slate-400">
              Bridge 1 Rectifies (α1 &lt; 90°)
            </text>
          </g>

          <g transform="translate(350, 270)">
            <text textAnchor="middle" className="text-[12px] font-bold fill-blue-700">
              QUADRANT II
            </text>
            <text textAnchor="middle" y="16" className="text-[10px] font-mono fill-slate-500">
              Forward Regenerative
            </text>
            <text textAnchor="middle" y="30" className="text-[9px] font-mono fill-slate-400">
              Bridge 1 Inverts (α1 &gt; 90°)
            </text>
          </g>

          <g transform="translate(150, 270)">
            <text textAnchor="middle" className="text-[12px] font-bold fill-blue-700">
              QUADRANT III
            </text>
            <text textAnchor="middle" y="16" className="text-[10px] font-mono fill-slate-500">
              Reverse Motoring
            </text>
            <text textAnchor="middle" y="30" className="text-[9px] font-mono fill-slate-400">
              Bridge 2 Rectifies (α2 &lt; 90°)
            </text>
          </g>

          <g transform="translate(150, 110)">
            <text textAnchor="middle" className="text-[12px] font-bold fill-blue-700">
              QUADRANT IV
            </text>
            <text textAnchor="middle" y="16" className="text-[10px] font-mono fill-slate-500">
              Reverse Regenerative
            </text>
            <text textAnchor="middle" y="30" className="text-[9px] font-mono fill-slate-400">
              Bridge 2 Inverts (α2 &gt; 90°)
            </text>
          </g>

          {/* Operating Point Indicator */}
          <circle
            cx={currentX}
            cy={currentY}
            r="8"
            fill="#2563eb"
            className="animate-pulse"
          />
          <circle
            cx={currentX}
            cy={currentY}
            r="14"
            fill="none"
            stroke="#3b82f6"
            strokeWidth="2"
            opacity="0.6"
          />

          {/* Readout at Operating Point */}
          <rect
            x={currentX + 12}
            y={currentY - 24}
            width="120"
            height="32"
            rx="4"
            fill="#1e293b"
            opacity="0.9"
          />
          <text
            x={currentX + 18}
            y={currentY - 12}
            className="text-[9px] font-mono fill-white font-medium"
          >
            Vdc = {vDcAvg.toFixed(1)} V
          </text>
          <text
            x={currentX + 18}
            y={currentY - 1}
            className="text-[9px] font-mono fill-emerald-300 font-medium"
          >
            Idc = {iDcAvg.toFixed(2)} A
          </text>
        </svg>
      </div>

      {/* Control State explanation footer */}
      <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-850 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex flex-wrap items-center justify-between gap-2">
        <div className="font-mono">
          Bridge 1 α1 = <span className="font-semibold text-blue-600">{firingAngleAlpha}°</span> | Bridge 2 α2 = <span className="font-semibold text-indigo-600">{firingAngleAlpha2}°</span> (α1 + α2 = 180°)
        </div>
        <div>
          Active Operating Quadrant: <span className="font-bold text-blue-700">Quadrant {quadrant}</span>
        </div>
      </div>
    </div>
  );
};
