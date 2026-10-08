import {
  ConverterParameters,
  InstantaneousValues,
  ConverterMetrics,
  HarmonicComponent,
} from '../types/rectifier';

export const PI = Math.PI;
export const TWO_PI = 2 * Math.PI;

export function degToRad(deg: number): number {
  return (deg * PI) / 180;
}

export function radToDeg(rad: number): number {
  return (rad * 180) / PI;
}

/**
 * Calculates instantaneous circuit values at angle theta (in radians, from 0 to 2*PI or beyond)
 */
export function getInstantaneousValues(
  theta: number,
  params: ConverterParameters
): InstantaneousValues {
  const normTheta = ((theta % TWO_PI) + TWO_PI) % TWO_PI;
  const angleDeg = (normTheta * 180) / PI;
  const cycleIndex = Math.floor(theta / TWO_PI);

  const {
    topology,
    loadType,
    vPeak,
    firingAngleAlpha,
    firingAngleAlpha2,
    resistance,
    inductance,
    backEmf,
    highlyInductive,
    dualBridgeMode,
    activeBridgeInDual,
    showFreewheelingDiode,
  } = params;

  const alphaRad = degToRad(firingAngleAlpha);
  const alpha2Rad = degToRad(firingAngleAlpha2);

  // Source voltage vs = Vm * sin(wt)
  const vs = vPeak * Math.sin(normTheta);

  let vo = 0;
  let io = 0;
  let is = 0;
  let vBridge1 = 0;
  let vBridge2 = 0;
  const activeSwitches: string[] = [];
  let activePairLabel = 'OFF';

  const pulseWidthRad = degToRad(15); // Pulse duration 15 degrees
  let gatePulseT1T2 = false;
  let gatePulseT3T4 = false;
  let gatePulseB2T1T2 = false;
  let gatePulseB2T3T4 = false;

  // Gate pulses for Bridge 1
  if (normTheta >= alphaRad && normTheta <= alphaRad + pulseWidthRad) {
    gatePulseT1T2 = true;
  }
  if (
    normTheta >= PI + alphaRad &&
    normTheta <= PI + alphaRad + pulseWidthRad
  ) {
    gatePulseT3T4 = true;
  }

  // Gate pulses for Bridge 2
  if (normTheta >= alpha2Rad && normTheta <= alpha2Rad + pulseWidthRad) {
    gatePulseB2T1T2 = true;
  }
  if (
    normTheta >= PI + alpha2Rad &&
    normTheta <= PI + alpha2Rad + pulseWidthRad
  ) {
    gatePulseB2T3T4 = true;
  }

  if (topology === 'diode-bridge') {
    // Uncontrolled Diode Bridge Rectifier
    if (normTheta >= 0 && normTheta < PI) {
      // Positive half cycle: D1 & D2 conduct
      activeSwitches.push('D1', 'D2');
      activePairLabel = 'D1 + D2 (Forward)';
      vo = vs;
      is = computeLoadCurrent(vo, normTheta, 0, PI, params);
      io = is;
    } else {
      // Negative half cycle: D3 & D4 conduct
      activeSwitches.push('D3', 'D4');
      activePairLabel = 'D3 + D4 (Reverse)';
      vo = -vs;
      io = computeLoadCurrent(vo, normTheta, PI, TWO_PI, params);
      is = -io;
    }

    if (loadType === 'RLE' && vo < backEmf) {
      vo = backEmf;
      io = 0;
      is = 0;
      activeSwitches.length = 0;
      activePairLabel = 'OFF (vo < E)';
    }

    vBridge1 = vo;
  } else if (topology === 'single-thyristor') {
    // Single Phase Fully Controlled Bridge Rectifier
    const isContinuous = highlyInductive || (loadType === 'RL' && inductance > 0.02);

    if (loadType === 'R') {
      // Pure Resistive Load: conducts from alpha to PI, and PI+alpha to 2PI
      if (normTheta >= alphaRad && normTheta < PI) {
        activeSwitches.push('T1', 'T2');
        activePairLabel = 'Bridge Pair T1 + T2';
        vo = vs;
        io = vo / Math.max(resistance, 0.1);
        is = io;
      } else if (normTheta >= PI + alphaRad && normTheta < TWO_PI) {
        activeSwitches.push('T3', 'T4');
        activePairLabel = 'Bridge Pair T3 + T4';
        vo = -vs;
        io = vo / Math.max(resistance, 0.1);
        is = -io;
      } else {
        vo = 0;
        io = 0;
        is = 0;
        activePairLabel = 'Natural Extinction (Zero)';
      }
    } else {
      // RL or RLE Load
      // In continuous conduction:
      // Interval 1: [alpha, PI + alpha] -> T1 and T2 conduct, vo = vs
      // Interval 2: [PI + alpha, 2PI + alpha] -> T3 and T4 conduct, vo = -vs
      if (isContinuous) {
        if (normTheta >= alphaRad && normTheta < PI + alphaRad) {
          activeSwitches.push('T1', 'T2');
          activePairLabel = 'Bridge Pair T1 + T2';
          vo = vs;
          io = computeContinuousCurrent(normTheta, alphaRad, params);
          is = io;
        } else {
          activeSwitches.push('T3', 'T4');
          activePairLabel = 'Bridge Pair T3 + T4';
          vo = -vs;
          const refAngle = normTheta < alphaRad ? normTheta + TWO_PI : normTheta;
          io = computeContinuousCurrent(refAngle - PI, alphaRad, params);
          is = -io;
        }

        // Freewheeling diode clamp if enabled
        if (showFreewheelingDiode && vo < 0) {
          vo = 0;
          activeSwitches.length = 0;
          activeSwitches.push('D_FW');
          activePairLabel = 'Freewheeling Diode D_FW';
          is = 0; // Source disconnected while freewheeling
        }
      } else {
        // Discontinuous Conduction mode with extinction angle beta
        const extinctionAngle = computeExtinctionAngle(alphaRad, params);
        if (normTheta >= alphaRad && normTheta < extinctionAngle) {
          activeSwitches.push('T1', 'T2');
          activePairLabel = 'T1 + T2 (Conducting)';
          vo = vs;
          io = computeDiscontinuousCurrent(normTheta, alphaRad, params);
          is = io;
        } else if (
          normTheta >= PI + alphaRad &&
          normTheta < Math.min(TWO_PI, PI + extinctionAngle)
        ) {
          activeSwitches.push('T3', 'T4');
          activePairLabel = 'T3 + T4 (Conducting)';
          vo = -vs;
          io = computeDiscontinuousCurrent(normTheta - PI, alphaRad, params);
          is = -io;
        } else {
          vo = loadType === 'RLE' ? backEmf : 0;
          io = 0;
          is = 0;
          activePairLabel = 'Discontinuous Interval (OFF)';
        }
      }
    }

    vBridge1 = vo;
  } else {
    // topology === 'double-bridge' (Dual Converter)
    // Bridge 1 gives vB1 = vs (alpha1 to PI+alpha1) and -vs (PI+alpha1 to 2PI+alpha1)
    // Bridge 2 is in antiparallel, gives vB2
    let vb1_inst = 0;
    let b1_is = 0;
    let b1_active: string[] = [];

    if (normTheta >= alphaRad && normTheta < PI + alphaRad) {
      vb1_inst = vs;
      b1_active = ['T1', 'T2'];
    } else {
      vb1_inst = -vs;
      b1_active = ['T3', 'T4'];
    }

    let vb2_inst = 0;
    let b2_is = 0;
    let b2_active: string[] = [];

    if (normTheta >= alpha2Rad && normTheta < PI + alpha2Rad) {
      vb2_inst = vs;
      b2_active = ['T1\'', 'T2\''];
    } else {
      vb2_inst = -vs;
      b2_active = ['T3\'', 'T4\''];
    }

    vBridge1 = vb1_inst;
    vBridge2 = -vb2_inst; // In antiparallel terminal orientation

    if (dualBridgeMode === 'non-circulating') {
      // Only the commanded bridge conducts
      if (activeBridgeInDual === 1) {
        vo = vb1_inst;
        activeSwitches.push(...b1_active);
        activePairLabel = `Bridge 1 [${b1_active.join('+')}] Forward`;
        io = computeContinuousCurrent(
          normTheta >= alphaRad ? normTheta : normTheta + TWO_PI,
          alphaRad,
          params
        );
        is = b1_active.includes('T1') ? io : -io;
      } else {
        vo = -vb2_inst;
        activeSwitches.push(...b2_active);
        activePairLabel = `Bridge 2 [${b2_active.join('+')}] Reverse`;
        // Negative current output
        const mag = computeContinuousCurrent(
          normTheta >= alpha2Rad ? normTheta : normTheta + TWO_PI,
          alpha2Rad,
          params
        );
        io = -mag;
        is = b2_active.includes("T1'") ? io : -io;
      }
    } else {
      // Circulating Current Mode: Both bridges triggered simultaneously
      // alpha1 + alpha2 = 180 degrees
      // Load sees average or Bridge 1 voltage minus reactor drop
      activeSwitches.push(...b1_active, ...b2_active);
      activePairLabel = `Dual Active: B1(${b1_active.join('+')}) + B2(${b2_active.join('+')})`;

      // Circulating ripple voltage: vr = (vB1 + vB2)/2
      const vr = (vb1_inst - vb2_inst) / 2;
      vo = (vb1_inst + vb2_inst) / 2;

      const baseCurrent = computeContinuousCurrent(
        normTheta >= alphaRad ? normTheta : normTheta + TWO_PI,
        alphaRad,
        params
      );
      // Circulating current ic is integrated ripple
      const iCirculating = Math.max(0.2, Math.abs(vr) / 25);
      io = baseCurrent;
      is = (b1_active.includes('T1') ? io : -io) + (vr > 0 ? iCirculating : -iCirculating);
    }
  }

  return {
    omegaT: theta,
    angleDeg,
    cycleIndex,
    vs,
    is,
    vo,
    io,
    vBridge1,
    vBridge2,
    activeSwitches,
    activePairLabel,
    gatePulseT1T2,
    gatePulseT3T4,
    gatePulseB2T1T2,
    gatePulseB2T3T4,
  };
}

