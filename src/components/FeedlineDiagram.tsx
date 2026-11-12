/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { FeedlineResult } from '../calculators/feedline';

interface Props {
  result: FeedlineResult;
  transmitterPowerWatts: number;
  cableLengthLabel: string;
}

function formatPower(watts: number) {
  return watts >= 10 ? `${watts.toFixed(1)} W` : `${watts.toFixed(2)} W`;
}

export function FeedlineDiagram({ result, transmitterPowerWatts, cableLengthLabel }: Props) {
  return <figure className="antenna-figure feedline-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="feedline-title feedline-desc">
      <title id="feedline-title">Feedline power-flow diagram</title>
      <desc id="feedline-desc">A transmitter supplies {formatPower(transmitterPowerWatts)}. After path loss, {formatPower(result.forwardPowerAtAntennaWatts)} reaches the antenna and {formatPower(result.acceptedPowerWatts)} is accepted by its load.</desc>
      <defs>
        <marker id="power-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path className="power-arrowhead" d="M0,0 L10,5 L0,10 Z" /></marker>
        <marker id="reflection-arrow" markerWidth="10" markerHeight="10" refX="1" refY="5" orient="auto"><path className="reflection-arrowhead" d="M10,0 L0,5 L10,10 Z" /></marker>
      </defs>
      <g className="diagram-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="300" />)}
        {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
      </g>
      <g className="power-blocks">
        <rect x="45" y="110" width="145" height="105" rx="14" />
        <rect x="570" y="110" width="145" height="105" rx="14" />
        <text x="117" y="145" textAnchor="middle">TRANSMITTER</text>
        <text x="117" y="178" textAnchor="middle" className="power-value">{formatPower(transmitterPowerWatts)}</text>
        <text x="642" y="145" textAnchor="middle">ANTENNA LOAD</text>
        <text x="642" y="178" textAnchor="middle" className="power-value">{formatPower(result.acceptedPowerWatts)}</text>
      </g>
      <g className="power-path">
        <path d="M205 145 H550" markerEnd="url(#power-arrow)" />
        <text x="377" y="125" textAnchor="middle">forward at feedpoint · {formatPower(result.forwardPowerAtAntennaWatts)}</text>
        <text x="377" y="170" textAnchor="middle">{cableLengthLabel} · {result.pathLossDb.toFixed(2)} dB path loss</text>
      </g>
      <g className="reflection-path">
        <path d="M550 230 H205" markerEnd="url(#reflection-arrow)" />
        <text x="377" y="255" textAnchor="middle">reflected at load · {formatPower(result.reflectedPowerWatts)} ({result.reflectedPowerPercent.toFixed(1)}%)</text>
      </g>
      <g className="end-labels">
        <text x="117" y="238" textAnchor="middle">path dissipation · {formatPower(result.pathDissipationWatts)}</text>
        <text x="642" y="238" textAnchor="middle">accepted efficiency · {result.acceptedEfficiencyPercent.toFixed(1)}%</text>
      </g>
    </svg>
    <figcaption>First-order power budget · Reflected power is shown at the load, not as a prediction of transmitter-end reverse power.</figcaption>
  </figure>;
}
