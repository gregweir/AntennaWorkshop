/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { DeltaLoopFeedMode, DeltaLoopOrientation, LoopShape } from '../calculators/designs';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  perimeterMetres: number;
  primaryDimensionMetres: number;
  shape: LoopShape;
  unitSystem: UnitSystem;
  deltaOrientation?: DeltaLoopOrientation;
  deltaFeedMode?: DeltaLoopFeedMode;
  triangleHeightMetres?: number | null;
  feedpointDistanceFromApexMetres?: number | null;
}

export function LoopDiagram({ perimeterMetres, primaryDimensionMetres, shape, unitSystem, deltaOrientation = 'apex-up', deltaFeedMode = 'horizontal', triangleHeightMetres = null, feedpointDistanceFromApexMetres = null }: Props) {
  const dimensionName = shape === 'circle' ? 'Diameter' : 'Each side';
  const trianglePath = deltaOrientation === 'apex-up' ? 'M380 45 L570 275 L190 275 Z' : 'M190 55 L570 55 L380 285 Z';
  const shapeNode = shape === 'square'
    ? <rect x="235" y="55" width="290" height="220" rx="3" />
    : shape === 'triangle'
      ? <path d={trianglePath} />
      : <ellipse cx="380" cy="165" rx="125" ry="125" />;
  const deltaFeedpoint = deltaFeedMode === 'horizontal'
    ? deltaOrientation === 'apex-up' ? { x: 380, y: 275 } : { x: 380, y: 55 }
    : deltaOrientation === 'apex-up' ? { x: 523, y: 218 } : { x: 523, y: 113 };
  const deltaLeaderY = deltaFeedpoint.y < 165 ? deltaFeedpoint.y + 35 : deltaFeedpoint.y - 35;
  const deltaFeedLabel = deltaFeedMode === 'vertical' ? '¼-PERIMETER FEED' : 'SIDE-MIDPOINT FEED';
  return (
    <figure className={`antenna-figure${shape === 'triangle' ? ' delta-loop-figure' : ''}`}>
      <svg className="dipole-diagram" viewBox="0 0 760 360" role="img" aria-labelledby="loop-title loop-desc">
        <title id="loop-title">Dimensioned full-wave {shape === 'triangle' ? 'triangle delta' : shape} loop</title>
        <desc id="loop-desc">A {shape} loop with a perimeter of {formatLength(perimeterMetres, unitSystem)}.{shape === 'triangle' && feedpointDistanceFromApexMetres !== null ? ` The ${deltaOrientation.replace('-', ' ')} loop is shown with its ${deltaFeedMode}-polarization starting feed arrangement ${formatLength(feedpointDistanceFromApexMetres, unitSystem)} along the wire from the apex.` : ''}</desc>
        <DiagramDefinitions prefix="loop" />
        <DiagramGrid />
        <g className="antenna-loop">{shapeNode}</g>
        {shape === 'triangle' ? <g className="delta-loop-feed"><circle cx={deltaFeedpoint.x} cy={deltaFeedpoint.y} r="9" /><path d={`M${deltaFeedpoint.x} ${deltaFeedpoint.y} L700 ${deltaLeaderY}`} /><text x="700" y={deltaLeaderY + 22} textAnchor="end">{deltaFeedLabel}</text></g> : <Feedpoint x={380} y={275} label="feedpoint position may be rotated" labelY={255} />}
        <SvgDimension prefix="loop" x1={190} y1={315} x2={570} y2={315} label={`${dimensionName} · ${formatLength(primaryDimensionMetres, unitSystem)}`} labelX={380} labelY={340} />
        {shape === 'triangle' && triangleHeightMetres !== null && <g className="dimension-lines"><line x1="140" y1="45" x2="140" y2="285" /><line x1="130" y1="45" x2="150" y2="45" /><line x1="130" y1="285" x2="150" y2="285" /><text x="118" y="165" transform="rotate(-90 118 165)" textAnchor="middle">Ideal height · {formatLength(triangleHeightMetres, unitSystem)}</text></g>}
        <g className="end-labels"><text x="380" y="26" textAnchor="middle">Total wire perimeter · {formatLength(perimeterMetres, unitSystem)}</text></g>
      </svg>
      <figcaption>{shape === 'triangle' ? `Vertical delta-loop construction · ${deltaOrientation.replace('-', ' ')} · ${deltaFeedMode}-polarization starting arrangement. Installed polarization, impedance, and pattern require modelling or measurement.` : 'Construction geometry · Feedpoint placement affects polarization and pattern; the drawing is not to scale.'}</figcaption>
    </figure>
  );
}
