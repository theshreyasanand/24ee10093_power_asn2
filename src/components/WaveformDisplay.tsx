import React, { useRef, useEffect, useState, useMemo } from 'react';
import {
  ConverterParameters,
  InstantaneousValues,
  ConverterMetrics,
} from '../types/rectifier';
import {
  generateWaveformSamples,
  TWO_PI,
  PI,
} from '../utils/physics';
import {
  Maximize2,
  Minimize2,
  Grid,
  Layers,
  Sliders,
  BarChart2,
  Compass,
} from 'lucide-react';

export type WaveformViewMode = 'superimposed' | 'channels' | 'harmonics' | 'four-quadrant';

interface WaveformDisplayProps {
  params: ConverterParameters;
  instantaneous: InstantaneousValues;
  metrics: ConverterMetrics;
  currentAngle: number; // in radians
  onAngleChange: (angleRad: number) => void;
  viewMode: WaveformViewMode;
  onChangeViewMode: (mode: WaveformViewMode) => void;
}

export const WaveformDisplay: React.FC<WaveformDisplayProps> = ({
  params,
  instantaneous,
  metrics,
  currentAngle,
  onAngleChange,
  viewMode,
  onChangeViewMode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [cycleSpan, setCycleSpan] = useState<1 | 2>(1);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVAvg, setShowVAvg] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  // Precompute waveform samples
  const samples = useMemo(() => {
    return generateWaveformSamples(params, cycleSpan, cycleSpan * 360);
  }, [params, cycleSpan]);

  // Handle canvas scrubbing
  const handlePointerScrub = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const paddingLeft = 55;
    const paddingRight = 25;
    const plotWidth = rect.width - paddingLeft - paddingRight;

    if (plotWidth <= 0) return;
    const ratio = Math.max(0, Math.min(1, (x - paddingLeft) / plotWidth));
    const targetAngle = ratio * (cycleSpan * TWO_PI);
    onAngleChange(targetAngle);
  };

  // Render waveforms on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high DPI display
    const dpr = window.devicePixelRatio || 1;
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);

    // Clear background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 25, right: 35, bottom: 50, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const totalAngle = cycleSpan * TWO_PI;

    // Determine scale bounds
    const maxV = Math.max(params.vPeak * 1.15, 150);
    const maxI = Math.max(
      metrics.iRms * 2.2,
      (params.vPeak / Math.max(params.resistance, 0.5)) * 1.15,
      10
    );

    if (viewMode === 'superimposed') {
      // Split canvas into 2 sections: Voltage (top 50%) and Current (bottom 50%)
      const headerH = 20;
      const paneHeight = (height - padding.top - padding.bottom - headerH) / 2;

      const voltTop = padding.top;
      const voltBottom = voltTop + paneHeight;
      const currTop = voltBottom + headerH;
      const currBottom = currTop + paneHeight;

      // 1. Draw Grids
      if (showGrid) {
        drawGrid(ctx, padding.left, voltTop, plotWidth, paneHeight, cycleSpan);
        drawGrid(ctx, padding.left, currTop, plotWidth, paneHeight, cycleSpan);
      }

      // 2. Draw Zero Lines
      const voltZeroY = voltTop + paneHeight / 2;
      const currZeroY = currTop + paneHeight / 2;

      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([]);
      // Volt zero line
      ctx.beginPath();
      ctx.moveTo(padding.left, voltZeroY);
      ctx.lineTo(padding.left + plotWidth, voltZeroY);
      ctx.stroke();

      // Current zero line
      ctx.beginPath();
      ctx.moveTo(padding.left, currZeroY);
      ctx.lineTo(padding.left + plotWidth, currZeroY);
      ctx.stroke();

      // Pane Titles & Legends
      // Voltage Pane Title
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('VOLTAGE WAVEFORMS (vs & vo Superimposed)', padding.left, voltTop - 8);

      // Current Pane Title
      ctx.fillText('CURRENT WAVEFORMS (is & io Superimposed)', padding.left, currTop - 8);

      // Y-axis labels for Voltage
      ctx.font = '500 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'right';
      ctx.fillText(`+${maxV.toFixed(0)}V`, padding.left - 8, voltTop + 10);
      ctx.fillText('0V', padding.left - 8, voltZeroY + 3);
      ctx.fillText(`-${maxV.toFixed(0)}V`, padding.left - 8, voltBottom - 2);

      // Y-axis labels for Current
      ctx.fillText(`+${maxI.toFixed(1)}A`, padding.left - 8, currTop + 10);
      ctx.fillText('0A', padding.left - 8, currZeroY + 3);
      ctx.fillText(`-${maxI.toFixed(1)}A`, padding.left - 8, currBottom - 2);

      // Draw V_avg dashed line if enabled
      if (showVAvg) {
        const vAvgY = voltZeroY - (metrics.vDcAvg / maxV) * (paneHeight / 2);
        ctx.strokeStyle = '#8b5cf6';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(padding.left, vAvgY);
        ctx.lineTo(padding.left + plotWidth, vAvgY);
        ctx.stroke();

        ctx.fillStyle = '#7c3aed';
        ctx.font = '600 10px "JetBrains Mono", monospace';
        ctx.textAlign = 'left';
        ctx.fillText(`V_dc = ${metrics.vDcAvg.toFixed(1)}V`, padding.left + plotWidth - 95, vAvgY - 4);
      }

      // Draw Curves
      // a) Input Voltage vs (Dashed Sky/Blue line)
      drawCurve(
        ctx,
        samples,
        padding.left,
        plotWidth,
        totalAngle,
        (s) => voltZeroY - (s.vs / maxV) * (paneHeight / 2),
        '#2563eb',
        1.5,
        [4, 3]
      );

      // b) Output Voltage vo (Solid Emerald line)
      drawCurve(
        ctx,
        samples,
        padding.left,
        plotWidth,
        totalAngle,
        (s) => voltZeroY - (s.vo / maxV) * (paneHeight / 2),
        '#059669',
        2.5,
        []
      );

      // In double bridge: draw Bridge 2 output if dual
      if (params.topology === 'double-bridge') {
        drawCurve(
          ctx,
          samples,
          padding.left,
          plotWidth,
          totalAngle,
          (s) => voltZeroY - (s.vBridge2 / maxV) * (paneHeight / 2),
          '#9333ea',
          1.5,
          [2, 3]
        );
      }

      // c) Input Current is (Solid Cyan/Sky line)
      drawCurve(
        ctx,
        samples,
        padding.left,
        plotWidth,
        totalAngle,
        (s) => currZeroY - (s.is / maxI) * (paneHeight / 2),
        '#0284c7',
        2,
        []
      );

      // d) Output Current io (Solid Amber/Orange line)
      drawCurve(
        ctx,
        samples,
        padding.left,
        plotWidth,
        totalAngle,
        (s) => currZeroY - (s.io / maxI) * (paneHeight / 2),
        '#d97706',
        2.5,
        []
      );

      // 3. Bottom Angle / Time X-Axis Ticks
      drawTimeAxis(ctx, padding.left, currBottom, plotWidth, cycleSpan);

      // 4. Live Cursor tracking currentAngle
      const normCursorAngle = currentAngle % totalAngle;
      const cursorX = padding.left + (normCursorAngle / totalAngle) * plotWidth;

      // Draw Cursor Line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorX, padding.top - 10);
      ctx.lineTo(cursorX, currBottom + 25);
      ctx.stroke();
      ctx.setLineDash([]);

      // Cursor angle tag badge
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(cursorX, padding.top - 10, 4, 0, TWO_PI);
      ctx.fill();

      // Readout box at cursor top
      const angleDeg = (normCursorAngle * 180 / PI).toFixed(1);
      ctx.font = '600 10px "JetBrains Mono", monospace';
      ctx.fillStyle = '#dc2626';
      ctx.textAlign = 'center';
      ctx.fillText(`ωt = ${angleDeg}°`, cursorX, padding.top - 16);

      // Operating point dots on the curves
      const currentInstVo = instantaneous.vo;
      const currentInstVs = instantaneous.vs;
      const currentInstIo = instantaneous.io;
      const currentInstIs = instantaneous.is;

      const ptVoY = voltZeroY - (currentInstVo / maxV) * (paneHeight / 2);
      const ptVsY = voltZeroY - (currentInstVs / maxV) * (paneHeight / 2);
      const ptIoY = currZeroY - (currentInstIo / maxI) * (paneHeight / 2);
      const ptIsY = currZeroY - (currentInstIs / maxI) * (paneHeight / 2);

      drawDot(ctx, cursorX, ptVoY, '#059669');
      drawDot(ctx, cursorX, ptVsY, '#2563eb');
      drawDot(ctx, cursorX, ptIoY, '#d97706');
      drawDot(ctx, cursorX, ptIsY, '#0284c7');
    } else if (viewMode === 'channels') {
      // 4 Separate Oscilloscope Channels: vs, is, vo, io
      const chHeight = (height - padding.top - padding.bottom) / 4;
      const channels = [
        { label: 'CH1: vs (Input Signal)', unit: 'V', maxVal: maxV, color: '#2563eb', getVal: (s: InstantaneousValues) => s.vs },
        { label: 'CH2: is (Input Current)', unit: 'A', maxVal: maxI, color: '#0284c7', getVal: (s: InstantaneousValues) => s.is },
        { label: 'CH3: vo (Output Voltage)', unit: 'V', maxVal: maxV, color: '#059669', getVal: (s: InstantaneousValues) => s.vo },
        { label: 'CH4: io (Output Current)', unit: 'A', maxVal: maxI, color: '#d97706', getVal: (s: InstantaneousValues) => s.io },
      ];

      channels.forEach((ch, idx) => {
        const topY = padding.top + idx * chHeight;
        const zeroY = topY + chHeight / 2;

        if (showGrid) {
          drawGrid(ctx, padding.left, topY, plotWidth, chHeight, cycleSpan);
        }

        // Zero line
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(padding.left, zeroY);
        ctx.lineTo(padding.left + plotWidth, zeroY);
        ctx.stroke();

        // Channel label
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = ch.color;
        ctx.textAlign = 'left';
        ctx.fillText(ch.label, padding.left + 8, topY + 14);

        // Y-axis tick
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.fillText(`+${ch.maxVal.toFixed(0)}${ch.unit}`, padding.left - 6, topY + 12);
        ctx.fillText(`0${ch.unit}`, padding.left - 6, zeroY + 3);
        ctx.fillText(`-${ch.maxVal.toFixed(0)}${ch.unit}`, padding.left - 6, topY + chHeight - 2);

        // Curve
        drawCurve(
          ctx,
          samples,
          padding.left,
          plotWidth,
          totalAngle,
          (s) => zeroY - (ch.getVal(s) / ch.maxVal) * (chHeight * 0.44),
          ch.color,
          2.2,
          []
        );

        // Dot at cursor
        const normCursorAngle = currentAngle % totalAngle;
        const cursorX = padding.left + (normCursorAngle / totalAngle) * plotWidth;
        const currVal = ch.getVal(instantaneous);
        const curY = zeroY - (currVal / ch.maxVal) * (chHeight * 0.44);
        drawDot(ctx, cursorX, curY, ch.color);
      });

      // Bottom axis
      drawTimeAxis(ctx, padding.left, height - padding.bottom, plotWidth, cycleSpan);

      // Cursor line across all channels
      const normCursorAngle = currentAngle % totalAngle;
      const cursorX = padding.left + (normCursorAngle / totalAngle) * plotWidth;
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorX, padding.top);
      ctx.lineTo(cursorX, height - padding.bottom);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }, [samples, currentAngle, viewMode, cycleSpan, showGrid, showVAvg, params, metrics, instantaneous]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full'
      }`}
    >
      {/* Waveform Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 bg-slate-50/80">
        {/* View Mode Tabs */}
        <div className="flex items-center gap-1 bg-slate-200/70 p-1 rounded-lg">
          <button
            onClick={() => onChangeViewMode('superimposed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'superimposed'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Superimposed
          </button>
          <button
            onClick={() => onChangeViewMode('channels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'channels'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            Oscilloscope Channels
          </button>
          <button
            onClick={() => onChangeViewMode('harmonics')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
              viewMode === 'harmonics'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Harmonics (FFT)
          </button>
          {params.topology === 'double-bridge' && (
            <button
              onClick={() => onChangeViewMode('four-quadrant')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'four-quadrant'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              4-Quadrant V-I
            </button>
          )}
        </div>

        {/* Oscilloscope Settings */}
        <div className="flex items-center gap-2">
          {/* Cycle selector */}
          <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white text-xs">
            <button
              onClick={() => setCycleSpan(1)}
              className={`px-2.5 py-1 font-mono font-medium transition-colors ${
                cycleSpan === 1 ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              1 Cycle (360°)
            </button>
            <button
              onClick={() => setCycleSpan(2)}
              className={`px-2.5 py-1 font-mono font-medium transition-colors ${
                cycleSpan === 2 ? 'bg-slate-800 text-white' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              2 Cycles (720°)
            </button>
          </div>

          {/* Grid toggle */}
          <button
            onClick={() => setShowGrid(!showGrid)}
            className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              showGrid
                ? 'bg-blue-50 text-blue-700 border-blue-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Grid"
          >
            <Grid className="w-3 h-3" />
            Grid
          </button>

          {/* V_avg line toggle */}
          <button
            onClick={() => setShowVAvg(!showVAvg)}
            className={`px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors ${
              showVAvg
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
            }`}
            title="Toggle Average Line"
          >
            V_avg
          </button>

          {/* Fullscreen toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 rounded-md transition-colors"
            title={isFullScreen ? 'Exit Full Screen' : 'Full Screen'}
          >
            {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      {(viewMode === 'superimposed' || viewMode === 'channels') && (
        <div className="relative flex-1 min-h-[380px] w-full bg-white select-none cursor-crosshair">
          <canvas
            ref={canvasRef}
            className="w-full h-full block"
            onPointerDown={(e) => {
              setIsDragging(true);
              handlePointerScrub(e);
            }}
            onPointerMove={(e) => {
              if (isDragging) handlePointerScrub(e);
            }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
          />

          {/* Waveform Channels Legend Floating Bar */}
          <div className="absolute top-2.5 right-4 flex items-center gap-3 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-lg border border-slate-200 shadow-xs text-xs font-mono">
            <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
              <span className="w-3 h-0.5 bg-blue-600 border-t border-dashed" />
              vs: {instantaneous.vs.toFixed(1)}V
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <span className="w-3 h-1 bg-emerald-600 rounded-full" />
              vo: {instantaneous.vo.toFixed(1)}V
            </span>
            <span className="flex items-center gap-1.5 text-cyan-600 font-semibold">
              <span className="w-3 h-1 bg-cyan-600 rounded-full" />
              is: {instantaneous.is.toFixed(2)}A
            </span>
            <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
              <span className="w-3 h-1 bg-amber-600 rounded-full" />
              io: {instantaneous.io.toFixed(2)}A
            </span>
          </div>
        </div>
      )}

      {/* Conduction Timeline Ribbon */}
      <div className="border-t border-slate-200 bg-slate-50 px-5 py-2.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-mono font-medium">TRIGGER STATUS:</span>
          <div className="flex items-center gap-3">
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                instantaneous.gatePulseT1T2
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              Gate T1/T2: {instantaneous.gatePulseT1T2 ? 'PULSE' : 'WAIT'}
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold ${
                instantaneous.gatePulseT3T4
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : 'bg-slate-200 text-slate-500'
              }`}
            >
              Gate T3/T4: {instantaneous.gatePulseT3T4 ? 'PULSE' : 'WAIT'}
            </span>
          </div>
        </div>

        <div className="text-slate-500 font-mono">
          Scrub anywhere on waveform canvas to inspect angles
        </div>
      </div>
    </div>
  );
};

