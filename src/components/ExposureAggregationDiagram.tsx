/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureAggregationResult } from '../calculators/exposureAggregation';

interface Props {
  result: ExposureAggregationResult;
}

export function ExposureAggregationDiagram({ result }: Props) {
  const maximum = Math.max(1, result.totalFractionOfReferenceLevel * 1.1);
  const scale = (fraction: number) => fraction / maximum * 600;
  let offset = 0;

  return <figure className="antenna-figure aggregation-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 265" role="img" aria-labelledby="aggregation-title aggregation-desc">
      <title id="aggregation-title">Multiple-source normalized exposure sum</title>
      <desc id="aggregation-desc">{result.contributions.length} sources contribute a combined {(result.totalFractionOfReferenceLevel * 100).toFixed(2)} percent of the applicable reference levels. The screening trigger is {(result.screeningTriggerFraction * 100).toFixed(0)} percent.</desc>
      <g className="diagram-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="225" />)}
        {Array.from({ length: 4 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
      </g>
      <text className="aggregation-heading" x="70" y="55">SUM OF FREQUENCY-NORMALIZED CONTRIBUTIONS</text>
      <rect className="aggregation-track" x="70" y="88" width="600" height="54" rx="8" />
      {result.contributions.map((source, index) => {
        const width = scale(source.fractionOfReferenceLevel);
        const x = 70 + offset;
        offset += width;
        return <rect key={source.id} className={`aggregation-segment aggregation-segment-${index % 6}`} x={x} y="88" width={Math.max(width, source.fractionOfReferenceLevel > 0 ? 1 : 0)} height="54"><title>{source.label}: {(source.fractionOfReferenceLevel * 100).toFixed(2)}%</title></rect>;
      })}
      <g className="aggregation-trigger"><line x1={70 + scale(result.screeningTriggerFraction)} y1="70" x2={70 + scale(result.screeningTriggerFraction)} y2="160" /><text x={70 + scale(result.screeningTriggerFraction)} y="178" textAnchor="middle">{(result.screeningTriggerFraction * 100).toFixed(0)}% SCREENING TRIGGER</text></g>
      <g className="aggregation-reference"><line x1={70 + scale(1)} y1="78" x2={70 + scale(1)} y2="154" /><text x={70 + scale(1)} y="202" textAnchor="middle">100% REFERENCE LEVEL</text></g>
      <text className="aggregation-total" x="70" y="238">TOTAL · {(result.totalFractionOfReferenceLevel * 100).toFixed(2)}%</text>
    </svg>
    <figcaption>Normalized-source sum · Each segment is the source power density divided by the limit applicable at that source’s frequency.</figcaption>
  </figure>;
}
