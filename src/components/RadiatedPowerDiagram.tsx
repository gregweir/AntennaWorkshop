/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateRadiatedPower, GainReference } from '../calculators/feedline';

interface Props {
  result: ReturnType<typeof calculateRadiatedPower>;
  transmitterPowerWatts: number;
  feedSystemLossDb: number;
  antennaGainDb: number;
  gainReference: GainReference;
}

function formatPower(watts: number) {
  if (watts >= 1000) return `${(watts / 1000).toFixed(2)} kW`;
  if (watts >= 10) return `${watts.toFixed(1)} W`;
  return `${watts.toFixed(2)} W`;
}

export function RadiatedPowerDiagram({ result, transmitterPowerWatts, feedSystemLossDb, antennaGainDb, gainReference }: Props) {
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 350" role="img" aria-labelledby="radiated-title radiated-desc">
      <title id="radiated-title">ERP and EIRP antenna-system diagram</title>
      <desc id="radiated-desc">A transmitter supplies {formatPower(transmitterPowerWatts)} through {feedSystemLossDb.toFixed(2)} decibels of loss. The antenna receives {formatPower(result.antennaInputPowerWatts)} and produces {formatPower(result.erpWatts)} ERP and {formatPower(result.eirpWatts)} EIRP in its maximum-gain direction.</desc>
      <defs><marker id="radiated-arrow" markerWidth="10" markerHeight="10" refX="9" refY="5" orient="auto"><path className="power-arrowhead" d="M0,0 L10,5 L0,10 Z" /></marker></defs>
      <g className="diagram-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="320" />)}
        {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
      </g>
      <g className="radiated-blocks">
        <rect x="40" y="115" width="150" height="100" rx="14" /><text x="115" y="148" textAnchor="middle">TRANSMITTER</text><text className="radiated-value" x="115" y="180" textAnchor="middle">{formatPower(transmitterPowerWatts)}</text>
        <rect x="305" y="115" width="150" height="100" rx="14" /><text x="380" y="148" textAnchor="middle">ANTENNA INPUT</text><text className="radiated-value" x="380" y="180" textAnchor="middle">{formatPower(result.antennaInputPowerWatts)}</text>
      </g>
      <g className="radiated-path"><path d="M200 165 H295" markerEnd="url(#radiated-arrow)" /><text x="247" y="145" textAnchor="middle">−{feedSystemLossDb.toFixed(2)} dB</text><path d="M465 165 H545" markerEnd="url(#radiated-arrow)" /><text x="505" y="145" textAnchor="middle">{antennaGainDb.toFixed(2)} {gainReference}</text></g>
      <g className="radiated-lobe"><path d="M555 165 Q610 70 720 90 Q675 165 720 240 Q610 260 555 165 Z" /><text x="642" y="145" textAnchor="middle">MAXIMUM-GAIN DIRECTION</text><text className="radiated-value" x="642" y="178" textAnchor="middle">ERP · {formatPower(result.erpWatts)}</text><text className="radiated-value" x="642" y="207" textAnchor="middle">EIRP · {formatPower(result.eirpWatts)}</text></g>
      <text className="radiated-note" x="380" y="292" textAnchor="middle">system gain relative to isotropic · {result.systemGainDb.toFixed(2)} dB</text>
      <text className="radiated-note" x="380" y="318" textAnchor="middle">EIRP = ERP + 2.15 dB</text>
    </svg>
    <figcaption>Antenna-system power accounting · ERP and EIRP describe the maximum-gain direction, not total radiated power in every direction.</figcaption>
  </figure>;
}
