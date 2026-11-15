/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { evaluateSwrEvidenceLesson, type SwrLessonLoss, type SwrLessonSourceNetwork } from '../calculators/swrEvidenceLesson';
import type { ExplanationDepth } from '../preferences';

interface Props { depth: ExplanationDepth; frequencyMHz: number }

export function SwrEvidenceLesson({ depth, frequencyMHz }: Props) {
  const [loss, setLoss] = useState<SwrLessonLoss>('0');
  const [network, setNetwork] = useState<SwrLessonSourceNetwork>('bypass');
  const result = useMemo(() => evaluateSwrEvidenceLesson(frequencyMHz, loss, network), [frequencyMHz, loss, network]);
  return <details className="swr-evidence-lesson">
    <summary><span><strong>Interactive lesson: what a low SWR does—and does not—show</strong><small>Follow the same load through line loss and a source-side network.</small></span></summary>
    <div className="swr-evidence-body">
      <div className="swr-evidence-controls"><fieldset><legend>Conceptual line’s one-way matched loss</legend>{(['0', '1', '3'] as SwrLessonLoss[]).map((value) => <button key={value} type="button" aria-pressed={loss === value} onClick={() => setLoss(value)}>{value} dB</button>)}</fieldset><fieldset><legend>Source-side network</legend><button type="button" aria-pressed={network === 'bypass'} onClick={() => setNetwork('bypass')}>Bypassed</button><button type="button" aria-pressed={network === 'ideal-match'} onClick={() => setNetwork('ideal-match')}>Ideal match</button></fieldset></div>
      <article className="swr-evidence-outcome"><p className="eyebrow">Three named reference planes</p><h4>{result.headline}</h4><p>The antenna-terminal load is fixed at 100 + j0 Ω on a 50 Ω system throughout this lesson.</p></article>
      <div className="swr-evidence-graphic"><svg viewBox="0 0 700 150" role="img" aria-labelledby="swr-evidence-title swr-evidence-desc"><title id="swr-evidence-title">Antenna, lossy line, source network, and source reference planes</title><desc id="swr-evidence-desc">A fixed antenna load connects through a conceptual line and selectable ideal source-side network. Numerical SWR values are in cards below.</desc><rect x="20" y="35" width="120" height="80" rx="14" /><path d="M140 75H275" /><rect className={Number(loss) > 0 ? 'line-loss-active' : ''} x="275" y="35" width="145" height="80" rx="14" /><path d="M420 75H505" /><rect className={network === 'ideal-match' ? 'source-network-active' : ''} x="505" y="35" width="95" height="80" rx="14" /><path d="M600 75H680" /></svg><div className="swr-evidence-planes"><div><strong>Antenna terminal</strong><span>{result.antennaSwr.toFixed(2)} : 1 SWR</span><small>Fixed 100 + j0 Ω load</small></div><div><strong>Line input</strong><span>{result.lineInputSwr.toFixed(2)} : 1 SWR</span><small>{loss} dB one-way matched loss</small></div><div><strong>Source plane</strong><span>{result.sourceSwr.toFixed(2)} : 1 SWR</span><small>{network === 'ideal-match' ? 'Ideal network enabled' : 'Network bypassed'}</small></div></div></div>
      {depth !== 'quick' && <div className="swr-evidence-notes"><p><strong>Loss effect:</strong> with {loss} dB matched one-way loss, {result.matchedOneWayPowerRemainingPercent.toFixed(1)}% of matched forward power remains after one pass in this idealized line model. The reflected wave crosses the line twice, so its round-trip attenuation is {result.roundTripReflectionAttenuationDb.toFixed(1)} dB.</p><p><strong>Matching effect:</strong> a source-side network can present a low SWR to the transmitter without changing the antenna-terminal load, feedline loss, radiation, or efficiency.</p></div>}
      {depth === 'technical' && <p className="formula">|Γin| = |Γload| × 10^(−L/10), where L is one-way matched loss in dB · SWR = (1 + |Γ|) ÷ (1 − |Γ|)</p>}
      <p className="swr-evidence-limit"><strong>Interpretation limit:</strong> SWR describes reflection magnitude at a named reference plane. A low reading alone does not establish resonance, antenna efficiency, radiation, bandwidth, feedline or network loss, heating, common mode, exposure, or safe power.</p>
    </div>
  </details>;
}
