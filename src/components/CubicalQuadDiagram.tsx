/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  drivenSideMetres: number;
  reflectorSideMetres: number;
  elementSpacingMetres: number;
  polarization: 'horizontal' | 'vertical';
  unitSystem: UnitSystem;
}

export function CubicalQuadDiagram({ drivenSideMetres, reflectorSideMetres, elementSpacingMetres, polarization, unitSystem }: Props) {
  const feedpoint = polarization === 'horizontal' ? { x: 285, y: 370 } : { x: 135, y: 220 };

  return <figure className="antenna-figure">
    <svg className="dipole-diagram cubical-quad-diagram" viewBox="0 0 760 430" role="img" aria-labelledby="quad-title quad-description">
      <title id="quad-title">Dimensioned two-element diamond cubical quad</title>
      <desc id="quad-description">A driven full-wave diamond loop and a reflector loop five percent larger, separated along a boom. The selected {polarization} polarization feedpoint is marked on the driven loop.</desc>
      <DiagramDefinitions prefix="cubical-quad" />
      <DiagramGrid />
      <g className="quad-boom"><line x1="285" y1="220" x2="470" y2="150" /><circle cx="285" cy="220" r="5" /><circle cx="470" cy="150" r="5" /></g>
      <g className="quad-reflector"><path d="M470 45 L575 150 L470 255 L365 150 Z" /></g>
      <g className="quad-spreaders quad-reflector-spreaders"><line x1="365" y1="150" x2="575" y2="150" /><line x1="470" y1="45" x2="470" y2="255" /></g>
      <g className="quad-driven"><path d="M285 70 L435 220 L285 370 L135 220 Z" /></g>
      <g className="quad-spreaders quad-driven-spreaders"><line x1="135" y1="220" x2="435" y2="220" /><line x1="285" y1="70" x2="285" y2="370" /></g>
      <g className="quad-feedpoint"><circle cx={feedpoint.x} cy={feedpoint.y} r="8" /><text x={polarization === 'horizontal' ? 285 : 126} y={polarization === 'horizontal' ? 351 : 201} textAnchor={polarization === 'horizontal' ? 'middle' : 'end'}>{polarization} feedpoint</text></g>
      <text className="diagram-caption" x="255" y="48" textAnchor="middle">Driven loop · side {formatLength(drivenSideMetres, unitSystem)}</text>
      <text className="diagram-caption" x="500" y="25" textAnchor="middle">Reflector +5% · side {formatLength(reflectorSideMetres, unitSystem)}</text>
      <SvgDimension prefix="quad-spacing" x1={325} y1={405} x2={510} y2={405} label={`Boom spacing · ${formatLength(elementSpacingMetres, unitSystem)}`} labelX={417} labelY={389} />
      <g className="quad-forward"><line x1="120" y1="105" x2="62" y2="132" /><path d="M62 132 l7 -12 6 13 Z" /><text x="52" y="151">Forward direction</text></g>
    </svg>
    <figcaption>Perspective diamond-support view, not to scale · Loop and boom dimensions are construction starting points. Spreader flex, wire sag, conductor size, feed arrangement, boom interaction, matching, and the installed pattern require modelling and measurement.</figcaption>
  </figure>;
}
