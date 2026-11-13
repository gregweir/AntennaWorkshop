/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { FccExemptionResult } from '../calculators/fccExemption';

interface Props {
  result: FccExemptionResult;
}

export function FccExemptionDiagram({ result }: Props) {
  return <figure className="antenna-figure fcc-exemption-figure">
    <svg className="dipole-diagram fcc-exemption-diagram" viewBox="0 0 720 300" role="img" aria-labelledby="fcc-diagram-title fcc-diagram-description">
      <title id="fcc-diagram-title">FCC single-source exemption criterion comparison</title>
      <desc id="fcc-diagram-description">Three rows compare the entered power with each applicable exemption threshold. A marker left of the threshold passes that criterion. Inapplicable criteria are identified separately.</desc>
      <rect className="fcc-diagram-surface" x="1" y="1" width="718" height="298" rx="14" />
      <text className="diagram-kicker" x="24" y="30">47 CFR § 1.1307(b)(3)(i)</text>
      <text className="diagram-title" x="24" y="56">single-source exemption paths</text>
      {result.criteria.map((criterion, index) => {
        const y = 102 + index * 68;
        const ratio = criterion.thresholdWatts && criterion.thresholdWatts > 0
          ? criterion.evaluatedPowerWatts / criterion.thresholdWatts
          : 0;
        const actualX = 310 + Math.min(ratio, 1.12) * 250;
        return <g key={criterion.id}>
          <text className="diagram-label" x="24" y={y}>{criterion.label}</text>
          {criterion.applicable && criterion.thresholdWatts !== null ? <>
            <line className="fcc-threshold-track" x1="310" y1={y - 4} x2="560" y2={y - 4} />
            <line className="fcc-threshold-marker" x1="560" y1={y - 15} x2="560" y2={y + 7} />
            <circle className={criterion.passes ? 'fcc-actual-marker fcc-actual-marker-pass' : 'fcc-actual-marker fcc-actual-marker-review'} cx={actualX} cy={y - 4} r="8" />
            <text className="diagram-annotation" x="310" y={y + 19}>entered power</text>
            <text className="diagram-annotation" x="560" y={y + 19} textAnchor="middle">threshold</text>
            <text className={criterion.passes ? 'fcc-diagram-status fcc-diagram-status-pass' : 'fcc-diagram-status fcc-diagram-status-review'} x="690" y={y} textAnchor="end">{criterion.passes ? 'qualifies' : 'does not qualify'}</text>
          </> : <text className="fcc-diagram-status" x="690" y={y} textAnchor="end">not applicable</text>}
        </g>;
      })}
      <text className="diagram-caption" x="360" y="282" textAnchor="middle">Each path is independent. Qualifying for one path is sufficient for this single-source exemption screen.</text>
    </svg>
    <figcaption>Marker position compares entered power with the threshold for each applicable path; the chart does not compare exposure with an MPE limit.</figcaption>
  </figure>;
}
