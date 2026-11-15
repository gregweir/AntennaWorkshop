/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, useMemo, useState } from 'react';
import { calculateSameSwrComparison, type SameSwrExample } from '../calculators/swrImpedanceLesson';
import type { ExplanationDepth } from '../preferences';

interface Props {
  depth: ExplanationDepth;
  onOpenExplorer: () => void;
}

function formatImpedance(example: SameSwrExample) {
  const resistance = example.resistanceOhms.toFixed(example.resistanceOhms < 100 ? 2 : 1);
  if (Math.abs(example.reactanceOhms) < 0.005) return `${resistance} + j0 Ω`;
  return `${resistance} + j${example.reactanceOhms.toFixed(2)} Ω`;
}

function ReflectionMiniChart({ example }: { example: SameSwrExample }) {
  const x = 50 + example.reflectionReal * 38;
  const y = 50 - example.reflectionImaginary * 38;
  return <svg viewBox="0 0 100 100" role="img" aria-label={`${example.label} reflection point`}><title>{example.label} reflection point</title><desc>The point has the same distance from the centre as the other examples, but a different direction.</desc><circle cx="50" cy="50" r="38" /><path d="M12 50h76M50 12v76" /><path className="reflection-vector" d={`M50 50L${x} ${y}`} /><circle className="reflection-point" cx={x} cy={y} r="4" /></svg>;
}

export function SwrImpedanceLesson({ depth, onOpenExplorer }: Props) {
  const [targetSwr, setTargetSwr] = useState(2);
  const outputId = useId();
  const comparison = useMemo(() => calculateSameSwrComparison(targetSwr), [targetSwr]);
  return <details className="swr-impedance-lesson">
    <summary><span><strong>Interactive lesson: one SWR, different impedances</strong><small>See what a scalar SWR reading leaves unresolved.</small></span></summary>
    <div className="swr-impedance-body">
      <div className="swr-lesson-control">
        <label htmlFor="lesson-target-swr"><span>Shared SWR</span><output id={outputId}>{targetSwr.toFixed(2)} : 1</output></label>
        <input id="lesson-target-swr" type="range" min="1.1" max="10" step="0.1" value={targetSwr} aria-describedby={outputId} onChange={(event) => setTargetSwr(Number(event.target.value))} />
      </div>
      <div className="same-swr-examples">{comparison.examples.map((example) => <article key={example.kind}>
        <ReflectionMiniChart example={example} />
        <div><strong>{example.label}</strong><code>{formatImpedance(example)}</code><span>Γ phase {example.reflectionPhaseDegrees.toFixed(1)}°</span></div>
      </article>)}</div>
      <p className="same-swr-observation"><strong>Same scalar result:</strong> every load above is {targetSwr.toFixed(2)} : 1 on a 50 Ω reference system, with |Γ| {comparison.reflectionMagnitude.toFixed(3)} and {comparison.reflectedPowerPercent.toFixed(1)}% mismatch-reflected power in the ideal reference calculation.</p>
      {depth !== 'quick' && <p>The high- and low-resistance loads require different transformations, while the reactive load also requires reactance cancellation. A tuner can change what the transmitter sees without changing antenna loss, feedline loss, common-mode current, pattern, or radiation efficiency.</p>}
      {depth === 'technical' && <p className="formula">Γ = (ZL − Z0) ÷ (ZL + Z0) · SWR = (1 + |Γ|) ÷ (1 − |Γ|) · SWR discards Γ phase</p>}
      <div className="swr-lesson-actions"><p><strong>Interpretation limit:</strong> SWR describes mismatch relative to a reference impedance. It does not identify the complex load by itself and does not establish antenna efficiency, radiation, bandwidth away from the sample, feedline heating, or safe operating power.</p><button type="button" onClick={onOpenExplorer}>Open full impedance explorer</button></div>
    </div>
  </details>;
}
