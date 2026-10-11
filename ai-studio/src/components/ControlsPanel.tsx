import React from 'react';
import { ConverterParameters, TopologyMode, LoadType } from '../types/rectifier';
import { Settings, Zap, Cpu, Sliders, ShieldAlert } from 'lucide-react';

interface ControlsPanelProps {
  params: ConverterParameters;
  onUpdateParams: (newParams: Partial<ConverterParameters>) => void;
}

export const ControlsPanel: React.FC<ControlsPanelProps> = ({
  params,
  onUpdateParams,
}) => {
  const {
    topology,
    loadType,
    vPeak,
    frequency,
    firingAngleAlpha,
    firingAngleAlpha2,
    resistance,
    inductance,
    backEmf,
    highlyInductive,
    dualBridgeMode,
    activeBridgeInDual,
    showFreewheelingDiode,
  } = params;

  const vRms = vPeak / Math.SQRT2;

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors duration-200">
      <div className="flex items-center gap-2 pb-4 border-b border-slate-200 dark:border-slate-800 mb-5">
        <Sliders className="w-4 h-4 text-blue-600" />
        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 dark:text-white tracking-tight">
          Converter Configuration & Circuit Parameters
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Column 1: Topology Selection */}
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 block">
            Converter Topology
          </label>

          <div className="space-y-2">
            <button
              onClick={() => onUpdateParams({ topology: 'diode-bridge' })}
              className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                topology === 'diode-bridge'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 dark:text-slate-300 bg-white dark:bg-slate-800/80'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">Diode Bridge Rectifier</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">
                Uncontrolled (α = 0° natural commutation)
              </div>
            </button>

            <button
              onClick={() => onUpdateParams({ topology: 'single-thyristor' })}
              className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                topology === 'single-thyristor'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 dark:text-slate-300 bg-white dark:bg-slate-800/80'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">1-Phase Thyristor Bridge</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">
                Fully Controlled Single Converter (T1–T4)
              </div>
            </button>

            <button
              onClick={() => onUpdateParams({ topology: 'double-bridge' })}
              className={`w-full text-left p-2.5 rounded-lg border text-xs font-medium transition-all ${
                topology === 'double-bridge'
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 ring-1 ring-blue-500'
                  : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 text-slate-700 dark:text-slate-300 dark:text-slate-300 bg-white dark:bg-slate-800/80'
              }`}
            >
              <div className="font-semibold text-slate-900 dark:text-slate-100">Double Bridge Thyristor</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 dark:text-slate-400 mt-0.5">
                Dual Converter (4-Quadrant bidirectional)
              </div>
            </button>
          </div>
        </div>

        {/* Column 2: Firing Angles */}
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 block">
            Firing Angle Status (α)
          </label>

          {topology === 'diode-bridge' ? (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 dark:text-slate-400 leading-relaxed">
              Diode rectifiers conduct naturally at zero crossings (<strong className="text-slate-700 dark:text-slate-300">α = 0°</strong>). Use the firing angle slider below anytime to adjust α.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-blue-50/70 dark:bg-blue-950/40 rounded-lg border border-blue-200/80 dark:border-blue-800/80">
                <div className="flex justify-between items-center text-xs mb-1">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {topology === 'double-bridge' ? 'Bridge 1 Firing Angle (α1):' : 'Firing Angle (α):'}
                  </span>
                  <span className="font-mono font-bold text-blue-700 bg-white dark:bg-slate-900 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800 shadow-2xs">
                    {firingAngleAlpha}°
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 font-medium">
                  {firingAngleAlpha <= 90 ? '⚡ Rectification Mode (0° – 90°)' : '🔄 Line-Commutated Inversion Mode (90° – 180°)'}
                </div>
                <div className="text-[10px] text-blue-600 mt-1.5 font-medium">
                  Adjustable via the firing angle slider bar
                </div>
              </div>

              {topology === 'double-bridge' && (
                <div>
                  <div className="flex justify-between items-center text-xs mb-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      Bridge 2 Firing Angle (α2):
                    </span>
                    <span className="font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {firingAngleAlpha2}°
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                    α1 + α2 = 180° (Coordinated Control)
                  </div>

                  {/* Dual Converter Mode Selector */}
                  <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-600 dark:text-slate-300">Circulating Current:</span>
                    <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded">
                      <button
                        onClick={() => onUpdateParams({ dualBridgeMode: 'non-circulating' })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          dualBridgeMode === 'non-circulating'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Non-Circulating
                      </button>
                      <button
                        onClick={() => onUpdateParams({ dualBridgeMode: 'circulating' })}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          dualBridgeMode === 'circulating'
                            ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        Circulating
                      </button>
                    </div>
                  </div>

                  {dualBridgeMode === 'non-circulating' && (
                    <div className="mt-2 flex items-center justify-between text-xs">
                      <span className="text-slate-600 dark:text-slate-300">Active Bridge:</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onUpdateParams({ activeBridgeInDual: 1 })}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            activeBridgeInDual === 1
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Bridge 1 (I+ fwd)
                        </button>
                        <button
                          onClick={() => onUpdateParams({ activeBridgeInDual: 2 })}
                          className={`px-2 py-0.5 rounded text-[11px] font-medium ${
                            activeBridgeInDual === 2
                              ? 'bg-indigo-600 text-white'
                              : 'bg-slate-100 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          Bridge 2 (I- rev)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {topology === 'single-thyristor' && (
                <div className="flex items-center justify-between pt-2">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Freewheeling Diode (FWD)
                  </label>
                  <input
                    type="checkbox"
                    checked={showFreewheelingDiode}
                    onChange={(e) =>
                      onUpdateParams({ showFreewheelingDiode: e.target.checked })
                    }
                    className="w-4 h-4 rounded text-blue-600 cursor-pointer"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Column 3: Load Configuration */}
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 block">
            Load Circuit
          </label>

          {/* Load Type Selector */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {(['R', 'RL', 'RLE'] as LoadType[]).map((type) => (
              <button
                key={type}
                onClick={() => onUpdateParams({ loadType: type })}
                className={`flex-1 py-1 text-xs font-semibold rounded-md transition-all ${
                  loadType === type
                    ? 'bg-white text-blue-700 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                }`}
              >
                {type} Load
              </button>
            ))}
          </div>

          {/* Resistance R */}
          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300">Resistance (R):</span>
              <span className="font-mono font-semibold text-amber-700">
                {resistance} Ω
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="100"
              step="1"
              value={resistance}
              onChange={(e) =>
                onUpdateParams({ resistance: parseInt(e.target.value, 10) })
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-600"
            />
          </div>

          {/* Inductance L (if RL or RLE) */}
          {(loadType === 'RL' || loadType === 'RLE') && (
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Inductance (L):</span>
                <span className="font-mono font-semibold text-blue-700">
                  {(inductance * 1000).toFixed(0)} mH
                </span>
              </div>
              <input
                type="range"
                min="0.005"
                max="0.2"
                step="0.005"
                value={inductance}
                onChange={(e) =>
                  onUpdateParams({ inductance: parseFloat(e.target.value) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
              />
            </div>
          )}

          {/* Back EMF E (if RLE) */}
          {loadType === 'RLE' && (
            <div>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-300">Back-EMF (E):</span>
                <span className="font-mono font-semibold text-red-600">
                  {backEmf} V
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="150"
                step="5"
                value={backEmf}
                onChange={(e) =>
                  onUpdateParams({ backEmf: parseInt(e.target.value, 10) })
                }
                className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-red-600"
              />
            </div>
          )}

          {/* Highly inductive ripple-free switch */}
          {(loadType === 'RL' || loadType === 'RLE') && (
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-600 dark:text-slate-300">
                Constant Idc (Ripple-Free)
              </span>
              <input
                type="checkbox"
                checked={highlyInductive}
                onChange={(e) =>
                  onUpdateParams({ highlyInductive: e.target.checked })
                }
                className="w-4 h-4 rounded text-blue-600 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Column 4: AC Source Parameters */}
        <div className="space-y-4">
          <label className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 dark:text-slate-400 block">
            AC Source Supply
          </label>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300">Peak Voltage (Vm):</span>
              <span className="font-mono font-semibold text-blue-600">
                {vPeak} V <span className="text-[10px] text-slate-400">({vRms.toFixed(0)}V RMS)</span>
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="400"
              step="5"
              value={vPeak}
              onChange={(e) =>
                onUpdateParams({ vPeak: parseInt(e.target.value, 10) })
              }
              className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
          </div>

          <div>
            <div className="flex justify-between items-center text-xs mb-1">
              <span className="text-slate-600 dark:text-slate-300">Supply Frequency:</span>
              <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                {frequency} Hz
              </span>
            </div>
            <div className="flex gap-2">
              {[50, 60].map((f) => (
                <button
                  key={f}
                  onClick={() => onUpdateParams({ frequency: f })}
                  className={`flex-1 py-1 text-xs font-mono font-medium rounded border ${
                    frequency === f
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'border-slate-200 text-slate-600 dark:text-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {f} Hz
                </button>
              ))}
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 dark:text-slate-300 font-mono">
            vs(t) = {vPeak} · sin(2π · {frequency}t)
          </div>
        </div>
      </div>
    </div>
  );
};
