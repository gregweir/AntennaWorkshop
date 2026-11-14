/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateQuarterWaveTransformer } from '../calculators/quarterWaveTransformer';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  result: ReturnType<typeof calculateQuarterWaveTransformer>;
  unitSystem: UnitSystem;
}

export function QuarterWaveTransformerDiagram({ result, unitSystem }: Props) {
  const idealLength = formatLength(result.physicalQuarterWaveMetres, unitSystem);
  return <figure className="antenna-figure quarter-wave-transformer-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 390" role="img" aria-labelledby="quarter-transformer-title quarter-transformer-desc">
      <title id="quarter-transformer-title">Dimensioned quarter-wave transmission-line transformer</title>
      <desc id="quarter-transformer-desc">A 90-degree line with required characteristic impedance {result.requiredCharacteristicImpedanceOhms.toFixed(2)} ohms and ideal physical length {idealLength}, connecting a {result.sourceResistanceOhms.toFixed(2)} ohm source to a {result.loadResistanceOhms.toFixed(2)} ohm real load.</desc>
      <DiagramDefinitions prefix="quarter-transformer" />
      <DiagramGrid />
      <g className="transformer-terminal source"><rect x="50" y="115" width="150" height="115" rx="18" /><text x="125" y="153" textAnchor="middle">SYSTEM</text><text x="125" y="188" textAnchor="middle">{result.sourceResistanceOhms.toFixed(2)} Ω</text><text x="125" y="212" textAnchor="middle">real resistance</text></g>
      <g className="transformer-line"><path d="M200 150 H560" /><path d="M200 195 H560" /><path className="transformer-centre" d="M200 172.5 H560" /><text x="380" y="112" textAnchor="middle">required Z₀ · {result.requiredCharacteristicImpedanceOhms.toFixed(2)} Ω</text><text x="380" y="139" textAnchor="middle">90° at {result.frequencyMHz.toFixed(3)} MHz</text></g>
      <g className="transformer-terminal load"><rect x="560" y="115" width="150" height="115" rx="18" /><text x="635" y="153" textAnchor="middle">REAL LOAD</text><text x="635" y="188" textAnchor="middle">{result.loadResistanceOhms.toFixed(2)} Ω</text><text x="635" y="212" textAnchor="middle">j0 required</text></g>
      <SvgDimension prefix="quarter-transformer" x1={200} y1={278} x2={560} y2={278} label={`ideal physical length · ${idealLength}`} labelX={380} labelY={307} />
      <text className="transformer-check" x="380" y="345" textAnchor="middle">ideal input check · {result.idealInputResistanceOhms.toFixed(3)} + j0 Ω</text>
      <text className="transformer-check" x="380" y="372" textAnchor="middle">cut length with allowance · {formatLength(result.cutLengthMetres, unitSystem)}</text>
    </svg>
    <figcaption>Conceptual single-section transformer · The drawing is not a cable cross-section or cutting scale. Required Z₀ is a design result, not a claim that a suitable line is commercially available.</figcaption>
  </figure>;
}