function computeLoadCurrent(
  vo: number,
  theta: number,
  startAngle: number,
  endAngle: number,
  params: ConverterParameters
): number {
  const { loadType, resistance, inductance, backEmf, highlyInductive, vPeak } = params;
  const R = Math.max(resistance, 0.2);

  if (loadType === 'R') {
    return vo / R;
  }

  if (highlyInductive) {
    const vAvg = (2 * vPeak) / PI;
    return Math.max(0.1, (vAvg - (loadType === 'RLE' ? backEmf : 0)) / R);
  }

  // RL dynamic approximation
  const omega = 2 * PI * params.frequency;
  const Z = Math.sqrt(R * R + Math.pow(omega * inductance, 2));
  const phi = Math.atan2(omega * inductance, R);
  const vAvg = (2 * vPeak) / PI;
  const iAvg = Math.max(0.1, (vAvg - (loadType === 'RLE' ? backEmf : 0)) / R);
  const ripple = ((vPeak / Z) * Math.sin(2 * theta - phi)) * 0.35;
  return Math.max(0, iAvg + ripple);
}

function computeContinuousCurrent(
  theta: number,
  alpha: number,
  params: ConverterParameters
): number {
  const { resistance, inductance, backEmf, highlyInductive, vPeak, loadType } = params;
  const R = Math.max(resistance, 0.2);

  // Exact steady state DC average
  const vAvg = ((2 * vPeak) / PI) * Math.cos(alpha);
  const eVal = loadType === 'RLE' ? backEmf : 0;
  const netV = vAvg - eVal;
  const iAvg = Math.max(0.1, netV / R);

  if (highlyInductive || inductance > 0.05) {
    // Constant ripple-free DC current approximation
    return iAvg;
  }

  const omega = 2 * PI * params.frequency;
  const Z = Math.sqrt(R * R + Math.pow(2 * omega * inductance, 2));
  const phi = Math.atan2(2 * omega * inductance, R);
  const rippleMag = (4 * vPeak) / (3 * PI * Z);
  const ripple = rippleMag * Math.cos(2 * (theta - alpha) - phi);
  return Math.max(0.05, iAvg + ripple);
}

