/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  radiatorMetres: number;
  radialMetres: number;
  footprintDiameterMetres: number;
  radialCount: number;
  slopeDegrees: number;
  unitSystem: UnitSystem;
}

export function GroundPlaneDiagram({ radiatorMetres, radialMetres, footprintDiameterMetres, radialCount, slopeDegrees, unitSystem }: Props) {
  return (
    <figure className="antenna-figure">
      <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="gp-title gp-desc">
        <title id="gp-title">Dimensioned quarter-wave ground-plane antenna</title>
        <desc id="gp-desc">One vertical radiator and {radialCount} equal radials sloping {slopeDegrees} degrees below horizontal.</desc>
        <DiagramDefinitions prefix="gp" />
        <DiagramGrid />
        <g className="antenna-wire">
          <line x1="380" y1="170" x2="380" y2="55" />
          <line x1="359" y1="180" x2="105" y2="265" />
          <line x1="401" y1="180" x2="655" y2="265" />
          <line x1="368" y1="182" x2="265" y2="285" />
          <line x1="392" y1="182" x2="495" y2="285" />
        </g>
        <Feedpoint x={380} y={175} label="coax feedpoint" />
        <SvgDimension prefix="gp" x1={420} y1={55} x2={420} y2={165} label={`Radiator · ${formatLength(radiatorMetres, unitSystem)}`} labelX={515} labelY={108} />
        <SvgDimension prefix="gp" x1={105} y1={300} x2={655} y2={300} label={`Footprint · ${formatLength(footprintDiameterMetres, unitSystem)}`} labelX={380} labelY={324} />
        <g className="end-labels">
          <text x="92" y="235">{radialCount} radials · {formatLength(radialMetres, unitSystem)} each</text>
          <text x="525" y="225">slope · {slopeDegrees}°</text>
        </g>
      </svg>
      <figcaption>Side/perspective construction view · Radials are shown schematically and the drawing is not to scale.</figcaption>
    </figure>
  );
}
