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
  ZoomIn,
  ZoomOut,
  RotateCcw,
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
  const [timeZoom, setTimeZoom] = useState<number>(1.0); // 0.5x (zoom out) to 4.0x (zoom in)
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showVAvg, setShowVAvg] = useState<boolean>(true);
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  // Listen for dark mode class changes on html to immediately redraw canvas
  const [isDarkTheme, setIsDarkTheme] = useState(() => {
    return typeof document !== 'undefined' && document.documentElement.classList.contains('dark');
  });

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDarkTheme(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const [visibleChannels, setVisibleChannels] = useState<{
    vs: boolean;
    is: boolean;
    vo: boolean;
    io: boolean;
    ig: boolean;
  }>({
    vs: true,
    is: true,
    vo: true,
    io: true,
    ig: true,
  });

  // Compute maximum cycles needed for waveform generation given zoom level
  const effectiveCycles = useMemo(() => {
    return Math.max(1, Math.ceil(cycleSpan / Math.min(1.0, timeZoom)));
  }, [cycleSpan, timeZoom]);

  // Precompute waveform samples spanning across effective cycles
  const samples = useMemo(() => {
    const numPoints = Math.max(720, effectiveCycles * 360);
    return generateWaveformSamples(params, effectiveCycles, numPoints);
  }, [params, effectiveCycles]);

  // Visible electrical angle span across the canvas width
  const totalAngle = (cycleSpan * TWO_PI) / timeZoom;

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
    const targetAngle = ratio * totalAngle;
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

    // Detect dark mode
    const isDark = document.documentElement.classList.contains('dark');

    // Clear background
    ctx.fillStyle = isDark ? '#0f172a' : '#ffffff';
    ctx.fillRect(0, 0, width, height);

    const padding = { top: 25, right: 35, bottom: 50, left: 60 };
    const plotWidth = width - padding.left - padding.right;
    const totalAngle = (cycleSpan * TWO_PI) / timeZoom;

    // Determine scale bounds
    const maxV = Math.max(params.vPeak * 1.15, 150);
    const maxI = Math.max(
      metrics.iRms * 2.2,
      (params.vPeak / Math.max(params.resistance, 0.5)) * 1.15,
      10
    );

    if (viewMode === 'superimposed') {
      const showGatePane = visibleChannels.ig;
      const headerH = 18;
      const gateH = showGatePane ? 56 : 0;
      const availableH = height - padding.top - padding.bottom - (showGatePane ? headerH * 2 : headerH) - gateH;
      const paneHeight = Math.max(60, availableH / 2);

      const voltTop = padding.top;
      const voltBottom = voltTop + paneHeight;
      const currTop = voltBottom + headerH;
      const currBottom = currTop + paneHeight;
      const gateTop = showGatePane ? currBottom + headerH : 0;
      const gateBottom = showGatePane ? gateTop + gateH : 0;

      // 1. Draw Grids
      if (showGrid) {
        drawGrid(ctx, padding.left, voltTop, plotWidth, paneHeight, totalAngle);
        drawGrid(ctx, padding.left, currTop, plotWidth, paneHeight, totalAngle);
        if (showGatePane) {
          drawGrid(ctx, padding.left, gateTop, plotWidth, gateH, totalAngle);
        }
      }

      // 2. Draw Zero Lines
      const voltZeroY = voltTop + paneHeight / 2;
      const currZeroY = currTop + paneHeight / 2;

      ctx.strokeStyle = isDark ? '#475569' : '#94a3b8';
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
      ctx.font = '600 11px Inter, sans-serif';
      ctx.fillStyle = '#1e293b';
      ctx.fillText('VOLTAGE WAVEFORMS (vs & vo Superimposed)', padding.left, voltTop - 7);
      ctx.fillText('CURRENT WAVEFORMS (is & io Superimposed)', padding.left, currTop - 7);

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
      if (visibleChannels.vs) {
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
      }

      // b) Output Voltage vo (Solid Emerald line)
      if (visibleChannels.vo) {
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
      }

      // In double bridge: draw Bridge 2 output if dual
      if (params.topology === 'double-bridge' && visibleChannels.vo) {
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
      if (visibleChannels.is) {
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
      }

      // d) Output Current io (Solid Amber/Orange line)
      if (visibleChannels.io) {
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
      }

      // e) GATE PULSES PANE (if visibleChannels.ig enabled)
      let curGateY = currBottom;
      if (showGatePane) {
        const gateZeroY = gateBottom - 7;
        const gatePeakY = gateTop + 14;

        // Zero line for gate pulses
        ctx.strokeStyle = '#cbd5e1';
        ctx.lineWidth = 1;
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.moveTo(padding.left, gateZeroY);
        ctx.lineTo(padding.left + plotWidth, gateZeroY);
        ctx.stroke();

        // Pane title
        ctx.font = '600 11px Inter, sans-serif';
        ctx.fillStyle = '#7c3aed';
        ctx.textAlign = 'left';
        const titleStr = params.topology === 'diode-bridge'
          ? 'GATE FIRING PULSES ig (Natural Commutation - Uncontrolled)'
          : `GATE FIRING PULSES ig (T1,T2 Fired @ α=${params.firingAngleAlpha}° | T3,T4 Fired @ π+α=${(180+params.firingAngleAlpha)%360}°)`;
        ctx.fillText(titleStr, padding.left, gateTop - 6);

        // Y-axis ticks for gate pulses
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        ctx.fillText('+5V', padding.left - 8, gatePeakY + 4);
        ctx.fillText('0V', padding.left - 8, gateZeroY + 3);

        if (params.topology === 'diode-bridge') {
          // Flat 0V line
          ctx.strokeStyle = '#a855f7';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(padding.left, gateZeroY);
          ctx.lineTo(padding.left + plotWidth, gateZeroY);
          ctx.stroke();

          ctx.font = 'italic 10px Inter, sans-serif';
          ctx.fillStyle = '#94a3b8';
          ctx.textAlign = 'center';
          ctx.fillText('Natural Commutation: Diodes conduct without gate trigger', padding.left + plotWidth / 2, (gateTop + gateBottom) / 2);
          curGateY = gateZeroY;
        } else {
          // Draw Gate pulses with filled rectangle areas and step stroke
          ctx.fillStyle = 'rgba(147, 51, 234, 0.22)';
          ctx.strokeStyle = '#9333ea';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(padding.left, gateZeroY);

          for (let i = 0; i < samples.length; i++) {
            const s = samples[i];
            const x = padding.left + (s.omegaT / totalAngle) * plotWidth;
            const isPulseActive = s.gatePulseT1T2 || s.gatePulseT3T4 || s.gatePulseB2T1T2 || s.gatePulseB2T3T4;
            const y = isPulseActive ? gatePeakY : gateZeroY;
            ctx.lineTo(x, y);
          }
          ctx.lineTo(padding.left + plotWidth, gateZeroY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // Gate trigger labels at pulse points
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#6b21a8';
          ctx.textAlign = 'center';
          const alphaRad = (params.firingAngleAlpha * PI) / 180;
          for (let c = 0; c < cycleSpan; c++) {
            const aX = padding.left + ((c * TWO_PI + alphaRad) / totalAngle) * plotWidth;
            const piAX = padding.left + ((c * TWO_PI + PI + alphaRad) / totalAngle) * plotWidth;

            if (aX >= padding.left && aX <= padding.left + plotWidth) {
              ctx.fillText('T1,T2 @ α', aX + 12, gatePeakY - 2);
            }
            if (piAX >= padding.left && piAX <= padding.left + plotWidth) {
              ctx.fillText('T3,T4 @ π+α', piAX + 14, gatePeakY - 2);
            }
          }

          const isInstPulse = instantaneous.gatePulseT1T2 || instantaneous.gatePulseT3T4 || instantaneous.gatePulseB2T1T2 || instantaneous.gatePulseB2T3T4;
          curGateY = isInstPulse ? gatePeakY : gateZeroY;
        }
      }

      // 3. Bottom Angle / Time X-Axis Ticks
      const axisY = showGatePane ? gateBottom : currBottom;
      drawTimeAxis(ctx, padding.left, axisY, plotWidth, cycleSpan);

      // 4. Live Cursor tracking currentAngle
      const normCursorAngle = currentAngle % totalAngle;
      const cursorX = padding.left + (normCursorAngle / totalAngle) * plotWidth;

      // Draw Cursor Line
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(cursorX, padding.top - 10);
      ctx.lineTo(cursorX, axisY + 25);
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

      if (visibleChannels.vo) drawDot(ctx, cursorX, ptVoY, '#059669');
      if (visibleChannels.vs) drawDot(ctx, cursorX, ptVsY, '#2563eb');
      if (visibleChannels.io) drawDot(ctx, cursorX, ptIoY, '#d97706');
      if (visibleChannels.is) drawDot(ctx, cursorX, ptIsY, '#0284c7');
      if (showGatePane) {
        drawDot(ctx, cursorX, curGateY, '#9333ea');
        const isPulseNow = instantaneous.gatePulseT1T2 || instantaneous.gatePulseT3T4 || instantaneous.gatePulseB2T1T2 || instantaneous.gatePulseB2T3T4;
        if (isPulseNow) {
          ctx.fillStyle = '#7c3aed';
          ctx.font = '700 9px "JetBrains Mono", monospace';
          ctx.textAlign = 'left';
          ctx.fillText('⚡ PULSE', cursorX + 8, curGateY + 2);
        }
      }
    } else if (viewMode === 'channels') {
      // All Separate Waveforms (5 Channels: vs, is, vo, io, ig)
      const allChannels = [
        { id: 'vs' as const, key: 'vs', label: 'CH1: vs (Input Signal)', unit: 'V', maxVal: maxV, color: '#2563eb', isPulse: false, getVal: (s: InstantaneousValues) => s.vs },
        { id: 'is' as const, key: 'is', label: 'CH2: is (Input Current)', unit: 'A', maxVal: maxI, color: '#0284c7', isPulse: false, getVal: (s: InstantaneousValues) => s.is },
        { id: 'vo' as const, key: 'vo', label: 'CH3: vo (Output Voltage)', unit: 'V', maxVal: maxV, color: '#059669', isPulse: false, getVal: (s: InstantaneousValues) => s.vo },
        { id: 'io' as const, key: 'io', label: 'CH4: io (Output Current)', unit: 'A', maxVal: maxI, color: '#d97706', isPulse: false, getVal: (s: InstantaneousValues) => s.io },
        {
          id: 'ig' as const,
          key: 'ig',
          label: params.topology === 'diode-bridge'
            ? 'CH5: ig (Uncontrolled - Natural Commutation)'
            : `CH5: ig (Gate Trigger Pulses: T1,T2 @ α=${params.firingAngleAlpha}°, T3,T4 @ π+α=${(180+params.firingAngleAlpha)%360}°)`,
          unit: 'V',
          maxVal: 5,
          color: '#9333ea',
          isPulse: true,
          getVal: (s: InstantaneousValues) => {
            if (params.topology === 'diode-bridge') return 0;
            if (s.gatePulseT1T2 || s.gatePulseB2T1T2 || s.gatePulseT3T4 || s.gatePulseB2T3T4) return 5;
            return 0;
          },
        },
      ];

      const activeChannels = allChannels.filter((c) => visibleChannels[c.id]);
      const numActive = Math.max(1, activeChannels.length);
      const chHeight = (height - padding.top - padding.bottom) / numActive;

      activeChannels.forEach((ch, idx) => {
        const topY = padding.top + idx * chHeight;
        const zeroY = ch.isPulse ? topY + chHeight - 8 : topY + chHeight / 2;

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

        // Channel label on the left
        ctx.font = '700 11px Inter, sans-serif';
        ctx.fillStyle = ch.color;
        ctx.textAlign = 'left';
        ctx.fillText(ch.label, padding.left + 8, topY + 14);

        // Live cursor value readout on the right
        const currVal = ch.getVal(instantaneous);
        const liveStr = ch.isPulse
          ? `${ch.key}(ωt) = ${currVal > 0 ? '+5.0V (FIRING)' : '0.0V (OFF)'}`
          : `${ch.key}(ωt) = ${currVal >= 0 ? '+' : ''}${currVal.toFixed(1)} ${ch.unit}`;
        ctx.font = '600 11px "JetBrains Mono", monospace';
        ctx.fillStyle = ch.color;
        ctx.textAlign = 'right';
        ctx.fillText(liveStr, padding.left + plotWidth - 10, topY + 14);

        // Y-axis tick labels
        ctx.font = '500 10px "JetBrains Mono", monospace';
        ctx.fillStyle = '#64748b';
        ctx.textAlign = 'right';
        if (ch.isPulse) {
          ctx.fillText(`+${ch.maxVal.toFixed(0)}${ch.unit}`, padding.left - 6, topY + 14);
          ctx.fillText(`0${ch.unit}`, padding.left - 6, zeroY + 3);
        } else {
          ctx.fillText(`+${ch.maxVal.toFixed(0)}${ch.unit}`, padding.left - 6, topY + 12);
          ctx.fillText(`0${ch.unit}`, padding.left - 6, zeroY + 3);
          ctx.fillText(`-${ch.maxVal.toFixed(0)}${ch.unit}`, padding.left - 6, topY + chHeight - 2);
        }

        // Curve
        if (ch.isPulse) {
          if (params.topology === 'diode-bridge') {
            ctx.strokeStyle = ch.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding.left, zeroY);
            ctx.lineTo(padding.left + plotWidth, zeroY);
            ctx.stroke();
          } else {
            const peakY = topY + 14;
            ctx.fillStyle = 'rgba(147, 51, 234, 0.22)';
            ctx.strokeStyle = ch.color;
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.moveTo(padding.left, zeroY);
            for (let i = 0; i < samples.length; i++) {
              const s = samples[i];
              const x = padding.left + (s.omegaT / totalAngle) * plotWidth;
              const isHigh = ch.getVal(s) > 0;
              const y = isHigh ? peakY : zeroY;
              ctx.lineTo(x, y);
            }
            ctx.lineTo(padding.left + plotWidth, zeroY);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else {
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
        }

        // Dot at cursor
        const normCursorAngle = currentAngle % totalAngle;
        const cursorX = padding.left + (normCursorAngle / totalAngle) * plotWidth;
        const curY = ch.isPulse
          ? (currVal > 0 ? topY + 14 : zeroY)
          : zeroY - (currVal / ch.maxVal) * (chHeight * 0.44);
        drawDot(ctx, cursorX, curY, ch.color);
      });

      // Bottom axis
      drawTimeAxis(ctx, padding.left, height - padding.bottom, plotWidth, totalAngle);

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
  }, [samples, currentAngle, viewMode, cycleSpan, showGrid, showVAvg, params, metrics, instantaneous, visibleChannels]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs transition-all ${
        isFullScreen ? 'fixed inset-4 z-50 shadow-2xl' : 'h-full'
      }`}
    >
      {/* Waveform Controls Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
        {/* View Mode Tabs: Primary Choice between Superimposed and All Separate */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-lg">
          <button
            onClick={() => onChangeViewMode('superimposed')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'superimposed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Superimposed Waveforms
          </button>
          <button
            onClick={() => onChangeViewMode('channels')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all ${
              viewMode === 'channels'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:text-slate-900'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            All Separate Waveforms (5 Channels)
          </button>
          <button
            onClick={() => onChangeViewMode('harmonics')}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              viewMode === 'harmonics'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Harmonics (FFT)
          </button>
          
        </div>

        {/* Oscilloscope Settings */}
        <div className="flex items-center gap-2">
                    {/* Time Axis Zoom Controls */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-0.5 shadow-2xs text-xs">
            <button
              onClick={() => setTimeZoom((prev) => Math.max(0.5, parseFloat((prev / 1.25).toFixed(2))))}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom Out along Time / Angle Axis"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono font-bold text-[11px] text-blue-600 dark:text-blue-400 px-1.5 min-w-[36px] text-center select-none">
              {timeZoom.toFixed(1)}x
            </span>
            <button
              onClick={() => setTimeZoom((prev) => Math.min(4.0, parseFloat((prev * 1.25).toFixed(2))))}
              className="p-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors cursor-pointer"
              title="Zoom In along Time / Angle Axis"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {timeZoom !== 1.0 && (
              <button
                onClick={() => setTimeZoom(1.0)}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded transition-colors cursor-pointer"
                title="Reset Zoom (1.0x)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>

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

      {/* Channel Visibility & Selection Bar */}
      {(viewMode === 'superimposed' || viewMode === 'channels') && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 bg-slate-50 border-b border-slate-200 text-xs">
          <div className="flex items-center gap-4">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
              Toggle Channels:
            </span>
            <label className="flex items-center gap-1.5 cursor-pointer text-blue-700 font-semibold">
              <input
                type="checkbox"
                checked={visibleChannels.vs}
                onChange={(e) => setVisibleChannels((prev) => ({ ...prev, vs: e.target.checked }))}
                className="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
              />
              <span>vs (Input Signal)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-cyan-700 font-semibold">
              <input
                type="checkbox"
                checked={visibleChannels.is}
                onChange={(e) => setVisibleChannels((prev) => ({ ...prev, is: e.target.checked }))}
                className="w-3.5 h-3.5 accent-cyan-600 rounded cursor-pointer"
              />
              <span>is (Input Current)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-emerald-700 font-semibold">
              <input
                type="checkbox"
                checked={visibleChannels.vo}
                onChange={(e) => setVisibleChannels((prev) => ({ ...prev, vo: e.target.checked }))}
                className="w-3.5 h-3.5 accent-emerald-600 rounded cursor-pointer"
              />
              <span>vo (Output Voltage)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-amber-700 font-semibold">
              <input
                type="checkbox"
                checked={visibleChannels.io}
                onChange={(e) => setVisibleChannels((prev) => ({ ...prev, io: e.target.checked }))}
                className="w-3.5 h-3.5 accent-amber-600 rounded cursor-pointer"
              />
              <span>io (Output Current)</span>
            </label>
            <label className="flex items-center gap-1.5 cursor-pointer text-purple-700 font-semibold">
              <input
                type="checkbox"
                checked={visibleChannels.ig}
                onChange={(e) => setVisibleChannels((prev) => ({ ...prev, ig: e.target.checked }))}
                className="w-3.5 h-3.5 accent-purple-600 rounded cursor-pointer"
              />
              <span>ig (Gate Trigger Pulses)</span>
            </label>
          </div>

          <div className="text-[11px] text-slate-500 font-mono">
            {viewMode === 'superimposed' ? 'Superimposed Multi-Pane DSO View' : 'All 5 Channels Stacked View'}
          </div>
        </div>
      )}

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
            {visibleChannels.vs && (
              <span className="flex items-center gap-1.5 text-blue-600 font-semibold">
                <span className="w-3 h-0.5 bg-blue-600 border-t border-dashed" />
                vs: {instantaneous.vs.toFixed(1)}V
              </span>
            )}
            {visibleChannels.vo && (
              <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                <span className="w-3 h-1 bg-emerald-600 rounded-full" />
                vo: {instantaneous.vo.toFixed(1)}V
              </span>
            )}
            {visibleChannels.is && (
              <span className="flex items-center gap-1.5 text-cyan-600 font-semibold">
                <span className="w-3 h-1 bg-cyan-600 rounded-full" />
                is: {instantaneous.is.toFixed(2)}A
              </span>
            )}
            {visibleChannels.io && (
              <span className="flex items-center gap-1.5 text-amber-600 font-semibold">
                <span className="w-3 h-1 bg-amber-600 rounded-full" />
                io: {instantaneous.io.toFixed(2)}A
              </span>
            )}
            {visibleChannels.ig && (
              <span className="flex items-center gap-1.5 text-purple-600 font-semibold">
                <span className="w-3 h-1 bg-purple-600 rounded-full" />
                ig: {instantaneous.gatePulseT1T2 || instantaneous.gatePulseT3T4 || instantaneous.gatePulseB2T1T2 || instantaneous.gatePulseB2T3T4 ? '5.0V ⚡' : '0.0V'}
              </span>
            )}
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
  totalAngle: number
) {
  const isDark = document.documentElement.classList.contains('dark');
  ctx.strokeStyle = isDark ? '#1e293b' : '#f1f5f9';
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

  // Vertical subdivisions: adaptive based on visible degrees
  const totalDeg = (totalAngle * 180) / PI;
  const stepDeg = totalDeg <= 180 ? 22.5 : totalDeg <= 360 ? 45 : totalDeg <= 720 ? 90 : 180;
  const numCols = Math.round(totalDeg / stepDeg);

  for (let c = 0; c <= numCols; c++) {
    const curX = x + (c / numCols) * width;
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
