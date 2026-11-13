/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  coneRadialCount: number;
  discRadialCount: number;
  coneSlantLengthMetres: number;
  coneHeightMetres: number;
  coneBaseDiameterMetres: number;
  discDiameterMetres: number;
  coneIncludedAngleDegrees: number;
  unitSystem: UnitSystem;
}

function radialEndpoints(count: number, centreX: number, centreY: number, radiusX: number, radiusY: number) {
  const shownCount = Math.min(count, 16);
  return Array.from({ length: shownCount }, (_, index) => {
    const angle = index / shownCount * Math.PI * 2;
    return { x: centreX + Math.cos(angle) * radiusX, y: centreY + Math.sin(angle) * radiusY };
  });
}

export function DisconeDiagram({ coneRadialCount, discRadialCount, coneSlantLengthMetres, coneHeightMetres, coneBaseDiameterMetres, discDiameterMetres, coneIncludedAngleDegrees, unitSystem }: Props) {
  const centreX = 380;
  const discY = 105;
  const apexY = 158;
  const baseY = 332;
  const discEnds = radialEndpoints(discRadialCount, centreX, discY, 155, 35);
  const coneEnds = radialEndpoints(coneRadialCount, centreX, baseY, 190, 46);

  return <figure className="antenna-figure">
    <svg className="dipole-diagram discone-diagram" viewBox="0 0 760 440" role="img" aria-labelledby="discone-title discone-description">
      <title id="discone-title">Dimensioned radial-element discone antenna</title>
      <desc id="discone-description">A horizontal disc of {discRadialCount} radial elements is separated by a short feed gap from the apex of a {coneRadialCount}-radial cone. Disc diameter, cone base diameter, cone height, slant length, and included angle are labelled.</desc>
      <DiagramDefinitions prefix="discone" />
      <DiagramGrid />
      <g className="discone-disc"><ellipse cx={centreX} cy={discY} rx="155" ry="35" />{discEnds.map((point, index) => <line key={index} x1={centreX} y1={discY} x2={point.x} y2={point.y} />)}<circle cx={centreX} cy={discY} r="7" /></g>
      <g className="discone-cone">{coneEnds.map((point, index) => <line key={index} x1={centreX} y1={apexY} x2={point.x} y2={point.y} />)}<ellipse cx={centreX} cy={baseY} rx="190" ry="46" /><circle cx={centreX} cy={apexY} r="7" /></g>
      <g className="discone-feed"><line x1={centreX} y1={discY + 8} x2={centreX} y2={apexY - 8} /><rect x={centreX - 31} y="126" width="62" height="18" rx="7" /><text x={centreX} y="139" textAnchor="middle">short gap</text></g>
      <SvgDimension prefix="discone-disc-diameter" x1={225} y1={54} x2={535} y2={54} label={`Disc Ø · ${formatLength(discDiameterMetres, unitSystem)}`} labelX={centreX} labelY={39} />
      <SvgDimension prefix="discone-height" x1={625} y1={apexY} x2={625} y2={baseY} label={`Height · ${formatLength(coneHeightMetres, unitSystem)}`} labelX={625} labelY={145} />
      <SvgDimension prefix="discone-base-diameter" x1={190} y1={405} x2={570} y2={405} label={`Cone base Ø · ${formatLength(coneBaseDiameterMetres, unitSystem)}`} labelX={centreX} labelY={390} />
      <text className="diagram-caption" x="205" y="253" textAnchor="middle">Slant · {formatLength(coneSlantLengthMetres, unitSystem)}</text>
      <text className="diagram-caption" x="555" y="253" textAnchor="middle">Included angle · {coneIncludedAngleDegrees.toFixed(0)}°</text>
      <text className="diagram-caption" x="380" y="425" textAnchor="middle">{discRadialCount} disc radials · {coneRadialCount} cone radials</text>
    </svg>
    <figcaption>Perspective radial construction, not to scale · The source requires the disc-to-cone separation to be as short as practical. Connector geometry, radial diameter, support hardware, element count, and the installed structure require modelling and measurement.</figcaption>
  </figure>;
}
