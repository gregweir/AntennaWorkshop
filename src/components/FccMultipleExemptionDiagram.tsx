/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { FccMultipleExemptionResult } from '../calculators/fccMultipleExemption';

interface Props {
  result: FccMultipleExemptionResult;
}

const sourceClasses = ['fcc-fraction-source-1', 'fcc-fraction-source-2', 'fcc-fraction-source-3', 'fcc-fraction-source-4'];

export function FccMultipleExemptionDiagram({ result }: Props) {
  const barStart = 70;
  const thresholdX = 620;
  const barWidth = thresholdX - barStart;
  const totalAvailablePower = result.lowPowerPath.totalAvailablePowerWatts < 0.01
    ? `${(result.lowPowerPath.totalAvailablePowerWatts * 1000).toPrecision(4)} mW`
    : `${result.lowPowerPath.totalAvailablePowerWatts.toPrecision(4)} W`;
  let cumulativeFraction = 0;
  return <figure className="antenna-figure fcc-exemption-figure">
    <svg className="dipole-diagram fcc-multiple-diagram" viewBox="0 0 720 310" role="img" aria-labelledby="fcc-multiple-title fcc-multiple-description">
      <title id="fcc-multiple-title">FCC multiple-source exemption fractions</title>
      <desc id="fcc-multiple-description">Applicable source fractions are stacked against a threshold of one. A separate row reports whether the special one-milliwatt path qualifies.</desc>
      <rect className="fcc-diagram-surface" x="1" y="1" width="718" height="308" rx="14" />
      <text className="diagram-kicker" x="24" y="30">47 CFR § 1.1307(b)(3)(ii)</text>
      <text className="diagram-title" x="24" y="56">collective exemption paths</text>
      <text className="diagram-label" x="24" y="100">Fractional contribution sum</text>
      {result.totalFraction === null
        ? <text className="fcc-diagram-status fcc-diagram-status-review" x="690" y="100" textAnchor="end">selected method inapplicable</text>
        : <>
          <rect className="fcc-fraction-track" x={barStart} y="122" width={barWidth} height="28" rx="8" />
          {result.contributions.map((contribution, index) => {
            const fraction = contribution.fraction ?? 0;
            const x = barStart + Math.min(cumulativeFraction, 1) * barWidth;
            const width = Math.max(0, Math.min(fraction, 1 - Math.min(cumulativeFraction, 1)) * barWidth);
            cumulativeFraction += fraction;
            return <rect className={sourceClasses[index % sourceClasses.length]} key={contribution.sourceId} x={x} y="122" width={width} height="28" />;
          })}
          <line className="fcc-threshold-marker" x1={thresholdX} y1="112" x2={thresholdX} y2="160" />
          <text className="diagram-annotation" x={thresholdX} y="177" textAnchor="middle">sum = 1 threshold</text>
          <text className={result.totalFraction <= 1 ? 'fcc-diagram-total fcc-diagram-status-pass' : 'fcc-diagram-total fcc-diagram-status-review'} x="690" y="142" textAnchor="end">{(result.totalFraction * 100).toFixed(2)}%</text>
        </>}
      <line className="fcc-multiple-divider" x1="24" y1="202" x2="696" y2="202" />
      <text className="diagram-label" x="24" y="235">Special 1 mW path</text>
      <text className={result.lowPowerPath.passes ? 'fcc-diagram-total fcc-diagram-status-pass' : 'fcc-diagram-total fcc-diagram-status-review'} x="690" y="235" textAnchor="end">{result.lowPowerPath.passes ? 'qualifies' : 'does not qualify'}</text>
      <text className="diagram-annotation" x="24" y="262">Total available power: {totalAvailablePower}</text>
      <text className="diagram-annotation" x="24" y="280">Every source ≤ 1 mW: {result.lowPowerPath.everySourceAtOrBelowOneMilliwatt ? 'yes' : 'no'} · 2 cm separation: {result.lowPowerPath.twoCentimetreSeparationSatisfied ? 'yes' : 'no'}</text>
    </svg>
    <figcaption>The two paths are alternatives. The fractional bar combines only applicable terms selected for the same collective-source assessment.</figcaption>
  </figure>;
}
