import React, { useState } from 'react';
import {
  Zap,
  BookOpen,
  RotateCcw,
  SlidersHorizontal,
  Layers,
  Sparkles,
} from 'lucide-react';
import { ConverterParameters, TopologyMode } from '../types/rectifier';

interface HeaderProps {
  params: ConverterParameters;
  onApplyPreset: (presetName: string) => void;
  onOpenTheory: () => void;
  onResetAll: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  params,
  onApplyPreset,
  onOpenTheory,
  onResetAll,
}) => {
  const [showPresetsMenu, setShowPresetsMenu] = useState(false);

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
    {
      id: 'dual-q1',
      name: 'Double Bridge: Forward Motoring (Q1)',
      desc: 'Bridge 1 rectifying at α1 = 30°',
    },
    {
      id: 'dual-q4',
      name: 'Double Bridge: Reverse Regen (Q4)',
      desc: 'Bridge 2 inverting at α2 = 120°',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-[1700px] mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
        {/* Left: Branding & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Shreyas' In Class Assignment
              </h1>
              <span className="hidden sm:inline-block text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Power Electronics Studio
              </span>
            </div>
            {/* Roll number directly below website name */}
            <div className="flex items-center gap-2 text-xs font-mono mt-0.5">
              <span className="font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                Roll No: 24EE10093
              </span>
              <span className="text-slate-400">·</span>
              <span className="text-slate-500 font-sans hidden sm:inline">
                Diode & Double Bridge Thyristor Controlled Rectifier
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Actions, Presets & Theory */}
        <div className="flex items-center gap-2.5">
          {/* Presets dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowPresetsMenu(!showPresetsMenu)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-slate-700 transition-colors shadow-xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-blue-600" />
              <span>Lab Presets</span>
            </button>

            {showPresetsMenu && (
              <div
                className="absolute right-0 mt-1.5 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                onClick={() => setShowPresetsMenu(false)}
              >
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Select Lab Configuration
                </div>
                {presets.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => onApplyPreset(p.id)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors block text-xs"
                  >
                    <div className="font-semibold text-slate-800">{p.name}</div>
                    <div className="text-[11px] text-slate-500">{p.desc}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theory and Derivations button */}
          <button
            onClick={onOpenTheory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 hover:bg-amber-100 text-xs font-semibold text-amber-900 transition-colors shadow-xs"
          >
            <BookOpen className="w-3.5 h-3.5 text-amber-700" />
            <span className="hidden sm:inline">Waveform Analysis & Derivations</span>
            <span className="sm:hidden">Theory</span>
          </button>

          {/* Reset All */}
          <button
            onClick={onResetAll}
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
            title="Reset Simulation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
};