function computeDiscontinuousCurrent(
  theta: number,
  alpha: number,
  params: ConverterParameters
): number {
  const { resistance, inductance, vPeak } = params;
  const R = Math.max(resistance, 0.2);
  const omega = 2 * PI * params.frequency;
  const Z = Math.sqrt(R * R + Math.pow(omega * inductance, 2));
  const phi = Math.atan2(omega * inductance, R);
  const tau = inductance / R;

  // i(wt) = (Vm/Z)*[sin(wt - phi) - sin(alpha - phi)*exp(-(wt - alpha)/(omega*tau))]
  const wt = theta;
  const term1 = Math.sin(wt - phi);
  const term2 = Math.sin(alpha - phi) * Math.exp(-(wt - alpha) / (omega * tau));
  const current = (vPeak / Z) * (term1 - term2);
  return Math.max(0, current);
}

function computeExtinctionAngle(alpha: number, params: ConverterParameters): number {
  const { resistance, inductance } = params;
  const omega = 2 * PI * params.frequency;
  const phi = Math.atan2(omega * inductance, Math.max(resistance, 0.2));
  // Approximate extinction angle beta for RL load
  const betaEst = PI + phi * 0.85;
  return Math.min(PI + alpha, Math.max(alpha + 0.1, betaEst));
}

