import React from 'react';
import { ConverterMetrics, ConverterParameters } from '../types/rectifier';

interface MetricsCardsProps {
  metrics: ConverterMetrics;
  params: ConverterParameters;
}

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

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight">
            Analytical Derivations & Performance Metrics
          </h3>
          <p className="text-xs text-slate-500">
            Real-time computed integration and Fourier power quality indices
          </p>
        </div>
        <div className="text-xs font-mono text-slate-500">
          Load: <span className="font-semibold text-slate-800">{params.loadType}</span> (R={params.resistance}Ω)
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Metric 1: V_dc */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Average Voltage Vdc
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {vDcAvg.toFixed(1)} <span className="text-xs font-normal text-slate-500">V</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            {params.topology === 'diode-bridge'
              ? '2Vm / π'
              : params.loadType === 'R'
              ? '(Vm/π)(1+cosα)'
              : '(2Vm/π)·cosα'}
          </div>
        </div>

        {/* Metric 2: V_rms */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            RMS Voltage Vrms
          </div>
          <div className="text-lg font-bold font-mono text-slate-900 mt-1">
            {vRms.toFixed(1)} <span className="text-xs font-normal text-slate-500">V</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Root Mean Square
          </div>
        </div>

        {/* Metric 3: I_dc */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Average Current Idc
          </div>
          <div className="text-lg font-bold font-mono text-emerald-700 mt-1">
            {iDcAvg.toFixed(2)} <span className="text-xs font-normal text-slate-500">A</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            DC load current
          </div>
        </div>

        {/* Metric 4: I_rms */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            RMS Current Irms
          </div>
          <div className="text-lg font-bold font-mono text-amber-700 mt-1">
            {iRms.toFixed(2)} <span className="text-xs font-normal text-slate-500">A</span>
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            Effective heating value
          </div>
        </div>

        {/* Metric 5: Power Factor */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Input Power Factor
          </div>
          <div className="text-lg font-bold font-mono text-blue-700 mt-1">
            {powerFactor.toFixed(3)}
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            PF = (Is1/Is)·cosφ1
          </div>
        </div>

        {/* Metric 6: Efficiency */}
        <div className="p-3 bg-slate-50/70 border border-slate-200/80 rounded-lg">
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">
            Conversion Efficiency
          </div>
          <div className="text-lg font-bold font-mono text-indigo-700 mt-1">
            {efficiency.toFixed(1)}%
          </div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">
            η = Pdc / Pac
          </div>
        </div>
      </div>

      {/* Auxiliary equations bar */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 font-mono">
        <div>
          Form Factor (FF): <strong className="text-slate-800">{formFactorV.toFixed(3)}</strong>
        </div>
        <div>
          Voltage Ripple Factor (γ): <strong className="text-slate-800">{rippleFactorV.toFixed(3)}</strong>
        </div>
        <div>
          DC Output Power (Pdc): <strong className="text-slate-800">{pDc.toFixed(1)} W</strong>
        </div>
        <div>
          AC Input Power (Pac): <strong className="text-slate-800">{pAc.toFixed(1)} W</strong>
        </div>
      </div>
    </div>
  );
};
