import React, { useMemo } from 'react';
import { InstantaneousValues, ConverterMetrics } from '../types/rectifier';
import { computeHarmonics } from '../utils/physics';

interface HarmonicsChartProps {
  samples: InstantaneousValues[];
  metrics: ConverterMetrics;
}

export const HarmonicsChart: React.FC<HarmonicsChartProps> = ({ samples, metrics }) => {
  const [targetSignal, setTargetSignal] = React.useState<'is' | 'vo'>('is');

  const harmonics = useMemo(() => {
    return computeHarmonics(samples, targetSignal, 13);
  }, [samples, targetSignal]);

  const maxPct = useMemo(() => {
    return Math.max(...harmonics.map((h) => (h.order === 1 ? 100 : h.percentage)), 100);
  }, [harmonics]);

  return (
    <div className="flex-1 flex flex-col p-6 bg-white overflow-y-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            Harmonic Spectrum (Discrete Fourier Transform)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Frequency domain breakdown of harmonic content and distortion
          </p>
        </div>

        {/* Signal Selector */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            onClick={() => setTargetSignal('is')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              targetSignal === 'is'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Input Current is(t)
          </button>
          <button
            onClick={() => setTargetSignal('vo')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-all ${
              targetSignal === 'vo'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Output Voltage vo(t)
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Total Harmonic Distortion
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {metrics.thdInputCurrent.toFixed(1)}%
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Displacement Factor
          </div>
          <div className="text-xl font-bold font-mono text-slate-800 mt-1">
            {metrics.displacementFactor.toFixed(3)}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Input Power Factor
          </div>
          <div className="text-xl font-bold font-mono text-blue-700 mt-1">
            {metrics.powerFactor.toFixed(3)}
          </div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">
            Voltage Ripple Factor
          </div>
          <div className="text-xl font-bold font-mono text-purple-700 mt-1">
            {metrics.rippleFactorV.toFixed(3)}
          </div>
        </div>
      </div>

      {/* Bar Chart Container */}
      <div className="flex-1 min-h-[220px] flex items-end gap-3 pt-6 pb-2 border-b border-slate-200">
        {harmonics.map((h) => {
          const heightPct = Math.min(100, (h.percentage / maxPct) * 100);
          const isOdd = h.order % 2 !== 0;

          return (
            <div key={h.order} className="flex-1 flex flex-col items-center h-full justify-end group">
              {/* Value readout tooltip on hover */}
              <div className="text-[10px] font-mono font-medium text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {h.percentage.toFixed(1)}% ({h.magnitude.toFixed(1)})
              </div>

              {/* Bar */}
              <div className="w-full max-w-[32px] bg-slate-100 rounded-t-sm flex items-end overflow-hidden h-[180px]">
                <div
                  style={{ height: `${heightPct}%` }}
                  className={`w-full transition-all duration-300 rounded-t-sm ${
                    h.order === 1
                      ? 'bg-blue-600'
                      : isOdd
                      ? targetSignal === 'is'
                        ? 'bg-cyan-500'
                        : 'bg-emerald-500'
                      : 'bg-slate-300'
                  }`}
                />
              </div>

              {/* Harmonic Label */}
              <div className="mt-2 text-center">
                <div className="text-xs font-mono font-bold text-slate-700">
                  {h.order === 1 ? 'Fund (1st)' : `${h.order}th`}
                </div>
                <div className="text-[10px] font-mono text-slate-400">
                  {h.frequency}Hz
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 text-xs text-slate-500 flex items-center justify-between">
        <span>* Characteristic AC line harmonics for full bridge are odd orders (3rd, 5th, 7th, 11th, 13th).</span>
        <span className="font-mono">Harmonic orders: n = 2k ± 1</span>
      </div>
    </div>
  );
};
