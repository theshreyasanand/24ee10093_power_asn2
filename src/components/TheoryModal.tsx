import React from 'react';
import { X, BookOpen, CheckCircle, Zap } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TheoryModal: React.FC<TheoryModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 rounded-t-2xl">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-lg">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Theory & Mathematical Derivations
              </h2>
              <p className="text-xs text-slate-500">
                Power Electronics: Single-Phase Diode & Double Bridge Thyristor Rectifiers
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-700">
          {/* Section 1 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              1. Uncontrolled Diode Bridge Rectifier
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Consists of 4 power diodes connected in a bridge configuration (D1, D2, D3, D4).
              During the positive half-cycle ($0 \le \omega t \le \pi$), diodes D1 and D2 are forward biased and conduct.
              During the negative half-cycle ($\pi \le \omega t \le 2\pi$), diodes D3 and D4 conduct.
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
              <div>Average Output Voltage: <strong>Vdc = (2·Vm) / π ≈ 0.6366 · Vm</strong></div>
              <div>RMS Output Voltage: <strong>Vrms = Vm / √2 ≈ 0.7071 · Vm</strong></div>
              <div>Form Factor (FF): <strong>Vrms / Vdc = π / (2√2) ≈ 1.11</strong></div>
              <div>Voltage Ripple Factor: <strong>γ = √(FF² - 1) ≈ 0.482 (48.2%)</strong></div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              2. Single-Phase Fully Controlled Thyristor Bridge
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Replaces the 4 diodes with Silicon Controlled Rectifiers (SCRs T1–T4). Firing pulses are delayed by firing angle α:
            </p>
            <ul className="list-disc pl-5 text-xs text-slate-600 space-y-1">
              <li>Pair T1 and T2 is triggered at $\omega t = \alpha$ and conducts until $\pi + \alpha$.</li>
              <li>Pair T3 and T4 is triggered at $\omega t = \pi + \alpha$ and conducts until $2\pi + \alpha$.</li>
              <li>With an inductive (RL) load in continuous conduction, the load inductor sustains conduction into negative voltage regions:</li>
            </ul>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
              <div>Continuous Conduction Vdc: <strong>Vdc = (2·Vm / π) · cos(α)</strong></div>
              <div>For α &lt; 90°: <strong>Vdc &gt; 0</strong> (Rectification Mode: AC supply supplies power to DC load)</div>
              <div>For α &gt; 90°: <strong>Vdc &lt; 0</strong> (Inversion Mode: DC side returns power to AC supply if active source E is present)</div>
              <div>Resistive Load (R only): <strong>Vdc = (Vm / π) · (1 + cos(α))</strong></div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              3. Double Bridge Thyristor Controlled Rectifier (Dual Converter)
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              To achieve full <strong>Four-Quadrant Operation</strong> (bidirectional voltage and bidirectional current), two identical full thyristor bridges are connected in antiparallel across the same load terminals:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg">
                <div className="font-semibold text-blue-900 mb-1">Bridge 1 (Positive Group)</div>
                <div className="text-blue-800">Produces positive DC terminal voltage and allows current flow in the positive direction (Io &gt; 0). Firing angle is α1.</div>
              </div>
              <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                <div className="font-semibold text-indigo-900 mb-1">Bridge 2 (Negative Group)</div>
                <div className="text-indigo-800">Connected in opposite polarity to conduct negative load current (Io &lt; 0). Firing angle is α2.</div>
              </div>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
              <div>Coordinated Firing Condition: <strong>α1 + α2 = 180°</strong></div>
              <div>Average Voltages: <strong>Vdc1 = (2Vm/π)cos(α1) = -Vdc2 = -(2Vm/π)cos(α2)</strong></div>
              <div>Circulating Current Mode: Current limiting reactor Lr prevents large circulating currents caused by instantaneous ripple difference [vo1(t) - vo2(t)].</div>
              <div>Non-Circulating Current Mode: Only one bridge conducts at any time; the idle bridge has gate pulses inhibited to avoid circulating currents.</div>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              4. Input Current Harmonics & Power Factor
            </h3>
            <p className="text-slate-600 text-xs leading-relaxed">
              Assuming ripple-free continuous DC current Io = Idc, the input AC current is(t) is a quasi-square wave shifted by firing angle α:
            </p>
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 font-mono text-xs space-y-1">
              <div>Fourier Series: <strong>is(t) = ∑ [ (4·Idc)/(n·π) · sin(n·ωt - n·α) ]</strong> for odd n (1, 3, 5, 7...)</div>
              <div>Fundamental RMS: <strong>Is1,rms = (2√2 / π) · Idc ≈ 0.90 · Idc</strong></div>
              <div>Displacement Factor: <strong>DF = cos(α)</strong></div>
              <div>Input Power Factor: <strong>PF = (Is1,rms / Is,rms) · cos(α) = (2√2 / π) · cos(α) ≈ 0.90 · cos(α)</strong></div>
              <div>Current THD: <strong>THD = √( (π²/8) - 1 ) ≈ 48.34%</strong></div>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-200 bg-slate-50 rounded-b-2xl">
          <span className="text-xs text-slate-500 font-mono">
            Shreyas' In Class Assignment • Roll No: 24EE10093 • Power Electronics Laboratory
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Close Reference
          </button>
        </div>
      </div>
    </div>
  );
};
