/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { evaluateMatchingTuningLesson, type MatchingLessonLoad, type MatchingLessonNetwork } from '../calculators/matchingTuningLesson';
import type { ExplanationDepth } from '../preferences';

interface Props { depth: ExplanationDepth; frequencyMHz: number }

function formatImpedance(resistance: number, reactance: number) {
  return `${resistance.toFixed(1)} ${reactance < 0 ? '−' : '+'} j${Math.abs(reactance).toFixed(1)} Ω`;
}

export function MatchingTuningLesson({ depth, frequencyMHz }: Props) {
  const [loadId, setLoadId] = useState<MatchingLessonLoad>('resonant-mismatch');
  const [network, setNetwork] = useState<MatchingLessonNetwork>('bypass');
  const result = useMemo(() => evaluateMatchingTuningLesson(frequencyMHz, loadId, network), [frequencyMHz, loadId, network]);
  return <details className="matching-tuning-lesson">
    <summary><span><strong>Interactive lesson: resonance, matching, and tuning</strong><small>Compare the antenna terminal with what the source sees.</small></span></summary>
    <div className="matching-tuning-body">
      <div className="matching-tuning-controls">
        <fieldset><legend>Antenna-terminal load</legend>
          <button type="button" aria-pressed={loadId === 'resonant-mismatch'} onClick={() => setLoadId('resonant-mismatch')}>100 + j0 Ω</button>
          <button type="button" aria-pressed={loadId === 'reactive-fifty'} onClick={() => setLoadId('reactive-fifty')}>50 + j30 Ω</button>
          <button type="button" aria-pressed={loadId === 'complex-load'} onClick={() => setLoadId('complex-load')}>25 + j50 Ω</button>
        </fieldset>
        <fieldset><legend>Network state</legend><button type="button" aria-pressed={network === 'bypass'} onClick={() => setNetwork('bypass')}>Bypassed</button><button type="button" aria-pressed={network === 'ideal-l-match'} onClick={() => setNetwork('ideal-l-match')}>Ideal L-match</button></fieldset>
      </div>
      <article className="matching-tuning-outcome"><p className="eyebrow">At {frequencyMHz.toFixed(3)} MHz</p><h4>{result.headline}</h4><p>{result.loadLabel}. {result.loadIsResonant ? 'The antenna-terminal reactance is zero.' : 'The antenna-terminal reactance is not zero.'}</p></article>
      <div className="matching-plane-graphic">
        <svg viewBox="0 0 660 180" role="img" aria-labelledby="matching-plane-title matching-plane-desc"><title id="matching-plane-title">Antenna, matching network, and source reference planes</title><desc id="matching-plane-desc">The antenna load connects through a selectable bypass or ideal lossless L-network to a 50 ohm source. Values are stated in the cards below the diagram.</desc><path d="M125 90H275M385 90H535" /><rect x="35" y="48" width="90" height="84" rx="14" /><rect className={network === 'ideal-l-match' ? 'network-active' : ''} x="275" y="48" width="110" height="84" rx="14" /><rect x="535" y="48" width="90" height="84" rx="14" /><circle cx="125" cy="90" r="5" /><circle cx="535" cy="90" r="5" /></svg>
        <div className="matching-plane-labels"><div><strong>Antenna terminal</strong><span>{formatImpedance(result.loadResistanceOhms, result.loadReactanceOhms)}</span><small>{result.loadIsResonant ? 'Resonant load' : 'Reactive load'} · SWR {result.loadSwr.toFixed(2)} : 1</small></div><div><strong>{network === 'ideal-l-match' ? 'Ideal lossless L-match' : 'Network bypassed'}</strong><span>{network === 'ideal-l-match' ? 'Transforms one frequency' : 'No transformation'}</span><small>The load itself remains unchanged</small></div><div><strong>50 Ω source plane</strong><span>{formatImpedance(result.inputResistanceOhms, result.inputReactanceOhms)}</span><small>SWR {result.inputSwr.toFixed(2)} : 1</small></div></div>
      </div>
      {depth !== 'quick' && <div className="matching-builder-notes"><p><strong>Resonance:</strong> zero reactance at the stated reference plane does not require the resistance to be 50 Ω.</p><p><strong>Matching:</strong> a network can transform the impedance seen by the source without changing the antenna-terminal impedance or proving useful radiation.</p></div>}
      {depth === 'technical' && <p className="formula">At resonance: X = 0 at the stated plane · For an ideal source match: Zin = Z0 = 50 + j0 Ω · the synthesized network is lossless and valid only at this modelled frequency</p>}
      <p className="matching-interpretation-limit"><strong>Interpretation limit:</strong> an ideal one-frequency match does not establish bandwidth, efficiency, radiation, network loss, component Q, voltage, current, heating, common mode, exposure, or safe power. Measure at named reference planes with the installed feed system.</p>
    </div>
  </details>;
}
