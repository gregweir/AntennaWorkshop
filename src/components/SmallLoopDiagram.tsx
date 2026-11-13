/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  diameterMetres: number;
  circumferenceMetres: number;
  minimumCapacitancePicofarads: number;
  maximumCapacitancePicofarads: number;
  lowerFrequencyMHz: number;
  upperFrequencyMHz: number;
  isUnderArrlSmallLoopBoundary: boolean;
  unitSystem: UnitSystem;
}

export function SmallLoopDiagram({ diameterMetres, circumferenceMetres, minimumCapacitancePicofarads, maximumCapacitancePicofarads, lowerFrequencyMHz, upperFrequencyMHz, isUnderArrlSmallLoopBoundary, unitSystem }: Props) {
  const capacitanceLabel = minimumCapacitancePicofarads > 0
    ? `${minimumCapacitancePicofarads.toFixed(1)}–${maximumCapacitancePicofarads.toFixed(1)} pF required`
    : 'Parallel fixed/stray C exceeds upper-frequency requirement';
  return <figure className="antenna-figure">
    <svg className="dipole-diagram small-loop-diagram" viewBox="0 0 760 410" role="img" aria-labelledby="small-loop-title small-loop-desc">
      <title id="small-loop-title">Dimensioned circular small transmitting loop tuning plan</title>
      <desc id="small-loop-desc">A circular loop {formatLength(diameterMetres, unitSystem)} in diameter and {formatLength(circumferenceMetres, unitSystem)} in circumference, with a series tuning capacitor for {lowerFrequencyMHz.toFixed(3)} through {upperFrequencyMHz.toFixed(3)} megahertz.</desc>
      <DiagramDefinitions prefix="small-loop" />
      <DiagramGrid />
      <g className="small-loop-conductor"><path d="M350 65 A135 135 0 1 0 410 65" /><line x1="350" y1="65" x2="369" y2="65" /><line x1="391" y1="65" x2="410" y2="65" /></g>
      <g className="small-loop-capacitor"><line x1="369" y1="43" x2="369" y2="87" /><line x1="391" y1="43" x2="391" y2="87" /><path d="M380 30 v-14 m0 0 l-6 8 m6-8 l6 8" /></g>
      <g className="small-loop-coupling"><circle cx="380" cy="300" r="36" /><line x1="380" y1="336" x2="380" y2="360" /></g>
      <SvgDimension prefix="small-loop-diameter" x1={245} y1={205} x2={515} y2={205} label={`Diameter · ${formatLength(diameterMetres, unitSystem)}`} labelX={380} labelY={193} />
      <g className="end-labels">
        <text x="380" y="112" textAnchor="middle">Series tuning capacitor</text>
        <text x="380" y="132" textAnchor="middle">{capacitanceLabel}</text>
        <text x="380" y="382" textAnchor="middle">Feed coupling and matching · illustrative, not dimensioned</text>
        <text x="380" y="402" textAnchor="middle">Circumference · {formatLength(circumferenceMetres, unitSystem)}</text>
      </g>
      <g className={isUnderArrlSmallLoopBoundary ? 'small-loop-boundary boundary-pass' : 'small-loop-boundary boundary-stop'}>
        <rect x="532" y="42" width="184" height="52" rx="12" />
        <text x="624" y="64" textAnchor="middle">ARRL diameter boundary</text>
        <text x="624" y="82" textAnchor="middle">{isUnderArrlSmallLoopBoundary ? 'under 1/16 λ' : 'not under 1/16 λ'}</text>
      </g>
    </svg>
    <figcaption>Measured-inductance tuning plan · Capacitor and feed-coupling positions are conceptual; the drawing does not predict efficiency, Q, bandwidth, voltage, current, matching, or safe power.</figcaption>
  </figure>;
}
