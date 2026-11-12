/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  overallHeightMetres: number;
  matchingStubMetres: number;
  upperFoldedSectionMetres: number;
  gapMetres: number;
  feedpointMetres: number;
  unitSystem: UnitSystem;
}

export function SlimJimDiagram({ overallHeightMetres, matchingStubMetres, upperFoldedSectionMetres, gapMetres, feedpointMetres, unitSystem }: Props) {
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="slim-title slim-desc">
      <title id="slim-title">Dimensioned Slim Jim antenna</title>
      <desc id="slim-desc">A continuous {formatLength(overallHeightMetres, unitSystem)} conductor is paired with a split conductor comprising a shorted matching stub, interruption gap, and upper folded section.</desc>
      <DiagramDefinitions prefix="slim" />
      <DiagramGrid />
      <g className="jpole-conductors">
        <path d="M410 45 V275 H310 V205" />
        <line x1="310" y1="185" x2="310" y2="45" />
      </g>
      <g className="slim-gap"><line x1="296" y1="195" x2="324" y2="195" /><text x="280" y="199" textAnchor="end">gap · {formatLength(gapMetres, unitSystem)}</text></g>
      <g className="jpole-feed"><circle cx="310" cy="254" r="6" /><circle cx="410" cy="254" r="6" /><path d="M310 254 H410 M360 254 V300" /><text x="455" y="260">adjustable coax tap</text></g>
      <SvgDimension prefix="slim" x1={465} y1={45} x2={465} y2={275} label={`Overall · ${formatLength(overallHeightMetres, unitSystem)}`} labelX={555} labelY={115} />
      <SvgDimension prefix="slim" x1={255} y1={205} x2={255} y2={275} label={`Stub · ${formatLength(matchingStubMetres, unitSystem)}`} labelX={170} labelY={235} />
      <g className="end-labels"><text x="155" y="95">upper folded section</text><text x="155" y="115">{formatLength(upperFoldedSectionMetres, unitSystem)}</text><text x="360" y="320" textAnchor="middle">tap height · {formatLength(feedpointMetres, unitSystem)}</text></g>
    </svg>
    <figcaption>Geometric starting model · Preserve the shorted bottom, interruption gap, parallel spacing, and vertical orientation while tuning.</figcaption>
  </figure>;
}
