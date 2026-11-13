/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import type { BeverageReceptionMode } from '../calculators/beverage';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  designWireLengthMetres: number;
  wireHeightMetres: number;
  targetBearingDegrees: number;
  targetCompassPoint: string;
  reverseBearingDegrees: number;
  reverseCompassPoint: string;
  receptionMode: BeverageReceptionMode;
  terminationResistanceOhms: number;
  transformerTurnsRatio: number;
  unitSystem: UnitSystem;
}

export function BeverageDiagram({ designWireLengthMetres, wireHeightMetres, targetBearingDegrees, targetCompassPoint, reverseBearingDegrees, reverseCompassPoint, receptionMode, terminationResistanceOhms, transformerTurnsRatio, unitSystem }: Props) {
  const centreX = 220;
  const centreY = 165;
  const radius = 118;
  const radians = targetBearingDegrees * Math.PI / 180;
  const endX = centreX + Math.sin(radians) * radius;
  const endY = centreY - Math.cos(radians) * radius;
  const reverseX = centreX - Math.sin(radians) * radius;
  const reverseY = centreY + Math.cos(radians) * radius;

  return <figure className="antenna-figure">
    <svg className="dipole-diagram beverage-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="beverage-title beverage-description">
      <title id="beverage-title">Beverage receiving-antenna route and elevation</title>
      <desc id="beverage-description">Plan view shows the wire axis from its feed end toward a target bearing of {targetBearingDegrees.toFixed(0)} degrees {targetCompassPoint}. Elevation view shows a low horizontal wire, ground returns, feed transformer, and {receptionMode === 'terminated' ? 'far-end terminating resistor' : 'insulated open far end'}.</desc>
      <DiagramDefinitions prefix="beverage" />
      <DiagramGrid />
      <g className="beverage-plan">
        <circle cx={centreX} cy={centreY} r={radius + 12} />
        <line x1={centreX} y1={centreY - radius - 12} x2={centreX} y2={centreY + radius + 12} />
        <line x1={centreX - radius - 12} y1={centreY} x2={centreX + radius + 12} y2={centreY} />
        <text x={centreX} y={centreY - radius - 20} textAnchor="middle">N</text><text x={centreX + radius + 22} y={centreY + 4} textAnchor="middle">E</text><text x={centreX} y={centreY + radius + 28} textAnchor="middle">S</text><text x={centreX - radius - 22} y={centreY + 4} textAnchor="middle">W</text>
        <line className="beverage-route" x1={centreX} y1={centreY} x2={endX} y2={endY} />
        <circle className="beverage-feed-point" cx={centreX} cy={centreY} r="8" />
        <circle className="beverage-far-point" cx={endX} cy={endY} r="8" />
        {receptionMode === 'unterminated' && <line className="beverage-reverse-axis" x1={centreX} y1={centreY} x2={reverseX} y2={reverseY} />}
        <text x={centreX} y={centreY + 22} textAnchor="middle">Feed</text>
        <text x={endX} y={endY - 14} textAnchor="middle">{receptionMode === 'terminated' ? 'Termination' : 'Open end'}</text>
        <path className="beverage-response-arrow" d={`M ${centreX + (endX - centreX) * 0.45} ${centreY + (endY - centreY) * 0.45} L ${endX} ${endY}`} />
        <text className="beverage-bearing-label" x="420" y="80">Target axis · {targetBearingDegrees.toFixed(0)}° {targetCompassPoint}</text>
        {receptionMode === 'unterminated' && <text className="beverage-bearing-label" x="420" y="101">Reverse axis · {reverseBearingDegrees.toFixed(0)}° {reverseCompassPoint}</text>}
      </g>
      <g className="beverage-elevation">
        <line className="beverage-ground" x1="92" y1="440" x2="684" y2="440" />
        <line className="beverage-wire" x1="145" y1="345" x2="620" y2="345" />
        <line className="beverage-drop" x1="145" y1="345" x2="145" y2="427" />
        <line className="beverage-drop" x1="620" y1="345" x2="620" y2="427" />
        <rect className="beverage-component" x="108" y="375" width="74" height="31" rx="7" /><text x="145" y="395" textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1 turns</text>
        {receptionMode === 'terminated' ? <><rect className="beverage-component" x="578" y="375" width="84" height="31" rx="7" /><text x="620" y="395" textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text></> : <text x="620" y="383" textAnchor="middle">Insulated open end</text>}
        <path className="beverage-ground-symbol" d="M 130 427 h 30 M 134 434 h 22 M 139 441 h 12 M 605 427 h 30 M 609 434 h 22 M 614 441 h 12" />
        <text x="145" y="465" textAnchor="middle">Feed ground</text><text x="620" y="465" textAnchor="middle">{receptionMode === 'terminated' ? 'Termination ground' : 'No far-end ground'}</text>
      </g>
      <SvgDimension prefix="beverage-length" x1={145} y1={322} x2={620} y2={322} label={`Horizontal wire · ${formatLength(designWireLengthMetres, unitSystem)}`} labelX={382} labelY={307} />
      <SvgDimension prefix="beverage-height" x1={700} y1={345} x2={700} y2={440} label={`Height · ${formatLength(wireHeightMetres, unitSystem)}`} labelX={700} labelY={330} />
    </svg>
    <figcaption>Plan and elevation views, not to scale · The target bearing runs from the feed end toward the far end. A terminated Beverage’s primary response is expected toward the termination; the actual pattern depends on the complete wire, ground, feed, terrain, and surroundings.</figcaption>
  </figure>;
}
