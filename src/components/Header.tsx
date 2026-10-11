import React, { useState } from 'react';
import {
  Zap,
  BookOpen,
  RotateCcw,
  SlidersHorizontal,
  Sliders,
  Layers,
  Sparkles,
  Gauge,
  Sun,
  Moon,
} from 'lucide-react';
import { ConverterParameters, TopologyMode } from '../types/rectifier';

interface HeaderProps {
  params: ConverterParameters;
  onApplyPreset: (presetName: string) => void;
  onOpenTheory: () => void;
  onResetAll: () => void;
  onUpdateParams?: (newParams: Partial<ConverterParameters>) => void;
  speedMultiplier?: number;
  onSpeedChange?: (speed: number) => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  params,
  onApplyPreset,
  onOpenTheory,
  onResetAll,
  onUpdateParams,
  speedMultiplier = 0.2,
  onSpeedChange,
  isDarkMode = false,
  onToggleDarkMode,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);
  const isThyristor = params.topology === 'single-thyristor';

  const presets = [
    {
      id: 'diode-r',
      name: 'Diode Bridge (R Load)',
      desc: 'Uncontrolled natural commutation full-wave rectifier',
    },
    {
      id: 'diode-rl',
      name: 'Diode Bridge (RL Load)',
      desc: 'Inductive smoothing with continuous current',
    },
    {
      id: 'scr-45',
      name: 'SCR Rectifier (α = 45°, RL)',
      desc: 'Controlled rectification forward power transfer',
    },
    {
      id: 'scr-inverter-120',
      name: 'SCR Inverter (α = 120°, RLE)',
      desc: 'Line-commutated inversion back into AC grid',
    },

  ];

  return (
    <header className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 shadow-xs transition-colors duration-200">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
                Shreyas' In Class Assignment
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-full border border-blue-200 dark:border-blue-800">
                Power Electronics Studio
              </span>
            </div>
            {/* Roll number directly below website name */}
            <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
              <span className="font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800">
                Roll No: 24EE10093
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 dark:text-slate-400 font-sans hidden sm:inline">
                Single-Phase Diode & Thyristor Controlled Bridge Rectifier
              </span>
            </div>
          </div>
        </div>

        {/* Center: Animation Speed Settings on the Top Header */}
        {onSpeedChange && (
          <div className="flex items-center gap-2.5 bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100/90 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 px-3.5 py-1.5 rounded-xl shadow-2xs transition-all">
            <div className="flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-blue-600" />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-100 dark:text-slate-200 whitespace-nowrap">
                Animation Speed:
              </span>
              <span className="font-mono text-xs font-bold text-blue-700 bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded shadow-2xs min-w-[46px] text-center">
                {speedMultiplier.toFixed(2)}x
              </span>
            </div>

            {/* Stepper Buttons */}
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => onSpeedChange(Math.max(0.02, parseFloat((speedMultiplier - 0.05).toFixed(2))))}
                className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold cursor-pointer"
                title="Decrease speed by 0.05x"
              >
                -0.05x
              </button>
              <button
                onClick={() => onSpeedChange(Math.min(5.0, parseFloat((speedMultiplier + 0.05).toFixed(2))))}
                className="px-1.5 py-0.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold cursor-pointer"
                title="Increase speed by 0.05x"
              >
                +0.05x
              </button>
            </div>

            {/* Speed Range Slider */}
            <div className="flex items-center gap-1.5">
              <input
                type="range"
                min="0.02"
                max="2.0"
                step="0.02"
                value={speedMultiplier}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="w-20 sm:w-28 md:w-36 h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-600"
                title="Slide to change animation playback speed"
              />
            </div>

            {/* Quick Speed Range Pills */}
            <div className="hidden sm:flex items-center gap-1 border-l border-slate-200 dark:border-slate-700 pl-2">
              {[0.05, 0.1, 0.2, 0.5, 1.0].map((s) => (
                <button
                  key={s}
                  onClick={() => onSpeedChange(s)}
                  className={`px-1.5 py-0.5 rounded text-[10.5px] font-mono transition-colors cursor-pointer ${
                    Math.abs(speedMultiplier - s) < 0.02
                      ? 'bg-blue-600 text-white font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Right: Quick Actions, Presets & Theory */}
        <div className="flex items-center gap-2.5">
          {/* Presets dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-750 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Lab Presets</span>
            </button>

            {showPresetsMenu && (
              <div
                className="absolute right-0 mt-1.5 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowPresetsMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 dark:border-slate-700 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Lab Configuration
                </div>
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onApplyPreset(p.id)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition-colors block text-xs"
                  >
                    <div className="font-semibold text-slate-800 dark:text-slate-100">{p.name}</div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theory and Derivations button */}
          <button
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-950/70 text-xs font-semibold text-amber-900 dark:text-amber-300 transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Waveform Analysis & Derivations</span>
            <span className="sm:hidden">Theory</span>
          </button>

          {/* Reset All */}
          <button
            onClick={onResetAll}
            className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Theme Mode Toggle (Right corner) */}
          {onToggleDarkMode && (
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all cursor-pointer shadow-xs"
              title={isDarkMode ? 'Switch to Light Theme' : 'Switch to Dark Theme'}
              aria-label="Toggle dark theme"
            >
              {isDarkMode ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400/20" />
                  <span className="hidden md:inline font-mono text-[11px]">Light</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 fill-indigo-600/20" />
                  <span className="hidden md:inline font-mono text-[11px]">Dark</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
