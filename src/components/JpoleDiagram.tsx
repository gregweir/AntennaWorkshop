/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  longElementMetres: number;
  matchingStubMetres: number;
  halfWaveRadiatorMetres: number;
  feedpointFromShortMetres: number;
  unitSystem: UnitSystem;
}

export function JpoleDiagram({ longElementMetres, matchingStubMetres, halfWaveRadiatorMetres, feedpointFromShortMetres, unitSystem }: Props) {
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="jpole-title jpole-desc">
      <title id="jpole-title">Dimensioned J-pole antenna</title>
      <desc id="jpole-desc">A {formatLength(longElementMetres, unitSystem)} long element stands beside a {formatLength(matchingStubMetres, unitSystem)} shorted matching stub, with an adjustable coax tap near the bottom.</desc>
      <DiagramDefinitions prefix="jpole" />
      <DiagramGrid />
      <g className="jpole-conductors">
        <path d="M390 45 V275 H300 V165" />
        <line x1="300" y1="165" x2="300" y2="151" />
      </g>
      <g className="jpole-notch"><line x1="288" y1="158" x2="312" y2="158" /><text x="268" y="150" textAnchor="end">open notch</text></g>
      <g className="jpole-feed">
        <circle cx="300" cy="254" r="6" /><circle cx="390" cy="254" r="6" />
        <path d="M300 254 H390 M345 254 V300" />
        <text x="455" y="260">adjustable 50 Ω coax tap</text>
      </g>
      <SvgDimension prefix="jpole" x1={445} y1={45} x2={445} y2={275} label={`Long element · ${formatLength(longElementMetres, unitSystem)}`} labelX={550} labelY={125} />
      <SvgDimension prefix="jpole" x1={245} y1={165} x2={245} y2={275} label={`¼-wave stub · ${formatLength(matchingStubMetres, unitSystem)}`} labelX={150} labelY={215} />
      <g className="end-labels">
        <text x="505" y="178">½-wave radiator above stub</text>
        <text x="505" y="198">{formatLength(halfWaveRadiatorMetres, unitSystem)}</text>
        <text x="345" y="320" textAnchor="middle">tap height · {formatLength(feedpointFromShortMetres, unitSystem)}</text>
      </g>
    </svg>
    <figcaption>Electrical construction diagram · Keep the matching section parallel and tune the tap and element lengths with an analyser.</figcaption>
  </figure>;
}
