/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateLinkedDipole } from '../calculators/linkedDipole';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

type Result = ReturnType<typeof calculateLinkedDipole>;

export function LinkedDipoleDiagram({ result, unitSystem }: { result: Result; unitSystem: UnitSystem }) {
  const apex = { x: 380, y: 78 };
  const leftEnd = { x: 92, y: 300 };
  const rightEnd = { x: 668, y: 300 };
  const total = result.segments.reduce((sum, segment) => sum + segment.cutEachSideMetres, 0);
  const point = (side: -1 | 1, distance: number) => {
    const end = side === -1 ? leftEnd : rightEnd;
    const ratio = distance / total;
    return { x: apex.x + (end.x - apex.x) * ratio, y: apex.y + (end.y - apex.y) * ratio };
  };
  const cumulative = result.segments.reduce<number[]>((values, segment) => [...values, (values.at(-1) ?? 0) + segment.cutEachSideMetres], []);

  return <figure className="antenna-figure linked-dipole-figure">
    <svg className="dipole-diagram linked-dipole-diagram" viewBox="0 0 760 400" role="img" aria-labelledby="linked-title linked-description">
      <title id="linked-title">Dimensioned linked multiband dipole</title>
      <desc id="linked-description">A symmetric portable inverted-V dipole with {result.linkCountPerSide} reconnectable links on each leg and configurations for {result.bands.map((band) => `${band.frequencyMHz.toFixed(3)} megahertz`).join(', ')}.</desc>
      <DiagramDefinitions prefix="linked-dipole" />
      <DiagramGrid />
      {([-1, 1] as const).map((side) => result.segments.map((segment, index) => {
        const startDistance = index === 0 ? 0 : cumulative[index - 1];
        const endDistance = cumulative[index];
        const start = point(side, startDistance);
        const end = point(side, endDistance);
        return <g className="linked-segment" key={`${side}-${segment.id}`}><line x1={start.x} y1={start.y} x2={end.x} y2={end.y} /><text x={(start.x + end.x) / 2} y={(start.y + end.y) / 2 - 12} textAnchor="middle">{segment.id} · {formatLength(segment.cutEachSideMetres, unitSystem)}</text>{segment.linkAfter && <g className="linked-joint"><circle cx={end.x} cy={end.y} r="8" /><text x={end.x} y={end.y + 28} textAnchor="middle">L{index + 1}</text></g>}</g>;
      }))}
      <Feedpoint x={apex.x} y={apex.y} label="balanced centre feed" labelY={52} />
      <SvgDimension prefix="linked-span" x1={leftEnd.x} y1={338} x2={rightEnd.x} y2={338} label={`Lowest-band support span · ${formatLength(result.supportSpanMetres, unitSystem)}`} labelX={380} labelY={365} />
      <g className="linked-legend" transform="translate(246 306)"><rect width="268" height="42" rx="8" /><text x="134" y="17" textAnchor="middle">L1 is nearest the feed · matching states on both legs</text><text x="134" y="33" textAnchor="middle">Wire shown at entered {result.includedAngleDegrees.toFixed(0)}° included angle</text></g>
    </svg>
    <figcaption>Portable construction reference · Segment lengths are per side and include cutting reserve. Link circles mark mechanical/electrical junctions; the link gap and hardware are not drawn to scale.</figcaption>
  </figure>;
}
