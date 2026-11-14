/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateIdealTransformer, ConnectionForm } from '../calculators/idealTransformer';
import { DiagramDefinitions, DiagramGrid } from './diagram/DiagramPrimitives';

interface Props {
  result: ReturnType<typeof calculateIdealTransformer>;
}

function connectionLabel(connection: ConnectionForm) {
  return connection === 'balanced' ? 'balanced' : 'unbalanced';
}

export function IdealTransformerDiagram({ result }: Props) {
  const best = result.candidates[0];
  return <figure className="antenna-figure ideal-transformer-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 390" role="img" aria-labelledby="ideal-transformer-title ideal-transformer-desc">
      <title id="ideal-transformer-title">Ideal {result.deviceClass} ratio diagram</title>
      <desc id="ideal-transformer-desc">A conceptual two-winding {result.deviceClass} from a {result.sourceResistanceOhms.toFixed(2)} ohm {connectionLabel(result.sourceConnection)} source using {result.sourceTurns} turns to a {result.loadResistanceOhms.toFixed(2)} ohm {connectionLabel(result.loadConnection)} load using {best.loadTurns} turns in the closest integer option.</desc>
      <DiagramDefinitions prefix="ideal-transformer" />
      <DiagramGrid />
      <g className="ideal-transformer-terminal source"><rect x="42" y="110" width="165" height="125" rx="18" /><text x="124" y="148" textAnchor="middle">SOURCE</text><text x="124" y="180" textAnchor="middle">{result.sourceResistanceOhms.toFixed(2)} Ω</text><text x="124" y="207" textAnchor="middle">{connectionLabel(result.sourceConnection)}</text></g>
      <g className="ideal-transformer-winding source"><path d="M265 105 q-34 18 0 36 q-34 18 0 36 q-34 18 0 36 q-34 18 0 36" /><text x="260" y="282" textAnchor="middle">{result.sourceTurns} turns</text></g>
      <g className="ideal-transformer-core"><path d="M345 95 V260 M365 95 V260" /><text x="355" y="74" textAnchor="middle">core not selected</text></g>
      <g className="ideal-transformer-winding load"><path d="M445 105 q34 18 0 36 q34 18 0 36 q34 18 0 36 q34 18 0 36" /><text x="450" y="282" textAnchor="middle">{best.loadTurns} turns</text></g>
      <g className="ideal-transformer-terminal load"><rect x="503" y="110" width="215" height="125" rx="18" /><text x="610" y="148" textAnchor="middle">LOAD</text><text x="610" y="180" textAnchor="middle">{result.loadResistanceOhms.toFixed(2)} Ω</text><text x="610" y="207" textAnchor="middle">{connectionLabel(result.loadConnection)}</text></g>
      <g className="ideal-transformer-wire"><path d="M207 145 H247 M207 205 H247 M463 145 H503 M463 205 H503" /></g>
      <text className="ideal-transformer-ratio" x="380" y="325" textAnchor="middle">ideal turns ratio · 1 : {result.idealTurnsRatioLoadToSource.toFixed(3)}</text>
      <text className="ideal-transformer-ratio" x="380" y="354" textAnchor="middle">ideal impedance ratio · 1 : {result.idealImpedanceRatioLoadToSource.toFixed(3)}</text>
      <text className="ideal-transformer-ratio muted" x="380" y="381" textAnchor="middle">conceptual two-winding model · winding topology and core remain separate</text>
    </svg>
    <div className="ideal-transformer-options" aria-label="Adjacent integer winding options">{result.candidates.map((option, index) => <article key={option.loadTurns}><span>{index === 0 ? 'Closest integer option' : 'Alternate integer option'}</span><strong>{result.sourceTurns}:{option.loadTurns} turns</strong><dl><div><dt>Reflected input</dt><dd>{option.reflectedInputResistanceOhms.toFixed(2)} Ω</dd></div><div><dt>Ideal SWR</dt><dd>{option.idealSWR.toFixed(3)} : 1</dd></div><div><dt>Resistance error</dt><dd>{option.resistanceErrorPercent > 0 ? '+' : ''}{option.resistanceErrorPercent.toFixed(2)}%</dd></div></dl></article>)}</div>
    <figcaption>Conceptual ratio view only · Coil shapes do not prescribe winding layout, core, wire, transmission-line construction, grounding, isolation, or current/voltage-balun behaviour.</figcaption>
  </figure>;
}
