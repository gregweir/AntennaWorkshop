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
  radialFieldDiameterMetres: number;
  radialCount: number;
  unitSystem: UnitSystem;
}

export function GroundMountedVerticalDiagram({ radiatorMetres, radialMetres, radialFieldDiameterMetres, radialCount, unitSystem }: Props) {
  const spokes = Array.from({ length: Math.min(radialCount, 24) }, (_, index) => {
    const angle = index / Math.min(radialCount, 24) * Math.PI * 2;
    return { x: 380 + Math.cos(angle) * 265, y: 235 + Math.sin(angle) * 48 };
  });
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 350" role="img" aria-labelledby="gmv-title gmv-desc">
      <title id="gmv-title">Dimensioned ground-mounted quarter-wave vertical</title>
      <desc id="gmv-desc">A vertical radiator {formatLength(radiatorMetres, unitSystem)} high over {radialCount} ground radials, each {formatLength(radialMetres, unitSystem)} long.</desc>
      <DiagramDefinitions prefix="gmv" />
      <DiagramGrid />
      <g className="ground-radial-field"><ellipse cx="380" cy="235" rx="265" ry="48" />{spokes.map((point, index) => <line key={index} x1="380" y1="235" x2={point.x} y2={point.y} />)}</g>
      <line className="ground-line" x1="75" y1="235" x2="685" y2="235" />
      <line className="vertical-radiator" x1="380" y1="225" x2="380" y2="55" />
      <Feedpoint x={380} y={225} label="base feed · radial junction" labelY={303} />
      <SvgDimension prefix="gmv" x1={430} y1={55} x2={430} y2={220} label={`Radiator · ${formatLength(radiatorMetres, unitSystem)}`} labelX={535} labelY={138} />
      <SvgDimension prefix="gmv" x1={115} y1={323} x2={645} y2={323} label={`Radial-field diameter · ${formatLength(radialFieldDiameterMetres, unitSystem)}`} labelX={380} labelY={347} />
      <g className="end-labels"><text x="92" y="210">{radialCount} on-ground or shallow-buried radials</text><text x="530" y="270">{formatLength(radialMetres, unitSystem)} each</text></g>
    </svg>
    <figcaption>Side/perspective construction view · Up to 24 radial spokes are drawn schematically; the entered radial count controls the cut list.</figcaption>
  </figure>;
}
