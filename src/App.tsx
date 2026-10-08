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
import { ControlsPanel } from './components/ControlsPanel';
import { MetricsCards } from './components/MetricsCards';
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
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(0.5);
  const [viewMode, setViewMode] = useState<WaveformViewMode>('superimposed');
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);
  const [isSchematicFullScreen, setIsSchematicFullScreen] = useState<boolean>(false);

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

  // Animation loop
  useEffect(() => {
    if (!isPlaying) {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      lastTimeRef.current = null;
      return;
    }

    const animate = (timestamp: number) => {
      if (lastTimeRef.current !== null) {
        const deltaMs = timestamp - lastTimeRef.current;
        // Supply angular frequency omega = 2 * PI * f
        // Angle delta = omega * delta_t * speedMultiplier
        const omega = 2 * PI * params.frequency;
        const deltaAngle = (omega * (deltaMs / 1000)) * (speedMultiplier * 0.12);

        setCurrentAngleRad((prev) => (prev + deltaAngle) % TWO_PI);
      }
      lastTimeRef.current = timestamp;
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isPlaying, speedMultiplier, params.frequency]);

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
      case 'dual-q1':
        setParams({
          ...DEFAULT_PARAMS,
          topology: 'double-bridge',
          firingAngleAlpha: 30,
          firingAngleAlpha2: 150,
          activeBridgeInDual: 1,
          dualBridgeMode: 'non-circulating',
        });
        setViewMode('four-quadrant');
        break;
      case 'dual-q4':
        setParams({
          ...DEFAULT_PARAMS,
          topology: 'double-bridge',
          firingAngleAlpha: 60,
          firingAngleAlpha2: 120,
          activeBridgeInDual: 2,
          dualBridgeMode: 'non-circulating',
        });
        setViewMode('four-quadrant');
        break;
      default:
        break;
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
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
      />

      {/* Main Studio Viewport */}
      <main className="flex-1 max-w-[1700px] w-full mx-auto p-4 sm:p-6 space-y-5">
        {/* Top Split View: Schematic (Left) & Waveforms (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left Column: Circuit Schematic Diagram */}
          <div className="lg:col-span-6 flex flex-col h-[520px] lg:h-[600px]">
            <Schematic
              params={params}
              instantaneous={instantaneous}
              onUpdateParams={handleUpdateParams}
              isFullScreen={isSchematicFullScreen}
              onToggleFullScreen={() => setIsSchematicFullScreen(!isSchematicFullScreen)}
            />
          </div>

          {/* Right Column: Waveform Display / Multi-Channel / FFT / 4-Quadrant */}
          <div className="lg:col-span-6 flex flex-col h-[520px] lg:h-[600px]">
            {viewMode === 'harmonics' ? (
              <div className="h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/80">
                  <div className="text-xs font-semibold text-slate-700">
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
              <div className="h-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs flex flex-col">
                <div className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50/80">
                  <div className="text-xs font-semibold text-slate-700">
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
          speedMultiplier={speedMultiplier}
          onSpeedChange={setSpeedMultiplier}
          onStep={handleStep}
          onReset={handleResetAngle}
        />

        {/* Analytical Derivations & Performance Metrics Cards */}
        <MetricsCards metrics={metrics} params={params} />

        {/* Converter Circuit & Parameter Control Drawer */}
        <ControlsPanel params={params} onUpdateParams={handleUpdateParams} />
      </main>

      {/* Theory & Mathematical Derivations Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
