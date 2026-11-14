/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateLoopOnGround } from '../calculators/loopOnGround';
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

type LoopOnGroundResult = ReturnType<typeof calculateLoopOnGround>;

function formatOffset(valueMetres: number, positiveDirection: string, negativeDirection: string, unitSystem: UnitSystem) {
  const direction = valueMetres >= 0 ? positiveDirection : negativeDirection;
  return `${formatLength(Math.abs(valueMetres), unitSystem)} ${direction}`;
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

export function LoopOnGroundConstructionPanel({ result, unitSystem }: { result: LoopOnGroundResult; unitSystem: UnitSystem }) {
  return <section className="log-construction-panel" aria-labelledby="log-construction-title">
    <div className="log-construction-heading"><div><p className="eyebrow">Surface layout and verification worksheet</p><h3 id="log-construction-title">Survey the square, then prove the loop remains isolated</h3><p>Establish a temporary centre reference and lay out all four corners before placing wire. The offsets describe flat geometry only; check utilities, access, drainage, mowing, snow removal, animals, and trip hazards before using stakes or leaving wire in place.</p></div><dl><div><dt>Finished side</dt><dd>{formatLength(result.sideLengthMetres, unitSystem)}</dd></div><div><dt>Allocated per side</dt><dd>{formatLength(result.allocatedCutLengthPerSideMetres, unitSystem)}</dd></div><div><dt>Total wire to cut</dt><dd>{formatLength(result.cutWireLengthMetres, unitSystem)}</dd></div><div><dt>Centre to corner</dt><dd>{formatLength(result.cornerDistanceFromCentreMetres, unitSystem)}</dd></div></dl></div>
    <div className="log-construction-grid">
      <article className="log-survey-check"><p className="eyebrow">Corner survey</p><h4>Offsets from the temporary loop centre</h4><div className="table-scroll"><table><thead><tr><th scope="col">Point</th><th scope="col">Bearing</th><th scope="col">East / west</th><th scope="col">North / south</th></tr></thead><tbody>{result.cornerSurvey.map((corner) => <tr key={corner.label}><th scope="row">{corner.label}</th><td>{corner.bearingDegrees.toFixed(0)}° {corner.compassPoint}</td><td>{formatOffset(corner.eastOffsetMetres, 'E', 'W', unitSystem)}</td><td>{formatOffset(corner.northOffsetMetres, 'N', 'S', unitSystem)}</td></tr>)}</tbody></table></div><ol><li>Measure both diagonals after setting the corners; each should equal {formatLength(result.diagonalMetres, unitSystem)}.</li><li>Keep the intended feedpoint corner at {result.feedpointBearingDegrees.toFixed(0)}° {result.feedpointCompassPoint} from centre.</li><li>Document actual corner positions and any unavoidable deviation from the square.</li></ol></article>
      <article className="log-material-check"><p className="eyebrow">Wire allocation</p><h4>Preserve one continuous insulated loop where practical</h4><dl><div><dt>Four finished sides</dt><dd>4 × {formatLength(result.sideLengthMetres, unitSystem)}</dd></div><div><dt>Allowance per side</dt><dd>{formatLength(result.allocatedCutLengthPerSideMetres - result.sideLengthMetres, unitSystem)}</dd></div><div><dt>Design perimeter</dt><dd>{formatLength(result.designPerimeterMetres, unitSystem)}</dd></div><div><dt>Allocated total</dt><dd>{formatLength(result.cutWireLengthMetres, unitSystem)}</dd></div></dl><ol><li>Use outdoor insulated wire and protect it from abrasion, standing water, traffic, tools, and wildlife.</li><li>Route the cut allowance into the feed enclosure and corner anchoring without shrinking the finished square.</li><li>Do not add an earth electrode or bond the loop conductor to the coax shield.</li></ol></article>
      <article className="log-isolation-check"><p className="eyebrow">Isolation transformer and commissioning</p><h4>Verify the complete receive path before leaving it connected</h4><dl><div><dt>Entered winding</dt><dd>{result.antennaWindingTurns}:{result.coaxWindingTurns} turns · antenna:coax</dd></div><div><dt>Ideal turns ratio</dt><dd>{result.transformerTurnsRatio.toFixed(2)} : 1</dd></div><div><dt>Ideal impedance ratio</dt><dd>{result.transformerImpedanceRatio.toFixed(2)} : 1</dd></div><div><dt>Ideal referred impedance</dt><dd>{result.nominalReferredAntennaImpedanceOhms.toFixed(1)} Ω</dd></div></dl><ol><li>With all equipment disconnected, confirm loop continuity and no DC continuity between the loop winding, coax winding, enclosure, or earth.</li><li>Sweep the transformer with representative terminations across every intended band; record fixture, core, winding, and enclosure details.</li><li>Verify feedline common-mode control, entry bonding, static protection, receiver overload protection, and positive transmit isolation separately.</li><li>Compare repeatable signal and noise observations on both axis directions and broadside, at several times and frequencies, against a documented reference antenna.</li></ol><p className="log-performance-limit"><strong>These checks do not predict reception.</strong> Soil, moisture, nearby conductors, feedline current, transformer behaviour, interference, and arrival angle can change the installed result.</p></article>
    </div>
  </section>;
}
