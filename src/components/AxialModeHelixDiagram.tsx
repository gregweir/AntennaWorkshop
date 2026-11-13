/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  turnCount: number;
  diameterMetres: number;
  turnSpacingMetres: number;
  axialLengthMetres: number;
  groundPlaneDiameterMetres: number;
  handedness: 'right' | 'left';
  unitSystem: UnitSystem;
}

export function AxialModeHelixDiagram({ turnCount, diameterMetres, turnSpacingMetres, axialLengthMetres, groundPlaneDiameterMetres, handedness, unitSystem }: Props) {
  const startX = 155;
  const endX = 665;
  const centreY = 205;
  const radius = 92;
  const samples = Math.max(160, turnCount * 28);
  const direction = handedness === 'right' ? 1 : -1;
  const points = Array.from({ length: samples + 1 }, (_, index) => {
    const progress = index / samples;
    const phase = progress * turnCount * Math.PI * 2;
    return `${startX + progress * (endX - startX)},${centreY + direction * Math.sin(phase) * radius}`;
  }).join(' ');
  const polarization = handedness === 'right' ? 'RHCP' : 'LHCP';

  return <figure className="antenna-figure">
    <svg className="dipole-diagram axial-helix-diagram" viewBox="0 0 760 440" role="img" aria-labelledby="helix-title helix-description">
      <title id="helix-title">Dimensioned axial-mode helical antenna</title>
      <desc id="helix-description">A {turnCount}-turn {handedness}-handed helix extends from a ground plane toward its direct endfire direction. Its diameter, turn spacing, axial length, and ground-plane diameter are labelled.</desc>
      <DiagramDefinitions prefix="axial-helix" />
      <DiagramGrid />
      <g className="helix-ground-plane"><ellipse cx="120" cy={centreY} rx="33" ry="138" /><line x1="120" y1="67" x2="120" y2="343" /></g>
      <line className="helix-axis" x1="120" y1={centreY} x2="710" y2={centreY} />
      <polyline className="helix-conductor" points={points} />
      <circle className="helix-feedpoint" cx={startX} cy={centreY} r="7" />
      <text className="diagram-caption" x="120" y="40" textAnchor="middle">Ground plane · {formatLength(groundPlaneDiameterMetres, unitSystem)}</text>
      <text className="diagram-caption" x="170" y="190">Feed and match</text>
      <SvgDimension prefix="helix-length" x1={startX} y1={365} x2={endX} y2={365} label={`Axial length · ${formatLength(axialLengthMetres, unitSystem)}`} labelX={410} labelY={350} />
      <SvgDimension prefix="helix-diameter" x1={700} y1={centreY - radius} x2={700} y2={centreY + radius} label={`Ø ${formatLength(diameterMetres, unitSystem)}`} labelX={684} labelY={centreY - radius - 12} />
      <SvgDimension prefix="helix-spacing" x1={475} y1={92} x2={475 + (endX - startX) / turnCount} y2={92} label={`Turn spacing · ${formatLength(turnSpacingMetres, unitSystem)}`} labelX={475 + (endX - startX) / turnCount / 2} labelY={77} />
      <g className="helix-forward"><line x1="665" y1="55" x2="724" y2="55" /><path d="M724 55 l-13 -8 v16 Z" /><text x="694" y="38" textAnchor="middle">Direct endfire</text></g>
      <g className="helix-polarization"><rect x="245" y="390" width="270" height="34" rx="9" /><text x="380" y="412" textAnchor="middle">{handedness === 'right' ? 'Right' : 'Left'}-handed winding · {polarization}</text></g>
    </svg>
    <figcaption>Construction view, not to scale · Polarization label applies to unobstructed direct endfire. A dish reflection reverses circular-polarization sense. Model the reflector, feed transition, supports, conductor size, and nearby structures before construction.</figcaption>
  </figure>;
}
