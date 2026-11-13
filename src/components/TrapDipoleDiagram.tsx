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
  trapPositionFromCentreMetres: number;
  inductanceMicrohenries: number;
  capacitancePicofarads: number;
  trapResonanceMHz: number;
  unitSystem: UnitSystem;
}

function TrapSymbol({ x }: { x: number }) {
  return <g className="trap-symbol" transform={`translate(${x} 165)`}>
    <rect x="-25" y="-34" width="50" height="68" rx="8" />
    <path d="M -18 -8 q 6 -14 12 0 t 12 0 t 12 0" />
    <line x1="-14" y1="14" x2="14" y2="14" />
    <line x1="-14" y1="22" x2="14" y2="22" />
  </g>;
}

export function TrapDipoleDiagram({ totalSpanMetres, trapPositionFromCentreMetres, inductanceMicrohenries, capacitancePicofarads, trapResonanceMHz, unitSystem }: Props) {
  const halfSpan = 285;
  const trapOffset = halfSpan * trapPositionFromCentreMetres / (totalSpanMetres / 2);
  const leftTrapX = 380 - trapOffset;
  const rightTrapX = 380 + trapOffset;
  return <figure className="antenna-figure">
    <svg className="dipole-diagram trap-dipole-diagram" viewBox="0 0 760 390" role="img" aria-labelledby="trap-dipole-title trap-dipole-desc">
      <title id="trap-dipole-title">Dimensioned two-band parallel-LC trap dipole</title>
      <desc id="trap-dipole-desc">A centre-fed dipole with two identical parallel LC traps. Each trap uses {inductanceMicrohenries.toFixed(2)} microhenries and {capacitancePicofarads.toFixed(1)} picofarads and resonates at {trapResonanceMHz.toFixed(3)} megahertz.</desc>
      <DiagramDefinitions prefix="trap-dipole" />
      <DiagramGrid />
      <g className="antenna-wire">
        <line x1="95" y1="165" x2={leftTrapX - 25} y2="165" />
        <line x1={leftTrapX + 25} y1="165" x2="366" y2="165" />
        <line x1="394" y1="165" x2={rightTrapX - 25} y2="165" />
        <line x1={rightTrapX + 25} y1="165" x2="665" y2="165" />
      </g>
      <TrapSymbol x={leftTrapX} />
      <TrapSymbol x={rightTrapX} />
      <Feedpoint x={380} y={165} label="balanced feedpoint" labelY={357} />
      <SvgDimension prefix="trap-dipole-span" x1={95} y1={70} x2={665} y2={70} label={`Physical span · ${formatLength(totalSpanMetres, unitSystem)}`} labelX={380} labelY={51} />
      <SvgDimension prefix="trap-dipole-position" x1={380} y1={260} x2={rightTrapX} y2={260} label={`Centre to each trap · ${formatLength(trapPositionFromCentreMetres, unitSystem)}`} labelX={(380 + rightTrapX) / 2} labelY={287} />
      <g className="end-labels">
        <text x="380" y="320" textAnchor="middle">Each trap · {inductanceMicrohenries.toFixed(2)} µH ∥ {capacitancePicofarads.toFixed(1)} pF</text>
        <text x="380" y="339" textAnchor="middle">Parallel resonance · {trapResonanceMHz.toFixed(3)} MHz</text>
      </g>
    </svg>
    <figcaption>Two-band construction model · Build and measure two matched parallel-LC traps, then tune the complete installed antenna on both bands.</figcaption>
  </figure>;
}
