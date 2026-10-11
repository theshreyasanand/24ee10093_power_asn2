import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  ConverterParameters,
  TopologyMode,
  LoadType,
  InstantaneousValues,
} from './types/rectifier';
import {
  getInstantaneousValues,
  generateWaveformSamples,
  calculateConverterMetrics,
  TWO_PI,
  PI,
} from './utils/physics';
import { Header } from './components/Header';
import { Schematic } from './components/Schematic';
import { WaveformDisplay, WaveformViewMode } from './components/WaveformDisplay';
import { TransportControls } from './components/TransportControls';
import { MetricsCards } from './components/MetricsCards';
import { ControlsPanel } from './components/ControlsPanel';
import { HarmonicsChart } from './components/HarmonicsChart';
import { FourQuadrantPlot } from './components/FourQuadrantPlot';
import { TheoryModal } from './components/TheoryModal';

const DEFAULT_PARAMS: ConverterParameters = {
  topology: 'single-thyristor',
  loadType: 'RL',
  vPeak: 325, // ~230V RMS
  frequency: 50,
  firingAngleAlpha: 45,
  firingAngleAlpha2: 135, // 180 - 45
  resistance: 20,
  inductance: 0.045, // 45 mH
  backEmf: 30,
  highlyInductive: false,
  dualBridgeMode: 'non-circulating',
  activeBridgeInDual: 1,
  showFreewheelingDiode: false,
};

