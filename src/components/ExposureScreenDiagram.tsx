/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureScreenResult } from '../calculators/exposureScreen';
import { formatLength, type UnitSystem } from '../lib/units';

interface Props {
  result: ExposureScreenResult;
  separationDistanceMetres: number;
  unitSystem: UnitSystem;
}

export function ExposureScreenDiagram({ result, separationDistanceMetres, unitSystem }: Props) {
  const scaleMaximum = Math.max(
    separationDistanceMetres,
    result.farFieldBoundaryMetres,
    result.distanceToScreeningTriggerMetres,
    0.01
  );
  const position = (metres: number) => 80 + Math.min(metres / scaleMaximum, 1) * 590;
  const farFieldX = position(result.farFieldBoundaryMetres);
  const triggerX = position(result.distanceToScreeningTriggerMetres);
  const personX = position(separationDistanceMetres);

  return <figure className="antenna-figure exposure-screen-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 360" role="img" aria-labelledby="screen-title screen-desc">
      <title id="screen-title">Far-field exposure screening geometry</title>
      <desc id="screen-desc">The person is {formatLength(separationDistanceMetres, unitSystem)} from the antenna. The conservative far-field boundary is {formatLength(result.farFieldBoundaryMetres, unitSystem)} and the selected screening trigger distance is {formatLength(result.distanceToScreeningTriggerMetres, unitSystem)}.</desc>
      <defs><pattern id="near-field-hatch" width="10" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><line x1="0" y1="0" x2="0" y2="10" /></pattern></defs>
      <g className="diagram-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="320" />)}
        {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
      </g>
      <rect className="near-field-zone" x="80" y="85" width={Math.max(farFieldX - 80, 2)} height="175" />
      <line className="screen-ground" x1="55" y1="260" x2="705" y2="260" />
      <g className="screen-antenna"><line x1="80" y1="80" x2="80" y2="260" /><line x1="55" y1="105" x2="105" y2="105" /><line x1="61" y1="145" x2="99" y2="145" /><text x="80" y="292" textAnchor="middle">ANTENNA</text></g>
      <g className="screen-boundary"><line x1={farFieldX} y1="70" x2={farFieldX} y2="270" /><text x={farFieldX} y="52" textAnchor="middle">FAR-FIELD CHECK</text><text x={farFieldX} y="70" textAnchor="middle">{formatLength(result.farFieldBoundaryMetres, unitSystem)}</text></g>
      <g className="screen-trigger"><line x1={triggerX} y1="105" x2={triggerX} y2="270" /><text x={triggerX} y="92" textAnchor="middle">SCREENING TRIGGER</text><text x={triggerX} y="110" textAnchor="middle">{formatLength(result.distanceToScreeningTriggerMetres, unitSystem)}</text></g>
      <g className="screen-person" transform={`translate(${personX} 0)`}><circle cx="0" cy="185" r="13" /><line x1="0" y1="198" x2="0" y2="235" /><line x1="0" y1="208" x2="-18" y2="220" /><line x1="0" y1="208" x2="18" y2="220" /><line x1="0" y1="235" x2="-14" y2="260" /><line x1="0" y1="235" x2="14" y2="260" /><text x="0" y="292" textAnchor="middle">PERSON · {formatLength(separationDistanceMetres, unitSystem)}</text></g>
      <path className="screen-distance" d={`M80 315 H${personX}`} /><text className="screen-distance-label" x={(80 + personX) / 2} y="340" textAnchor="middle">straight-line separation from the radiating antenna</text>
    </svg>
    <figcaption>Geometry check only · The screening equation is interpreted only when the evaluation point is beyond the displayed conservative far-field boundary.</figcaption>
  </figure>;
}
