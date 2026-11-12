/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  reflectorMetres: number;
  drivenElementMetres: number;
  directorMetres: number;
  reflectorSpacingMetres: number;
  directorSpacingMetres: number;
  unitSystem: UnitSystem;
}

export function YagiDiagram({ reflectorMetres, drivenElementMetres, directorMetres, reflectorSpacingMetres, directorSpacingMetres, unitSystem }: Props) {
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 340" role="img" aria-labelledby="yagi-title yagi-desc">
      <title id="yagi-title">Dimensioned three-element Yagi</title>
      <desc id="yagi-desc">Top view with reflector {formatLength(reflectorMetres, unitSystem)}, driven element {formatLength(drivenElementMetres, unitSystem)}, director {formatLength(directorMetres, unitSystem)}, and a two-section boom.</desc>
      <DiagramDefinitions prefix="yagi" />
      <DiagramGrid />
      <line className="yagi-boom" x1="140" y1="165" x2="620" y2="165" />
      <g className="yagi-elements">
        <line className="yagi-reflector" x1="140" y1="65" x2="140" y2="265" />
        <line className="yagi-driven" x1="380" y1="60" x2="380" y2="270" />
        <line className="yagi-director" x1="620" y1="76" x2="620" y2="254" />
      </g>
      <Feedpoint x={380} y={165} label="balanced driven-element feedpoint" labelY={226} />
      <g className="yagi-direction"><path d="M650 45 H720" /><path d="M707 34 L720 45 L707 56" /><text x="685" y="25" textAnchor="middle">forward direction</text></g>
      <g className="end-labels">
        <text x="140" y="48" textAnchor="middle">reflector · {formatLength(reflectorMetres, unitSystem)}</text>
        <text x="380" y="43" textAnchor="middle">driven · {formatLength(drivenElementMetres, unitSystem)}</text>
        <text x="620" y="66" textAnchor="middle">director · {formatLength(directorMetres, unitSystem)}</text>
      </g>
      <SvgDimension prefix="yagi" x1={140} y1={300} x2={380} y2={300} label={`R–DE · ${formatLength(reflectorSpacingMetres, unitSystem)}`} labelX={260} labelY={326} />
      <SvgDimension prefix="yagi" x1={380} y1={300} x2={620} y2={300} label={`DE–D1 · ${formatLength(directorSpacingMetres, unitSystem)}`} labelX={500} labelY={326} />
    </svg>
    <figcaption>Top-view reference geometry · Element lengths and boom spacings are scaled from the NBS 0.4-wavelength three-element design.</figcaption>
  </figure>;
}
