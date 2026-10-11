export type TopologyMode = 'diode-bridge' | 'single-thyristor' | 'double-bridge';

export type LoadType = 'R' | 'RL' | 'RLE';

export interface ConverterParameters {
  topology: TopologyMode;
  loadType: LoadType;
  vPeak: number; // Peak AC Voltage (e.g. 325V for 230V RMS)
  frequency: number; // Hz (e.g. 50Hz)
  firingAngleAlpha: number; // degrees (0 - 180) for Bridge 1
  firingAngleAlpha2: number; // degrees for Bridge 2 in Double Bridge (usually 180 - alpha1)
  resistance: number; // Ohms
  inductance: number; // Henries
  backEmf: number; // Volts (E)
  highlyInductive: boolean; // Continuous constant current approximation
  dualBridgeMode: 'non-circulating' | 'circulating';
  activeBridgeInDual: 1 | 2; // For non-circulating mode
  showFreewheelingDiode: boolean;
  switchOverrides?: Record<string, 'thyristor' | 'diode'>;
}

export interface SwitchState {
  id: string;
  name: string;
  type: 'diode' | 'thyristor';
  bridge: 1 | 2;
  isConducting: boolean;
  isTriggered: boolean;
  forwardVoltage: number;
  current: number;
}

export interface InstantaneousValues {
  omegaT: number; // radians
  angleDeg: number; // degrees (0-360)
  cycleIndex: number;
  vs: number; // Input voltage
  is: number; // Input current
  vo: number; // Output voltage
  io: number; // Output current
  vBridge1: number;
  vBridge2: number;
  activeSwitches: string[];
  activePairLabel: string;
  gatePulseT1T2: boolean;
  gatePulseT3T4: boolean;
  gatePulseB2T1T2: boolean;
  gatePulseB2T3T4: boolean;
}

export interface ConverterMetrics {
  vDcAvg: number;
  vRms: number;
  iDcAvg: number;
  iRms: number;
  pDc: number;
  pAc: number;
  powerFactor: number;
  displacementFactor: number;
  thdInputCurrent: number;
  rippleFactorV: number;
  formFactorV: number;
  efficiency: number;
}

export interface HarmonicComponent {
  order: number;
  frequency: number;
  magnitude: number;
  percentage: number;
}
