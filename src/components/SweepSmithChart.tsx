/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId } from 'react';
import type { TouchstonePoint, TouchstoneSweep } from '../lib/touchstone';

const CX = 380;
const CY = 255;
const RADIUS = 180;
const RESISTANCES = [0.2, 0.5, 1, 2, 5];
const REACTANCES = [0.2, 0.5, 1, 2, 5];

interface Props {
  reference: TouchstoneSweep;
  referenceName: string;
  comparison: TouchstoneSweep | null;
  comparisonName: string;
  selectedIndex: number;
}

export function SweepSmithChart({ reference, referenceName, comparison, comparisonName, selectedIndex }: Props) {
  const clipId = `sweep-smith-${useId().replace(/:/g, '')}`;
  const selected = reference.points[selectedIndex];
  const comparisonPoint = comparison ? nearestPoint(comparison.points, selected.frequencyHz) : null;
  const referenceTrace = tracePoints(reference.points);
  const comparisonTrace = comparison ? tracePoints(comparison.points) : [];
  const outsideCount = reference.points.filter((point) => point.reflectionMagnitude > 1).length
    + (comparison?.points.filter((point) => point.reflectionMagnitude > 1).length ?? 0);
  const pointX = (point: TouchstonePoint) => CX + RADIUS * point.reflectionReal;
  const pointY = (point: TouchstonePoint) => CY - RADIUS * point.reflectionImaginary;

  return <figure className="sweep-smith-figure">
    <svg viewBox="0 0 760 510" role="img" aria-labelledby={`${clipId}-title ${clipId}-desc`}>
      <title id={`${clipId}-title`}>Smith-chart trace for the imported sweep</title>
      <desc id={`${clipId}-desc`}>{referenceName} is plotted as a solid trace. {comparison ? `${comparisonName} is plotted as a dashed comparison trace.` : 'No comparison sweep is loaded.'} The marker is at {formatMHz(selected.frequencyHz)}.</desc>
      <defs><clipPath id={clipId}><circle cx={CX} cy={CY} r={RADIUS} /></clipPath></defs>
      <circle className="smith-chart-background" cx={CX} cy={CY} r={RADIUS} />
      <g className="smith-chart-grid" clipPath={`url(#${clipId})`}>
        <line x1={CX - RADIUS} y1={CY} x2={CX + RADIUS} y2={CY} />
        {RESISTANCES.map((resistance) => <circle key={`r-${resistance}`} cx={CX + RADIUS * resistance / (1 + resistance)} cy={CY} r={RADIUS / (1 + resistance)} />)}
        {REACTANCES.flatMap((reactance) => [reactance, -reactance].map((signed) => <circle key={`x-${signed}`} cx={CX + RADIUS} cy={CY - RADIUS / signed} r={RADIUS / Math.abs(signed)} />))}
      </g>
      <circle className="smith-chart-boundary" cx={CX} cy={CY} r={RADIUS} />
      <g clipPath={`url(#${clipId})`}>
        <polyline className="sweep-smith-reference" points={referenceTrace.map((point) => `${pointX(point).toFixed(2)},${pointY(point).toFixed(2)}`).join(' ')} />
        {comparison && <polyline className="sweep-smith-comparison" points={comparisonTrace.map((point) => `${pointX(point).toFixed(2)},${pointY(point).toFixed(2)}`).join(' ')} />}
      </g>
      <circle className="smith-chart-centre" cx={CX} cy={CY} r="5" />
      <g clipPath={`url(#${clipId})`}><circle className="sweep-smith-reference-point" cx={pointX(selected)} cy={pointY(selected)} r="7" />{comparisonPoint && <circle className="sweep-smith-comparison-point" cx={pointX(comparisonPoint)} cy={pointY(comparisonPoint)} r="7" />}</g>
      <g className="smith-chart-labels"><text x={CX - RADIUS - 8} y={CY + 5} textAnchor="end">short</text><text x={CX} y={CY + 24} textAnchor="middle">match · normalized 1 + j0</text><text x={CX + RADIUS + 8} y={CY + 5}>open</text><text x={CX} y={50} textAnchor="middle">inductive · +jX</text><text x={CX} y={474} textAnchor="middle">capacitive · −jX</text></g>
      <g className="sweep-smith-legend">
        <rect x="40" y="20" width="238" height={comparison ? 66 : 42} rx="10" />
        <line className="sweep-smith-reference" x1="56" x2="92" y1="43" y2="43" /><text x="102" y="48">Reference · {truncate(referenceName)}</text>
        {comparison && <><line className="sweep-smith-comparison" x1="56" x2="92" y1="67" y2="67" /><text x="102" y="72">Comparison · {truncate(comparisonName)}</text></>}
      </g>
    </svg>
    <figcaption><span>The trace shows how complex impedance moves with frequency; the centre is a match to each file’s reference impedance.</span>{outsideCount > 0 && <strong>{outsideCount.toLocaleString()} active or calibration-error {outsideCount === 1 ? 'point lies' : 'points lie'} outside the passive-chart boundary and {outsideCount === 1 ? 'is' : 'are'} clipped.</strong>}</figcaption>
  </figure>;
}

export function nearestPoint(points: TouchstonePoint[], frequencyHz: number) {
  let low = 0;
  let high = points.length - 1;
  while (low < high) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].frequencyHz < frequencyHz) low = middle + 1;
    else high = middle;
  }
  if (low === 0) return points[0];
  const previous = points[low - 1];
  return Math.abs(previous.frequencyHz - frequencyHz) <= Math.abs(points[low].frequencyHz - frequencyHz) ? previous : points[low];
}

function tracePoints(points: TouchstonePoint[]) {
  const sampleEvery = Math.max(1, Math.ceil(points.length / 1600));
  return points.filter((_, index) => index % sampleEvery === 0 || index === points.length - 1);
}

function formatMHz(frequencyHz: number) {
  return `${(frequencyHz / 1e6).toLocaleString(undefined, { maximumFractionDigits: 4 })} MHz`;
}

function truncate(value: string) {
  return value.length > 24 ? `${value.slice(0, 21)}…` : value;
}
