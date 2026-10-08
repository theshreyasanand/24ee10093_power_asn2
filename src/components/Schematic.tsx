import React, { useMemo } from 'react';
import { ConverterParameters, InstantaneousValues } from '../types/rectifier';
import { Activity, Zap, Info, Maximize2, Minimize2 } from 'lucide-react';

interface SchematicProps {
  params: ConverterParameters;
  instantaneous: InstantaneousValues;
  onUpdateParams: (newParams: Partial<ConverterParameters>) => void;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
}

export const Schematic: React.FC<SchematicProps> = ({
  params,
  instantaneous,
  onUpdateParams,
  isFullScreen = false,
  onToggleFullScreen,
}) => {
  const { topology, loadType, resistance, inductance, backEmf, showFreewheelingDiode, dualBridgeMode } =
    params;
  const { vs, is: currentIs, vo, io, activeSwitches, activePairLabel } = instantaneous;

  // Determine active states for switches
  const isT1On = activeSwitches.includes('T1') || activeSwitches.includes('D1');
  const isT2On = activeSwitches.includes('T2') || activeSwitches.includes('D2');
  const isT3On = activeSwitches.includes('T3') || activeSwitches.includes('D3');
  const isT4On = activeSwitches.includes('T4') || activeSwitches.includes('D4');

  // Double bridge 2 switches
  const isB2T1On = activeSwitches.includes("T1'");
  const isB2T2On = activeSwitches.includes("T2'");
  const isB2T3On = activeSwitches.includes("T3'");
  const isB2T4On = activeSwitches.includes("T4'");

  const isDfwOn = activeSwitches.includes('D_FW');

  const isThyristor = topology === 'single-thyristor' || topology === 'double-bridge';
  const isDual = topology === 'double-bridge';

  // Current flow direction for particles animation
  const isPositiveCycle = vs >= 0;
  const flowSpeed = Math.min(2.5, Math.max(0.4, Math.abs(io) / 3));

  // Determine wire glowing classes based on conduction path
  const positiveRailActive = isT1On || isT3On || isB2T1On || isB2T3On;
  const returnRailActive = isT2On || isT4On || isB2T2On || isB2T4On;

  return (
    <div
      className={`flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full'
      }`}
    >
      {/* Schematic Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 bg-slate-50/80">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 tracking-tight">
              Circuit Schematic Diagram
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="font-semibold text-blue-600">
                {topology === 'diode-bridge'
                  ? '1-PHASE UNCONTROLLED DIODE BRIDGE'
                  : topology === 'single-thyristor'
                  ? '1-PHASE FULLY CONTROLLED THYRISTOR BRIDGE'
                  : 'DUAL CONVERTER (DOUBLE BRIDGE THYRISTOR)'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Active loop callout */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-white border border-slate-200 rounded-lg shadow-xs text-xs">
            <span className="text-slate-400 font-medium">ACTIVE LOOP:</span>
            <span
              className={`font-semibold flex items-center gap-1.5 ${
                activeSwitches.length > 0 ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeSwitches.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'
                }`}
              />
              {activePairLabel}
            </span>
          </div>

          {/* Fullscreen button */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
              title={isFullScreen ? 'Exit full screen' : 'Full screen schematic'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative flex-1 min-h-[360px] p-4 flex items-center justify-center bg-slate-50/40 select-none overflow-hidden">
        <svg
          viewBox={isDual ? '0 0 920 480' : '0 0 760 440'}
          className="w-full h-full max-h-[580px] drop-shadow-xs"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="#cbd5e1" opacity="0.45" />
            </pattern>

            {/* Glowing filter for conducting components */}
            <filter id="glow-emerald" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Animated dashes for active current wires */}
            <style>
              {`
                @keyframes flow-forward {
                  from { stroke-dashoffset: 40; }
                  to { stroke-dashoffset: 0; }
                }
                @keyframes flow-reverse {
                  from { stroke-dashoffset: 0; }
                  to { stroke-dashoffset: 40; }
                }
                .flow-active {
                  animation: flow-forward 1.2s linear infinite;
                }
                .flow-reverse {
                  animation: flow-reverse 1.2s linear infinite;
                }
              `}
            </style>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* ===================== AC SOURCE ===================== */}
          <g transform={isDual ? 'translate(60, 220)' : 'translate(70, 220)'}>
            {/* Source circle */}
            <circle
              cx="0"
              cy="0"
              r="28"
              className="fill-white stroke-slate-700"
              strokeWidth="2.5"
            />
            {/* Sine wave inside */}
            <path
              d="M -16,0 Q -8,-14 0,0 Q 8,14 16,0"
              fill="none"
              stroke="#2563eb"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Voltage readout */}
            <text
              x="0"
              y="44"
              textAnchor="middle"
              className="text-[12px] font-semibold fill-slate-800 font-mono"
            >
              AC Source
            </text>
            <text
              x="0"
              y="58"
              textAnchor="middle"
              className="text-[10px] fill-blue-600 font-mono font-medium"
            >
              vs = {vs.toFixed(1)} V
            </text>
            <text
              x="0"
              y="72"
              textAnchor="middle"
              className="text-[10px] fill-cyan-600 font-mono font-medium"
            >
              is = {currentIs >= 0 ? `+${currentIs.toFixed(2)}` : currentIs.toFixed(2)} A
            </text>
          </g>

          {/* ===================== BRIDGE 1 WIRES & RAILS ===================== */}
          {/* Main bus lines */}
          {/* Top rail (+Vo) */}
          <path
            d={isDual ? 'M 180 80 L 740 80' : 'M 190 80 L 600 80'}
            fill="none"
            stroke={positiveRailActive ? '#059669' : '#94a3b8'}
            strokeWidth={positiveRailActive ? '3' : '2'}
            className={positiveRailActive && io > 0.1 ? 'flow-active' : ''}
            strokeDasharray={positiveRailActive && io > 0.1 ? '6 6' : 'none'}
          />
          {/* Bottom rail (-Vo / Ground) */}
          <path
            d={isDual ? 'M 180 360 L 740 360' : 'M 190 360 L 600 360'}
            fill="none"
            stroke={returnRailActive ? '#059669' : '#94a3b8'}
            strokeWidth={returnRailActive ? '3' : '2'}
            className={returnRailActive && Math.abs(io) > 0.1 ? 'flow-reverse' : ''}
            strokeDasharray={returnRailActive && Math.abs(io) > 0.1 ? '6 6' : 'none'}
          />

          {/* AC Line Connections */}
          {/* Phase A: from AC source top (x:70, y:192) -> to Bridge midpoint A (x:210, y:220) */}
          <path
            d={isDual ? 'M 60 192 L 60 180 L 180 180' : 'M 70 192 L 70 180 L 200 180'}
            fill="none"
            stroke={Math.abs(currentIs) > 0.1 ? '#2563eb' : '#94a3b8'}
            strokeWidth="2.5"
            className={Math.abs(currentIs) > 0.1 ? (currentIs > 0 ? 'flow-active' : 'flow-reverse') : ''}
            strokeDasharray={Math.abs(currentIs) > 0.1 ? '6 6' : 'none'}
          />
          <text
            x={isDual ? '110' : '120'}
            y="172"
            className="text-[10px] font-mono font-semibold fill-slate-600"
          >
            Phase A
          </text>

          {/* Neutral N: from AC source bot (x:70, y:248) -> to Bridge midpoint B (x:320, y:260) */}
          <path
            d={isDual ? 'M 60 248 L 60 260 L 290 260' : 'M 70 248 L 70 260 L 320 260'}
            fill="none"
            stroke={Math.abs(currentIs) > 0.1 ? '#2563eb' : '#94a3b8'}
            strokeWidth="2.5"
            className={Math.abs(currentIs) > 0.1 ? (currentIs > 0 ? 'flow-reverse' : 'flow-active') : ''}
            strokeDasharray={Math.abs(currentIs) > 0.1 ? '6 6' : 'none'}
          />
          <text
            x={isDual ? '110' : '120'}
            y="278"
            className="text-[10px] font-mono font-semibold fill-slate-600"
          >
            Neutral (N)
          </text>

          {/* Left Leg: Switch T1 (Top), T4 (Bottom) */}
          {/* Vertical wire left leg */}
          <line
            x1={isDual ? '180' : '200'}
            y1="80"
            x2={isDual ? '180' : '200'}
            y2="360"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Render Switch 1 (T1 or D1) */}
          <RenderSwitch
            x={isDual ? 180 : 200}
            y={125}
            name={isThyristor ? 'T1' : 'D1'}
            sublabel="Phase A (Top)"
            isOn={isT1On}
            isThyristor={isThyristor}
            hasGatePulse={instantaneous.gatePulseT1T2}
            direction="up"
          />

          {/* Render Switch 4 (T4 or D4) */}
          <RenderSwitch
            x={isDual ? 180 : 200}
            y={305}
            name={isThyristor ? 'T4' : 'D4'}
            sublabel="Phase A (Bot)"
            isOn={isT4On}
            isThyristor={isThyristor}
            hasGatePulse={instantaneous.gatePulseT3T4}
            direction="up"
          />

          {/* Right Leg: Switch T3 (Top), T2 (Bottom) */}
          <line
            x1={isDual ? '290' : '320'}
            y1="80"
            x2={isDual ? '290' : '320'}
            y2="360"
            stroke="#94a3b8"
            strokeWidth="2"
          />

          {/* Render Switch 3 (T3 or D3) */}
          <RenderSwitch
            x={isDual ? 290 : 320}
            y={125}
            name={isThyristor ? 'T3' : 'D3'}
            sublabel="Neutral (Top)"
            isOn={isT3On}
            isThyristor={isThyristor}
            hasGatePulse={instantaneous.gatePulseT3T4}
            direction="up"
          />

          {/* Render Switch 2 (T2 or D2) */}
          <RenderSwitch
            x={isDual ? 290 : 320}
            y={305}
            name={isThyristor ? 'T2' : 'D2'}
            sublabel="Neutral (Bot)"
            isOn={isT2On}
            isThyristor={isThyristor}
            hasGatePulse={instantaneous.gatePulseT1T2}
            direction="up"
          />

          {/* ===================== DOUBLE BRIDGE 2 (IF ENABLED) ===================== */}
          {isDual && (
            <g>
              {/* Bridge 2 antiparallel interconnection */}
              <text
                x="410"
                y="55"
                textAnchor="middle"
                className="text-[11px] font-bold fill-indigo-600 font-mono tracking-wider"
              >
                BRIDGE 2 (ANTIPARALLEL)
              </text>

              {/* Reactor Lr (circulating current limiting reactor) */}
              <g transform="translate(345, 80)">
                <path
                  d="M 0 0 C 8 -12, 16 -12, 24 0 C 32 -12, 40 -12, 48 0 C 56 -12, 64 -12, 72 0"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                />
                <text x="36" y="-16" textAnchor="middle" className="text-[9px] fill-indigo-600 font-mono">
                  Reactor Lr1
                </text>
              </g>

              {/* Legs for Bridge 2 */}
              <line x1="430" y1="80" x2="430" y2="360" stroke="#94a3b8" strokeWidth="2" />
              <line x1="530" y1="80" x2="530" y2="360" stroke="#94a3b8" strokeWidth="2" />

              {/* Connecting AC to Bridge 2 */}
              <path
                d="M 180 180 L 430 180"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />
              <path
                d="M 290 260 L 530 260"
                fill="none"
                stroke="#94a3b8"
                strokeWidth="1.5"
                strokeDasharray="4 4"
              />

              {/* T1' */}
              <RenderSwitch
                x={430}
                y={125}
                name="T1'"
                sublabel="B2 Ph-A"
                isOn={isB2T1On}
                isThyristor={true}
                hasGatePulse={instantaneous.gatePulseB2T1T2}
                direction="down"
              />
              {/* T4' */}
              <RenderSwitch
                x={430}
                y={305}
                name="T4'"
                sublabel="B2 Ph-A"
                isOn={isB2T4On}
                isThyristor={true}
                hasGatePulse={instantaneous.gatePulseB2T3T4}
                direction="down"
              />
              {/* T3' */}
              <RenderSwitch
                x={530}
                y={125}
                name="T3'"
                sublabel="B2 Ph-B"
                isOn={isB2T3On}
                isThyristor={true}
                hasGatePulse={instantaneous.gatePulseB2T3T4}
                direction="down"
              />
              {/* T2' */}
              <RenderSwitch
                x={530}
                y={305}
                name="T2'"
                sublabel="B2 Ph-B"
                isOn={isB2T2On}
                isThyristor={true}
                hasGatePulse={instantaneous.gatePulseB2T1T2}
                direction="down"
              />
            </g>
          )}

          {/* ===================== FREEWHEELING DIODE (OPTIONAL) ===================== */}
          {showFreewheelingDiode && (
            <g transform={`translate(${isDual ? 610 : 440}, 220)`}>
              <line x1="0" y1="-140" x2="0" y2="140" stroke="#94a3b8" strokeWidth="2" />
              <RenderSwitch
                x={0}
                y={0}
                name="D_FW"
                sublabel="Freewheel"
                isOn={isDfwOn}
                isThyristor={false}
                hasGatePulse={false}
                direction="up"
              />
            </g>
          )}

          {/* ===================== LOAD BRANCH ===================== */}
          <g transform={`translate(${isDual ? 740 : 590}, 220)`}>
            {/* Load vertical wire connection */}
            <line
              x1="0"
              y1="-140"
              x2="0"
              y2="140"
              stroke={Math.abs(io) > 0.05 ? '#059669' : '#94a3b8'}
              strokeWidth="2.5"
            />

            {/* Load Enclosure Box */}
            <rect
              x="-48"
              y="-100"
              width="96"
              height="200"
              rx="12"
              className="fill-white stroke-slate-300"
              strokeWidth="2"
            />

            {/* Load Header Label */}
            <text
              x="0"
              y="-78"
              textAnchor="middle"
              className="text-[12px] font-bold fill-slate-800 font-mono"
            >
              {loadType === 'R' ? 'R Load' : loadType === 'RL' ? 'RL Load' : 'RLE Load'}
            </text>

            {/* Resistor symbol */}
            <g transform="translate(0, -42)">
              <path
                d="M -12 -12 L 12 -8 L -12 -4 L 12 0 L -12 4 L 12 8 L 0 12"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <text x="0" y="24" textAnchor="middle" className="text-[10px] font-mono fill-amber-700 font-semibold">
                R = {resistance} Ω
              </text>
            </g>

            {/* Inductor symbol (if RL or RLE) */}
            {(loadType === 'RL' || loadType === 'RLE') && (
              <g transform="translate(0, 15)">
                <path
                  d="M 0 -18 C -16 -18, -16 -6, 0 -6 C -16 -6, -16 6, 0 6 C -16 6, -16 18, 0 18"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
                <text x="0" y="32" textAnchor="middle" className="text-[10px] font-mono fill-blue-700 font-semibold">
                  L = {(inductance * 1000).toFixed(0)} mH
                </text>
              </g>
            )}

            {/* DC Back-EMF battery symbol (if RLE) */}
            {loadType === 'RLE' && (
              <g transform="translate(0, 68)">
                <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#dc2626" strokeWidth="3" />
                <line x1="-8" y1="5" x2="8" y2="5" stroke="#dc2626" strokeWidth="2" />
                <text x="20" y="-2" className="text-[9px] fill-red-600 font-bold">+</text>
                <text x="14" y="8" className="text-[9px] fill-red-600 font-bold">-</text>
                <text x="0" y="22" textAnchor="middle" className="text-[9px] font-mono fill-red-600 font-semibold">
                  E = {backEmf} V
                </text>
              </g>
            )}

            {/* Live Load current badge */}
            <rect
              x="-42"
              y="110"
              width="84"
              height="26"
              rx="6"
              className={Math.abs(io) > 0.1 ? 'fill-emerald-50 stroke-emerald-500' : 'fill-slate-100 stroke-slate-300'}
              strokeWidth="1.5"
            />
            <text
              x="0"
              y="127"
              textAnchor="middle"
              className={`text-[11px] font-mono font-bold ${
                Math.abs(io) > 0.1 ? 'fill-emerald-700' : 'fill-slate-500'
              }`}
            >
              io = {io >= 0 ? `+${io.toFixed(2)}` : io.toFixed(2)} A
            </text>

            {/* Load Voltage terminals */}
            <text
              x="0"
              y="-150"
              textAnchor="middle"
              className="text-[11px] font-mono font-bold fill-emerald-700"
            >
              + Vo ({vo >= 0 ? `+${vo.toFixed(1)}` : vo.toFixed(1)} V)
            </text>
            <text
              x="0"
              y="158"
              textAnchor="middle"
              className="text-[11px] font-mono font-bold fill-slate-600"
            >
              - Vo (GND)
            </text>
          </g>

          {/* Node Connection Dots */}
          <circle cx={isDual ? 180 : 200} cy="80" r="4" fill="#0f172a" />
          <circle cx={isDual ? 290 : 320} cy="80" r="4" fill="#0f172a" />
          <circle cx={isDual ? 180 : 200} cy="360" r="4" fill="#0f172a" />
          <circle cx={isDual ? 290 : 320} cy="360" r="4" fill="#0f172a" />
          <circle cx={isDual ? 740 : 590} cy="80" r="4" fill="#0f172a" />
          <circle cx={isDual ? 740 : 590} cy="360" r="4" fill="#0f172a" />
          <circle cx={isDual ? 180 : 200} cy="180" r="4" fill="#0f172a" />
          <circle cx={isDual ? 290 : 320} cy="260" r="4" fill="#0f172a" />
        </svg>

        {/* Legend / Quick Help Footer */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[11px] text-slate-500 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span>Conducting Switch</span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-300" />
              <span>Blocking / OFF</span>
            </span>
            {isThyristor && (
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                <span>Gate Firing Pulse</span>
              </span>
            )}
          </div>
          <div className="font-mono text-slate-600">
            Instantaneous: vo = <span className="font-semibold text-emerald-600">{vo.toFixed(1)}V</span> | is = <span className="font-semibold text-cyan-600">{currentIs.toFixed(2)}A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

interface RenderSwitchProps {
  x: number;
  y: number;
  name: string;
  sublabel: string;
  isOn: boolean;
  isThyristor: boolean;
  hasGatePulse: boolean;
  direction?: 'up' | 'down';
}

const RenderSwitch: React.FC<RenderSwitchProps> = ({
  x,
  y,
  name,
  sublabel,
  isOn,
  isThyristor,
  hasGatePulse,
  direction = 'up',
}) => {
  const isUp = direction === 'up';

  // Triangle and Cathode coordinates
  // For 'up': Anode base at y=8, Cathode apex & bar at y=-8
  // For 'down': Anode base at y=-8, Cathode apex & bar at y=8 (exact match to reference diagram)
  const trianglePoints = isUp ? '0,-8 -11,8 11,8' : '0,8 -11,-8 11,-8';
  const cathodeBarY = isUp ? -8 : 8;
  const anodeLineY1 = isUp ? 26 : -26;
  const anodeLineY2 = isUp ? 8 : -8;
  const cathodeLineY1 = isUp ? -8 : 8;
  const cathodeLineY2 = isUp ? -26 : 26;

  // Gate terminal coordinates (originating directly from Cathode bar)
  const gateStartY = cathodeBarY;
  const gateKneeY = isUp ? 0 : 16;
  const gateEndX = -20;
  const gateEndY = gateKneeY;

  return (
    <g transform={`translate(${x}, ${y})`}>
      {/* Outer bounding glowing box when active */}
      <rect
        x="-32"
        y="-26"
        width="60"
        height="52"
        rx="8"
        fill={isOn ? '#ecfdf5' : '#ffffff'}
        stroke={isOn ? '#10b981' : '#cbd5e1'}
        strokeWidth={isOn ? '2.5' : '1.5'}
        filter={isOn ? 'url(#glow-emerald)' : undefined}
        className="transition-all duration-150"
      />

      {/* Through-lead: Anode terminal line */}
      <line
        x1="0"
        y1={anodeLineY1}
        x2="0"
        y2={anodeLineY2}
        stroke={isOn ? '#047857' : '#475569'}
        strokeWidth="2"
      />

      {/* Through-lead: Cathode terminal line */}
      <line
        x1="0"
        y1={cathodeLineY1}
        x2="0"
        y2={cathodeLineY2}
        stroke={isOn ? '#047857' : '#475569'}
        strokeWidth="2"
      />

      {/* Triangle Body (Anode -> Cathode direction) */}
      <polygon
        points={trianglePoints}
        fill={isOn ? '#059669' : '#475569'}
        stroke={isOn ? '#047857' : '#334155'}
        strokeWidth="1.5"
      />

      {/* Cathode Crossbar (perpendicular to terminal) */}
      <line
        x1="-13"
        y1={cathodeBarY}
        x2="13"
        y2={cathodeBarY}
        stroke={isOn ? '#047857' : '#1e293b'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Thyristor Gate Terminal (connected at Cathode, angled at 45° then horizontal to the left) */}
      {isThyristor && (
        <g>
          {/* Gate lead path */}
          <path
            d={`M 0,${gateStartY} L -10,${gateKneeY} L ${gateEndX},${gateEndY}`}
            fill="none"
            stroke={hasGatePulse ? '#f59e0b' : isOn ? '#059669' : '#475569'}
            strokeWidth={hasGatePulse ? '2.5' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gate terminal circle */}
          <circle
            cx={gateEndX}
            cy={gateEndY}
            r="2.5"
            fill={hasGatePulse ? '#f59e0b' : '#475569'}
          />

          {/* Gate "G" label */}
          <text
            x={gateEndX - 3}
            y={gateEndY + 3}
            textAnchor="end"
            className={`text-[9px] font-mono font-bold ${
              hasGatePulse ? 'fill-amber-600' : 'fill-slate-600'
            }`}
          >
            G
          </text>

          {/* Gate firing trigger pulse glow */}
          {hasGatePulse && (
            <circle
              cx={gateEndX}
              cy={gateEndY}
              r="6"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              className="animate-ping"
            />
          )}
        </g>
      )}

      {/* Switch Name Header */}
      <text
        x="0"
        y="-32"
        textAnchor="middle"
        className={`text-[12px] font-bold font-mono ${
          isOn ? 'fill-emerald-800' : 'fill-slate-700'
        }`}
      >
        {name}
      </text>

      {/* State label (ON / OFF) */}
      <text
        x="0"
        y="38"
        textAnchor="middle"
        className={`text-[9px] font-mono font-semibold ${
          isOn ? 'fill-emerald-600' : 'fill-slate-400'
        }`}
      >
        {isOn ? 'ON (COND)' : 'OFF (BLOCK)'}
      </text>
    </g>
  );
};
