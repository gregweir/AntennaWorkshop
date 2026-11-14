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
      <title id="line-transform-title">Lossless transmission-line impedance transformation</title>
      <desc id="line-transform-desc">A {formatLength(result.physicalLengthMetres, unitSystem)} line with characteristic impedance {result.characteristicImpedanceOhms.toFixed(2)} ohms transforms the entered load to {result.inputResistanceOhms.toFixed(2)} {result.inputReactanceOhms < 0 ? 'minus' : 'plus'} j{Math.abs(result.inputReactanceOhms).toFixed(2)} ohms at the input.</desc>
      <defs><clipPath id="line-transform-clip"><circle cx={CX} cy={CY} r={RADIUS} /></clipPath></defs>
      <g className="line-transform-terminal input"><rect x="45" y="55" width="190" height="105" rx="16" /><text x="140" y="87" textAnchor="middle">LINE INPUT</text><text x="140" y="118" textAnchor="middle">{result.inputResistanceOhms.toFixed(2)} {result.inputReactanceOhms < 0 ? '−' : '+'} j{Math.abs(result.inputReactanceOhms).toFixed(2)} Ω</text><text x="140" y="143" textAnchor="middle">toward generator</text></g>
      <g className="line-transform-line"><path d="M235 90 H525 M235 130 H525" /><path className="line-transform-centre" d="M235 110 H525" /><text x="380" y="67" textAnchor="middle">Z₀ {result.characteristicImpedanceOhms.toFixed(2)} Ω · VF {result.velocityFactor.toFixed(2)}</text><text x="380" y="185" textAnchor="middle">{formatLength(result.physicalLengthMetres, unitSystem)} · {result.electricalLengthDegrees.toFixed(1)}° total</text></g>
      <g className="line-transform-terminal load"><rect x="525" y="55" width="190" height="105" rx="16" /><text x="620" y="87" textAnchor="middle">LOAD</text><text x="620" y="118" textAnchor="middle">{result.loadResistanceOhms.toFixed(2)} {result.loadReactanceOhms < 0 ? '−' : '+'} j{Math.abs(result.loadReactanceOhms).toFixed(2)} Ω</text><text x="620" y="143" textAnchor="middle">antenna reference plane</text></g>
      <circle className="smith-chart-background" cx={CX} cy={CY} r={RADIUS} />
      <g className="smith-chart-grid" clipPath="url(#line-transform-clip)"><line x1={CX - RADIUS} y1={CY} x2={CX + RADIUS} y2={CY} />{GRID_VALUES.map((value) => <circle key={`r-${value}`} cx={CX + RADIUS * value / (1 + value)} cy={CY} r={RADIUS / (1 + value)} />)}{GRID_VALUES.flatMap((value) => [value, -value].map((signed) => <circle key={`x-${signed}`} cx={CX + RADIUS} cy={CY - RADIUS / signed} r={RADIUS / Math.abs(signed)} />))}</g>
      <circle className="smith-chart-boundary" cx={CX} cy={CY} r={RADIUS} /><circle className="smith-chart-swr" cx={CX} cy={CY} r={RADIUS * result.loadPoint.reflectionMagnitude} />
      <line className="line-transform-load-vector" x1={CX} y1={CY} x2={loadX} y2={loadY} /><line className="line-transform-input-vector" x1={CX} y1={CY} x2={inputX} y2={inputY} />
      <circle className="line-transform-load-point" cx={loadX} cy={loadY} r="7" /><circle className="line-transform-input-point" cx={inputX} cy={inputY} r="7" />
      <g className="line-transform-legend"><circle cx="215" cy="522" r="6" className="line-transform-load-point" /><text x="228" y="527">load</text><circle cx="330" cy="522" r="6" className="line-transform-input-point" /><text x="343" y="527">line input</text><text x="470" y="527">same |Γ| · SWR {result.loadPoint.swr.toFixed(3)} : 1</text></g>
      <text className="line-transform-chart-label" x={CX} y="245" textAnchor="middle">toward generator · {result.electricalLengthWavelengths.toFixed(4)} λ</text>
    </svg>
    <figcaption>Ideal lossless uniform line · Both reference-plane impedances lie on the same constant-SWR circle. Real attenuation would reduce the measured input reflection and move its point inward.</figcaption>
  </figure>;
}
