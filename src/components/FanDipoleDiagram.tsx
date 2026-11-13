/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface FanElement {
  frequencyMHz: number;
  cutTotalMetres: number;
  cutLegMetres: number;
}

export function FanDipoleDiagram({ elements, unitSystem }: { elements: FanElement[]; unitSystem: UnitSystem }) {
  const longest = Math.max(...elements.map((element) => element.cutLegMetres));
  const rows = elements.map((element, index) => {
    const halfSpan = 275 * element.cutLegMetres / longest;
    const y = 112 + index * (190 / Math.max(1, elements.length - 1));
    return { ...element, halfSpan, y };
  });

  return (
    <figure className="antenna-figure">
      <svg className="dipole-diagram fan-dipole-diagram" viewBox="0 0 760 400" role="img" aria-labelledby="fan-dipole-title fan-dipole-description">
        <title id="fan-dipole-title">Dimensioned parallel fan dipole</title>
        <desc id="fan-dipole-description">Two to six pairs of equal wire legs share one centre feedpoint and fan outward. Each pair is labelled with its design frequency and cut length.</desc>
        <DiagramDefinitions prefix="fan-dipole" />
        <DiagramGrid />
        <g className="antenna-wire">
          {rows.map((element, index) => (
            <g key={`${element.frequencyMHz}-${index}`}>
              <line x1="366" y1="205" x2={380 - element.halfSpan} y2={element.y} />
              <line x1="394" y1="205" x2={380 + element.halfSpan} y2={element.y} />
              <circle cx={380 - element.halfSpan} cy={element.y} r="4" />
              <circle cx={380 + element.halfSpan} cy={element.y} r="4" />
            </g>
          ))}
        </g>
        <g className="fan-element-labels">
          {rows.map((element, index) => <text key={`${element.frequencyMHz}-label-${index}`} x="380" y={element.y - 9} textAnchor="middle">{element.frequencyMHz.toFixed(3)} MHz · {formatLength(element.cutTotalMetres, unitSystem)} total</text>)}
        </g>
        <Feedpoint x={380} y={205} label="shared balanced feedpoint" labelY={382} />
        <SvgDimension prefix="fan-dipole" x1={380 - rows[0].halfSpan} y1={72} x2={380 + rows[0].halfSpan} y2={72} label={`Longest span · ${formatLength(elements[0].cutTotalMetres, unitSystem)}`} labelX={380} labelY={53} />
      </svg>
      <figcaption>Construction drawing · Each pair is an independent cut-length starting point; installed interaction is not to scale.</figcaption>
    </figure>
  );
}
