/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, useMemo, useState } from 'react';
import { calculateElectricalLengthComparison } from '../calculators/electricalLengthLesson';
import { formatLength, type UnitSystem } from '../lib/units';
import type { ExplanationDepth } from '../preferences';

interface Props {
  frequencyMHz: number;
  unitSystem: UnitSystem;
  depth: ExplanationDepth;
}

function signedPercent(value: number) {
  if (Math.abs(value) < 0.005) return 'no change';
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(1)}%`;
}

export function ElectricalLengthLesson({ frequencyMHz, unitSystem, depth }: Props) {
  const [multiplier, setMultiplier] = useState(1.5);
  const outputId = useId();
  const comparison = useMemo(() => Number.isFinite(frequencyMHz) && frequencyMHz > 0
    ? calculateElectricalLengthComparison(frequencyMHz, multiplier)
    : null, [frequencyMHz, multiplier]);
  if (!comparison) return null;
  const maximumHalfWave = Math.max(comparison.base.halfWaveMetres, comparison.comparison.halfWaveMetres);
  const frequencyDigits = comparison.comparison.frequencyMHz < 30 ? 3 : 1;
  return <details className="electrical-length-lesson">
    <summary><span><strong>Interactive lesson: electrical length</strong><small>Change frequency and watch free-space wavelength respond.</small></span></summary>
    <div className="electrical-length-body">
      <div className="electrical-length-control">
        <label htmlFor="electrical-length-multiplier"><span>Comparison frequency</span><output id={outputId}>{comparison.comparison.frequencyMHz.toFixed(frequencyDigits)} MHz · {multiplier.toFixed(2)}×</output></label>
        <input id="electrical-length-multiplier" type="range" min="0.5" max="2" step="0.05" value={multiplier} aria-describedby={outputId} onChange={(event) => setMultiplier(Number(event.target.value))} />
        <div aria-hidden="true"><span>Half frequency</span><span>Current</span><span>Double frequency</span></div>
      </div>
      <div className="electrical-length-bars" aria-label="Free-space half-wave length comparison">
        <div><span>Current · {comparison.base.frequencyMHz.toFixed(comparison.base.frequencyMHz < 30 ? 3 : 1)} MHz</span><i style={{ width: `${comparison.base.halfWaveMetres / maximumHalfWave * 100}%` }} /><strong>{formatLength(comparison.base.halfWaveMetres, unitSystem)}</strong></div>
        <div><span>Comparison · {comparison.comparison.frequencyMHz.toFixed(frequencyDigits)} MHz</span><i style={{ width: `${comparison.comparison.halfWaveMetres / maximumHalfWave * 100}%` }} /><strong>{formatLength(comparison.comparison.halfWaveMetres, unitSystem)}</strong></div>
      </div>
      <p className="electrical-length-observation"><strong>Observed relationship:</strong> the comparison half wave is {comparison.halfWaveLengthRatio.toFixed(3)}× the current length ({signedPercent(comparison.halfWaveChangePercent)}).</p>
      {depth !== 'quick' && <p>Frequency and free-space wavelength move in opposite directions. This is why antennas for lower frequencies generally require longer conductors, loading, folding, or a different physical approach.</p>}
      {depth === 'technical' && <p className="formula">λ = c ÷ f · free-space half wave = λ ÷ 2 · length ratio = current frequency ÷ comparison frequency</p>}
      <p className="electrical-length-limit"><strong>Construction limit:</strong> these bars show geometric free-space half waves only. Conductor properties, insulation, diameter, end effects, height, ground, supports, loading, coupling, and nearby objects change the installed electrical length. Use the selected planner for a starting cut, then measure the installed antenna.</p>
    </div>
  </details>;
}
