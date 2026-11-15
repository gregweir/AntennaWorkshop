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
  directorsMetres: number[];
  reflectorSpacingMetres: number;
  directorSpacingsMetres: number[];
  unitSystem: UnitSystem;
}

export function YagiDiagram({ reflectorMetres, drivenElementMetres, directorsMetres, reflectorSpacingMetres, directorSpacingsMetres, unitSystem }: Props) {
  const lengths = [reflectorMetres, drivenElementMetres, ...directorsMetres];
  const spacings = [reflectorSpacingMetres, ...directorSpacingsMetres];
  const labels = ['R', 'DE', ...directorsMetres.map((_, index) => `D${index + 1}`)];
  const xPositions = lengths.map((_, index) => 90 + index * (560 / (lengths.length - 1)));
  const maximumLength = Math.max(...lengths);
  const elementHeight = (length: number) => 150 * length / maximumLength;
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 370" role="img" aria-labelledby="yagi-title yagi-desc">
      <title id="yagi-title">Dimensioned {lengths.length}-element NBS Yagi</title>
      <desc id="yagi-desc">Top view with one reflector, one driven element, {directorsMetres.length} {directorsMetres.length === 1 ? 'director' : 'directors'}, and {spacings.length} equal boom sections.</desc>
      <DiagramDefinitions prefix="yagi" />
      <DiagramGrid />
      <line className="yagi-boom" x1={xPositions[0]} y1="175" x2={xPositions[xPositions.length - 1]} y2="175" />
      <g className="yagi-elements">{lengths.map((length, index) => <line key={labels[index]} className={index === 0 ? 'yagi-reflector' : index === 1 ? 'yagi-driven' : 'yagi-director'} x1={xPositions[index]} y1={175 - elementHeight(length) / 2} x2={xPositions[index]} y2={175 + elementHeight(length) / 2} />)}</g>
      <Feedpoint x={xPositions[1]} y={175} label="balanced driven-element feedpoint" labelY={255} />
      <g className="yagi-direction"><path d="M665 45 H725" /><path d="M712 34 L725 45 L712 56" /><text x="695" y="25" textAnchor="middle">forward direction</text></g>
      <g className="end-labels">{lengths.map((length, index) => <text key={labels[index]} x={xPositions[index]} y={82 - elementHeight(length) / 2} textAnchor="middle">{labels[index]} · {formatLength(length, unitSystem)}</text>)}</g>
      {spacings.map((spacing, index) => <SvgDimension key={`${labels[index]}-${labels[index + 1]}`} prefix={`yagi-${index}`} x1={xPositions[index]} y1={315} x2={xPositions[index + 1]} y2={315} label={`${labels[index]}–${labels[index + 1]} · ${formatLength(spacing, unitSystem)}`} labelX={(xPositions[index] + xPositions[index + 1]) / 2} labelY={342} />)}
    </svg>
    <figcaption>Top-view reference geometry · Element lengths and 0.2λ boom spacings are scaled from the NBS {lengths.length}-element design.</figcaption>
  </figure>;
}
