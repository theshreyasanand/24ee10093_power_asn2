import React, { useMemo } from 'react';
import { ConverterParameters, InstantaneousValues, LoadType } from '../types/rectifier';
import { getSwitchDeviceType } from '../utils/physics';
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
  const {
    topology,
    loadType,
    resistance,
    inductance,
    backEmf,
    showFreewheelingDiode,
    dualBridgeMode,
    firingAngleAlpha,
    firingAngleAlpha2,
  } = params;
  const { vs, is: currentIs, vo, io, activeSwitches, activePairLabel } = instantaneous;

  // Individual switch device types for Bridge 1
  const s1Type = getSwitchDeviceType('T1', params);
  const s2Type = getSwitchDeviceType('T2', params);
  const s3Type = getSwitchDeviceType('T3', params);
  const s4Type = getSwitchDeviceType('T4', params);

  const isT1Thyristor = s1Type === 'thyristor';
  const isT2Thyristor = s2Type === 'thyristor';
  const isT3Thyristor = s3Type === 'thyristor';
  const isT4Thyristor = s4Type === 'thyristor';

  // Double bridge 2 switch device types
  const b2s1Type = getSwitchDeviceType("T1'", params);
  const b2s2Type = getSwitchDeviceType("T2'", params);
  const b2s3Type = getSwitchDeviceType("T3'", params);
  const b2s4Type = getSwitchDeviceType("T4'", params);

  // Toggle individual switch between thyristor and diode
  const handleToggleIndividualSwitch = (switchId: string) => {
    const current = getSwitchDeviceType(switchId, params);
    const next = current === 'thyristor' ? 'diode' : 'thyristor';
    onUpdateParams({
      switchOverrides: {
        ...(params.switchOverrides || {}),
        [switchId]: next,
      },
    });
  };

  // Determine active states for switches
  const isT1On = activeSwitches.includes('T1') || activeSwitches.includes('D1');
  const isT2On = activeSwitches.includes('T2') || activeSwitches.includes('D2');
  const isT3On = activeSwitches.includes('T3') || activeSwitches.includes('D3');
  const isT4On = activeSwitches.includes('T4') || activeSwitches.includes('D4');

  // Double bridge 2 switches
  const isB2T1On = activeSwitches.includes("T1'") || activeSwitches.includes("D1'");
  const isB2T2On = activeSwitches.includes("T2'") || activeSwitches.includes("D2'");
  const isB2T3On = activeSwitches.includes("T3'") || activeSwitches.includes("D3'");
  const isB2T4On = activeSwitches.includes("T4'") || activeSwitches.includes("D4'");

  const isDfwOn = activeSwitches.includes('D_FW');

  const isThyristor = isT1Thyristor || isT2Thyristor || isT3Thyristor || isT4Thyristor;
  const allThyristors = isT1Thyristor && isT2Thyristor && isT3Thyristor && isT4Thyristor;
  const allDiodes = !isT1Thyristor && !isT2Thyristor && !isT3Thyristor && !isT4Thyristor;
  const isDual = topology === 'double-bridge';

  const showFlowArrows = true;
  const highlightActiveLoop = true;

  // Toggle all switches in bridge
  const handleToggleSwitchType = () => {
    if (allDiodes) {
      onUpdateParams({ topology: 'single-thyristor', switchOverrides: {} });
    } else {
      onUpdateParams({ topology: 'diode-bridge', switchOverrides: {} });
    }
  };

  // Schematic coordinate anchors
  const sourceX = isDual ? 60 : 70;
  const leg1X = isDual ? 180 : 200;
  const leg2X = isDual ? 290 : 320;
  const dfwX = isDual ? 610 : 440;
  const loadX = isDual ? 740 : 590;

  // Conduction loop identification
  const isLoopT1T2 = isT1On && isT2On && Math.abs(io) > 0.02;
  const isLoopT3T4 = isT3On && isT4On && Math.abs(io) > 0.02;
  const isLoopLeg1 = isT1On && isT4On && Math.abs(io) > 0.02;
  const isLoopLeg2 = isT3On && isT2On && Math.abs(io) > 0.02;
  const isLoopDfw = isDfwOn && showFreewheelingDiode && Math.abs(io) > 0.02;
  const isLoopB2T1T2 = isB2T1On && isB2T2On && Math.abs(io) > 0.02;
  const isLoopB2T3T4 = isB2T3On && isB2T4On && Math.abs(io) > 0.02;
  const isConductionActive = isLoopT1T2 || isLoopT3T4 || isLoopLeg1 || isLoopLeg2 || isLoopDfw || isLoopB2T1T2 || isLoopB2T3T4;

  // Current flow direction for particles animation
  const isPositiveCycle = vs >= 0;
  const flowSpeed = Math.min(2.5, Math.max(0.4, Math.abs(io) / 3));

  // Determine wire glowing classes based on conduction path
  const positiveRailActive = isT1On || isT3On || isB2T1On || isB2T3On || isDfwOn;
  const returnRailActive = isT2On || isT4On || isB2T2On || isB2T4On || isDfwOn;

  return (
    <div
      className={`flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full'
      }`}
    >
      {/* Schematic Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
              Circuit Schematic Diagram
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              <span className="font-semibold text-blue-600">
                {isDual
                  ? 'DUAL CONVERTER (DOUBLE BRIDGE)'
                  : allDiodes
                  ? '1-PHASE UNCONTROLLED DIODE BRIDGE'
                  : allThyristors
                  ? '1-PHASE FULLY CONTROLLED THYRISTOR BRIDGE'
                  : '1-PHASE HYBRID / SEMI-CONVERTER BRIDGE'}
              </span>
            </div>
          </div>
        </div>

        {/* Integrated Clean Controls: Device Toggle + Load Type + D_FW + Fullscreen */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Switch Device Mode (Thyristor vs Diode) */}
          <button
            onClick={handleToggleSwitchType}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              topology === 'diode-bridge'
                ? 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700'
                : 'bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
            }`}
            title="Click to switch between Diode and Thyristor (or click any switch in the circuit diagram directly)"
          >
            <span>{topology === 'diode-bridge' ? '⚪ Diode Bridge' : '⚡ Thyristor Bridge'}</span>
            <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(Click to toggle)</span>
          </button>

          {/* Load Type Fast Switcher */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs text-xs">
            <span className="text-[11px] font-semibold text-slate-500 pl-2">Load:</span>
            {(['R', 'RL', 'RLE'] as LoadType[]).map((type) => (
              <button
                key={type}
                onClick={() => onUpdateParams({ loadType: type })}
                className={`px-2.5 py-1 rounded-md font-semibold text-xs transition-all cursor-pointer ${
                  loadType === type
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
                title={`Switch load to ${type}`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Freewheeling Diode (D_FW) Toggle */}
          <button
            onClick={() => onUpdateParams({ showFreewheelingDiode: !showFreewheelingDiode })}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              showFreewheelingDiode
                ? isDfwOn
                  ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-300 shadow-2xs'
                : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
            }`}
            title="Toggle Freewheeling Diode across load terminals"
          >
            <span
              className={`w-2 h-2 rounded-full ${
                showFreewheelingDiode
                  ? isDfwOn
                    ? 'bg-amber-300 animate-pulse'
                    : 'bg-emerald-500'
                  : 'bg-slate-300'
              }`}
            />
            <span>
              {showFreewheelingDiode
                ? isDfwOn
                  ? '⚡ D_FW Conducting'
                  : 'D_FW Connected'
                : '+ Add D_FW'}
            </span>
          </button>

          {/* Fullscreen button */}
          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-1.5 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
              title={isFullScreen ? 'Exit full screen' : 'Full screen schematic'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Live Conduction Flow Status Bar */}
      <div
        className={`px-4 py-1.5 border-b text-xs flex flex-wrap items-center justify-between gap-2 transition-colors ${
          isLoopT1T2
            ? 'bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
            : isLoopT3T4
            ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800 text-sky-950 dark:text-sky-200'
            : isLoopDfw
            ? 'bg-amber-50/80 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
            : 'bg-slate-50/70 dark:bg-slate-850 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
        }`}
      >
        <div className="flex items-center gap-2 font-mono text-[11px]">
          <span
            className={`w-2 h-2 rounded-full ${
              activeSwitches.length > 0 ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
            }`}
          />
          <span className="font-bold">
            {isLoopT1T2
              ? isThyristor ? 'Active Loop: AC Source (+) ➔ T1 ➔ Load ➔ T2 ➔ AC Source (−)' : 'Active Loop: AC Source (+) ➔ D1 ➔ Load ➔ D2 ➔ AC Source (−)'
              : isLoopT3T4
              ? isThyristor ? 'Active Loop: AC Source (−) ➔ T3 ➔ Load ➔ T4 ➔ AC Source (+)' : 'Active Loop: AC Source (−) ➔ D3 ➔ Load ➔ D4 ➔ AC Source (+)'
              : isLoopDfw
              ? 'Inductive Freewheeling Loop: Load ➔ D_FW ➔ Load'
              : 'Blocking / Natural Zero-Crossing Interval'}
          </span>
        </div>

        <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500 dark:text-slate-400 shrink-0">
          <span className="font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap">Active Conducting:</span>
          <span className="inline-block min-w-[210px] sm:min-w-[240px] text-center bg-white dark:bg-slate-900 px-2.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 font-bold text-slate-800 dark:text-slate-100 shadow-2xs truncate">
            {activePairLabel}
          </span>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative flex-1 min-h-[360px] p-4 flex items-center justify-center bg-slate-50/40 dark:bg-slate-950 select-none overflow-hidden">
        <svg
          viewBox={isDual ? '0 0 920 480' : '0 0 760 440'}
          className="w-full h-full max-h-[580px] drop-shadow-xs"
        >
          <defs>
            {/* Grid Pattern */}
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" className="text-slate-300 dark:text-slate-800" opacity="0.5" />
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

            {/* Arrowhead markers */}
            <marker id="arrow-emerald" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#059669" />
            </marker>
            <marker id="arrow-blue" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 9 5 L 0 9 z" fill="#2563eb" />
            </marker>

            {/* Animated dashes for active current wires */}
            <style>
              {`
                @keyframes flow-forward {
                  from { stroke-dashoffset: 48; }
                  to { stroke-dashoffset: 0; }
                }
                @keyframes flow-reverse {
                  from { stroke-dashoffset: 0; }
                  to { stroke-dashoffset: 48; }
                }
                .flow-active {
                  animation: flow-forward 2.2s linear infinite;
                }
                .flow-reverse {
                  animation: flow-reverse 2.2s linear infinite;
                }
              `}
            </style>
          </defs>

          {/* Background grid */}
          <rect width="100%" height="100%" fill="url(#grid)" />

          {/* ===================== CLOSED-LOOP PATH HIGHLIGHT OVERLAY ===================== */}
          {highlightActiveLoop && isLoopT1T2 && (
            <g className="pointer-events-none">
              {/* Outer soft glow */}
              <path
                d={`M ${sourceX} 180 L ${leg1X} 180 L ${leg1X} 80 L ${loadX} 80 L ${loadX} 360 L ${leg2X} 360 L ${leg2X} 260 L ${sourceX} 260 L ${sourceX} 180 Z`}
                fill="none"
                stroke="#10b981"
                strokeWidth="10"
                opacity="0.25"
                filter="url(#glow-emerald)"
                strokeLinejoin="round"
              />
              {/* Crisp animated dash loop */}
              <path
                d={`M ${sourceX} 180 L ${leg1X} 180 L ${leg1X} 80 L ${loadX} 80 L ${loadX} 360 L ${leg2X} 360 L ${leg2X} 260 L ${sourceX} 260 L ${sourceX} 180 Z`}
                fill="none"
                stroke="#059669"
                strokeWidth="3.5"
                strokeDasharray="12 8"
                className="flow-active"
                strokeLinejoin="round"
              />
            </g>
          )}

          {highlightActiveLoop && isLoopT3T4 && (
            <g className="pointer-events-none">
              {/* Outer soft glow */}
              <path
                d={`M ${sourceX} 260 L ${leg2X} 260 L ${leg2X} 80 L ${loadX} 80 L ${loadX} 360 L ${leg1X} 360 L ${leg1X} 180 L ${sourceX} 180 L ${sourceX} 260 Z`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="10"
                opacity="0.25"
                filter="url(#glow-cyan)"
                strokeLinejoin="round"
              />
              {/* Crisp animated dash loop */}
              <path
                d={`M ${sourceX} 260 L ${leg2X} 260 L ${leg2X} 80 L ${loadX} 80 L ${loadX} 360 L ${leg1X} 360 L ${leg1X} 180 L ${sourceX} 180 L ${sourceX} 260 Z`}
                fill="none"
                stroke="#0284c7"
                strokeWidth="3.5"
                strokeDasharray="12 8"
                className="flow-active"
                strokeLinejoin="round"
              />
            </g>
          )}

          {highlightActiveLoop && isLoopDfw && (
            <g className="pointer-events-none">
              {/* Outer soft glow */}
              <path
                d={`M ${dfwX} 80 L ${loadX} 80 L ${loadX} 360 L ${dfwX} 360 Z`}
                fill="none"
                stroke="#f59e0b"
                strokeWidth="10"
                opacity="0.3"
                strokeLinejoin="round"
              />
              {/* Crisp animated dash loop */}
              <path
                d={`M ${dfwX} 80 L ${loadX} 80 L ${loadX} 360 L ${dfwX} 360 Z`}
                fill="none"
                stroke="#d97706"
                strokeWidth="3.5"
                strokeDasharray="12 8"
                className="flow-reverse"
                strokeLinejoin="round"
              />
            </g>
          )}

          {/* ===================== AC SOURCE ===================== */}
          <g transform={`translate(${sourceX}, 220)`}>
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
            {/* Source label */}
            <text
              x="0"
              y="44"
              textAnchor="middle"
              className="text-[12px] font-semibold fill-slate-800 dark:fill-slate-200 font-mono"
            >
              AC Source (vs)
            </text>
          </g>

          {/* AC Source Dynamic Polarity Badges (+ and -) */}
          <g transform={`translate(${sourceX - 22}, 180)`} className="pointer-events-none">
            <circle
              cx="0"
              cy="0"
              r="8"
              fill={vs >= 0 ? '#ef4444' : '#3b82f6'}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-xs"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              className="text-[11px] font-mono font-bold fill-white select-none"
            >
              {vs >= 0 ? '+' : '−'}
            </text>
          </g>
          <g transform={`translate(${sourceX - 22}, 260)`} className="pointer-events-none">
            <circle
              cx="0"
              cy="0"
              r="8"
              fill={vs >= 0 ? '#3b82f6' : '#ef4444'}
              stroke="#ffffff"
              strokeWidth="1.5"
              className="drop-shadow-xs"
            />
            <text
              x="0"
              y="3"
              textAnchor="middle"
              className="text-[11px] font-mono font-bold fill-white select-none"
            >
              {vs >= 0 ? '−' : '+'}
            </text>
          </g>

          {/* ===================== BRIDGE 1 WIRES & RAILS ===================== */}
          {/* Main bus lines */}
          {/* Top rail (+Vo) */}
          <path
            d={`M ${leg1X} 80 L ${loadX} 80`}
            fill="none"
            stroke={positiveRailActive ? '#059669' : '#94a3b8'}
            strokeWidth={positiveRailActive ? '3.5' : '2'}
            className={positiveRailActive && io > 0.05 ? 'flow-active' : ''}
            strokeDasharray={positiveRailActive && io > 0.05 ? '8 6' : 'none'}
          />
          {/* Bottom rail (-Vo / Ground) */}
          <path
            d={`M ${leg1X} 360 L ${loadX} 360`}
            fill="none"
            stroke={returnRailActive ? '#059669' : '#94a3b8'}
            strokeWidth={returnRailActive ? '3.5' : '2'}
            className={returnRailActive && Math.abs(io) > 0.05 ? 'flow-reverse' : ''}
            strokeDasharray={returnRailActive && Math.abs(io) > 0.05 ? '8 6' : 'none'}
          />

          {/* Directional Flow Chevrons on Top Rail & Bottom Rail */}
          {showFlowArrows && positiveRailActive && io > 0.05 && (
            <>
              <FlowChevron x={isDual ? 360 : 380} y={80} dir="right" color="#059669" size={8} />
              <FlowChevron x={isDual ? 490 : 470} y={80} dir="right" color="#059669" size={8} />
              <FlowChevron x={isDual ? 670 : 540} y={80} dir="right" color="#059669" size={8} />
            </>
          )}
          {showFlowArrows && returnRailActive && Math.abs(io) > 0.05 && (
            <>
              <FlowChevron x={isDual ? 670 : 540} y={360} dir="left" color="#059669" size={8} />
              <FlowChevron x={isDual ? 490 : 470} y={360} dir="left" color="#059669" size={8} />
              <FlowChevron x={isDual ? 360 : 380} y={360} dir="left" color="#059669" size={8} />
            </>
          )}

          {/* AC Line Connections */}
          {/* Phase A: from AC source top (x:sourceX, y:192) -> to Bridge midpoint A (x:leg1X, y:180) */}
          <path
            d={`M ${sourceX} 192 L ${sourceX} 180 L ${leg1X} 180`}
            fill="none"
            stroke={Math.abs(currentIs) > 0.05 ? '#2563eb' : '#94a3b8'}
            strokeWidth={Math.abs(currentIs) > 0.05 ? '3' : '2'}
            className={Math.abs(currentIs) > 0.05 ? (currentIs > 0 ? 'flow-active' : 'flow-reverse') : ''}
            strokeDasharray={Math.abs(currentIs) > 0.05 ? '8 6' : 'none'}
          />
          <text
            x={sourceX + 45}
            y="172"
            textAnchor="middle"
            className="text-[10px] font-mono font-medium fill-slate-500"
          >
            Phase A
          </text>

          {/* Chevrons on Phase A wire */}
          {showFlowArrows && Math.abs(currentIs) > 0.05 && (
            <>
              <FlowChevron
                x={sourceX + (leg1X - sourceX) * 0.4}
                y={180}
                dir={currentIs > 0 ? 'right' : 'left'}
                color="#2563eb"
                size={8}
              />
              <FlowChevron
                x={sourceX + (leg1X - sourceX) * 0.75}
                y={180}
                dir={currentIs > 0 ? 'right' : 'left'}
                color="#2563eb"
                size={8}
              />
            </>
          )}

          {/* Neutral N: from AC source bot (x:sourceX, y:248) -> to Bridge midpoint B (x:leg2X, y:260) */}
          <path
            d={`M ${sourceX} 248 L ${sourceX} 260 L ${leg2X} 260`}
            fill="none"
            stroke={Math.abs(currentIs) > 0.05 ? '#2563eb' : '#94a3b8'}
            strokeWidth={Math.abs(currentIs) > 0.05 ? '3' : '2'}
            className={Math.abs(currentIs) > 0.05 ? (currentIs > 0 ? 'flow-reverse' : 'flow-active') : ''}
            strokeDasharray={Math.abs(currentIs) > 0.05 ? '8 6' : 'none'}
          />
          <text
            x={sourceX + 45}
            y="252"
            textAnchor="middle"
            className="text-[10px] font-mono font-medium fill-slate-500"
          >
            Neutral (N)
          </text>

          {/* Chevrons on Neutral wire */}
          {showFlowArrows && Math.abs(currentIs) > 0.05 && (
            <>
              <FlowChevron
                x={sourceX + (leg2X - sourceX) * 0.35}
                y={260}
                dir={currentIs > 0 ? 'left' : 'right'}
                color="#2563eb"
                size={8}
              />
              <FlowChevron
                x={sourceX + (leg2X - sourceX) * 0.7}
                y={260}
                dir={currentIs > 0 ? 'left' : 'right'}
                color="#2563eb"
                size={8}
              />
            </>
          )}

          {/* Left Leg: Switch T1 (Top), T4 (Bottom) */}
          {/* Upper segment of Leg 1 (Phase A tap to Top Rail via T1) */}
          <line
            x1={leg1X}
            y1="80"
            x2={leg1X}
            y2="180"
            stroke={isT1On && Math.abs(io) > 0.05 ? '#059669' : '#94a3b8'}
            strokeWidth={isT1On && Math.abs(io) > 0.05 ? '3.5' : '2'}
            strokeDasharray={isT1On && Math.abs(io) > 0.05 ? '8 6' : 'none'}
            className={isT1On && Math.abs(io) > 0.05 ? 'flow-active' : ''}
          />
          {/* Lower segment of Leg 1 (Bottom Rail to Phase A tap via T4) */}
          <line
            x1={leg1X}
            y1="180"
            x2={leg1X}
            y2="360"
            stroke={isT4On && Math.abs(io) > 0.05 ? '#059669' : '#94a3b8'}
            strokeWidth={isT4On && Math.abs(io) > 0.05 ? '3.5' : '2'}
            strokeDasharray={isT4On && Math.abs(io) > 0.05 ? '8 6' : 'none'}
            className={isT4On && Math.abs(io) > 0.05 ? 'flow-active' : ''}
          />

          {/* Flow chevrons on Left Leg */}
          {showFlowArrows && isT1On && Math.abs(io) > 0.05 && (
            <FlowChevron x={leg1X} y={96} dir="up" color="#059669" size={8} />
          )}
          {showFlowArrows && isT4On && Math.abs(io) > 0.05 && (
            <FlowChevron x={leg1X} y={205} dir="up" color="#059669" size={8} />
          )}

          {/* Render Switch 1 (T1 or D1) */}
          <RenderSwitch
            x={leg1X}
            y={125}
            name={isT1Thyristor ? 'T1' : 'D1'}
            isOn={isT1On}
            isThyristor={isT1Thyristor}
            hasGatePulse={instantaneous.gatePulseT1T2 && isT1Thyristor}
            direction="up"
            showFlowArrows={showFlowArrows}
            onClick={() => handleToggleIndividualSwitch('T1')}
          />

          {/* Render Switch 4 (T4 or D4) */}
          <RenderSwitch
            x={leg1X}
            y={305}
            name={isT4Thyristor ? 'T4' : 'D4'}
            isOn={isT4On}
            isThyristor={isT4Thyristor}
            hasGatePulse={instantaneous.gatePulseT3T4 && isT4Thyristor}
            direction="up"
            showFlowArrows={showFlowArrows}
            onClick={() => handleToggleIndividualSwitch('T4')}
          />

          {/* Right Leg: Switch T3 (Top), T2 (Bottom) */}
          {/* Upper segment of Leg 2 (Neutral tap to Top Rail via T3) */}
          <line
            x1={leg2X}
            y1="80"
            x2={leg2X}
            y2="260"
            stroke={isT3On && Math.abs(io) > 0.05 ? '#059669' : '#94a3b8'}
            strokeWidth={isT3On && Math.abs(io) > 0.05 ? '3.5' : '2'}
            strokeDasharray={isT3On && Math.abs(io) > 0.05 ? '8 6' : 'none'}
            className={isT3On && Math.abs(io) > 0.05 ? 'flow-active' : ''}
          />
          {/* Lower segment of Leg 2 (Bottom Rail to Neutral tap via T2) */}
          <line
            x1={leg2X}
            y1="260"
            x2={leg2X}
            y2="360"
            stroke={isT2On && Math.abs(io) > 0.05 ? '#059669' : '#94a3b8'}
            strokeWidth={isT2On && Math.abs(io) > 0.05 ? '3.5' : '2'}
            strokeDasharray={isT2On && Math.abs(io) > 0.05 ? '8 6' : 'none'}
            className={isT2On && Math.abs(io) > 0.05 ? 'flow-active' : ''}
          />

          {/* Flow chevrons on Right Leg */}
          {showFlowArrows && isT3On && Math.abs(io) > 0.05 && (
            <FlowChevron x={leg2X} y={96} dir="up" color="#059669" size={8} />
          )}
          {showFlowArrows && isT2On && Math.abs(io) > 0.05 && (
            <FlowChevron x={leg2X} y={280} dir="up" color="#059669" size={8} />
          )}

          {/* Render Switch 3 (T3 or D3) */}
          <RenderSwitch
            x={leg2X}
            y={125}
            name={isT3Thyristor ? 'T3' : 'D3'}
            isOn={isT3On}
            isThyristor={isT3Thyristor}
            hasGatePulse={instantaneous.gatePulseT3T4 && isT3Thyristor}
            direction="up"
            showFlowArrows={showFlowArrows}
            onClick={() => handleToggleIndividualSwitch('T3')}
          />

          {/* Render Switch 2 (T2 or D2) */}
          <RenderSwitch
            x={leg2X}
            y={305}
            name={isT2Thyristor ? 'T2' : 'D2'}
            isOn={isT2On}
            isThyristor={isT2Thyristor}
            hasGatePulse={instantaneous.gatePulseT1T2 && isT2Thyristor}
            direction="up"
            showFlowArrows={showFlowArrows}
            onClick={() => handleToggleIndividualSwitch('T2')}
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
                name={b2s1Type === 'thyristor' ? "T1'" : "D1'"}
                isOn={isB2T1On}
                isThyristor={b2s1Type === 'thyristor'}
                hasGatePulse={instantaneous.gatePulseB2T1T2 && b2s1Type === 'thyristor'}
                direction="down"
                showFlowArrows={showFlowArrows}
                onClick={() => handleToggleIndividualSwitch("T1'")}
              />
              {/* T4' */}
              <RenderSwitch
                x={430}
                y={305}
                name={b2s4Type === 'thyristor' ? "T4'" : "D4'"}
                isOn={isB2T4On}
                isThyristor={b2s4Type === 'thyristor'}
                hasGatePulse={instantaneous.gatePulseB2T3T4 && b2s4Type === 'thyristor'}
                direction="down"
                showFlowArrows={showFlowArrows}
                onClick={() => handleToggleIndividualSwitch("T4'")}
              />
              {/* T3' */}
              <RenderSwitch
                x={530}
                y={125}
                name={b2s3Type === 'thyristor' ? "T3'" : "D3'"}
                isOn={isB2T3On}
                isThyristor={b2s3Type === 'thyristor'}
                hasGatePulse={instantaneous.gatePulseB2T3T4 && b2s3Type === 'thyristor'}
                direction="down"
                showFlowArrows={showFlowArrows}
                onClick={() => handleToggleIndividualSwitch("T3'")}
              />
              {/* T2' */}
              <RenderSwitch
                x={530}
                y={305}
                name={b2s2Type === 'thyristor' ? "T2'" : "D2'"}
                isOn={isB2T2On}
                isThyristor={b2s2Type === 'thyristor'}
                hasGatePulse={instantaneous.gatePulseB2T1T2 && b2s2Type === 'thyristor'}
                direction="down"
                showFlowArrows={showFlowArrows}
                onClick={() => handleToggleIndividualSwitch("T2'")}
              />
            </g>
          )}

          {/* ===================== FREEWHEELING DIODE (INTERACTIVE) ===================== */}
          <g
            transform={`translate(${isDual ? 610 : 440}, 220)`}
            onClick={() => onUpdateParams({ showFreewheelingDiode: !showFreewheelingDiode })}
            className="cursor-pointer group select-none"
          >
            {/* Connection dots on DC rails */}
            {showFreewheelingDiode && (
              <>
                <circle cx="0" cy="-140" r="4" className="fill-slate-900 dark:fill-slate-200" />
                <circle cx="0" cy="140" r="4" className="fill-slate-900 dark:fill-slate-200" />
              </>
            )}

            {/* Vertical Freewheeling Diode branch connection line */}
            <line
              x1="0"
              y1="-140"
              x2="0"
              y2="140"
              stroke={showFreewheelingDiode ? (isDfwOn ? '#d97706' : '#475569') : '#cbd5e1'}
              strokeWidth={showFreewheelingDiode ? (isDfwOn ? '3.5' : '2') : '1.5'}
              strokeDasharray={showFreewheelingDiode ? (isDfwOn ? '8 6' : 'none') : '4 4'}
              className={showFreewheelingDiode && isDfwOn ? 'flow-reverse' : ''}
            />

            {/* Flow Chevrons through Freewheeling Diode branch */}
            {showFlowArrows && showFreewheelingDiode && isDfwOn && (
              <>
                <FlowChevron x={0} y={65} dir="up" color="#d97706" size={8} />
                <FlowChevron x={0} y={-65} dir="up" color="#d97706" size={8} />
              </>
            )}

            {/* Diode component */}
            <g
              opacity={showFreewheelingDiode ? 1 : 0.4}
              filter={showFreewheelingDiode && isDfwOn ? 'url(#glow-emerald)' : undefined}
              className="transition-all"
            >
              <RenderSwitch
                x={0}
                y={0}
                name="D_FW"
                isOn={showFreewheelingDiode && isDfwOn}
                isThyristor={false}
                hasGatePulse={false}
                direction="up"
                showFlowArrows={showFlowArrows}
              />
            </g>

            {/* Interactive Toggle Badge / Button */}
            {showFreewheelingDiode ? (
              <g transform="translate(0, 56)">
                <rect
                  x="-65"
                  y="0"
                  width="130"
                  height="26"
                  rx="6"
                  className={`transition-all ${
                    isDfwOn
                      ? 'fill-emerald-100 stroke-emerald-600'
                      : 'fill-slate-100 stroke-slate-300 group-hover:fill-red-50 group-hover:stroke-red-300'
                  }`}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="16"
                  textAnchor="middle"
                  className={`text-[9.5px] font-mono font-bold ${
                    isDfwOn ? 'fill-emerald-800' : 'fill-slate-600 group-hover:fill-red-700'
                  }`}
                >
                  {isDfwOn ? '⚡ D_FW FREEWHEELING' : '✓ D_FW (Click to Remove)'}
                </text>
              </g>
            ) : (
              <g transform="translate(0, 52)">
                <rect
                  x="-72"
                  y="0"
                  width="144"
                  height="28"
                  rx="7"
                  className="fill-blue-50 stroke-blue-400 group-hover:fill-blue-600 group-hover:stroke-blue-700 transition-colors shadow-2xs"
                  strokeWidth="1.5"
                />
                <text
                  x="0"
                  y="18"
                  textAnchor="middle"
                  className="text-[9.5px] font-mono font-bold fill-blue-700 group-hover:fill-white transition-colors"
                >
                  + ADD FREEWHEELING DIODE
                </text>
              </g>
            )}

            {/* Top Branch Label */}
            <text
              x="0"
              y="-150"
              textAnchor="middle"
              className={`text-[9px] font-mono font-semibold ${
                showFreewheelingDiode ? (isDfwOn ? 'fill-emerald-700' : 'fill-slate-500') : 'fill-slate-400'
              }`}
            >
              {showFreewheelingDiode ? (isDfwOn ? '⚡ D_FW Loop' : 'D_FW Branch') : 'Diode Branch (OFF)'}
            </text>
          </g>

          {/* ===================== LOAD BRANCH (CLICKABLE TO SWITCH LOAD TYPE) ===================== */}
          <g
            transform={`translate(${isDual ? 740 : 590}, 220)`}
            onClick={() => {
              const nextLoad: Record<LoadType, LoadType> = {
                R: 'RL',
                RL: 'RLE',
                RLE: 'R',
              };
              onUpdateParams({ loadType: nextLoad[loadType] });
            }}
            className="cursor-pointer group select-none"
          >
            {/* Load vertical wire connection */}
            <line
              x1="0"
              y1="-140"
              x2="0"
              y2="140"
              stroke={Math.abs(io) > 0.05 ? '#059669' : '#94a3b8'}
              strokeWidth={Math.abs(io) > 0.05 ? '3.5' : '2'}
              strokeDasharray={Math.abs(io) > 0.05 ? '8 6' : 'none'}
              className={Math.abs(io) > 0.05 ? 'flow-active' : ''}
            />

            {/* Directional Flow Chevrons inside Load branch */}
            {showFlowArrows && Math.abs(io) > 0.05 && (
              <>
                <FlowChevron x={0} y={-80} dir="down" color="#059669" size={8} />
                <FlowChevron x={0} y={-10} dir="down" color="#059669" size={8} />
                <FlowChevron x={0} y={95} dir="down" color="#059669" size={8} />
              </>
            )}

            {/* Load Enclosure Box with interactive hover ring */}
            <rect
              x="-64"
              y="-118"
              width="128"
              height="236"
              rx="14"
              className="fill-white dark:fill-slate-850 stroke-slate-300 dark:stroke-slate-700 group-hover:stroke-blue-500 dark:group-hover:stroke-blue-400 group-hover:shadow-xl transition-all"
              strokeWidth="2"
            />

            {/* Load Header Tab Bar: 3 Clickable Buttons [ R ] [ RL ] [ RLE ] */}
            <rect
              x="-56"
              y="-108"
              width="112"
              height="24"
              rx="6"
              className="fill-slate-100 dark:fill-slate-800 stroke-slate-200 dark:stroke-slate-700"
              strokeWidth="1"
            />
            {/* Tab: R */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onUpdateParams({ loadType: 'R' });
              }}
              className="cursor-pointer"
            >
              <rect
                x="-54"
                y="-106"
                width="34"
                height="20"
                rx="5"
                className={`transition-colors ${
                  loadType === 'R'
                    ? 'fill-blue-600'
                    : 'fill-transparent hover:fill-blue-100'
                }`}
              />
              <text
                x="-37"
                y="-92"
                textAnchor="middle"
                className={`text-[10px] font-mono font-bold ${
                  loadType === 'R' ? 'fill-white' : 'fill-slate-600 dark:fill-slate-300'
                }`}
              >
                R
              </text>
            </g>

            {/* Tab: RL */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onUpdateParams({ loadType: 'RL' });
              }}
              className="cursor-pointer"
            >
              <rect
                x="-17"
                y="-106"
                width="34"
                height="20"
                rx="5"
                className={`transition-colors ${
                  loadType === 'RL'
                    ? 'fill-blue-600'
                    : 'fill-transparent hover:fill-blue-100'
                }`}
              />
              <text
                x="0"
                y="-92"
                textAnchor="middle"
                className={`text-[10px] font-mono font-bold ${
                  loadType === 'RL' ? 'fill-white' : 'fill-slate-600 dark:fill-slate-300'
                }`}
              >
                RL
              </text>
            </g>

            {/* Tab: RLE */}
            <g
              onClick={(e) => {
                e.stopPropagation();
                onUpdateParams({ loadType: 'RLE' });
              }}
              className="cursor-pointer"
            >
              <rect
                x="20"
                y="-106"
                width="34"
                height="20"
                rx="5"
                className={`transition-colors ${
                  loadType === 'RLE'
                    ? 'fill-blue-600'
                    : 'fill-transparent hover:fill-blue-100'
                }`}
              />
              <text
                x="37"
                y="-92"
                textAnchor="middle"
                className={`text-[10px] font-mono font-bold ${
                  loadType === 'RLE' ? 'fill-white' : 'fill-slate-600 dark:fill-slate-300'
                }`}
              >
                RLE
              </text>
            </g>

            {/* Resistor symbol */}
            <g
              transform="translate(0, -42)"
              onClick={(e) => {
                e.stopPropagation();
                onUpdateParams({ loadType: 'R' });
              }}
              className="cursor-pointer"
            >
              <path
                d="M -12 -12 L 12 -8 L -12 -4 L 12 0 L -12 4 L 12 8 L 0 12"
                fill="none"
                stroke="#d97706"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <text x="0" y="24" textAnchor="middle" className="text-[10px] font-mono fill-amber-600 dark:fill-amber-400 font-semibold">
                R = {resistance} Ω
              </text>
            </g>

            {/* Inductor symbol (if RL or RLE) */}
            {loadType === 'RL' || loadType === 'RLE' ? (
              <g
                transform="translate(0, 16)"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateParams({ loadType: loadType === 'RL' ? 'R' : 'RL' });
                }}
                className="cursor-pointer"
              >
                <path
                  d="M 0 -18 C -16 -18, -16 -6, 0 -6 C -16 -6, -16 6, 0 6 C -16 6, -16 18, 0 18"
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="2.5"
                />
                <text x="0" y="32" textAnchor="middle" className="text-[10px] font-mono fill-blue-600 dark:fill-blue-400 font-semibold">
                  L = {(inductance * 1000).toFixed(0)} mH
                </text>
              </g>
            ) : (
              <g
                transform="translate(0, 16)"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateParams({ loadType: 'RL' });
                }}
                className="cursor-pointer group/ind"
              >
                <path
                  d="M 0 -14 C -12 -14, -12 -4, 0 -4 C -12 -4, -12 6, 0 6 C -12 6, -12 14, 0 14"
                  fill="none"
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  strokeDasharray="3 3"
                />
                <rect
                  x="-38"
                  y="18"
                  width="76"
                  height="16"
                  rx="4"
                  className="fill-blue-50 stroke-blue-200 group-hover/ind:fill-blue-600 transition-colors"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="29"
                  textAnchor="middle"
                  className="text-[8.5px] font-mono font-bold fill-blue-700 group-hover/ind:fill-white transition-colors"
                >
                  + Add Inductor L
                </text>
              </g>
            )}

            {/* DC Back-EMF battery symbol (if RLE) */}
            {loadType === 'RLE' ? (
              <g
                transform="translate(0, 68)"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateParams({ loadType: 'RL' });
                }}
                className="cursor-pointer"
              >
                <line x1="-14" y1="-5" x2="14" y2="-5" stroke="#dc2626" strokeWidth="3" />
                <line x1="-8" y1="5" x2="8" y2="5" stroke="#dc2626" strokeWidth="2" />
                <text x="20" y="-2" className="text-[9px] fill-red-600 font-bold">+</text>
                <text x="14" y="8" className="text-[9px] fill-red-600 font-bold">-</text>
                <text x="0" y="22" textAnchor="middle" className="text-[9px] font-mono fill-red-600 font-semibold">
                  E = {backEmf} V
                </text>
              </g>
            ) : loadType === 'RL' ? (
              <g
                transform="translate(0, 66)"
                onClick={(e) => {
                  e.stopPropagation();
                  onUpdateParams({ loadType: 'RLE' });
                }}
                className="cursor-pointer group/emf"
              >
                <rect
                  x="-40"
                  y="2"
                  width="80"
                  height="16"
                  rx="4"
                  className="fill-red-50 stroke-red-200 group-hover/emf:fill-red-600 transition-colors"
                  strokeWidth="1"
                />
                <text
                  x="0"
                  y="13"
                  textAnchor="middle"
                  className="text-[8.5px] font-mono font-bold fill-red-700 group-hover/emf:fill-white transition-colors"
                >
                  + Add DC Source E
                </text>
              </g>
            ) : null}

            {/* Load Voltage terminals */}
            <g transform="translate(0, -126)">
              <rect
                x="-26"
                y="-9"
                width="52"
                height="18"
                rx="4"
                fill="#ecfdf5"
                stroke="#10b981"
                strokeWidth="1.2"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                className="text-[9.5px] font-mono font-bold fill-emerald-800 select-none"
              >
                + Vo
              </text>
            </g>
            <g transform="translate(0, 126)">
              <rect
                x="-26"
                y="-9"
                width="52"
                height="18"
                rx="4"
                className="fill-slate-50 dark:fill-slate-800 stroke-slate-400 dark:stroke-slate-600"
                strokeWidth="1.2"
              />
              <text
                x="0"
                y="3.5"
                textAnchor="middle"
                className="text-[9.5px] font-mono font-bold fill-slate-700 dark:fill-slate-300 select-none"
              >
                − Vo
              </text>
            </g>
          </g>

          {/* Node Connection Dots */}
          <circle cx={isDual ? 180 : 200} cy="80" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 290 : 320} cy="80" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 180 : 200} cy="360" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 290 : 320} cy="360" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 740 : 590} cy="80" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 740 : 590} cy="360" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 180 : 200} cy="180" r="4" className="fill-slate-900 dark:fill-slate-200" />
          <circle cx={isDual ? 290 : 320} cy="260" r="4" className="fill-slate-900 dark:fill-slate-200" />
        </svg>

        {/* Legend / Quick Help Footer */}
        <div className="absolute bottom-2 left-4 right-4 flex items-center justify-between text-[11px] text-slate-500 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
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
                <span>Gate Pulse</span>
              </span>
            )}
          </div>
          <div className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 font-mono">
            ⚡ Click any switch (T1–T4) in circuit to toggle Thyristor ↔ Diode
          </div>
        </div>
      </div>
    </div>
  );
};

interface FlowChevronProps {
  x: number;
  y: number;
  dir: 'right' | 'left' | 'up' | 'down';
  color?: string;
  size?: number;
  active?: boolean;
}

const FlowChevron: React.FC<FlowChevronProps> = ({
  x,
  y,
  dir,
  color = '#059669',
  size = 7,
  active = true,
}) => {
  if (!active) return null;
  const h = size;
  const w = size * 0.8;
  const pts =
    dir === 'right'
      ? `${-w},${-h / 2} ${w},0 ${-w},${h / 2}`
      : dir === 'left'
      ? `${w},${-h / 2} ${-w},0 ${w},${h / 2}`
      : dir === 'up'
      ? `${-h / 2},${w} 0,${-w} ${h / 2},${w}`
      : `${-h / 2},${-w} 0,${w} ${h / 2},${-w}`;

  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      <polygon
        points={pts}
        fill={color}
        stroke="#ffffff"
        strokeWidth="1"
        className="drop-shadow-xs"
      />
    </g>
  );
};

interface RenderSwitchProps {
  x: number;
  y: number;
  name: string;
  sublabel?: string;
  isOn: boolean;
  isThyristor: boolean;
  hasGatePulse: boolean;
  direction?: 'up' | 'down';
  currentVal?: number;
  showFlowArrows?: boolean;
  onClick?: () => void;
}

const RenderSwitch: React.FC<RenderSwitchProps> = ({
  x,
  y,
  name,
  isOn,
  isThyristor,
  hasGatePulse,
  direction = 'up',
  showFlowArrows = true,
  onClick,
}) => {
  const isUp = direction === 'up';

  // Triangle and Cathode coordinates
  const trianglePoints = isUp ? '0,-8 -11,8 11,8' : '0,8 -11,-8 11,-8';
  const cathodeBarY = isUp ? -8 : 8;
  const anodeLineY1 = isUp ? 26 : -26;
  const anodeLineY2 = isUp ? 8 : -8;
  const cathodeLineY1 = isUp ? -8 : 8;
  const cathodeLineY2 = isUp ? -26 : 26;

  // Gate terminal coordinates
  const gateStartY = cathodeBarY;
  const gateKneeY = isUp ? -16 : 16;
  const gateEndX = -22;
  const gateEndY = gateKneeY;

  return (
    <g
      transform={`translate(${x}, ${y})`}
      onClick={onClick}
      className={onClick ? 'cursor-pointer group/sw select-none' : undefined}
    >
      {/* Title tooltip for user interaction */}
      <title>{`${name} (${isThyristor ? 'Thyristor / SCR' : 'Diode'}) - Click to toggle`}</title>

      {/* Outer bounding glowing box when active */}
      <rect
        x="-28"
        y="-22"
        width="56"
        height="44"
        rx="7"
        fill={isOn ? '#059669' : '#1e293b'}
        fillOpacity={isOn ? 0.15 : 0.04}
        stroke={isOn ? '#10b981' : '#64748b'}
        strokeWidth={isOn ? '2.5' : '1.5'}
        className={onClick ? 'group-hover/sw:stroke-blue-500 transition-all duration-150' : 'transition-all duration-150'}
        filter={isOn ? 'url(#glow-emerald)' : undefined}
      />

      {/* Through-lead: Anode terminal line */}
      <line
        x1="0"
        y1={anodeLineY1}
        x2="0"
        y2={anodeLineY2}
        className={isOn ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-slate-600 dark:stroke-slate-400'}
        strokeWidth="2"
      />

      {/* Through-lead: Cathode terminal line */}
      <line
        x1="0"
        y1={cathodeLineY1}
        x2="0"
        y2={cathodeLineY2}
        className={isOn ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-slate-600 dark:stroke-slate-400'}
        strokeWidth="2"
      />

      {/* Conduction beam when active */}
      {isOn && (
        <line
          x1="0"
          y1={anodeLineY1}
          x2="0"
          y2={cathodeLineY2}
          stroke="#10b981"
          strokeWidth="3.5"
          filter="url(#glow-emerald)"
          opacity="0.8"
        />
      )}

      {/* Triangle Body (Anode -> Cathode direction) */}
      <polygon
        points={trianglePoints}
        className={isOn ? 'fill-emerald-600 dark:fill-emerald-500 stroke-emerald-700 dark:stroke-emerald-300' : 'fill-slate-750 dark:fill-slate-300 stroke-slate-900 dark:stroke-slate-100'}
        strokeWidth="1.5"
      />

      {/* Directional Flow Chevron inside switch body when conducting */}
      {isOn && showFlowArrows && (
        <polygon
          points={isUp ? "-4,3 0,-3 4,3" : "-4,-3 0,3 4,-3"}
          fill="#ffffff"
          className="drop-shadow-xs"
        />
      )}

      {/* Cathode Crossbar (perpendicular to terminal) */}
      <line
        x1="-12"
        y1={cathodeBarY}
        x2="12"
        y2={cathodeBarY}
        className={isOn ? 'stroke-emerald-700 dark:stroke-emerald-300' : 'stroke-slate-900 dark:stroke-slate-100'}
        strokeWidth="2.5"
        strokeLinecap="round"
      />

      {/* Thyristor Gate Terminal */}
      {isThyristor && (
        <g>
          {/* Gate lead path */}
          <path
            d={`M 0,${gateStartY} L -8,${gateKneeY} L ${gateEndX},${gateEndY}`}
            fill="none"
            className={hasGatePulse ? 'stroke-amber-500' : isOn ? 'stroke-emerald-600 dark:stroke-emerald-400' : 'stroke-slate-900 dark:stroke-slate-200'}
            strokeWidth={hasGatePulse ? '2.5' : '1.8'}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Gate terminal circle */}
          <circle
            cx={gateEndX}
            cy={gateEndY}
            r="2.5"
            className={hasGatePulse ? 'fill-amber-500' : 'fill-slate-900 dark:fill-slate-200'}
          />

          {/* Gate letter 'G' */}
          <text
            x={gateEndX - 3}
            y={gateEndY + 3}
            textAnchor="end"
            className={`text-[8.5px] font-mono font-bold select-none ${
              hasGatePulse ? 'fill-amber-500 dark:fill-amber-400' : 'fill-slate-500 dark:fill-slate-400'
            }`}
          >
            G
          </text>

          {/* Gate firing trigger pulse glow */}
          {hasGatePulse && (
            <circle
              cx={gateEndX}
              cy={gateEndY}
              r="5"
              fill="none"
              stroke="#f59e0b"
              strokeWidth="2"
              className="animate-ping"
            />
          )}
        </g>
      )}

      {/* Integrated Combined Switch Badge at top */}
      <g transform="translate(0, -29)">
        <rect
          x="-24"
          y="-8"
          width="48"
          height="16"
          rx="4"
          fill={isOn ? '#dcfce7' : '#f8fafc'}
          stroke={isOn ? '#10b981' : '#cbd5e1'}
          strokeWidth="1"
          className="transition-colors group-hover/sw:border-blue-400"
        />
        <text
          x="0"
          y="3.5"
          textAnchor="middle"
          className={`text-[9.5px] font-bold font-mono select-none ${
            isOn ? 'fill-emerald-800' : 'fill-slate-600'
          }`}
        >
          {name} {isOn ? '• ON' : ''}
        </text>
      </g>
    </g>
  );
};
