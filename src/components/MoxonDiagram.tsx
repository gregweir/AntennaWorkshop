/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  aMetres: number;
  bMetres: number;
  cMetres: number;
  dMetres: number;
  eMetres: number;
  unitSystem: UnitSystem;
}

export function MoxonDiagram({ aMetres, bMetres, cMetres, dMetres, eMetres, unitSystem }: Props) {
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="moxon-title moxon-desc">
      <title id="moxon-title">Dimensioned Moxon rectangle</title>
      <desc id="moxon-desc">Top view of a two-element directional Moxon rectangle with width A {formatLength(aMetres, unitSystem)}, overall depth E {formatLength(eMetres, unitSystem)}, and two end gaps C {formatLength(cMetres, unitSystem)}.</desc>
      <DiagramDefinitions prefix="moxon" />
      <DiagramGrid />
      <g className="moxon-elements">
        <path className="moxon-driven" d="M115 105 H359 M401 105 H645 M115 105 V160 M645 105 V160" />
        <path className="moxon-reflector" d="M115 250 H645 M115 250 V195 M645 250 V195" />
      </g>
      <Feedpoint x={380} y={105} label="balanced driven-element feedpoint" labelY={83} />
      <g className="moxon-direction"><path d="M380 65 V28" /><path d="M370 40 L380 28 L390 40" /><text x="410" y="35">main-lobe direction</text></g>
      <SvgDimension prefix="moxon" x1={115} y1={285} x2={645} y2={285} label={`A · width · ${formatLength(aMetres, unitSystem)}`} labelX={380} labelY={312} />
      <SvgDimension prefix="moxon" x1={690} y1={105} x2={690} y2={250} label={`E · depth · ${formatLength(eMetres, unitSystem)}`} labelX={705} labelY={185} />
      <g className="end-labels">
        <text x="90" y="139" textAnchor="end">B · {formatLength(bMetres, unitSystem)}</text>
        <text x="90" y="227" textAnchor="end">D · {formatLength(dMetres, unitSystem)}</text>
        <text x="145" y="181">C · critical gap · {formatLength(cMetres, unitSystem)}</text>
      </g>
    </svg>
    <figcaption>Top-view construction drawing · Dimensions A–E follow the Cebik/MoxGen constant-diameter regression model.</figcaption>
  </figure>;
}
