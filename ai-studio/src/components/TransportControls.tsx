import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
  Sliders,
} from 'lucide-react';
import { PI, TWO_PI } from '../utils/physics';
import { ConverterParameters } from '../types/rectifier';

interface TransportControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentAngleRad: number;
  onAngleChange: (angleRad: number) => void;
  onStep: (deltaDeg: number) => void;
  onReset: () => void;
  params: ConverterParameters;
  onUpdateParams: (newParams: Partial<ConverterParameters>) => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentAngleRad,
  onAngleChange,
  onStep,
  onReset,
  params,
  onUpdateParams,
}) => {
  const normAngleRad = ((currentAngleRad % TWO_PI) + TWO_PI) % TWO_PI;
  const currentAngleDeg = (normAngleRad * 180) / PI;
  const piFraction = (normAngleRad / PI).toFixed(2);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs space-y-3 transition-colors duration-200">
      {/* Top Row: Playback Buttons & Angle Scrubber */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Playback buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-center lg:justify-start">
          {/* Run Real-Time button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-xs cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-200'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-white" />
                <span>Pause</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Run Real-Time</span>
              </>
            )}
          </button>

          {/* Step Back button */}
          <button
            onClick={() => onStep(-5)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Step backward (-5°)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Step Forward button */}
          <button
            onClick={() => onStep(5)}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Step forward (+5°)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg transition-colors border border-slate-200 dark:border-slate-700 cursor-pointer"
            title="Reset angle to 0°"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Angle Scrubber Slider */}
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 dark:text-slate-400 min-w-[70px]">
            <Gauge className="w-4 h-4 text-blue-600" />
            <span>Angle ωt:</span>
          </div>

          <div className="flex-1 relative flex items-center">
            <input
              type="range"
              min="0"
              max="360"
              step="0.5"
              value={currentAngleDeg}
              onChange={(e) => {
                const deg = parseFloat(e.target.value);
                onAngleChange((deg * PI) / 180);
              }}
              className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
          </div>

          {/* Angle numeric badge */}
          <div className="min-w-[90px] text-right font-mono">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {currentAngleDeg.toFixed(1)}°
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
              ({piFraction}π rad)
            </span>
          </div>
        </div>
      </div>

      {/* Bottom Row: Firing Angle (α) Slider & Controls Bar */}
      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-blue-600" />
          <span className="font-semibold text-slate-700 dark:text-slate-200">
            {params.topology === 'double-bridge' ? 'Firing Angle (α₁):' : 'Firing Angle (α):'}
          </span>
          <span className="font-mono font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
            {params.firingAngleAlpha}°
          </span>
          {params.topology === 'double-bridge' && (
            <span className="font-mono text-[11px] text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-1.5 py-0.5 rounded border border-indigo-200 dark:border-indigo-800">
              α₂ = {params.firingAngleAlpha2}°
            </span>
          )}

          {/* Step increment buttons */}
          <div className="flex items-center gap-1 ml-1">
            <button
              onClick={() => {
                const nextAlpha = Math.max(0, params.firingAngleAlpha - 5);
                onUpdateParams({
                  firingAngleAlpha: nextAlpha,
                  firingAngleAlpha2: Math.min(180, 180 - nextAlpha),
                });
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 font-mono font-semibold transition-colors cursor-pointer"
              title="Decrease α by 5°"
            >
              -5°
            </button>
            <button
              onClick={() => {
                const nextAlpha = Math.max(0, params.firingAngleAlpha - 1);
                onUpdateParams({
                  firingAngleAlpha: nextAlpha,
                  firingAngleAlpha2: Math.min(180, 180 - nextAlpha),
                });
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 font-mono font-semibold transition-colors cursor-pointer"
              title="Decrease α by 1°"
            >
              -1°
            </button>
            <button
              onClick={() => {
                const nextAlpha = Math.min(180, params.firingAngleAlpha + 1);
                onUpdateParams({
                  firingAngleAlpha: nextAlpha,
                  firingAngleAlpha2: Math.max(0, 180 - nextAlpha),
                });
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 font-mono font-semibold transition-colors cursor-pointer"
              title="Increase α by 1°"
            >
              +1°
            </button>
            <button
              onClick={() => {
                const nextAlpha = Math.min(180, params.firingAngleAlpha + 5);
                onUpdateParams({
                  firingAngleAlpha: nextAlpha,
                  firingAngleAlpha2: Math.max(0, 180 - nextAlpha),
                });
              }}
              className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded border border-slate-200 dark:border-slate-700 font-mono font-semibold transition-colors cursor-pointer"
              title="Increase α by 5°"
            >
              +5°
            </button>
          </div>
        </div>

        {/* Firing Angle Slider */}
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1 max-w-sm">
          <span className="text-[10px] text-slate-400 font-mono">0°</span>
          <input
            type="range"
            min="0"
            max="180"
            step="1"
            value={params.firingAngleAlpha}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              onUpdateParams({
                firingAngleAlpha: val,
                firingAngleAlpha2: 180 - val,
              });
            }}
            className="flex-1 h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            title="Slide to change firing angle α (0° to 180°)"
          />
          <span className="text-[10px] text-slate-400 font-mono">180°</span>
        </div>

        {/* Quick Angle Range Presets */}
        <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          {[0, 30, 45, 60, 90, 120, 150].map((deg) => (
            <button
              key={deg}
              onClick={() =>
                onUpdateParams({
                  firingAngleAlpha: deg,
                  firingAngleAlpha2: 180 - deg,
                })
              }
              className={`px-2 py-0.5 text-[11px] font-mono font-medium rounded transition-colors cursor-pointer ${
                params.firingAngleAlpha === deg
                  ? 'bg-blue-600 text-white shadow-xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {deg}°
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
