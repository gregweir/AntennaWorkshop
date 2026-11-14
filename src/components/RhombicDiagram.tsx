/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateRhombic } from '../calculators/rhombic';
import { formatLength, type UnitSystem } from '../lib/units';

type RhombicResult = ReturnType<typeof calculateRhombic>;

export function RhombicDiagram({ result, unitSystem }: { result: RhombicResult; unitSystem: UnitSystem }) {
  const halfAngleRadians = result.includedAngleDegrees * Math.PI / 360;
  const halfWidth = 250 * Math.sin(halfAngleRadians);
  const halfDepth = 250 * Math.cos(halfAngleRadians);
  const feedY = 420;
  const sideY = feedY - halfDepth;
  const farY = feedY - 2 * halfDepth;
  return <figure className="antenna-figure v-beam-figure rhombic-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="rhombic-title rhombic-desc">
      <title id="rhombic-title">Dimensioned four-support rhombic antenna site plan</title>
      <desc id="rhombic-desc">Plan view of four {formatLength(result.designSideMetres, unitSystem)} sides forming a rhombus with a {result.includedAngleDegrees} degree feed-apex angle, {formatLength(result.forwardDepthMetres, unitSystem)} long diagonal, and {formatLength(result.crossSpanMetres, unitSystem)} cross span, oriented toward {result.forwardBearingDegrees.toFixed(0)} degrees {result.forwardCompassPoint}.</desc>
      <defs><marker id="rhombic-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="455" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      <g className="v-beam-wire rhombic-wire"><path d={`M380 ${feedY} L${380 - halfWidth} ${sideY} L380 ${farY} L${380 + halfWidth} ${sideY} Z`} /></g>
      <g className="v-beam-feed"><circle cx="380" cy={feedY} r="10" /><path d={`M380 ${feedY + 10} V464`} /><text x="398" y={feedY + 25}>A · BALANCED FEED</text></g>
      <g className="v-beam-endpoints rhombic-supports"><circle cx={380 - halfWidth} cy={sideY} r="8" /><circle cx={380 + halfWidth} cy={sideY} r="8" /><circle cx="380" cy={farY} r="8" /><text x={360 - halfWidth} y={sideY + 28}>B</text><text x={396 + halfWidth} y={sideY + 28}>D</text><text x="398" y={farY + 5}>C · {result.mode === 'terminated' ? 'TERMINATION' : 'OPEN APEX'}</text>{result.mode === 'terminated' && <><rect x="360" y={farY - 34} width="40" height="20" rx="3" /><text x="380" y={farY - 19} textAnchor="middle">R</text></>}</g>
      <g className="v-beam-direction"><line x1="380" y1={sideY + 55} x2="380" y2={Math.max(38, farY - 54)} markerEnd="url(#rhombic-arrow)" /><text x="398" y={Math.max(52, farY - 42)}>{result.mode === 'terminated' ? 'FORWARD' : 'FORWARD AXIS'} · {result.forwardBearingDegrees.toFixed(0)}° {result.forwardCompassPoint}</text>{result.mode === 'open' && <><line x1="380" y1={feedY} x2="380" y2="474" markerEnd="url(#rhombic-arrow)" /><text x="398" y="480">REVERSE · {result.reverseBearingDegrees.toFixed(0)}° {result.reverseCompassPoint}</text></>}</g>
      <g className="v-beam-angle"><path d={`M${380 - 58 * Math.sin(halfAngleRadians)} ${feedY - 58 * Math.cos(halfAngleRadians)} A58 58 0 0 1 ${380 + 58 * Math.sin(halfAngleRadians)} ${feedY - 58 * Math.cos(halfAngleRadians)}`} /><text x="380" y={feedY - 55} textAnchor="middle">{result.includedAngleDegrees}°</text></g>
      <g className="v-beam-labels rhombic-labels"><text x={354 - halfWidth / 2} y={feedY - halfDepth / 2} textAnchor="end">SIDE · {formatLength(result.designSideMetres, unitSystem)}</text><text x={406 + halfWidth / 2} y={feedY - halfDepth / 2}>SIDE · {formatLength(result.designSideMetres, unitSystem)}</text><text x="380" y={sideY - 18} textAnchor="middle">CROSS SPAN · {formatLength(result.crossSpanMetres, unitSystem)}</text><text x="398" y={sideY + 50}>DEPTH · {formatLength(result.forwardDepthMetres, unitSystem)}</text></g>
    </svg>
    <figcaption>Plan geometry oriented along the entered true bearing · Four equal design sides; support heights, sag, terrain, feedline, ground, and termination require separate design.</figcaption>
  </figure>;
}
