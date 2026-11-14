/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateVBeam } from '../calculators/vBeam';
import { formatLength, type UnitSystem } from '../lib/units';

type VBeamResult = ReturnType<typeof calculateVBeam>;

export function VBeamDiagram({ result, unitSystem }: { result: VBeamResult; unitSystem: UnitSystem }) {
  const halfAngleRadians = result.apexAngleDegrees * Math.PI / 360;
  const endX = 270 * Math.sin(halfAngleRadians);
  const endY = 270 * Math.cos(halfAngleRadians);
  return <figure className="antenna-figure v-beam-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="v-beam-title v-beam-desc">
      <title id="v-beam-title">Dimensioned V-beam directional wire antenna site plan</title>
      <desc id="v-beam-desc">Plan view of two {formatLength(result.designLegMetres, unitSystem)} wire legs meeting at a {result.apexAngleDegrees} degree feed apex and opening toward {result.targetBearingDegrees.toFixed(0)} degrees {result.targetCompassPoint}. Endpoint separation is {formatLength(result.endpointSpanMetres, unitSystem)}.</desc>
      <defs><marker id="v-beam-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="455" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      <g className="v-beam-wire"><line x1="380" y1="405" x2={380 - endX} y2={405 - endY} /><line x1="380" y1="405" x2={380 + endX} y2={405 - endY} /></g>
      <g className="v-beam-feed"><circle cx="380" cy="405" r="10" /><path d="M380 415 V454" /><text x="398" y="430">BALANCED FEED APEX</text></g>
      <g className="v-beam-endpoints"><circle cx={380 - endX} cy={405 - endY} r="8" /><circle cx={380 + endX} cy={405 - endY} r="8" />{result.mode === 'terminated' && <><rect x={360 - endX} y={414 - endY} width="40" height="20" rx="3" /><rect x={360 + endX} y={414 - endY} width="40" height="20" rx="3" /><text x={380 - endX} y={429 - endY} textAnchor="middle">R</text><text x={380 + endX} y={429 - endY} textAnchor="middle">R</text></>}</g>
      <g className="v-beam-direction"><line x1="380" y1="330" x2="380" y2="58" markerEnd="url(#v-beam-arrow)" /><text x="398" y="75">{result.mode === 'terminated' ? 'FORWARD' : 'FORWARD AXIS'} · {result.targetBearingDegrees.toFixed(0)}° {result.targetCompassPoint}</text>{result.mode === 'open' && <><line x1="380" y1="405" x2="380" y2="464" markerEnd="url(#v-beam-arrow)" /><text x="398" y="476">REVERSE · {result.reverseBearingDegrees.toFixed(0)}° {result.reverseCompassPoint}</text></>}</g>
      <g className="v-beam-angle"><path d={`M${380 - 58 * Math.sin(halfAngleRadians)} ${405 - 58 * Math.cos(halfAngleRadians)} A58 58 0 0 1 ${380 + 58 * Math.sin(halfAngleRadians)} ${405 - 58 * Math.cos(halfAngleRadians)}`} /><text x="380" y="350" textAnchor="middle">{result.apexAngleDegrees}°</text></g>
      <g className="v-beam-labels"><text x={360 - endX / 2} y={390 - endY / 2} textAnchor="end">LEG A · {formatLength(result.designLegMetres, unitSystem)}</text><text x={400 + endX / 2} y={390 - endY / 2}>LEG B · {formatLength(result.designLegMetres, unitSystem)}</text><text x="380" y={382 - endY} textAnchor="middle">ENDPOINT SPAN · {formatLength(result.endpointSpanMetres, unitSystem)}</text></g>
    </svg>
    <figcaption>Plan geometry oriented along the entered true bearing · Survey coordinates assume level ground and straight taut legs; supports, sag, height, feedline, grounds, and terminations require separate design.</figcaption>
  </figure>;
}
