/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface ElementGeometry {
  number: number;
  cutLengthMetres: number;
  spacingToNextMetres: number;
  boomPositionMetres: number;
  halfWaveFrequencyMHz: number;
  connection: string;
}

interface Props {
  elements: ElementGeometry[];
  boomSpanMetres: number;
  apexIncludedAngleDegrees: number;
  unitSystem: UnitSystem;
}

export function LogPeriodicDiagram({ elements, boomSpanMetres, apexIncludedAngleDegrees, unitSystem }: Props) {
  const xStart = 130;
  const xEnd = 625;
  const centreY = 220;
  const longest = elements[0]?.cutLengthMetres ?? 1;
  const xScale = boomSpanMetres > 0 ? (xEnd - xStart) / boomSpanMetres : 1;
  const displayed = elements.length <= 32 ? elements : elements.filter((_, index) => index % Math.ceil(elements.length / 32) === 0 || index === elements.length - 1);

  return <figure className="antenna-figure">
    <svg className="dipole-diagram lpda-diagram" viewBox="0 0 760 440" role="img" aria-labelledby="lpda-title lpda-description">
      <title id="lpda-title">Dimensioned log-periodic dipole array</title>
      <desc id="lpda-description">An array of {elements.length} parallel dipoles decreases geometrically from the longest rear element to the shortest front element. Adjacent elements connect to the two boom conductors with alternating polarity. The beam points toward the shorter elements.</desc>
      <DiagramDefinitions prefix="lpda" />
      <DiagramGrid />
      <g className="lpda-envelope"><path d={`M 86 ${centreY - 168} L 684 ${centreY} L 86 ${centreY + 168}`} /><text x="96" y="42">Included apex · {apexIncludedAngleDegrees.toFixed(1)}°</text></g>
      <g className="lpda-boom"><line x1="104" y1={centreY - 6} x2="660" y2={centreY - 6} /><line x1="104" y1={centreY + 6} x2="660" y2={centreY + 6} /></g>
      <g className="lpda-elements">{displayed.map((element) => {
        const x = xStart + element.boomPositionMetres * xScale;
        const halfHeight = 150 * element.cutLengthMetres / longest;
        return <g key={element.number}><line x1={x} y1={centreY - halfHeight} x2={x} y2={centreY + halfHeight} /><circle cx={x} cy={centreY - 6} r="3.5" /><circle cx={x} cy={centreY + 6} r="3.5" /><text x={x} y={centreY + halfHeight + 17} textAnchor="middle">{element.number}</text></g>;
      })}</g>
      <g className="lpda-beam"><line x1="585" y1="72" x2="684" y2="72" /><path d="M 684 72 l -16 -9 v 18 z" /><text x="635" y="55" textAnchor="middle">Beam direction</text></g>
      <SvgDimension prefix="lpda-longest" x1={82} y1={70} x2={82} y2={370} label={`Longest · ${formatLength(elements[0]?.cutLengthMetres ?? 0, unitSystem)}`} labelX={82} labelY={48} />
      <SvgDimension prefix="lpda-boom-span" x1={xStart} y1={404} x2={xEnd} y2={404} label={`Element-centre span · ${formatLength(boomSpanMetres, unitSystem)}`} labelX={(xStart + xEnd) / 2} labelY={390} />
    </svg>
    <figcaption>Plan view, not to scale · Element 1 is the longest rear element; feed at the short-element end. The schedule gives every cut length, centre spacing, boom position, and alternating connection.</figcaption>
  </figure>;
}

export function LogPeriodicSchedule({ elements, unitSystem }: Pick<Props, 'elements' | 'unitSystem'>) {
  return <section className="lpda-schedule" aria-labelledby="lpda-schedule-title">
    <div><p className="eyebrow">Element schedule</p><h3 id="lpda-schedule-title">Cut, position, and alternate every dipole</h3></div>
    <div className="table-scroll"><table><thead><tr><th scope="col">Element</th><th scope="col">Full cut length</th><th scope="col">Each half</th><th scope="col">Next centre spacing</th><th scope="col">Boom position</th><th scope="col">Half-wave reference</th><th scope="col">Connection</th></tr></thead><tbody>{elements.map((element) => <tr key={element.number}><th scope="row">{element.number}</th><td>{formatLength(element.cutLengthMetres, unitSystem)}</td><td>{formatLength(element.cutLengthMetres / 2, unitSystem)}</td><td>{element.spacingToNextMetres > 0 ? formatLength(element.spacingToNextMetres, unitSystem) : '—'}</td><td>{formatLength(element.boomPositionMetres, unitSystem)}</td><td>{element.halfWaveFrequencyMHz.toFixed(3)} MHz</td><td>{element.connection}</td></tr>)}</tbody></table></div>
    <p>Connections name the two balanced boom conductors as viewed from the rear toward the shorter elements. Confirm the physical crossover and feed arrangement in the complete electromagnetic model.</p>
  </section>;
}
