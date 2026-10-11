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

export function getSwitchDeviceType(
  switchId: string,
  params: ConverterParameters
): 'thyristor' | 'diode' {
  if (params.switchOverrides && params.switchOverrides[switchId]) {
    return params.switchOverrides[switchId];
  }
  if (params.topology === 'diode-bridge') {
    return 'diode';
  }
  return 'thyristor';
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

  // Individual switch types for Bridge 1
  const s1Type = getSwitchDeviceType('T1', params);
  const s2Type = getSwitchDeviceType('T2', params);
  const s3Type = getSwitchDeviceType('T3', params);
  const s4Type = getSwitchDeviceType('T4', params);

  const isS1Thyristor = s1Type === 'thyristor';
  const isS2Thyristor = s2Type === 'thyristor';
  const isS3Thyristor = s3Type === 'thyristor';
  const isS4Thyristor = s4Type === 'thyristor';

  const s1Name = isS1Thyristor ? 'T1' : 'D1';
  const s2Name = isS2Thyristor ? 'T2' : 'D2';
  const s3Name = isS3Thyristor ? 'T3' : 'D3';
  const s4Name = isS4Thyristor ? 'T4' : 'D4';

  // Firing angles for each pair:
  // If either switch in the positive loop is a thyristor, it requires gating at alpha
  const alphaPosRad = (isS1Thyristor || isS2Thyristor) ? alphaRad : 0;
  // If either switch in the negative loop is a thyristor, it requires gating at alpha after PI
  const alphaNegRad = (isS3Thyristor || isS4Thyristor) ? alphaRad : 0;

  // Gate pulses for Bridge 1
  if ((isS1Thyristor || isS2Thyristor) && normTheta >= alphaRad && normTheta <= alphaRad + pulseWidthRad) {
    gatePulseT1T2 = true;
  }
  if ((isS3Thyristor || isS4Thyristor) && normTheta >= PI + alphaRad && normTheta <= PI + alphaRad + pulseWidthRad) {
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

  if (topology !== 'double-bridge') {
    // Single Bridge (Controlled, Uncontrolled, or Mixed/Semi-converter)
    const isInductive = loadType === 'RL' || loadType === 'RLE';
    const isContinuous = highlyInductive || (isInductive && inductance > 0.02);

    // Freewheeling capability at zero-crossings depends on which specific switches are diodes:
    // In positive delay (0 <= normTheta < alphaPosRad, vs > 0):
    // Requires D_FW OR an incoming diode that can turn on naturally at vs > 0:
    // Leg 1 freewheel: S1 is diode (D1 anode at Phase A > 0, connects to S4 which was on)
    // Leg 2 freewheel: S2 is diode (D2 cathode at Neutral < 0, connects to S3 which was on)
    const canFreewheelPos = showFreewheelingDiode || !isS1Thyristor || !isS2Thyristor;

    // In negative delay (PI <= normTheta < PI + alphaNegRad, vs < 0):
    // Requires D_FW OR an incoming diode that can turn on naturally at vs < 0:
    // Leg 1 freewheel: S4 is diode (D4 cathode at Phase A < 0, connects to S1 which was on)
    // Leg 2 freewheel: S3 is diode (D3 anode at Neutral > 0, connects to S2 which was on)
    const canFreewheelNeg = showFreewheelingDiode || !isS4Thyristor || !isS3Thyristor;

    if (!isInductive) {
      // Pure Resistive Load (R)
      if (normTheta >= alphaPosRad && normTheta < PI) {
        activeSwitches.push(s1Name, s2Name);
        activePairLabel = `${s1Name} + ${s2Name} (Conducting)`;
        vo = vs;
        io = vo / Math.max(resistance, 0.1);
        is = io;
      } else if (normTheta >= PI + alphaNegRad && normTheta < TWO_PI) {
        activeSwitches.push(s3Name, s4Name);
        activePairLabel = `${s3Name} + ${s4Name} (Conducting)`;
        vo = -vs;
        io = vo / Math.max(resistance, 0.1);
        is = -io;
      } else {
        vo = 0;
        io = 0;
        is = 0;
        activePairLabel = 'Blocking / Off Interval';
      }
    } else {
      // Inductive Load (RL or RLE)
      if (isContinuous) {
        // Continuous Conduction Mode
        if (normTheta >= alphaPosRad && normTheta < PI) {
          // Positive half cycle active conduction
          activeSwitches.push(s1Name, s2Name);
          activePairLabel = `${s1Name} + ${s2Name} (Active)`;
          vo = vs;
          io = computeContinuousCurrent(normTheta, alphaPosRad, params);
          is = io;
        } else if (normTheta >= PI && normTheta < PI + alphaNegRad) {
          // Commutation / delay interval in negative cycle
          if (canFreewheelNeg) {
            // Natural freewheeling clamp through diode(s) or D_FW
            vo = 0;
            if (showFreewheelingDiode) {
              activeSwitches.push('D_FW');
              activePairLabel = 'Freewheeling (D_FW)';
            } else if (!isS4Thyristor) {
              activeSwitches.push(s1Name, s4Name);
              activePairLabel = `Freewheeling (${s1Name}+${s4Name})`;
            } else {
              activeSwitches.push(s3Name, s2Name);
              activePairLabel = `Freewheeling (${s3Name}+${s2Name})`;
            }
            io = computeContinuousCurrent(normTheta, alphaPosRad, params);
            is = 0;
          } else {
            // Neither S3 nor S4 is a diode, and no D_FW:
            // Both are thyristors waiting for firing pulse at PI + alpha!
            // Inductive current forces incoming pair (S1 + S2) to remain ON -> Negative Excursion
            activeSwitches.push(s1Name, s2Name);
            activePairLabel = `${s1Name} + ${s2Name} (Negative Excursion)`;
            vo = vs; // vs < 0
            io = computeContinuousCurrent(normTheta, alphaPosRad, params);
            is = io;
          }
        } else if (normTheta >= PI + alphaNegRad && normTheta < TWO_PI) {
          // Negative half cycle active conduction
          activeSwitches.push(s3Name, s4Name);
          activePairLabel = `${s3Name} + ${s4Name} (Active)`;
          vo = -vs;
          const refAngle = normTheta - PI;
          io = computeContinuousCurrent(refAngle, alphaNegRad, params);
          is = -io;
        } else {
          // normTheta < alphaPosRad: delay interval in positive cycle
          if (canFreewheelPos) {
            // Natural freewheeling clamp through diode(s) or D_FW
            vo = 0;
            if (showFreewheelingDiode) {
              activeSwitches.push('D_FW');
              activePairLabel = 'Freewheeling (D_FW)';
            } else if (!isS1Thyristor) {
              activeSwitches.push(s1Name, s4Name);
              activePairLabel = `Freewheeling (${s1Name}+${s4Name})`;
            } else {
              activeSwitches.push(s3Name, s2Name);
              activePairLabel = `Freewheeling (${s3Name}+${s2Name})`;
            }
            io = computeContinuousCurrent(normTheta + PI, alphaNegRad, params);
            is = 0;
          } else {
            // Neither S1 nor S2 is a diode, and no D_FW:
            // Both are thyristors waiting for firing pulse at alpha!
            // Inductive current forces previous pair (S3 + S4) to remain ON -> Negative Excursion
            activeSwitches.push(s3Name, s4Name);
            activePairLabel = `${s3Name} + ${s4Name} (Negative Excursion)`;
            vo = -vs; // -vs < 0 because vs > 0
            io = computeContinuousCurrent(normTheta + PI, alphaNegRad, params);
            is = -io;
          }
        }
      } else {
        // Discontinuous Conduction Mode
        const extinctionAngle = computeExtinctionAngle(alphaPosRad, params);
        if (normTheta >= alphaPosRad && normTheta < extinctionAngle) {
          activeSwitches.push(s1Name, s2Name);
          activePairLabel = `${s1Name} + ${s2Name} (Conducting)`;
          vo = vs;
          io = computeDiscontinuousCurrent(normTheta, alphaPosRad, params);
          is = io;
        } else if (
          normTheta >= PI + alphaNegRad &&
          normTheta < Math.min(TWO_PI, PI + computeExtinctionAngle(alphaNegRad, params))
        ) {
          activeSwitches.push(s3Name, s4Name);
          activePairLabel = `${s3Name} + ${s4Name} (Conducting)`;
          vo = -vs;
          io = computeDiscontinuousCurrent(normTheta - PI, alphaNegRad, params);
          is = -io;
        } else {
          vo = loadType === 'RLE' ? backEmf : 0;
          io = 0;
          is = 0;
          activePairLabel = 'Discontinuous Interval (OFF)';
        }

        if (showFreewheelingDiode && vo < 0) {
          vo = 0;
          activeSwitches.length = 0;
          activeSwitches.push('D_FW');
          activePairLabel = 'Freewheeling Diode D_FW';
          is = 0;
        } else if (vo < 0) {
          const isNeg = normTheta >= PI;
          const canFw = isNeg ? canFreewheelNeg : canFreewheelPos;
          if (canFw) {
            vo = 0;
            is = 0;
            activeSwitches.length = 0;
            if (isNeg) {
              if (!isS4Thyristor) activeSwitches.push(s1Name, s4Name);
              else activeSwitches.push(s3Name, s2Name);
            } else {
              if (!isS1Thyristor) activeSwitches.push(s1Name, s4Name);
              else activeSwitches.push(s3Name, s2Name);
            }
            activePairLabel = `Freewheeling (${activeSwitches.join('+')})`;
          }
        }
      }
    }

    if (loadType === 'RLE' && vo < backEmf && Math.abs(io) < 0.05) {
      vo = backEmf;
      io = 0;
      is = 0;
      activeSwitches.length = 0;
      activePairLabel = 'Blocking (vo = E)';
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
  const { resistance, inductance, backEmf, highlyInductive, vPeak, loadType, showFreewheelingDiode } = params;
  const R = Math.max(resistance, 0.2);

  // Exact steady state DC average (with freewheeling diode, negative voltage is clamped so Vavg = (Vm/π)(1 + cosα))
  const vAvg = showFreewheelingDiode
    ? (vPeak / PI) * (1 + Math.cos(alpha))
    : ((2 * vPeak) / PI) * Math.cos(alpha);
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
      if (params.showFreewheelingDiode) {
        vDcAvg = (vPeak / PI) * (1 + Math.cos(alphaRad));
        vRms =
          (vPeak / Math.SQRT2) *
          Math.sqrt(Math.max(0, 1 - alphaRad / PI + Math.sin(2 * alphaRad) / (2 * PI)));
      } else {
        vDcAvg = ((2 * vPeak) / PI) * Math.cos(alphaRad);
        vRms = vPeak / Math.SQRT2;
      }
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

  const hasSwitchOverrides = Boolean(params.switchOverrides && Object.keys(params.switchOverrides).length > 0);
  const finalVDc = hasSwitchOverrides ? numVDc : (Number.isFinite(vDcAvg) ? vDcAvg : numVDc);
  const finalVRms = hasSwitchOverrides ? numVRms : (Number.isFinite(vRms) ? vRms : numVRms);

  return {
    vDcAvg: finalVDc,
    vRms: finalVRms,
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
