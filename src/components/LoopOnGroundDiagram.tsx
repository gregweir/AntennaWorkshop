/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  sideLengthMetres: number;
  diagonalMetres: number;
  receiveAxisBearingDegrees: number;
  receiveCompassPoint: string;
  reverseReceiveBearingDegrees: number;
  reverseReceiveCompassPoint: string;
  feedpointBearingDegrees: number;
  feedpointCompassPoint: string;
  antennaWindingTurns: number;
  coaxWindingTurns: number;
  unitSystem: UnitSystem;
}

export function LoopOnGroundDiagram({ sideLengthMetres, diagonalMetres, receiveAxisBearingDegrees, receiveCompassPoint, reverseReceiveBearingDegrees, reverseReceiveCompassPoint, feedpointBearingDegrees, feedpointCompassPoint, antennaWindingTurns, coaxWindingTurns, unitSystem }: Props) {
  const centreX = 245;
  const centreY = 175;
  const radius = 115;
  const point = (bearingDegrees: number, pointRadius = radius) => {
    const radians = bearingDegrees * Math.PI / 180;
    return { x: centreX + Math.sin(radians) * pointRadius, y: centreY - Math.cos(radians) * pointRadius };
  };
  const corners = [0, 90, 180, 270].map((offset) => point((feedpointBearingDegrees + offset) % 360));
  const receiveEnd = point(receiveAxisBearingDegrees, radius + 22);
  const receiveStart = point(reverseReceiveBearingDegrees, radius + 22);
  const feedPoint = corners[0];

  return <figure className="antenna-figure">
    <svg className="dipole-diagram loop-on-ground-diagram" viewBox="0 0 760 520" role="img" aria-labelledby="log-title log-description">
      <title id="log-title">Loop-on-Ground receiving-antenna plan and feed isolation</title>
      <desc id="log-description">Plan view shows a square insulated-wire loop lying on the ground, corner-fed at {feedpointBearingDegrees.toFixed(0)} degrees {feedpointCompassPoint}. The expected low-angle bidirectional axis is {receiveAxisBearingDegrees.toFixed(0)} degrees {receiveCompassPoint} and {reverseReceiveBearingDegrees.toFixed(0)} degrees {reverseReceiveCompassPoint}. Detail view shows separate transformer windings and no antenna connection to earth.</desc>
      <DiagramDefinitions prefix="loop-on-ground" />
      <DiagramGrid />
      <g className="log-plan">
        <circle cx={centreX} cy={centreY} r={radius + 28} />
        <text x={centreX} y={centreY - radius - 35} textAnchor="middle">N</text><text x={centreX + radius + 37} y={centreY + 4} textAnchor="middle">E</text><text x={centreX} y={centreY + radius + 42} textAnchor="middle">S</text><text x={centreX - radius - 37} y={centreY + 4} textAnchor="middle">W</text>
        <path className="log-wire" d={`M ${corners.map(({ x, y }) => `${x} ${y}`).join(' L ')} Z`} />
        <line className="log-feed-axis" x1={corners[0].x} y1={corners[0].y} x2={corners[2].x} y2={corners[2].y} />
        <path className="log-response-arrow" d={`M ${centreX} ${centreY} L ${receiveEnd.x} ${receiveEnd.y}`} />
        <path className="log-response-arrow" d={`M ${centreX} ${centreY} L ${receiveStart.x} ${receiveStart.y}`} />
        <circle className="log-feed-point" cx={feedPoint.x} cy={feedPoint.y} r="8" />
        <text x={feedPoint.x} y={feedPoint.y - 15} textAnchor="middle">Isolated feed · {feedpointCompassPoint}</text>
        <text className="log-axis-label" x="430" y="95">Low-angle axis</text>
        <text className="log-axis-label" x="430" y="117">{receiveAxisBearingDegrees.toFixed(0)}° {receiveCompassPoint} ↔ {reverseReceiveBearingDegrees.toFixed(0)}° {reverseReceiveCompassPoint}</text>
      </g>
      <g className="log-feed-detail">
        <line className="log-surface" x1="75" y1="420" x2="685" y2="420" />
        <path className="log-surface-wire" d="M 95 414 C 190 404, 255 426, 330 414" />
        <rect className="log-transformer-box" x="330" y="365" width="150" height="92" rx="12" />
        <path className="log-winding" d="M 350 398 q 9 -18 18 0 q 9 -18 18 0 q 9 -18 18 0" />
        <path className="log-winding" d="M 420 398 q 9 -18 18 0 q 9 -18 18 0" />
        <line className="log-isolation-gap" x1="411" y1="375" x2="411" y2="438" />
        <line className="log-surface-wire" x1="330" y1="414" x2="300" y2="414" />
        <line className="log-coax" x1="480" y1="414" x2="650" y2="414" />
        <text x="377" y="439" textAnchor="middle">Loop · {antennaWindingTurns} turns</text>
        <text x="447" y="439" textAnchor="middle">Coax · {coaxWindingTurns} turns</text>
        <text className="log-no-ground" x="377" y="478" textAnchor="middle">No antenna connection to earth</text>
        <text x="585" y="400" textAnchor="middle">Coax to receiver</text>
      </g>
      <SvgDimension prefix="log-side" x1={corners[0].x} y1={corners[0].y} x2={corners[1].x} y2={corners[1].y} label={`Each side · ${formatLength(sideLengthMetres, unitSystem)}`} labelX={500} labelY={260} />
      <SvgDimension prefix="log-diagonal" x1={corners[0].x} y1={corners[0].y} x2={corners[2].x} y2={corners[2].y} label={`Diagonal · ${formatLength(diagonalMetres, unitSystem)}`} labelX={500} labelY={285} />
    </svg>
    <figcaption>Plan and feed-isolation views, not to scale · The loop is insulated from earth even though it lies on the surface. Low-angle direction is a broad bidirectional context; installed response varies with frequency, soil, layout, feedline isolation, and surroundings.</figcaption>
  </figure>;
}
