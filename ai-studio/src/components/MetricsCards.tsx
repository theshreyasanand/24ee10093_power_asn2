import React from 'react';
import { ConverterMetrics, ConverterParameters } from '../types/rectifier';
import { Gauge, Zap, Activity, Info } from 'lucide-react';

interface MetricsCardsProps {
  metrics: ConverterMetrics;
  params: ConverterParameters;
}

interface AnalogMeterProps {
  value: number;
  min: number;
  max: number;
  unit: string;
  title: string;
  meterType: string;
  formula?: string;
  accentColor: string;
  decimals?: number;
}

const AnalogMeter: React.FC<AnalogMeterProps> = ({
  value,
  min,
  max,
  unit,
  title,
  meterType,
  formula,
  accentColor,
  decimals = 1,
}) => {
  // Clamp fraction between 0 and 1
  const clampedVal = Math.max(min, Math.min(max, isNaN(value) ? 0 : value));
  const fraction = max > min ? (clampedVal - min) / (max - min) : 0;

  // Arc sweeps from -60 degrees to +60 degrees (120 degrees total)
  const startAngle = -60;
  const endAngle = 60;
  const sweep = endAngle - startAngle;
  const needleAngle = startAngle + fraction * sweep;

  const cx = 80;
  const cy = 82;
  const r = 58;

  // Generate 5 major ticks (0%, 25%, 50%, 75%, 100%)
  const majorTicks = [0, 0.25, 0.5, 0.75, 1.0].map((frac) => {
    const angDeg = startAngle + frac * sweep;
    const angRad = (angDeg - 90) * (Math.PI / 180);
    const x1 = cx + (r - 2) * Math.cos(angRad);
    const y1 = cy + (r - 2) * Math.sin(angRad);
    const x2 = cx + (r - 10) * Math.cos(angRad);
    const y2 = cy + (r - 10) * Math.sin(angRad);
    const textX = cx + (r - 17) * Math.cos(angRad);
    const textY = cy + (r - 17) * Math.sin(angRad) + 3;
    const tickVal = min + frac * (max - min);
    return {
      x1,
      y1,
      x2,
      y2,
      textX,
      textY,
      label: tickVal >= 100 ? tickVal.toFixed(0) : tickVal >= 10 ? tickVal.toFixed(0) : tickVal.toFixed(1),
    };
  });

  // Minor ticks (intermediate)
  const minorTicks = [0.125, 0.375, 0.625, 0.875].map((frac) => {
    const angDeg = startAngle + frac * sweep;
    const angRad = (angDeg - 90) * (Math.PI / 180);
    const x1 = cx + (r - 2) * Math.cos(angRad);
    const y1 = cy + (r - 2) * Math.sin(angRad);
    const x2 = cx + (r - 6) * Math.cos(angRad);
    const y2 = cy + (r - 6) * Math.sin(angRad);
    return { x1, y1, x2, y2 };
  });

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 rounded-xl p-3 shadow-xs flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all">
      {/* Meter Header */}
      <div className="flex items-center justify-between gap-1 mb-1">
        <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 dark:text-slate-100 uppercase tracking-tight truncate">
          {title}
        </span>
        <span className="text-[9px] font-mono font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
          {meterType}
        </span>
      </div>

      {/* Analog Meter Dial SVG */}
      <div className="relative w-full flex items-center justify-center py-1">
        <svg viewBox="0 0 160 98" className="w-full max-w-[170px] select-none overflow-visible">
          <defs>
            {/* Subtle dial face gradient */}
            <radialGradient id="dialGradient" cx="50%" cy="80%" r="75%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#f8fafc" />
            </radialGradient>
            {/* Needle drop shadow */}
            <filter id="needleShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0.5" dy="1" stdDeviation="1" floodColor="#0f172a" floodOpacity="0.25" />
            </filter>
          </defs>

          {/* Dial Face Plate */}
          <path
            d="M 12 88 Q 12 18 80 18 Q 148 18 148 88 Z"
            fill="url(#dialGradient)"
            stroke="#e2e8f0"
            strokeWidth="1.5"
          />

          {/* Scale Outer Arc */}
          <path
            d="M 29.7 53 A 58 58 0 0 1 130.3 53"
            fill="none"
            stroke="#cbd5e1"
            strokeWidth="2"
            strokeLinecap="round"
          />

          {/* Colored operating arc zone */}
          <path
            d="M 29.7 53 A 58 58 0 0 1 130.3 53"
            fill="none"
            stroke={accentColor}
            strokeWidth="2.5"
            strokeDasharray={`${fraction * 121.5} 200`}
            strokeLinecap="round"
            opacity="0.85"
          />

          {/* Warning / Peak zone mark (>80%) */}
          <path
            d="M 110.4 43.5 A 58 58 0 0 1 130.3 53"
            fill="none"
            stroke="#ef4444"
            strokeWidth="3.5"
            strokeLinecap="round"
            opacity="0.7"
          />

          {/* Minor Ticks */}
          {minorTicks.map((tick, i) => (
            <line
              key={i}
              x1={tick.x1}
              y1={tick.y1}
              x2={tick.x2}
              y2={tick.y2}
              stroke="#94a3b8"
              strokeWidth="1"
            />
          ))}

          {/* Major Ticks and Scale Numbers */}
          {majorTicks.map((tick, i) => (
            <g key={i}>
              <line
                x1={tick.x1}
                y1={tick.y1}
                x2={tick.x2}
                y2={tick.y2}
                stroke="#475569"
                strokeWidth="1.6"
              />
              <text
                x={tick.textX}
                y={tick.textY}
                textAnchor="middle"
                className="text-[7.5px] font-mono fill-slate-500 dark:fill-slate-400 font-semibold select-none"
              >
                {tick.label}
              </text>
            </g>
          ))}

          {/* Meter Unit Label printed on dial face */}
          <text
            x={cx}
            y={cy - 24}
            textAnchor="middle"
            className="text-[9px] font-mono font-bold select-none tracking-wider"
            fill={accentColor}
          >
            {unit}
          </text>

          {/* Moving Analog Needle */}
          <g
            transform={`translate(${cx}, ${cy}) rotate(${needleAngle})`}
            style={{ transition: 'transform 0.3s cubic-bezier(0.2, 0, 0.2, 1)' }}
            filter="url(#needleShadow)"
          >
            {/* Tapered Needle Pointer */}
            <polygon
              points="-2,4 0,-54 2,4 0,8"
              fill="#dc2626"
            />
            {/* Needle Pivot Cap */}
            <circle cx="0" cy="0" r="4.5" fill="#1e293b" />
            <circle cx="0" cy="0" r="2" fill="#e2e8f0" />
          </g>

          {/* Bottom Mirror / Pivot Base */}
          <path d="M 64 88 Q 80 82 96 88 Z" fill="#cbd5e1" opacity="0.6" />
        </svg>
      </div>

      {/* Digital Readout & Analytical Derivation */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white tracking-tight flex items-baseline gap-1">
            <span>{value.toFixed(decimals)}</span>
            <span className="text-xs font-semibold text-slate-500">{unit}</span>
          </div>
          {formula && (
            <div className="text-[10px] font-mono text-slate-400 dark:text-slate-500 truncate max-w-[140px]" title={formula}>
              {formula}
            </div>
          )}
        </div>
        <div
          className="w-2.5 h-2.5 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
};

export const MetricsCards: React.FC<MetricsCardsProps> = ({ metrics, params }) => {
  const {
    vDcAvg,
    vRms,
    iDcAvg,
    iRms,
    pDc,
    pAc,
    powerFactor,
    displacementFactor,
    rippleFactorV,
    formFactorV,
    efficiency,
  } = metrics;

  const vFormula =
    params.topology === 'diode-bridge'
      ? 'Vdc = (2Vm/π)'
      : params.loadType === 'R'
      ? 'Vdc = (Vm/π)(1+cosα)'
      : 'Vdc = (2Vm/π)·cosα';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 shadow-xs space-y-4 transition-colors duration-200">
      {/* Console Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800">
            <Gauge className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Analog Meter Instrument Panel & Performance Readings
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live moving-coil analog needle meters and true RMS readings for power converter analysis
            </p>
          </div>
        </div>

        {/* Load & Operating Summary Badge */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700">
            Load: <strong>{params.loadType}</strong> (R={params.resistance}Ω, L={(params.inductance * 1000).toFixed(0)}mH)
          </span>
          <span className="bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-800 font-semibold">
            {params.topology === 'diode-bridge' ? 'Diode (α=0°)' : `SCR (α=${params.firingAngleAlpha}°)`}
          </span>
        </div>
      </div>

      {/* 6 Analog Dial Meters Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Meter 1: DC Voltmeter (Average Vdc) */}
        <AnalogMeter
          value={vDcAvg}
          min={0}
          max={350}
          unit="V"
          title="Average Vdc"
          meterType="DC Voltmeter"
          formula={vFormula}
          accentColor="#0284c7"
          decimals={1}
        />

        {/* Meter 2: True RMS Voltmeter (Vrms) */}
        <AnalogMeter
          value={vRms}
          min={0}
          max={350}
          unit="V"
          title="RMS Voltage"
          meterType="True RMS"
          formula="Vrms = √[ (1/π) ∫ vo² dωt ]"
          accentColor="#2563eb"
          decimals={1}
        />

        {/* Meter 3: DC Ammeter (Average Idc) */}
        <AnalogMeter
          value={iDcAvg}
          min={0}
          max={25}
          unit="A"
          title="Average Idc"
          meterType="DC Ammeter"
          formula="Idc = Vdc / R"
          accentColor="#059669"
          decimals={2}
        />

        {/* Meter 4: AC / RMS Ammeter (Irms) */}
        <AnalogMeter
          value={iRms}
          min={0}
          max={25}
          unit="A"
          title="RMS Current"
          meterType="AC Ammeter"
          formula="Irms (Thermal)"
          accentColor="#d97706"
          decimals={2}
        />

        {/* Meter 5: Power Factor Meter (PF) */}
        <AnalogMeter
          value={powerFactor}
          min={0}
          max={1.0}
          unit="PF"
          title="Power Factor"
          meterType="Cos φ Meter"
          formula="PF = (P / S)"
          accentColor="#7c3aed"
          decimals={3}
        />

        {/* Meter 6: DC Wattmeter (Pdc) */}
        <AnalogMeter
          value={pDc}
          min={0}
          max={3000}
          unit="W"
          title="DC Output Power"
          meterType="Wattmeter"
          formula="Pdc = Vdc · Idc"
          accentColor="#dc2626"
          decimals={1}
        />
      </div>

      {/* Auxiliary Engineering Indices Bar */}
      <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs font-mono text-slate-600 bg-slate-50/70 p-3 rounded-lg border border-slate-200">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Form Factor (FF):</span>
          <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {formFactorV.toFixed(3)}
          </strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Ripple Factor (γv):</span>
          <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {rippleFactorV.toFixed(3)}
          </strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">AC Input Power (Pac):</span>
          <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {pAc.toFixed(1)} W
          </strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Conversion Efficiency (η):</span>
          <strong className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-bold">
            {efficiency.toFixed(1)}%
          </strong>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-slate-500">Displacement Factor:</span>
          <strong className="text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
            {displacementFactor.toFixed(3)}
          </strong>
        </div>
      </div>
    </div>
  );
};
