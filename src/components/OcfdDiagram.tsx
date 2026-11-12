/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  shortLegMetres: number;
  longLegMetres: number;
  totalMetres: number;
  feedpointPercent: number;
  transformerRatio: number;
  unitSystem: UnitSystem;
}

export function OcfdDiagram({ shortLegMetres, longLegMetres, totalMetres, feedpointPercent, transformerRatio, unitSystem }: Props) {
  const left = 70;
  const right = 690;
  const feedX = left + (right - left) * feedpointPercent / 100;
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="ocfd-title ocfd-desc">
      <title id="ocfd-title">Dimensioned off-centre-fed dipole</title>
      <desc id="ocfd-desc">A half-wave wire totaling {formatLength(totalMetres, unitSystem)} is divided into unequal legs at a feedpoint {feedpointPercent.toFixed(1)} percent from one end.</desc>
      <DiagramDefinitions prefix="ocfd" />
      <DiagramGrid />
      <g className="antenna-wire">
        <line x1={left} y1="150" x2={feedX - 23} y2="150" />
        <line x1={feedX + 23} y1="150" x2={right} y2="150" />
        <circle cx={left} cy="150" r="6" /><circle cx={right} cy="150" r="6" />
      </g>
      <g className="transformer-box">
        <rect x={feedX - 23} y="126" width="46" height="48" rx="8" />
        <path d={`M${feedX - 13} 140 C${feedX - 3} 140 ${feedX - 3} 160 ${feedX + 7} 160 M${feedX - 13} 160 C${feedX - 3} 160 ${feedX - 3} 140 ${feedX + 7} 140`} />
        <text x={feedX} y="205" textAnchor="middle">{transformerRatio}:1 current balun</text>
      </g>
      <g className="coax-path"><path d={`M${feedX} 174 V245`} /><text x={feedX + 12} y="235">50 Ω coax</text></g>
      <SvgDimension prefix="ocfd" x1={left} y1={75} x2={right} y2={75} label={`Total cut length · ${formatLength(totalMetres, unitSystem)}`} labelX={380} labelY={55} />
      <SvgDimension prefix="ocfd" x1={left} y1={270} x2={feedX - 10} y2={270} label={`Short leg · ${formatLength(shortLegMetres, unitSystem)}`} labelX={(left + feedX) / 2} labelY={296} />
      <SvgDimension prefix="ocfd" x1={feedX + 10} y1={270} x2={right} y2={270} label={`Long leg · ${formatLength(longLegMetres, unitSystem)}`} labelX={(feedX + right) / 2} labelY={296} />
      <g className="end-labels"><text x={feedX} y="104" textAnchor="middle">feedpoint · {feedpointPercent.toFixed(1)}% from end</text></g>
    </svg>
    <figcaption>Construction drawing · A current balun and common-mode control are part of the antenna system; dimensions are not to scale.</figcaption>
  </figure>;
}
