/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Direction {
  bearingDegrees: number;
  compassPoint: string;
  loop: number;
  reversed: boolean;
  terminationBearingDegrees: number;
  terminationCompassPoint: string;
}

interface Props {
  apexHeightMetres: number;
  halfWidthMetres: number;
  lowerCornerHeightMetres: number;
  footprintDiameterMetres: number;
  directions: Direction[];
  selectedDirectionIndex: number;
  terminationResistanceOhms: number;
  transformerTurnsRatio: number;
  unitSystem: UnitSystem;
}

export function K9ayDiagram({ apexHeightMetres, halfWidthMetres, lowerCornerHeightMetres, footprintDiameterMetres, directions, selectedDirectionIndex, terminationResistanceOhms, transformerTurnsRatio, unitSystem }: Props) {
  const selected = directions[selectedDirectionIndex];
  const centreX = 205;
  const centreY = 170;
  const axisRadius = 112;
  const point = (bearingDegrees: number, radius = axisRadius) => {
    const radians = bearingDegrees * Math.PI / 180;
    return { x: centreX + Math.sin(radians) * radius, y: centreY - Math.cos(radians) * radius };
  };
  const selectedEnd = point(selected.bearingDegrees);
  const selectedStart = point(selected.terminationBearingDegrees, 34);

  return <figure className="antenna-figure">
    <svg className="dipole-diagram k9ay-diagram" viewBox="0 0 760 540" role="img" aria-labelledby="k9ay-title k9ay-description">
      <title id="k9ay-title">K9AY crossed-loop geometry and four-direction switching</title>
      <desc id="k9ay-description">Plan view shows two loops at right angles with four selectable receive bearings. Direction {selectedDirectionIndex + 1} is selected, using loop {selected.loop} in its {selected.reversed ? 'reversed' : 'reference'} state to receive toward {selected.bearingDegrees.toFixed(0)} degrees {selected.compassPoint}. Elevation view shows one quasi-delta loop with a shared ground, matching transformer, and terminating resistor.</desc>
      <DiagramDefinitions prefix="k9ay" />
      <DiagramGrid />
      <g className="k9ay-plan">
        <circle cx={centreX} cy={centreY} r={axisRadius + 16} />
        <text x={centreX} y={centreY - axisRadius - 23} textAnchor="middle">N</text><text x={centreX + axisRadius + 24} y={centreY + 4} textAnchor="middle">E</text><text x={centreX} y={centreY + axisRadius + 30} textAnchor="middle">S</text><text x={centreX - axisRadius - 24} y={centreY + 4} textAnchor="middle">W</text>
        {[0, 1].map((loopIndex) => {
          const one = point(directions[loopIndex].bearingDegrees);
          const other = point(directions[loopIndex + 2].bearingDegrees);
          return <line key={loopIndex} className={`k9ay-loop-axis k9ay-loop-${loopIndex + 1}`} x1={one.x} y1={one.y} x2={other.x} y2={other.y} />;
        })}
        {directions.map((direction, index) => {
          const end = point(direction.bearingDegrees, axisRadius + 2);
          return <g key={direction.bearingDegrees} className={index === selectedDirectionIndex ? 'k9ay-direction selected' : 'k9ay-direction'}><circle cx={end.x} cy={end.y} r="14" /><text x={end.x} y={end.y + 4} textAnchor="middle">{direction.compassPoint}</text></g>;
        })}
        <path className="k9ay-response-arrow" d={`M ${selectedStart.x} ${selectedStart.y} L ${selectedEnd.x} ${selectedEnd.y}`} />
        <circle className="k9ay-ground-point" cx={centreX} cy={centreY} r="8" />
        <text className="k9ay-selected-label" x="390" y="98">Selected · {selected.bearingDegrees.toFixed(0)}° {selected.compassPoint}</text>
        <text className="k9ay-selected-label" x="390" y="120">Loop {selected.loop} · {selected.reversed ? 'feed/termination reversed' : 'reference connections'}</text>
        <text className="k9ay-selected-label" x="390" y="142">Null end · {selected.terminationBearingDegrees.toFixed(0)}° {selected.terminationCompassPoint}</text>
      </g>
      <g className="k9ay-elevation">
        <line className="k9ay-ground" x1="85" y1="500" x2="690" y2="500" />
        <path className="k9ay-wire" d="M 145 420 L 385 300 L 625 420 L 430 482 M 340 482 L 145 420" />
        <circle className="k9ay-apex-point" cx="385" cy="300" r="6" />
        <circle className="k9ay-feed-point" cx="340" cy="482" r="7" />
        <circle className="k9ay-termination-point" cx="430" cy="482" r="7" />
        <rect className="k9ay-component" x="288" y="438" width="92" height="28" rx="7" /><text x="334" y="457" textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1 turns</text>
        <rect className="k9ay-component" x="401" y="438" width="74" height="28" rx="7" /><text x="438" y="457" textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text>
        <path className="k9ay-ground-symbol" d="M 370 482 h 30 M 374 489 h 22 M 379 496 h 12" />
        <text x="385" y="525" textAnchor="middle">Shared base ground and switching enclosure</text>
      </g>
      <SvgDimension prefix="k9ay-width" x1={145} y1={395} x2={625} y2={395} label={`Footprint diameter · ${formatLength(footprintDiameterMetres, unitSystem)}`} labelX={385} labelY={380} />
      <SvgDimension prefix="k9ay-height" x1={700} y1={300} x2={700} y2={500} label={`Apex height · ${formatLength(apexHeightMetres, unitSystem)}`} labelX={700} labelY={282} />
      <SvgDimension prefix="k9ay-half-width" x1={385} y1={355} x2={625} y2={355} label={`Half-width · ${formatLength(halfWidthMetres, unitSystem)}`} labelX={505} labelY={340} />
      <SvgDimension prefix="k9ay-corner" x1={105} y1={420} x2={105} y2={500} label={`Corner · ${formatLength(lowerCornerHeightMetres, unitSystem)}`} labelX={105} labelY={407} />
    </svg>
    <figcaption>Plan and elevation views, not to scale · Two loops share one support and ground. Selecting a loop and reversing its feed and termination provides four directions; actual response depends on the full installation.</figcaption>
  </figure>;
}
