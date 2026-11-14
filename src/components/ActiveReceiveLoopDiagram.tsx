/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  loopDiameterMetres: number;
  baseHeightMetres: number;
  topHeightMetres: number;
  nullAxisBearingDegrees: number;
  nullCompassPoint: string;
  reverseNullBearingDegrees: number;
  reverseNullCompassPoint: string;
  loopPlaneBearingDegrees: number;
  loopPlaneCompassPoint: string;
  unitSystem: UnitSystem;
}

export function ActiveReceiveLoopDiagram({ loopDiameterMetres, baseHeightMetres, topHeightMetres, nullAxisBearingDegrees, nullCompassPoint, reverseNullBearingDegrees, reverseNullCompassPoint, loopPlaneBearingDegrees, loopPlaneCompassPoint, unitSystem }: Props) {
  const centreX = 230;
  const centreY = 195;
  const radius = 105;
  const point = (bearing: number, distance: number) => {
    const radians = bearing * Math.PI / 180;
    return { x: centreX + Math.sin(radians) * distance, y: centreY - Math.cos(radians) * distance };
  };
  const nullA = point(nullAxisBearingDegrees, radius + 28);
  const nullB = point(reverseNullBearingDegrees, radius + 28);
  const planeA = point(loopPlaneBearingDegrees, radius);
  const planeB = point((loopPlaneBearingDegrees + 180) % 360, radius);

  return <figure className="antenna-figure">
    <svg className="dipole-diagram active-receive-loop-diagram" viewBox="0 0 760 520" role="img" aria-labelledby="active-loop-title active-loop-description">
      <title id="active-loop-title">Untuned active receiving-loop elevation and orientation</title>
      <desc id="active-loop-description">A circular vertical one-turn loop has its amplifier at the bottom. The plan view marks an expected bidirectional null axis at {nullAxisBearingDegrees.toFixed(0)} degrees {nullCompassPoint} and {reverseNullBearingDegrees.toFixed(0)} degrees {reverseNullCompassPoint}; the loop plane runs at {loopPlaneBearingDegrees.toFixed(0)} degrees {loopPlaneCompassPoint}.</desc>
      <DiagramDefinitions prefix="active-rx-loop" />
      <DiagramGrid />
      <g className="active-loop-plan">
        <circle className="active-loop-compass" cx={centreX} cy={centreY} r={radius + 22} />
        <text x={centreX} y={centreY - radius - 34} textAnchor="middle">N</text>
        <text x={centreX + radius + 35} y={centreY + 4} textAnchor="middle">E</text>
        <text x={centreX} y={centreY + radius + 42} textAnchor="middle">S</text>
        <text x={centreX - radius - 35} y={centreY + 4} textAnchor="middle">W</text>
        <line className="active-loop-plane" x1={planeA.x} y1={planeA.y} x2={planeB.x} y2={planeB.y} />
        <path className="active-loop-null" d={`M ${centreX} ${centreY} L ${nullA.x} ${nullA.y}`} />
        <path className="active-loop-null" d={`M ${centreX} ${centreY} L ${nullB.x} ${nullB.y}`} />
        <circle className="active-loop-centre" cx={centreX} cy={centreY} r="7" />
        <text className="active-loop-plan-label" x="390" y="94">Expected null axis</text>
        <text className="active-loop-plan-label" x="390" y="116">{nullAxisBearingDegrees.toFixed(0)}° {nullCompassPoint} ↔ {reverseNullBearingDegrees.toFixed(0)}° {reverseNullCompassPoint}</text>
        <text className="active-loop-plan-label" x="390" y="148">Loop plane · {loopPlaneBearingDegrees.toFixed(0)}° {loopPlaneCompassPoint}</text>
      </g>
      <g className="active-loop-elevation">
        <line className="active-loop-ground" x1="72" y1="459" x2="688" y2="459" />
        <circle className="active-loop-wire" cx="518" cy="326" r="91" />
        <rect className="active-loop-amplifier" x="478" y="405" width="80" height="45" rx="8" />
        <text x="518" y="426" textAnchor="middle">Balanced</text>
        <text x="518" y="441" textAnchor="middle">amplifier</text>
        <line className="active-loop-coax" x1="558" y1="429" x2="650" y2="429" />
        <text x="608" y="416" textAnchor="middle">Coax + DC path</text>
        <SvgDimension prefix="active-loop-diameter" x1={414} y1={326} x2={622} y2={326} label={`Diameter · ${formatLength(loopDiameterMetres, unitSystem)}`} labelX={518} labelY={312} />
        <SvgDimension prefix="active-loop-base" x1={680} y1={459} x2={680} y2={417} label={`Base · ${formatLength(baseHeightMetres, unitSystem)}`} labelX={650} labelY={449} />
        <text x="518" y="482" textAnchor="middle">Top height · {formatLength(topHeightMetres, unitSystem)}</text>
      </g>
    </svg>
    <figcaption>Plan and elevation views, not to scale · Rotate the complete loop and amplifier together. Null direction is an expected small-loop context, not a guaranteed installed null.</figcaption>
  </figure>;
}
