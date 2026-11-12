/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  radiatorMetres: number;
  transformerRatio: number;
  unitSystem: UnitSystem;
}

export function EfhwDiagram({ radiatorMetres, transformerRatio, unitSystem }: Props) {
  const lengthLabel = formatLength(radiatorMetres, unitSystem);
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="efhw-title efhw-desc">
      <title id="efhw-title">Dimensioned end-fed half-wave antenna</title>
      <desc id="efhw-desc">A {lengthLabel} half-wave radiator extends from a {transformerRatio}:1 impedance transformer. A separate RF return strategy and common-mode control are required.</desc>
      <DiagramDefinitions prefix="efhw" />
      <DiagramGrid />
      <g className="antenna-wire">
        <line x1="165" y1="125" x2="690" y2="125" />
        <circle cx="690" cy="125" r="6" />
      </g>
      <g className="transformer-box">
        <rect x="92" y="90" width="74" height="70" rx="10" />
        <path d="M112 111 C128 111 128 139 144 139 M112 139 C128 139 128 111 144 111" />
        <text x="129" y="181" textAnchor="middle">{transformerRatio}:1 transformer</text>
      </g>
      <g className="coax-path">
        <path d="M92 125 H42" />
        <text x="67" y="108" textAnchor="middle">50 Ω coax</text>
      </g>
      <g className="return-path">
        <path d="M128 160 V235 H48" />
        <text x="210" y="231">RF return path and common-mode control</text>
        <text x="210" y="252">must be designed for the installation</text>
      </g>
      <SvgDimension prefix="efhw" x1={165} y1={70} x2={690} y2={70} label={`Radiator cut length · ${lengthLabel}`} labelX={428} labelY={50} />
      <g className="hazard-labels">
        <text x="690" y="165" textAnchor="middle">HIGH RF VOLTAGE</text>
        <text x="166" y="205">end-fed high-impedance point</text>
      </g>
    </svg>
    <figcaption>Construction concept · Transformer design, RF return path, choking, and deployment geometry require separate verification.</figcaption>
  </figure>;
}
