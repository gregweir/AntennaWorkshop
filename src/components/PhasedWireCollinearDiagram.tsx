/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  elementCount: number;
  radiatingSpanMetres: number;
  radiatorSectionMetres: number;
  phasingStubMetres: number;
  feedModeReference: string;
  unitSystem: UnitSystem;
}

export function PhasedWireCollinearDiagram({ elementCount, radiatingSpanMetres, radiatorSectionMetres, phasingStubMetres, feedModeReference, unitSystem }: Props) {
  const left = 70;
  const right = 690;
  const top = 140;
  const sectionWidth = (right - left) / elementCount;
  const junctions = Array.from({ length: elementCount - 1 }, (_, index) => left + sectionWidth * (index + 1));

  return <figure className="antenna-figure">
    <svg className="dipole-diagram collinear-diagram" viewBox="0 0 760 410" role="img" aria-labelledby="collinear-title collinear-description">
      <title id="collinear-title">Dimensioned half-wave phased wire collinear array</title>
      <desc id="collinear-description">{elementCount} equal half-wave radiator sections arranged end to end with {elementCount - 1} shorted quarter-wave phase-reversing stubs.</desc>
      <DiagramDefinitions prefix="phased-collinear" />
      <DiagramGrid />
      <SvgDimension prefix="collinear-span" x1={left} y1={66} x2={right} y2={66} label={`Radiating span · ${formatLength(radiatingSpanMetres, unitSystem)}`} labelX={380} labelY={48} />
      <g className="collinear-radiators">
        {Array.from({ length: elementCount }, (_, index) => {
          const x1 = left + sectionWidth * index + (index === 0 ? 0 : 8);
          const x2 = left + sectionWidth * (index + 1) - (index === elementCount - 1 ? 0 : 8);
          return <line key={index} x1={x1} y1={top} x2={x2} y2={top} />;
        })}
        <circle cx={left} cy={top} r="5" /><circle cx={right} cy={top} r="5" />
      </g>
      <g className="collinear-stubs">
        {junctions.map((x, index) => <path key={index} d={`M${x - 8} ${top} V258 Q${x - 8} 270 ${x} 270 Q${x + 8} 270 ${x + 8} 258 V${top}`} />)}
      </g>
      <g className="collinear-junctions">{junctions.map((x, index) => <g key={index}><circle cx={x - 8} cy={top} r="4" /><circle cx={x + 8} cy={top} r="4" /></g>)}</g>
      <text className="diagram-caption" x={left + sectionWidth / 2} y="121" textAnchor="middle">Each radiator · {formatLength(radiatorSectionMetres, unitSystem)}</text>
      <text className="diagram-caption" x="380" y="302" textAnchor="middle">Each shorted two-conductor stub · {formatLength(phasingStubMetres, unitSystem)} one-way</text>
      <g className="collinear-feed-note"><rect x="205" y="330" width="350" height="48" rx="10" /><text x="380" y="350" textAnchor="middle">QST reference · {feedModeReference.toLowerCase()}</text><text x="380" y="368" textAnchor="middle">Feed location and matching network are not dimensioned</text></g>
    </svg>
    <figcaption>Construction sequence · Stub depth is schematic; preserve equal radiator sections and equal electrically quarter-wave stubs. The feed class is source context only; feedpoint, matching, supports, pattern, and gain require separate design and verification.</figcaption>
  </figure>;
}
