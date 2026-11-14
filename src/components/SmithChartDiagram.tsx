/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateImpedanceExplorer } from '../calculators/impedanceExplorer';

const CX = 380;
const CY = 220;
const RADIUS = 180;
const RESISTANCES = [0.2, 0.5, 1, 2, 5];
const REACTANCES = [0.2, 0.5, 1, 2, 5];

export function SmithChartDiagram({ result }: { result: ReturnType<typeof calculateImpedanceExplorer> }) {
  const pointX = CX + RADIUS * result.reflectionReal;
  const pointY = CY - RADIUS * result.reflectionImaginary;
  const loadSign = result.loadReactanceOhms < 0 ? '−' : '+';
  return <figure className="antenna-figure smith-chart-figure">
    <svg viewBox="0 0 760 470" role="img" aria-labelledby="smith-chart-title smith-chart-desc">
      <title id="smith-chart-title">Smith chart for the entered complex load</title>
      <desc id="smith-chart-desc">The load {result.loadResistanceOhms.toFixed(2)} {loadSign} j{Math.abs(result.loadReactanceOhms).toFixed(2)} ohms is plotted at reflection coefficient {result.reflectionReal.toFixed(3)} {result.reflectionImaginary < 0 ? 'minus' : 'plus'} j{Math.abs(result.reflectionImaginary).toFixed(3)}, relative to {result.referenceResistanceOhms.toFixed(2)} ohms.</desc>
      <defs><clipPath id="smith-chart-clip"><circle cx={CX} cy={CY} r={RADIUS} /></clipPath></defs>
      <circle className="smith-chart-background" cx={CX} cy={CY} r={RADIUS} />
      <g className="smith-chart-grid" clipPath="url(#smith-chart-clip)">
        <line x1={CX - RADIUS} y1={CY} x2={CX + RADIUS} y2={CY} />
        {RESISTANCES.map((resistance) => <circle key={`r-${resistance}`} cx={CX + RADIUS * resistance / (1 + resistance)} cy={CY} r={RADIUS / (1 + resistance)} />)}
        {REACTANCES.flatMap((reactance) => [reactance, -reactance].map((signed) => <circle key={`x-${signed}`} cx={CX + RADIUS} cy={CY - RADIUS / signed} r={RADIUS / Math.abs(signed)} />))}
      </g>
      <circle className="smith-chart-boundary" cx={CX} cy={CY} r={RADIUS} />
      <circle className="smith-chart-swr" cx={CX} cy={CY} r={RADIUS * result.reflectionMagnitude} />
      <line className="smith-chart-vector" x1={CX} y1={CY} x2={pointX} y2={pointY} />
      <circle className="smith-chart-centre" cx={CX} cy={CY} r="5" />
      <circle className="smith-chart-point-halo" cx={pointX} cy={pointY} r="12" />
      <circle className="smith-chart-point" cx={pointX} cy={pointY} r="6" />
      <g className="smith-chart-labels"><text x={CX - RADIUS - 8} y={CY + 5} textAnchor="end">short</text><text x={CX} y={CY + 24} textAnchor="middle">match · {result.referenceResistanceOhms.toFixed(1)} Ω</text><text x={CX + RADIUS + 8} y={CY + 5}>open</text><text x={CX} y={22} textAnchor="middle">inductive · +jX</text><text x={CX} y={435} textAnchor="middle">capacitive · −jX</text></g>
      <g className="smith-chart-readout"><rect x="42" y="38" width="205" height="82" rx="12" /><text x="58" y="64">NORMALIZED LOAD</text><text x="58" y="91">{result.normalizedResistance.toFixed(3)} {result.normalizedReactance < 0 ? '−' : '+'} j{Math.abs(result.normalizedReactance).toFixed(3)}</text><text x="58" y="112">R + jX divided by Z₀</text></g>
      <g className="smith-chart-readout right"><rect x="513" y="38" width="205" height="82" rx="12" /><text x="529" y="64">REFLECTION Γ</text><text x="529" y="91">{result.reflectionMagnitude.toFixed(3)} ∠ {result.reflectionPhaseDegrees.toFixed(1)}°</text><text x="529" y="112">SWR {result.swr.toFixed(3)} : 1</text></g>
    </svg>
    <figcaption>Impedance Smith chart · The highlighted circle is the constant-SWR circle through this one measured point. A frequency sweep would produce a trace rather than a single point.</figcaption>
  </figure>;
}
