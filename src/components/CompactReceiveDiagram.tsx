/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { CompactReceiveGeometry } from '../calculators/compactReceive';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  geometry: CompactReceiveGeometry;
  horizontalSpanMetres: number;
  verticalHeightMetres: number;
  bottomClearanceMetres: number;
  receiveBearingDegrees: number;
  receiveCompassPoint: string;
  nullBearingDegrees: number;
  nullCompassPoint: string;
  terminationResistanceOhms: number;
  transformerTurnsRatio: number;
  unitSystem: UnitSystem;
}

const geometryNames: Record<CompactReceiveGeometry, string> = {
  flag: 'Flag',
  pennant: 'point-fed Pennant',
  ewe: 'EWE'
};

export function CompactReceiveDiagram({ geometry, horizontalSpanMetres, verticalHeightMetres, bottomClearanceMetres, receiveBearingDegrees, receiveCompassPoint, nullBearingDegrees, nullCompassPoint, terminationResistanceOhms, transformerTurnsRatio, unitSystem }: Props) {
  const feedX = 620;
  const terminationX = 150;
  const topY = 315;
  const bottomY = 430;
  const middleY = (topY + bottomY) / 2;
  const wirePath = geometry === 'flag'
    ? `M ${terminationX} ${middleY} L ${terminationX} ${topY} L ${feedX} ${topY} L ${feedX} ${middleY} M ${feedX} ${middleY} L ${feedX} ${bottomY} L ${terminationX} ${bottomY} L ${terminationX} ${middleY}`
    : geometry === 'pennant'
      ? `M ${terminationX} ${middleY} L ${feedX} ${topY} L ${feedX} ${middleY} M ${feedX} ${middleY} L ${feedX} ${bottomY} L ${terminationX} ${middleY}`
      : `M ${terminationX} ${448} L ${terminationX} ${topY} L ${feedX} ${topY} L ${feedX} ${448}`;

  return <figure className="antenna-figure">
    <svg className="dipole-diagram compact-receive-diagram" viewBox="0 0 760 520" role="img" aria-labelledby="compact-receive-title compact-receive-description">
      <title id="compact-receive-title">{geometryNames[geometry]} receiving-antenna geometry and direction</title>
      <desc id="compact-receive-description">The antenna receives primarily toward its feed end at {receiveBearingDegrees.toFixed(0)} degrees {receiveCompassPoint}, with its principal null toward the terminating resistor at {nullBearingDegrees.toFixed(0)} degrees {nullCompassPoint}. The elevation view identifies the feedpoint, termination, dimensions, and {geometry === 'ewe' ? 'two ground returns' : 'elevated closed wire loop'}.</desc>
      <DiagramDefinitions prefix="compact-receive" />
      <DiagramGrid />
      <g className="compact-direction-panel">
        <line className="compact-direction-axis" x1="145" y1="115" x2="620" y2="115" />
        <path className="compact-response-arrow" d="M 375 115 L 620 115" />
        <circle className="compact-termination-point" cx="145" cy="115" r="8" />
        <circle className="compact-feed-point" cx="620" cy="115" r="8" />
        <text x="145" y="91" textAnchor="middle">Termination</text>
        <text x="620" y="91" textAnchor="middle">Feed</text>
        <text className="compact-receive-label" x="500" y="146" textAnchor="middle">Receive · {receiveBearingDegrees.toFixed(0)}° {receiveCompassPoint}</text>
        <text className="compact-null-label" x="260" y="146" textAnchor="middle">Principal null · {nullBearingDegrees.toFixed(0)}° {nullCompassPoint}</text>
      </g>
      <g className="compact-elevation">
        <path className="compact-wire" d={wirePath} />
        <circle className="compact-termination-point" cx={terminationX} cy={geometry === 'ewe' ? 448 : middleY} r="7" />
        <circle className="compact-feed-point" cx={feedX} cy={geometry === 'ewe' ? 448 : middleY} r="7" />
        {geometry === 'ewe' ? <>
          <rect className="compact-component" x="108" y="400" width="84" height="30" rx="7" /><text x="150" y="420" textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text>
          <rect className="compact-component" x="575" y="400" width="90" height="30" rx="7" /><text x="620" y="420" textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1</text>
          <path className="compact-ground-symbol" d="M 135 448 h 30 M 139 455 h 22 M 144 462 h 12 M 605 448 h 30 M 609 455 h 22 M 614 462 h 12" />
          <text x="150" y="488" textAnchor="middle">Termination ground</text><text x="620" y="488" textAnchor="middle">Feed ground</text>
        </> : <>
          <rect className="compact-component" x="103" y={middleY - 15} width="94" height="30" rx="7" /><text x="150" y={middleY + 5} textAnchor="middle">{terminationResistanceOhms.toFixed(0)} Ω</text>
          <rect className="compact-component" x="570" y={middleY - 15} width="100" height="30" rx="7" /><text x="620" y={middleY + 5} textAnchor="middle">{transformerTurnsRatio.toFixed(2)}:1 turns</text>
          <line className="compact-ground" x1="85" y1="485" x2="690" y2="485" />
          <SvgDimension prefix="compact-clearance" x1={90} y1={bottomY} x2={90} y2={485} label={`Clearance · ${formatLength(bottomClearanceMetres, unitSystem)}`} labelX={90} labelY={412} />
        </>}
        <text className="compact-geometry-label" x="385" y="268" textAnchor="middle">{geometryNames[geometry]}</text>
      </g>
      <SvgDimension prefix="compact-span" x1={terminationX} y1={285} x2={feedX} y2={285} label={`Horizontal span · ${formatLength(horizontalSpanMetres, unitSystem)}`} labelX={385} labelY={270} />
      <SvgDimension prefix="compact-height" x1={704} y1={topY} x2={704} y2={bottomY} label={`Height · ${formatLength(verticalHeightMetres, unitSystem)}`} labelX={704} labelY={300} />
    </svg>
    <figcaption>Direction and elevation views, not to scale · Primary response is toward the feed end; the principal null is toward the termination. These labels show the source convention, not a predicted installed pattern.</figcaption>
  </figure>;
}
