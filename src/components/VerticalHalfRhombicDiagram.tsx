/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateVerticalHalfRhombic } from '../calculators/verticalHalfRhombic';
import { formatLength, type UnitSystem } from '../lib/units';

type Result = ReturnType<typeof calculateVerticalHalfRhombic>;

export function VerticalHalfRhombicDiagram({ result, unitSystem }: { result: Result; unitSystem: UnitSystem }) {
  return <figure className="antenna-figure v-beam-figure half-rhombic-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="half-rhombic-title half-rhombic-desc">
      <title id="half-rhombic-title">Dimensioned vertical half-rhombic elevation and site-axis diagram</title>
      <desc id="half-rhombic-desc">Elevation of two equal {formatLength(result.designLegMetres, unitSystem)} sloping wire legs meeting at an apex {formatLength(result.apexHeightMetres, unitSystem)} high, over a {formatLength(result.baseSpanMetres, unitSystem)} counterpoise route aimed toward {result.forwardBearingDegrees.toFixed(0)} degrees {result.forwardCompassPoint}.</desc>
      <defs><marker id="half-rhombic-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="455" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      <g className="half-rhombic-wire"><path d="M100 390 L380 90 L660 390" /><path className="counterpoise" d="M100 420 H660" /></g>
      <g className="half-rhombic-support"><line x1="380" y1="90" x2="380" y2="420" /><circle cx="380" cy="90" r="9" /><text x="398" y="78">B · APEX SUPPORT</text></g>
      <g className="v-beam-feed"><circle cx="100" cy="390" r="9" /><path d="M100 400 V440" /><text x="62" y="372">A · FEED</text></g>
      <g className="v-beam-endpoints"><circle cx="660" cy="390" r="9" /><text x="610" y="372">C · {result.mode === 'terminated' ? 'TERMINATION' : 'OPEN END'}</text>{result.mode === 'terminated' && <><rect x="640" y="404" width="40" height="22" rx="3" /><text x="660" y="420" textAnchor="middle">R</text></>}</g>
      <g className="v-beam-direction"><line x1="455" y1="458" x2="675" y2="458" markerEnd="url(#half-rhombic-arrow)" /><text x="565" y="450" textAnchor="middle">{result.mode === 'terminated' ? 'FORWARD' : 'FORWARD AXIS'} · {result.forwardBearingDegrees.toFixed(0)}° {result.forwardCompassPoint}</text>{result.mode === 'open' && <><line x1="305" y1="458" x2="85" y2="458" markerEnd="url(#half-rhombic-arrow)" /><text x="195" y="450" textAnchor="middle">REVERSE · {result.reverseBearingDegrees.toFixed(0)}°</text></>}</g>
      <g className="v-beam-labels"><text x="220" y="218" textAnchor="middle">LEG A · {formatLength(result.designLegMetres, unitSystem)}</text><text x="540" y="218" textAnchor="middle">LEG B · {formatLength(result.designLegMetres, unitSystem)}</text><text x="380" y="444" textAnchor="middle">COUNTERPOISE · {formatLength(result.designCounterpoiseMetres, unitSystem)}</text><text x="398" y="260">HEIGHT · {formatLength(result.apexHeightMetres, unitSystem)}</text><text x="380" y="112" textAnchor="middle">{result.slopeAngleDegrees.toFixed(1)}° SLOPE</text></g>
    </svg>
    <figcaption>Elevation along the entered true-bearing axis · Ideal equal slopes and level ground; actual sag, terrain, supports, feed, ground, and termination require separate design.</figcaption>
  </figure>;
}