// Helper to draw clean grid
function drawGrid(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  cycles: number
) {
  ctx.strokeStyle = '#f1f5f9';
  ctx.lineWidth = 1;

  // Horizontal subdivisions (8 divisions)
  const rows = 8;
  for (let r = 0; r <= rows; r++) {
    const curY = y + (r * height) / rows;
    ctx.beginPath();
    ctx.moveTo(x, curY);
    ctx.lineTo(x + width, curY);
    ctx.stroke();
  }

  // Vertical subdivisions (every 45 or 90 degrees)
  const cols = cycles * 8;
  for (let c = 0; c <= cols; c++) {
    const curX = x + (c * width) / cols;
    ctx.beginPath();
    ctx.moveTo(curX, y);
    ctx.lineTo(curX, y + height);
    ctx.stroke();
  }
}

// Helper to draw clean time axis
function drawTimeAxis(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  cycles: number
) {
  const totalDeg = cycles * 360;
  const tickStep = 90;
  const numTicks = totalDeg / tickStep;

  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + width, y);
  ctx.stroke();

  ctx.font = '500 10px "JetBrains Mono", monospace';
  ctx.fillStyle = '#64748b';
  ctx.textAlign = 'center';

  for (let i = 0; i <= numTicks; i++) {
    const deg = i * tickStep;
    const curX = x + (i / numTicks) * width;

    // Tick line
    ctx.beginPath();
    ctx.moveTo(curX, y);
    ctx.lineTo(curX, y + 5);
    ctx.stroke();

    // Deg label
    ctx.fillText(`${deg}°`, curX, y + 16);
  }
}

// Helper to draw smooth curves
function drawCurve(
  ctx: CanvasRenderingContext2D,
  samples: InstantaneousValues[],
  startX: number,
  plotWidth: number,
  totalAngle: number,
  getY: (s: InstantaneousValues) => number,
  color: string,
  lineWidth: number,
  dash: number[]
) {
  if (samples.length === 0) return;

  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.setLineDash(dash);
  ctx.beginPath();

  for (let i = 0; i < samples.length; i++) {
    const s = samples[i];
    const x = startX + (s.omegaT / totalAngle) * plotWidth;
    const y = getY(s);

    if (i === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  }

  ctx.stroke();
  ctx.setLineDash([]);
}

// Helper to draw a cursor dot
function drawDot(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 4, 0, TWO_PI);
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}
