/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { CoaxialCollinearMode } from '../calculators/coaxialCollinear';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

export function CoaxialCollinearDiagram({ mode, sectionCount, sectionMetres, terminationMetres, terminalWhipMetres, overallMetres, unitSystem }: { mode: CoaxialCollinearMode; sectionCount: number; sectionMetres: number; terminationMetres: number | null; terminalWhipMetres: number | null; overallMetres: number; unitSystem: UnitSystem }) {
  const shownCount = Math.min(sectionCount, 12);
  const top = 52;
  const bottom = 356;
  const step = (bottom - top) / (shownCount + (mode === 'end-fed-receive' ? 1 : 0));
  const x = 350;
  const sections = Array.from({ length: shownCount }, (_, index) => ({ y1: top + step * index, y2: top + step * (index + 1), offset: index % 2 === 0 ? -12 : 12 }));

  return <figure className="antenna-figure">
    <svg className="dipole-diagram coco-diagram" viewBox="0 0 760 430" role="img" aria-labelledby="coco-title coco-description">
      <title id="coco-title">Dimensioned coaxial collinear construction diagram</title>
      <desc id="coco-description">{sectionCount} alternating electrical half-wave coax sections, each {formatLength(sectionMetres, unitSystem)}, in a {mode === 'balanced-coco' ? 'balanced centre-fed COCO arrangement with two shorted quarter-wave end sections' : 'source-derived end-fed receiving arrangement with a terminal whip'}.</desc>
      <DiagramDefinitions prefix="coco" />
      <DiagramGrid />
      <SvgDimension prefix="coco-overall" x1={170} y1={top} x2={170} y2={bottom} label={`Nominal reference · ${formatLength(overallMetres, unitSystem)}`} labelX={125} labelY={210} />
      <g className="coax-path">
        {sections.map((section, index) => <g key={index}><line x1={x + section.offset} y1={section.y1 + 3} x2={x + section.offset} y2={section.y2 - 3} /><circle cx={x + section.offset} cy={section.y1 + 5} r="4" /><circle cx={x + section.offset} cy={section.y2 - 5} r="4" />{index < sections.length - 1 && <path d={`M${x + section.offset} ${section.y2 - 5} L${x - section.offset} ${section.y2 + 5}`} />}</g>)}
      </g>
      {mode === 'balanced-coco' ? <>
        <g className="return-path"><path d={`M${x - 12} ${top} V28 H${x + 12} V${top}`} /><path d={`M${x - 12} ${bottom} V382 H${x + 12} V${bottom}`} /></g>
        <g className="transformer-box"><rect x="430" y="190" width="170" height="48" rx="8" /><text x="515" y="209" textAnchor="middle">BALANCED CENTRE FEED</text><text x="515" y="227" textAnchor="middle">matching not calculated</text></g>
        <path className="diagram-leader" d="M430 214 H375" />
        <text className="diagram-caption" x="505" y="70" textAnchor="middle">Two shorted end sections · {terminationMetres === null ? '—' : formatLength(terminationMetres, unitSystem)} each</text>
      </> : <>
        <g className="antenna-wire"><line x1={x + 12} y1={bottom} x2={x + 12} y2={bottom + step - 10} /></g>
        <g className="transformer-box"><rect x="430" y="332" width="170" height="48" rx="8" /><text x="515" y="351" textAnchor="middle">BOTTOM CONNECTOR</text><text x="515" y="369" textAnchor="middle">receive-only source layout</text></g>
        <path className="diagram-leader" d="M430 356 H375" />
        <text className="diagram-caption" x="505" y="70" textAnchor="middle">Terminal whip reference · {terminalWhipMetres === null ? '—' : formatLength(terminalWhipMetres, unitSystem)}</text>
      </>}
      <g className="diagram-legend" transform="translate(430 110)"><rect width="230" height="112" rx="8" /><text x="14" y="24">CONSTRUCTION KEY</text><text x="14" y="48">A / B offsets = alternating sections</text><text x="14" y="68">Every joint crosses centre ↔ shield</text><text x="14" y="88">Drawing compresses section count</text><text x="14" y="106">No pattern or impedance is shown</text></g>
    </svg>
    <figcaption>Electrical construction reference · The drawing shows at most twelve repeated sections so joints remain legible. Use the complete schedule for the selected count. Junction overlap, connector geometry, enclosure loading, feed, matching, and support details require separate modelling and measurement.</figcaption>
  </figure>;
}
