/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  legMetres: number;
  spanMetres: number;
  dropMetres: number;
  angleDegrees: number;
  unitSystem: UnitSystem;
}

export function InvertedVDiagram({ legMetres, spanMetres, dropMetres, angleDegrees, unitSystem }: Props) {
  const legLabel = formatLength(legMetres, unitSystem);
  return (
    <figure className="antenna-figure">
      <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="iv-title iv-desc">
        <title id="iv-title">Dimensioned inverted-V antenna</title>
        <desc id="iv-desc">Two {legLabel} legs descend symmetrically from an apex at an included angle of {angleDegrees} degrees.</desc>
        <DiagramDefinitions prefix="iv" />
        <DiagramGrid />
        <g className="antenna-wire">
          <line x1="380" y1="98" x2="95" y2="245" />
          <line x1="380" y1="98" x2="665" y2="245" />
          <circle cx="95" cy="245" r="6" />
          <circle cx="665" cy="245" r="6" />
        </g>
        <Feedpoint x={380} y={98} label="apex feedpoint" />
        <SvgDimension prefix="iv" x1={95} y1={285} x2={665} y2={285} label={`Endpoint span · ${formatLength(spanMetres, unitSystem)}`} labelX={380} labelY={310} />
        <SvgDimension prefix="iv" x1={412} y1={108} x2={680} y2={246} label={`Each leg · ${legLabel}`} labelX={565} labelY={158} />
        <g className="end-labels">
          <text x="380" y="52" textAnchor="middle">included angle · {angleDegrees}°</text>
          <text x="154" y="115">vertical drop · {formatLength(dropMetres, unitSystem)}</text>
        </g>
      </svg>
      <figcaption>Construction drawing · Keep the included angle near 90°–120° when practical; dimensions are not to scale.</figcaption>
    </figure>
  );
}
