/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import type { calculateCoaxialStub, StubTermination } from '../calculators/feedline';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  result: ReturnType<typeof calculateCoaxialStub>;
  termination: StubTermination;
  unitSystem: UnitSystem;
}

export function CoaxialStubDiagram({ result, termination, unitSystem }: Props) {
  const behavior = result.inputImpedanceBehavior === 'high' ? 'high impedance' : 'low impedance';
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="stub-title stub-desc">
      <title id="stub-title">Dimensioned coaxial stub</title>
      <desc id="stub-desc">A {result.electricalLengthDegrees}-degree coaxial stub with a {termination} far end, ideal physical length {formatLength(result.physicalLengthMetres, unitSystem)}, and {behavior} at its input at the design frequency.</desc>
      <DiagramDefinitions prefix="stub" />
      <DiagramGrid />
      <g className="stub-coax">
        <path d="M120 130 H640" />
        <path d="M120 200 H640" />
        <path className="stub-centre" d="M120 165 H640" />
      </g>
      <g className="stub-input"><path d="M80 145 H120 M80 185 H120" /><text x="80" y="118" textAnchor="middle">input</text><text x="80" y="225" textAnchor="middle">{behavior}</text></g>
      {termination === 'short'
        ? <g className="stub-termination"><path d="M640 130 V200" /><text x="640" y="105" textAnchor="middle">shorted end</text></g>
        : <g className="stub-termination"><circle cx="640" cy="130" r="5" /><circle cx="640" cy="200" r="5" /><text x="640" y="105" textAnchor="middle">open end</text></g>}
      <SvgDimension prefix="stub" x1={120} y1={255} x2={640} y2={255} label={`ideal physical length · ${formatLength(result.physicalLengthMetres, unitSystem)}`} labelX={380} labelY={282} />
      <text className="stub-electrical-label" x="380" y="305" textAnchor="middle">{result.electricalLengthDegrees}° electrical · velocity factor applied</text>
    </svg>
    <figcaption>Conceptual transmission-line view · The drawing identifies electrical behaviour and is not a cable cross-section or cutting scale.</figcaption>
  </figure>;
}
