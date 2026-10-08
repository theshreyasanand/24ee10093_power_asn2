import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
} from 'lucide-react';
import { PI, TWO_PI } from '../utils/physics';

interface TransportControlsProps {
  isPlaying: boolean;
  onTogglePlay: () => void;
  currentAngleRad: number;
  onAngleChange: (angleRad: number) => void;
  speedMultiplier: number;
  onSpeedChange: (speed: number) => void;
  onStep: (deltaDeg: number) => void;
  onReset: () => void;
}

export const TransportControls: React.FC<TransportControlsProps> = ({
  isPlaying,
  onTogglePlay,
  currentAngleRad,
  onAngleChange,
  speedMultiplier,
  onSpeedChange,
  onStep,
  onReset,
}) => {
  const normAngleRad = ((currentAngleRad % TWO_PI) + TWO_PI) % TWO_PI;
  const currentAngleDeg = (normAngleRad * 180) / PI;
  const piFraction = (normAngleRad / PI).toFixed(2);

  const speedOptions = [0.1, 0.2, 0.5, 1, 2];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
      <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
        {/* Left: Playback buttons */}
        <div className="flex items-center gap-2 w-full lg:w-auto justify-center lg:justify-start">
          {/* Run Real-Time button */}
          <button
            onClick={onTogglePlay}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg font-semibold text-sm transition-all shadow-xs ${
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
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            title="Step backward (-5°)"
          >
            <SkipBack className="w-4 h-4" />
          </button>

          {/* Step Forward button */}
          <button
            onClick={() => onStep(5)}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            title="Step forward (+5°)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Reset button */}
          <button
            onClick={onReset}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors border border-slate-200"
            title="Reset angle to 0°"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Center: Angle Scrubber Slider */}
        <div className="flex-1 w-full flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-slate-500 min-w-[70px]">
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
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
            />
          </div>

          {/* Angle numeric badge */}
          <div className="min-w-[90px] text-right font-mono">
            <span className="text-sm font-bold text-blue-600">
              {currentAngleDeg.toFixed(1)}°
            </span>
            <span className="text-[10px] text-slate-400 block">
              ({piFraction}π rad)
            </span>
          </div>
        </div>

        {/* Right: Speed selector buttons */}
        <div className="flex items-center gap-1.5 w-full lg:w-auto justify-center lg:justify-end">
          <span className="text-xs text-slate-500 font-medium mr-1">Speed:</span>
          <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200">
            {speedOptions.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                className={`px-2 py-1 text-xs font-mono font-medium rounded transition-colors ${
                  speedMultiplier === s
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
