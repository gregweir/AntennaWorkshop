/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateTransmissionLineTransform } from '../calculators/transmissionLineTransform';
import { formatLength, type UnitSystem } from '../lib/units';

const CX = 380;
const CY = 390;
const RADIUS = 120;
const GRID_VALUES = [0.2, 0.5, 1, 2, 5];

export function TransmissionLineTransformDiagram({ result, unitSystem }: { result: ReturnType<typeof calculateTransmissionLineTransform>; unitSystem: UnitSystem }) {
  const loadX = CX + RADIUS * result.loadPoint.reflectionReal;
  const loadY = CY - RADIUS * result.loadPoint.reflectionImaginary;
  const inputX = CX + RADIUS * result.inputPoint.reflectionReal;
  const inputY = CY - RADIUS * result.inputPoint.reflectionImaginary;
  return <figure className="antenna-figure line-transform-figure">
    <svg viewBox="0 0 760 550" role="img" aria-labelledby="line-transform-title line-transform-desc">
      <title id="line-transform-title">Transmission-line impedance transformation with entered attenuation</title>
      <desc id="line-transform-desc">A {formatLength(result.physicalLengthMetres, unitSystem)} line with characteristic impedance {result.characteristicImpedanceOhms.toFixed(2)} ohms and {result.oneWayMatchedLossDb.toFixed(2)} decibels of one-way matched loss transforms the entered load to {result.inputResistanceOhms.toFixed(2)} {result.inputReactanceOhms < 0 ? 'minus' : 'plus'} j{Math.abs(result.inputReactanceOhms).toFixed(2)} ohms at the input.</desc>
      <defs><clipPath id="line-transform-clip"><circle cx={CX} cy={CY} r={RADIUS} /></clipPath></defs>
      <g className="line-transform-terminal input"><rect x="45" y="55" width="190" height="105" rx="16" /><text x="140" y="87" textAnchor="middle">LINE INPUT</text><text x="140" y="118" textAnchor="middle">{result.inputResistanceOhms.toFixed(2)} {result.inputReactanceOhms < 0 ? '−' : '+'} j{Math.abs(result.inputReactanceOhms).toFixed(2)} Ω</text><text x="140" y="143" textAnchor="middle">toward generator</text></g>
      <g className="line-transform-line"><path d="M235 90 H525 M235 130 H525" /><path className="line-transform-centre" d="M235 110 H525" /><text x="380" y="67" textAnchor="middle">Z₀ {result.characteristicImpedanceOhms.toFixed(2)} Ω · VF {result.velocityFactor.toFixed(2)}</text><text x="380" y="176" textAnchor="middle">{formatLength(result.physicalLengthMetres, unitSystem)} · {result.electricalLengthDegrees.toFixed(1)}° total</text><text x="380" y="198" textAnchor="middle">{result.oneWayMatchedLossDb.toFixed(2)} dB one way · {result.roundTripReflectionAttenuationDb.toFixed(2)} dB round trip</text></g>
      <g className="line-transform-terminal load"><rect x="525" y="55" width="190" height="105" rx="16" /><text x="620" y="87" textAnchor="middle">LOAD</text><text x="620" y="118" textAnchor="middle">{result.loadResistanceOhms.toFixed(2)} {result.loadReactanceOhms < 0 ? '−' : '+'} j{Math.abs(result.loadReactanceOhms).toFixed(2)} Ω</text><text x="620" y="143" textAnchor="middle">antenna reference plane</text></g>
      <circle className="smith-chart-background" cx={CX} cy={CY} r={RADIUS} />
      <g className="smith-chart-grid" clipPath="url(#line-transform-clip)"><line x1={CX - RADIUS} y1={CY} x2={CX + RADIUS} y2={CY} />{GRID_VALUES.map((value) => <circle key={`r-${value}`} cx={CX + RADIUS * value / (1 + value)} cy={CY} r={RADIUS / (1 + value)} />)}{GRID_VALUES.flatMap((value) => [value, -value].map((signed) => <circle key={`x-${signed}`} cx={CX + RADIUS} cy={CY - RADIUS / signed} r={RADIUS / Math.abs(signed)} />))}</g>
      <circle className="smith-chart-boundary" cx={CX} cy={CY} r={RADIUS} /><circle className="smith-chart-swr line-transform-load-swr" cx={CX} cy={CY} r={RADIUS * result.loadPoint.reflectionMagnitude} /><circle className="smith-chart-swr line-transform-input-swr" cx={CX} cy={CY} r={RADIUS * result.inputPoint.reflectionMagnitude} />
      <line className="line-transform-load-vector" x1={CX} y1={CY} x2={loadX} y2={loadY} /><line className="line-transform-input-vector" x1={CX} y1={CY} x2={inputX} y2={inputY} />
      <circle className="line-transform-load-point" cx={loadX} cy={loadY} r="7" /><circle className="line-transform-input-point" cx={inputX} cy={inputY} r="7" />
      <g className="line-transform-legend"><circle cx="170" cy="522" r="6" className="line-transform-load-point" /><text x="183" y="527">load · {result.loadPoint.swr.toFixed(3)}:1</text><circle cx="385" cy="522" r="6" className="line-transform-input-point" /><text x="398" y="527">line input · {result.inputPoint.swr.toFixed(3)}:1</text></g>
      <text className="line-transform-chart-label" x={CX} y="245" textAnchor="middle">toward generator · {result.electricalLengthWavelengths.toFixed(4)} λ</text>
    </svg>
    <figcaption>Uniform-line estimate · Entered matched attenuation reduces the returning reflection and moves the input point inward. A lower near-end SWR can therefore conceal the unchanged load mismatch.</figcaption>
  </figure>;
}
