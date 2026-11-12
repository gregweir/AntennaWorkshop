/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import type { ExposureEvaluationPointInput, ExposureProjectSourceInput } from '../calculators/exposureProject';
import { formatCoordinate, type UnitSystem } from '../lib/units';
import { createSitePlanViewport, snapSiteCoordinate, type SitePlanViewport, type SitePosition } from '../lib/sitePlanLayout';

interface Props {
  sources: ExposureProjectSourceInput[];
  points: ExposureEvaluationPointInput[];
  unitSystem: UnitSystem;
  onSourcePositionChange: (id: string, eastMetres: number, northMetres: number) => void;
  onPointPositionChange: (id: string, eastMetres: number, northMetres: number) => void;
}

interface DragTarget {
  kind: 'source' | 'point';
  id: string;
  pointerId: number;
}

export function SiteLayoutEditor({ sources, points, unitSystem, onSourcePositionChange, onPointPositionChange }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const dragTargetRef = useRef<DragTarget | null>(null);
  const dragViewportRef = useRef<SitePlanViewport | null>(null);
  const [dragTarget, setDragTarget] = useState<DragTarget | null>(null);
  const [dragViewport, setDragViewport] = useState<SitePlanViewport | null>(null);
  const [announcement, setAnnouncement] = useState('Drag a marker, or focus it and use the arrow keys. Hold Shift for 0.1 metre keyboard steps.');
  const calculatedViewport = useMemo(() => createSitePlanViewport([
    ...sources.map((source) => ({ eastMetres: source.eastOffsetMetres, northMetres: source.northOffsetMetres })),
    ...points.map((point) => ({ eastMetres: point.eastOffsetMetres, northMetres: point.northOffsetMetres }))
  ]), [sources, points]);
  const viewport = dragViewport ?? calculatedViewport;

  const move = (kind: DragTarget['kind'], id: string, position: SitePosition) => {
    const eastMetres = snapSiteCoordinate(position.eastMetres);
    const northMetres = snapSiteCoordinate(position.northMetres);
    if (kind === 'source') onSourcePositionChange(id, eastMetres, northMetres);
    else onPointPositionChange(id, eastMetres, northMetres);
    const label = kind === 'source'
      ? sources.find((source) => source.id === id)?.label
      : points.find((point) => point.id === id)?.label;
    setAnnouncement(`${label ?? 'Marker'} moved to east ${formatCoordinate(eastMetres, unitSystem)}, north ${formatCoordinate(northMetres, unitSystem)}.`);
  };

  const pointerPosition = (event: PointerEvent<SVGGElement>) => {
    const svg = svgRef.current;
    if (!svg) return null;
    const rectangle = svg.getBoundingClientRect();
    return (dragViewportRef.current ?? viewport).fromCanvas({
      x: (event.clientX - rectangle.left) * viewport.width / rectangle.width,
      y: (event.clientY - rectangle.top) * viewport.height / rectangle.height
    });
  };

  const startDrag = (event: PointerEvent<SVGGElement>, kind: DragTarget['kind'], id: string) => {
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragViewportRef.current = calculatedViewport;
    dragTargetRef.current = { kind, id, pointerId: event.pointerId };
    setDragViewport(calculatedViewport);
    setDragTarget(dragTargetRef.current);
  };

  const continueDrag = (event: PointerEvent<SVGGElement>, kind: DragTarget['kind'], id: string) => {
    const activeDrag = dragTargetRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId || activeDrag.kind !== kind || activeDrag.id !== id) return;
    const position = pointerPosition(event);
    if (position) move(kind, id, position);
  };

  const endDrag = (event: PointerEvent<SVGGElement>) => {
    const activeDrag = dragTargetRef.current;
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    dragTargetRef.current = null;
    dragViewportRef.current = null;
    setDragTarget(null);
    setDragViewport(null);
  };

  const nudge = (event: KeyboardEvent<SVGGElement>, kind: DragTarget['kind'], id: string, position: SitePosition) => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault();
    const step = event.shiftKey ? 0.1 : 1;
    move(kind, id, {
      eastMetres: position.eastMetres + (event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0),
      northMetres: position.northMetres + (event.key === 'ArrowDown' ? -step : event.key === 'ArrowUp' ? step : 0)
    });
  };

  return <section className="site-layout-editor" aria-labelledby="site-layout-heading">
    <div className="site-layout-heading"><div><p className="eyebrow">Interactive site plan</p><h4 id="site-layout-heading">Position antennas and accessible locations</h4></div><div className="site-layout-legend"><span><i className="site-source-symbol" />Antenna</span><span><i className="site-point-symbol" />Evaluation point</span></div></div>
    <p className="site-layout-help">Drag markers to approximate the layout, then use the synchronized fields below for surveyed values. Arrow keys move a focused marker 1 m; Shift + arrow moves 0.1 m.</p>
    <svg ref={svgRef} className="site-layout-canvas" viewBox={`0 0 ${viewport.width} ${viewport.height}`} role="group" aria-label="Editable station site plan">
      <rect className="site-layout-background" x={viewport.left} y={viewport.top} width={viewport.right - viewport.left} height={viewport.bottom - viewport.top} />
      <g className="site-layout-grid" aria-hidden="true">
        {viewport.eastGridMetres.map((east) => {
          const canvas = viewport.toCanvas({ eastMetres: east, northMetres: 0 });
          return <g key={`east-${east}`}><line x1={canvas.x} y1={viewport.top} x2={canvas.x} y2={viewport.bottom} /><text x={canvas.x} y={viewport.bottom + 22} textAnchor="middle">E {east.toFixed(1)}</text></g>;
        })}
        {viewport.northGridMetres.map((north) => {
          const canvas = viewport.toCanvas({ eastMetres: 0, northMetres: north });
          return <g key={`north-${north}`}><line x1={viewport.left} y1={canvas.y} x2={viewport.right} y2={canvas.y} /><text x={viewport.left - 9} y={canvas.y + 4} textAnchor="end">N {north.toFixed(1)}</text></g>;
        })}
      </g>
      <g className="site-editor-north" aria-hidden="true"><line x1="625" y1="100" x2="625" y2="65" /><path d="M617 76 L625 62 L633 76" /><text x="625" y="51" textAnchor="middle">N</text></g>
      {sources.map((source, index) => {
        const position = { eastMetres: source.eastOffsetMetres, northMetres: source.northOffsetMetres };
        const canvas = viewport.toCanvas(position);
        return <g key={source.id} className={`site-editor-marker site-editor-source site-editor-source-${index % 6}${dragTarget?.kind === 'source' && dragTarget.id === source.id ? ' site-editor-dragging' : ''}`} transform={`translate(${canvas.x} ${canvas.y})`} role="button" tabIndex={0} aria-label={`${source.label} antenna at east ${formatCoordinate(source.eastOffsetMetres, unitSystem)}, north ${formatCoordinate(source.northOffsetMetres, unitSystem)}`} onPointerDown={(event) => startDrag(event, 'source', source.id)} onPointerMove={(event) => continueDrag(event, 'source', source.id)} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={(event) => nudge(event, 'source', source.id, position)}>
          <circle className="site-editor-hit" r="36" /><circle className="site-editor-focus" r="20" />
          <line x1="-10" y1="0" x2="10" y2="0" /><line x1="0" y1="-10" x2="0" y2="10" /><circle r="6" />
          <text x="13" y="-13">{source.label}</text>
        </g>;
      })}
      {points.map((point) => {
        const position = { eastMetres: point.eastOffsetMetres, northMetres: point.northOffsetMetres };
        const canvas = viewport.toCanvas(position);
        return <g key={point.id} className={`site-editor-marker site-editor-point${dragTarget?.kind === 'point' && dragTarget.id === point.id ? ' site-editor-dragging' : ''}`} transform={`translate(${canvas.x} ${canvas.y})`} role="button" tabIndex={0} aria-label={`${point.label} evaluation point at east ${formatCoordinate(point.eastOffsetMetres, unitSystem)}, north ${formatCoordinate(point.northOffsetMetres, unitSystem)}`} onPointerDown={(event) => startDrag(event, 'point', point.id)} onPointerMove={(event) => continueDrag(event, 'point', point.id)} onPointerUp={endDrag} onPointerCancel={endDrag} onKeyDown={(event) => nudge(event, 'point', point.id, position)}>
          <circle className="site-editor-hit" r="36" /><circle className="site-editor-focus" r="20" />
          <circle className="site-editor-point-ring" r="10" /><circle className="site-editor-point-centre" r="3" />
          <text x="13" y="-13">{point.label}</text>
        </g>;
      })}
    </svg>
    <p className="site-layout-status" aria-live="polite">{announcement}</p>
  </section>;
}
