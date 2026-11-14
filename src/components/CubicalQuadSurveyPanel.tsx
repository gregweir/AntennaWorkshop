/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateTwoElementCubicalQuad } from '../calculators/twoElementCubicalQuad';
import { formatCoordinate, formatLength, type UnitSystem } from '../lib/units';

type QuadResult = ReturnType<typeof calculateTwoElementCubicalQuad>;

interface Props {
  result: QuadResult;
  unitSystem: UnitSystem;
}

function coordinateLabel(value: number, positive: string, negative: string, unitSystem: UnitSystem) {
  if (Math.abs(value) < 0.0005) return `0 ${unitSystem === 'metric' ? 'm' : 'ft'}`;
  return `${formatCoordinate(Math.abs(value), unitSystem)} ${value >= 0 ? positive : negative}`;
}

export function CubicalQuadSurveyPanel({ result, unitSystem }: Props) {
  const plottedPoints = [result.drivenLeftCorner, result.drivenRightCorner, result.reflectorLeftCorner, result.reflectorRightCorner];
  const maximumOffset = Math.max(result.elementSpacingMetres, result.reflectorSpreaderArmMetres, ...plottedPoints.flatMap((point) => [Math.abs(point.eastMetres), Math.abs(point.northMetres)]));
  const scale = 135 / Math.max(maximumOffset, 0.001);
  const mapPoint = (point: { eastMetres: number; northMetres: number }) => ({ x: 220 + point.eastMetres * scale, y: 210 - point.northMetres * scale });
  const mast = mapPoint({ eastMetres: 0, northMetres: 0 });
  const drivenCentre = mapPoint(result.drivenCentre);
  const reflectorCentre = mapPoint(result.reflectorCentre);
  const drivenLeft = mapPoint(result.drivenLeftCorner);
  const drivenRight = mapPoint(result.drivenRightCorner);
  const reflectorLeft = mapPoint(result.reflectorLeftCorner);
  const reflectorRight = mapPoint(result.reflectorRightCorner);
  const arrowEnd = mapPoint({
    eastMetres: result.drivenCentre.eastMetres + Math.sin(result.forwardBearingDegrees * Math.PI / 180) * result.elementSpacingMetres * 0.55,
    northMetres: result.drivenCentre.northMetres + Math.cos(result.forwardBearingDegrees * Math.PI / 180) * result.elementSpacingMetres * 0.55
  });

  return <section className="quad-survey-panel" aria-labelledby="quad-survey-heading">
    <div className="quad-survey-intro">
      <div><p className="eyebrow">Site layout</p><h3 id="quad-survey-heading">Quad orientation and clearance</h3><p>Set the mast reference, sight the boom toward the forward bearing, and use the offsets as a level-site layout aid.</p></div>
      <dl>
        <div><dt>Forward</dt><dd>{result.forwardBearingDegrees.toFixed(0)}° true · {result.forwardCompassPoint}</dd></div>
        <div><dt>Rear</dt><dd>{result.reverseBearingDegrees.toFixed(0)}° true · {result.reverseCompassPoint}</dd></div>
        <div><dt>Lowest wire</dt><dd>{formatLength(result.lowestWireHeightMetres, unitSystem)}</dd></div>
        <div><dt>Highest wire</dt><dd>{formatLength(result.highestWireHeightMetres, unitSystem)}</dd></div>
      </dl>
    </div>
    <div className="quad-survey-layout">
      <figure className="quad-plan-figure">
        <svg viewBox="0 0 440 420" role="img" aria-labelledby="quad-plan-title quad-plan-desc">
          <title id="quad-plan-title">Top-view cubical-quad site plan</title>
          <desc id="quad-plan-desc">The mast reference, driven element, reflector, boom axis, true north, and forward bearing are plotted from the entered survey values.</desc>
          <defs><marker id="quad-plan-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
          <circle className="quad-plan-ring" cx="220" cy="210" r="176" />
          <line className="quad-plan-north" x1="220" y1="70" x2="220" y2="25" markerEnd="url(#quad-plan-arrow)" /><text x="220" y="18" textAnchor="middle">N · true</text>
          <line className="quad-plan-boom" x1={reflectorCentre.x} y1={reflectorCentre.y} x2={drivenCentre.x} y2={drivenCentre.y} />
          <line className="quad-plan-reflector" x1={reflectorLeft.x} y1={reflectorLeft.y} x2={reflectorRight.x} y2={reflectorRight.y} />
          <line className="quad-plan-driven" x1={drivenLeft.x} y1={drivenLeft.y} x2={drivenRight.x} y2={drivenRight.y} />
          <line className="quad-plan-forward" x1={drivenCentre.x} y1={drivenCentre.y} x2={arrowEnd.x} y2={arrowEnd.y} markerEnd="url(#quad-plan-arrow)" />
          <circle className="quad-plan-mast" cx={mast.x} cy={mast.y} r="6" /><text x={mast.x + 10} y={mast.y - 9}>Mast reference</text>
          <text x={drivenCentre.x + 8} y={drivenCentre.y + 22}>Driven</text><text x={reflectorCentre.x + 8} y={reflectorCentre.y + 22}>Reflector</text>
          <text x={arrowEnd.x + 8} y={arrowEnd.y - 8}>Forward · {result.forwardBearingDegrees.toFixed(0)}°</text>
        </svg>
        <figcaption>Top view, scaled to the calculated offsets. Element lines show their horizontal cross-axis; the diamond loops extend vertically above and below the boom.</figcaption>
      </figure>
      <div className="quad-survey-schedule">
        <h4>Survey schedule</h4>
        <div className="table-scroll"><table><thead><tr><th>Point</th><th>E / W</th><th>N / S</th><th>Height</th></tr></thead><tbody>{result.surveyPoints.map((point) => <tr key={point.label}><th scope="row">{point.label}</th><td>{coordinateLabel(point.eastMetres, 'E', 'W', unitSystem)}</td><td>{coordinateLabel(point.northMetres, 'N', 'S', unitSystem)}</td><td>{formatLength(point.heightMetres, unitSystem)}</td></tr>)}</tbody></table></div>
      </div>
    </div>
    <p className="quad-survey-note"><strong>Reference:</strong> {result.mastReference === 'boom-midpoint' ? 'the mast is at the boom midpoint between the elements' : 'the mast is centred on the driven element'}. Coordinates assume level ground, true bearings, a horizontal boom, and no boom overhang. Confirm property, utility, fall-zone, climbing, electrical, and rotating-structure clearances on site.</p>
  </section>;
}
