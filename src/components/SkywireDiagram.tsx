/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { SkywireFeedSide } from '../calculators/skywire';
import { formatLength, type UnitSystem } from '../lib/units';

export function SkywireDiagram({ longSideMetres, shortSideMetres, supportHeightsMetres, feedSide, feedPositionPercent, unitSystem }: { longSideMetres: number; shortSideMetres: number; supportHeightsMetres: [number, number, number, number]; feedSide: SkywireFeedSide; feedPositionPercent: number; unitSystem: UnitSystem }) {
  const ratio = Math.min(longSideMetres / shortSideMetres, 4.2);
  const width = ratio <= 1.62 ? 260 * ratio : 420;
  const height = ratio <= 1.62 ? 260 : 420 / ratio;
  const left = 380 - width / 2;
  const top = 200 - height / 2;
  const right = left + width;
  const bottom = top + height;
  const fraction = feedPositionPercent / 100;
  const feed = feedSide === 'north' ? { x: left + width * fraction, y: top }
    : feedSide === 'east' ? { x: right, y: top + height * fraction }
      : feedSide === 'south' ? { x: right - width * fraction, y: bottom }
        : { x: left, y: bottom - height * fraction };
  const supports = [
    { id: 'A', x: left, y: top }, { id: 'B', x: right, y: top },
    { id: 'C', x: right, y: bottom }, { id: 'D', x: left, y: bottom }
  ];
  return <figure className="antenna-figure skywire-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="skywire-title skywire-desc">
      <title id="skywire-title">Dimensioned horizontal full-wave loop skywire support plan</title>
      <desc id="skywire-desc">Top-view rectangular support plan with a long side of {formatLength(longSideMetres, unitSystem)} and a short side of {formatLength(shortSideMetres, unitSystem)}. Supports A through D are {supportHeightsMetres.map((height) => formatLength(height, unitSystem)).join(', ')} high. The feedpoint is {feedPositionPercent}% along the {feedSide} side.</desc>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="455" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      <rect className="skywire-radiator" x={left} y={top} width={width} height={height} rx="4" />
      <g className="skywire-supports">{supports.map((support, index) => <g key={support.id}><circle cx={support.x} cy={support.y} r="9" /><text x={support.x + (support.x === left ? -16 : 16)} y={support.y + (support.y === top ? -14 : 25)} textAnchor={support.x === left ? 'end' : 'start'}>{support.id} · {formatLength(supportHeightsMetres[index], unitSystem)}</text></g>)}</g>
      <g className="skywire-feed"><circle cx={feed.x} cy={feed.y} r="10" /><path d={`M${feed.x} ${feed.y} L${feed.x} 425`} /><text x={feed.x} y="447" textAnchor="middle">FEED · {feedSide.toUpperCase()} {feedPositionPercent.toFixed(0)}%</text></g>
      <g className="dimension-lines"><line x1={left} y1="475" x2={right} y2="475" /><line x1={left} y1="465" x2={left} y2="485" /><line x1={right} y1="465" x2={right} y2="485" /><text x="380" y="495" textAnchor="middle">LONG SIDE · {formatLength(longSideMetres, unitSystem)}</text><text x={left - 36} y="200" transform={`rotate(-90 ${left - 36} 200)`} textAnchor="middle">SHORT SIDE · {formatLength(shortSideMetres, unitSystem)}</text></g>
    </svg>
    <figcaption>Top-view support coordinates and interpolated feed location · Height differences, sag, trees, attachment hardware, and feedline routing require a three-dimensional model and field verification.</figcaption>
  </figure>;
}