export default function App() {
  const [params, setParams] = useState<ConverterParameters>(DEFAULT_PARAMS);
  const [currentAngleRad, setCurrentAngleRad] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.2);
  const [viewMode, setViewMode] = useState<WaveformViewMode>('superimposed');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isSchematicFullScreen, setIsSchematicFullScreen] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme-dark');
      if (saved !== null) return saved === 'true';
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Keep dark class synced on <html>
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme-dark', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme-dark', 'false');
    }
  }, [isDarkMode]);

  const toggleDarkMode = useCallback(() => {
    setIsDarkMode((prev) => !prev);
  }, []);

  // Animation frame reference
  const lastTimeRef = useRef<number | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Compute Instantaneous values for the current angle
  const instantaneous = useMemo(() => {
    return getInstantaneousValues(currentAngleRad, params);
  }, [currentAngleRad, params]);

  // Compute sampled waveforms for analytical metrics
  const samplesForMetrics = useMemo(() => {
    return generateWaveformSamples(params, 2, 720);
  }, [params]);

  // Compute Metrics
  const metrics = useMemo(() => {
    return calculateConverterMetrics(params, samplesForMetrics);
  }, [params, samplesForMetrics]);

  // Update parameters handler
  const handleUpdateParams = useCallback((newParams: Partial<ConverterParameters>) => {
    setParams((prev) => ({ ...prev, ...newParams }));
  }, []);

  // Animation loop (slowed down for clear visual tracking of waveforms & firing pulses)
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current !== null) {
        const deltaMs = timestamp - lastTimeRef.current;
        // Smooth educational speed: 1 electrical cycle (2*PI) takes ~6 seconds at 1.0x speed
        // At default 0.2x speed, 1 cycle takes 30 seconds for crystal clear observation
        const baseAngularSpeed = (2 * PI) / 6.0;
        const deltaAngle = baseAngularSpeed * (deltaMs / 1000) * speedMultiplier;

        setCurrentAngleRad((prev) => (prev + deltaAngle) % TWO_PI);
      }
      lastTimeRef.current = timestamp;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier]);

  // Step angle by delta degrees
  const handleStep = useCallback((deltaDeg: number) => {
    setIsPlaying(false);
    setCurrentAngleRad((prev) => {
      const currentDeg = (prev * 180) / PI;
      const nextDeg = ((currentDeg + deltaDeg) % 360 + 360) % 360;
      return (nextDeg * PI) / 180;
    });
  }, []);

  // Reset angle to 0
  const handleResetAngle = useCallback(() => {
    setCurrentAngleRad(0);
  }, []);

  // Preset applicator
  const handleApplyPreset = useCallback((presetId: string) => {
    switch (presetId) {
      case 'diode-r':
        setParams({
          ...DEFAULT_PARAMS,
          topology: 'diode-bridge',
          loadType: 'R',
          resistance: 25,
          inductance: 0,
        });
        setViewMode('superimposed');
        break;
      case 'diode-rl':
        setParams({
          ...DEFAULT_PARAMS,
          topology: 'diode-bridge',
          loadType: 'RL',
          resistance: 20,
          inductance: 0.05,
        });
        setViewMode('superimposed');
        break;
      case 'scr-45':
        setParams({
          ...DEFAULT_PARAMS,
          topology: 'single-thyristor',
          firingAngleAlpha: 45,
          loadType: 'RL',
          resistance: 20,
          inductance: 0.045,
        });
        setViewMode('superimposed');
        break;
      case 'scr-inverter-120':
        setParams({
          ...DEFAULT_PARAMS,
          topology: 'single-thyristor',
          firingAngleAlpha: 120,
          loadType: 'RLE',
          resistance: 10,
          inductance: 0.06,
          backEmf: 120,
        });
        setViewMode('superimposed');
        break;

      default:
        break;
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Top Application Header */}
      <Header
        params={params}
        onApplyPreset={handleApplyPreset}
        onOpenTheory={() => setIsTheoryOpen(true)}
        onResetAll={() => {
          setParams(DEFAULT_PARAMS);
          setCurrentAngleRad(0);
          setIsPlaying(true);
        }}
        onUpdateParams={handleUpdateParams}
        speedMultiplier={speedMultiplier}
        onSpeedChange={setSpeedMultiplier}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Top Split View: Schematic (Left) & Waveforms (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Circuit Schematic Diagram */}
          <div className="lg:col-span-6 flex flex-col min-h-[560px] lg:h-[660px]">
            <Schematic
              params={params}
              instantaneous={instantaneous}
              onUpdateParams={handleUpdateParams}
              isFullScreen={isSchematicFullScreen}
              onToggleFullScreen={() => setIsSchematicFullScreen(!isSchematicFullScreen)}
            />
          </div>

          {/* Right Column: Waveform Display / Multi-Channel / FFT / 4-Quadrant */}
          <div className="lg:col-span-6 flex flex-col min-h-[560px] lg:h-[660px]">
            {viewMode === 'harmonics' ? (
              <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Frequency Domain Analysis
                  </div>
                  <button
                    onClick={() => setViewMode('superimposed')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    ← Back to Oscilloscope
                  </button>
                </div>
                <HarmonicsChart samples={samplesForMetrics} metrics={metrics} />
              </div>
            ) : viewMode === 'four-quadrant' ? (
              <div className="h-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-xs flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/90">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Double Bridge 4-Quadrant Plane
                  </div>
                  <button
                    onClick={() => setViewMode('superimposed')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800"
                  >
                    ← Back to Oscilloscope
                  </button>
                </div>
                <FourQuadrantPlot
                  params={params}
                  metrics={metrics}
                  instantaneous={instantaneous}
                  onUpdateParams={handleUpdateParams}
                />
              </div>
            ) : (
              <WaveformDisplay
                params={params}
                instantaneous={instantaneous}
                metrics={metrics}
                currentAngle={currentAngleRad}
                onAngleChange={setCurrentAngleRad}
                viewMode={viewMode}
                onChangeViewMode={setViewMode}
              />
            )}
          </div>
        </div>

        {/* Transport & Angle Scrubber Bar */}
        <TransportControls
          isPlaying={isPlaying}
          onTogglePlay={() => setIsPlaying(!isPlaying)}
          currentAngleRad={currentAngleRad}
          onAngleChange={(angle) => {
            setIsPlaying(false);
            setCurrentAngleRad(angle);
          }}
          onStep={handleStep}
          onReset={handleResetAngle}
          params={params}
          onUpdateParams={handleUpdateParams}
        />

        {/* Analog Instrument Gauges & Performance Metrics */}
        <MetricsCards metrics={metrics} params={params} />

        {/* Converter Circuit & Parameter Control Drawer */}
        <ControlsPanel params={params} onUpdateParams={handleUpdateParams} />
      </main>

      {/* Theory & Mathematical Derivations Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
