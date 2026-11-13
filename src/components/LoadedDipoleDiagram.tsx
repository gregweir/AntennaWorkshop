/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  totalSpanMetres: number;
  loadingPointFromCentreMetres: number;
  inductanceMicrohenries: number;
  unitSystem: UnitSystem;
}

export function LoadedDipoleDiagram({ totalSpanMetres, loadingPointFromCentreMetres, inductanceMicrohenries, unitSystem }: Props) {
  const halfSpan = 285;
  const coilOffset = halfSpan * loadingPointFromCentreMetres / (totalSpanMetres / 2);
  return <figure className="antenna-figure">
    <svg className="dipole-diagram loaded-antenna-diagram" viewBox="0 0 760 350" role="img" aria-labelledby="loaded-dipole-title loaded-dipole-desc">
      <title id="loaded-dipole-title">Dimensioned centre-fed loaded dipole</title>
      <desc id="loaded-dipole-desc">A shortened centre-fed dipole with equal loading coils {formatLength(loadingPointFromCentreMetres, unitSystem)} from the feedpoint. Each coil is calculated as {inductanceMicrohenries.toFixed(2)} microhenries.</desc>
      <DiagramDefinitions prefix="loaded-dipole" />
      <DiagramGrid />
      <g className="antenna-wire"><line x1="95" y1="165" x2={380 - coilOffset - 17} y2="165" /><line x1={380 - coilOffset + 17} y1="165" x2="366" y2="165" /><line x1="394" y1="165" x2={380 + coilOffset - 17} y2="165" /><line x1={380 + coilOffset + 17} y1="165" x2="665" y2="165" /></g>
      <g className="loading-coil"><path d={`M ${380 - coilOffset - 17} 165 q 6 -20 12 0 t 12 0 t 10 0`} /><path d={`M ${380 + coilOffset - 17} 165 q 6 -20 12 0 t 12 0 t 10 0`} /></g>
      <Feedpoint x={380} y={165} label="balanced feedpoint" labelY={318} />
      <SvgDimension prefix="loaded-dipole-span" x1={95} y1={80} x2={665} y2={80} label={`Physical span · ${formatLength(totalSpanMetres, unitSystem)}`} labelX={380} labelY={61} />
      <SvgDimension prefix="loaded-dipole-coil" x1={380} y1={235} x2={380 + coilOffset} y2={235} label={`Centre to each coil · ${formatLength(loadingPointFromCentreMetres, unitSystem)}`} labelX={380 + coilOffset / 2} labelY={262} />
      <g className="end-labels"><text x={380 - coilOffset} y="126" textAnchor="middle">L = {inductanceMicrohenries.toFixed(2)} µH</text><text x={380 + coilOffset} y="126" textAnchor="middle">L = {inductanceMicrohenries.toFixed(2)} µH</text></g>
    </svg>
    <figcaption>Single-band construction model · Wind two equal series coils, then tune the complete installed antenna with an analyser.</figcaption>
  </figure>;
}