/**
 * Precomputes sampled waveform points across cycles (N samples per cycle)
 */
export function generateWaveformSamples(
  params: ConverterParameters,
  cycles: number = 2,
  samplePoints: number = 720
): InstantaneousValues[] {
  const samples: InstantaneousValues[] = [];
  const totalAngle = cycles * TWO_PI;
  const step = totalAngle / samplePoints;

  for (let i = 0; i <= samplePoints; i++) {
    const theta = i * step;
    samples.push(getInstantaneousValues(theta, params));
  }
  return samples;
}

/**
 * Calculates accurate analytical metrics for the converter
 */
export function calculateConverterMetrics(
  params: ConverterParameters,
  samples: InstantaneousValues[]
): ConverterMetrics {
  const { topology, vPeak, firingAngleAlpha, resistance, loadType, backEmf } = params;
  const R = Math.max(resistance, 0.2);
  const alphaRad = degToRad(firingAngleAlpha);

  let vDcAvg = 0;
  let vRms = 0;
  let iDcAvg = 0;
  let iRms = 0;

  if (topology === 'diode-bridge') {
    vDcAvg = (2 * vPeak) / PI;
    vRms = vPeak / Math.SQRT2;
  } else if (topology === 'single-thyristor') {
    if (loadType === 'R') {
      vDcAvg = (vPeak / PI) * (1 + Math.cos(alphaRad));
      vRms =
        (vPeak / Math.SQRT2) *
        Math.sqrt(1 - alphaRad / PI + Math.sin(2 * alphaRad) / (2 * PI));
    } else {
      // RL continuous
      vDcAvg = ((2 * vPeak) / PI) * Math.cos(alphaRad);
      vRms = vPeak / Math.SQRT2;
    }
  } else {
    // Double bridge
    vDcAvg = ((2 * vPeak) / PI) * Math.cos(alphaRad);
    vRms = vPeak / Math.SQRT2;
  }

  // Calculate numerically from samples for exact integration
  let sumVo = 0;
  let sumVoSq = 0;
  let sumIo = 0;
  let sumIoSq = 0;
  let sumIsSq = 0;
  let sumPac = 0;

  const n = samples.length;
  for (let i = 0; i < n; i++) {
    const s = samples[i];
    sumVo += s.vo;
    sumVoSq += s.vo * s.vo;
    sumIo += s.io;
    sumIoSq += s.io * s.io;
    sumIsSq += s.is * s.is;
    sumPac += s.vs * s.is;
  }

  const numVDc = sumVo / n;
  const numVRms = Math.sqrt(sumVoSq / n);
  const numIDc = sumIo / n;
  const numIRms = Math.sqrt(sumIoSq / n);
  const isRms = Math.sqrt(sumIsSq / n);
  const pAc = sumPac / n;
  const pDc = numVDc * numIDc;

  const vsRms = vPeak / Math.SQRT2;
  const powerFactor = vsRms * isRms > 0.001 ? Math.min(1, Math.max(0, pAc / (vsRms * isRms))) : 0;
  const displacementFactor = Math.abs(Math.cos(alphaRad));

  // Form factor FF = Vrms / Vdc
  const formFactorV = Math.abs(numVDc) > 0.01 ? numVRms / Math.abs(numVDc) : 1;
  // Ripple factor RF = sqrt(FF^2 - 1)
  const rippleFactorV = Math.sqrt(Math.max(0, formFactorV * formFactorV - 1));

  // Total Harmonic Distortion of input current
  // In pure square wave continuous current, THD = sqrt(pi^2 / 8 - 1) ~ 48.3%
  const fundIsRms = (2 * Math.SQRT2 / PI) * numIDc;
  const thdInputCurrent =
    fundIsRms > 0.01 && isRms >= fundIsRms
      ? (Math.sqrt(Math.max(0, isRms * isRms - fundIsRms * fundIsRms)) / fundIsRms) * 100
      : 48.3;

  const efficiency = pAc > 0.01 ? Math.min(100, (pDc / pAc) * 100) : 0;

  return {
    vDcAvg: Number.isFinite(vDcAvg) ? vDcAvg : numVDc,
    vRms: Number.isFinite(vRms) ? vRms : numVRms,
    iDcAvg: numIDc,
    iRms: numIRms,
    pDc,
    pAc: Math.max(0, pAc),
    powerFactor,
    displacementFactor,
    thdInputCurrent,
    rippleFactorV,
    formFactorV,
    efficiency: Math.max(0, efficiency),
  };
}

/**
 * Computes Fourier Harmonics (DFT) for Input Current or Output Voltage
 */
export function computeHarmonics(
  samples: InstantaneousValues[],
  target: 'is' | 'vo',
  maxHarmonic: number = 15
): HarmonicComponent[] {
  const oneCycleSamples = samples.slice(0, Math.floor(samples.length / 2));
  const N = oneCycleSamples.length;
  if (N === 0) return [];

  const harmonics: HarmonicComponent[] = [];
  let fundamentalMag = 1;

  for (let k = 1; k <= maxHarmonic; k++) {
    let re = 0;
    let im = 0;

    for (let n = 0; n < N; n++) {
      const val = target === 'is' ? oneCycleSamples[n].is : oneCycleSamples[n].vo;
      const angle = (TWO_PI * k * n) / N;
      re += val * Math.cos(angle);
      im -= val * Math.sin(angle);
    }

    const mag = (2 * Math.sqrt(re * re + im * im)) / N;
    if (k === 1) {
      fundamentalMag = Math.max(0.001, mag);
    }

    harmonics.push({
      order: k,
      frequency: k * 50,
      magnitude: mag,
      percentage: (mag / fundamentalMag) * 100,
    });
  }

  return harmonics;
}
