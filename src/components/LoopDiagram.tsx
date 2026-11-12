/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { LoopShape } from '../calculators/designs';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  perimeterMetres: number;
  primaryDimensionMetres: number;
  shape: LoopShape;
  unitSystem: UnitSystem;
}

export function LoopDiagram({ perimeterMetres, primaryDimensionMetres, shape, unitSystem }: Props) {
  const dimensionName = shape === 'circle' ? 'Diameter' : 'Each side';
  const shapeNode = shape === 'square'
    ? <rect x="235" y="55" width="290" height="220" rx="3" />
    : shape === 'triangle'
      ? <path d="M380 45 L570 275 L190 275 Z" />
      : <ellipse cx="380" cy="165" rx="125" ry="125" />;
  return (
    <figure className="antenna-figure">
      <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="loop-title loop-desc">
        <title id="loop-title">Dimensioned full-wave {shape} loop</title>
        <desc id="loop-desc">A {shape} loop with a perimeter of {formatLength(perimeterMetres, unitSystem)}.</desc>
        <DiagramDefinitions prefix="loop" />
        <DiagramGrid />
        <g className="antenna-loop">{shapeNode}</g>
        <Feedpoint x={380} y={275} label="feedpoint position may be rotated" labelY={255} />
        <SvgDimension prefix="loop" x1={190} y1={305} x2={570} y2={305} label={`${dimensionName} · ${formatLength(primaryDimensionMetres, unitSystem)}`} labelX={380} labelY={328} />
        <g className="end-labels"><text x="380" y="26" textAnchor="middle">Total wire perimeter · {formatLength(perimeterMetres, unitSystem)}</text></g>
      </svg>
      <figcaption>Construction geometry · Feedpoint placement affects polarization and pattern; the drawing is not to scale.</figcaption>
    </figure>
  );
}
