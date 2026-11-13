/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  radiatorHeightMetres: number;
  loadingPointFromBaseMetres: number;
  inductanceMicrohenries: number;
  unitSystem: UnitSystem;
}

export function LoadedVerticalDiagram({ radiatorHeightMetres, loadingPointFromBaseMetres, inductanceMicrohenries, unitSystem }: Props) {
  const baseY = 275;
  const topY = 55;
  const coilY = baseY - (baseY - topY) * loadingPointFromBaseMetres / radiatorHeightMetres;
  const renderedCoilY = loadingPointFromBaseMetres === 0 ? baseY - 20 : coilY;
  const placement = loadingPointFromBaseMetres === 0 ? 'base loading' : `coil at ${formatLength(loadingPointFromBaseMetres, unitSystem)}`;
  return <figure className="antenna-figure">
    <svg className="dipole-diagram loaded-antenna-diagram" viewBox="0 0 760 350" role="img" aria-labelledby="loaded-vertical-title loaded-vertical-desc">
      <title id="loaded-vertical-title">Dimensioned inductively loaded vertical</title>
      <desc id="loaded-vertical-desc">A shortened vertical {formatLength(radiatorHeightMetres, unitSystem)} high with {placement} and a calculated series inductance of {inductanceMicrohenries.toFixed(2)} microhenries.</desc>
      <DiagramDefinitions prefix="loaded-vertical" />
      <DiagramGrid />
      <line className="ground-line" x1="100" y1="290" x2="660" y2="290" />
      <g className="antenna-wire"><line x1="380" y1={topY} x2="380" y2={Math.max(topY, renderedCoilY - 18)} /><line x1="380" y1={Math.min(baseY, renderedCoilY + 18)} x2="380" y2={baseY} /></g>
      <path className="loading-coil" d={`M 380 ${renderedCoilY + 18} q 22 -6 0 -12 t 0 -12 t 0 -12`} />
      <Feedpoint x={380} y={baseY} label="base feed · radial or counterpoise system" labelY={337} />
      <SvgDimension prefix="loaded-vertical-height" x1={455} y1={topY} x2={455} y2={baseY} label={`Radiator · ${formatLength(radiatorHeightMetres, unitSystem)}`} labelX={555} labelY={168} />
      {loadingPointFromBaseMetres > 0 && <SvgDimension prefix="loaded-vertical-coil" x1={315} y1={baseY} x2={315} y2={coilY} label={`Coil height · ${formatLength(loadingPointFromBaseMetres, unitSystem)}`} labelX={225} labelY={(baseY + coilY) / 2} />}
      <g className="end-labels"><text x="400" y={renderedCoilY - 25}>L = {inductanceMicrohenries.toFixed(2)} µH</text><text x="485" y="270">RF return system required</text></g>
    </svg>
    <figcaption>Single-band construction model · The radial/counterpoise system, coil Q, matching, and installed environment are not calculated.</figcaption>
  </figure>;
}
