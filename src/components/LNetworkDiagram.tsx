/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { LNetworkSolution, ReactiveElement } from '../calculators/lNetwork';

function scaled(value: number, units: Array<[number, string]>) {
  const absolute = Math.abs(value);
  const [scale, unit] = units.find(([candidate]) => absolute >= candidate) ?? units.at(-1)!;
  const shown = value / scale;
  return `${shown >= 100 ? shown.toFixed(1) : shown >= 10 ? shown.toFixed(2) : shown.toFixed(3)} ${unit}`;
}

export function formatReactiveElement(element: ReactiveElement) {
  if (element.kind === 'none') return 'No element';
  if (element.kind === 'inductor') return scaled(element.inductanceHenries!, [[1, 'H'], [1e-3, 'mH'], [1e-6, 'µH'], [1e-9, 'nH']]);
  return scaled(element.capacitanceFarads!, [[1, 'F'], [1e-6, 'µF'], [1e-9, 'nF'], [1e-12, 'pF']]);
}

function elementName(element: ReactiveElement) {
  return element.kind === 'inductor' ? 'Inductor' : element.kind === 'capacitor' ? 'Capacitor' : 'Direct connection';
}

function Circuit({ solution, index }: { solution: LNetworkSolution; index: number }) {
  const shuntX = solution.topology === 'shunt-first' ? 220 : 470;
  const seriesX = solution.topology === 'shunt-first' ? 365 : 285;
  const sourceOrder = solution.topology === 'shunt-first' ? 'shunt element, then series element' : 'series element, then shunt element';
  return <article className="l-network-solution">
    <header><span>Option {index + 1}</span><strong>{sourceOrder}</strong></header>
    <svg viewBox="0 0 680 260" role="img" aria-label={`L-network option ${index + 1}: ${sourceOrder}`}>
      <g className="l-network-wire"><line x1="70" y1="105" x2="610" y2="105" /><line x1="70" y1="210" x2="610" y2="210" /><line x1={shuntX} y1="105" x2={shuntX} y2="210" /></g>
      <g className="l-network-terminal"><circle cx="70" cy="105" r="6" /><circle cx="610" cy="105" r="6" /></g>
      <g className="l-network-element series"><rect x={seriesX - 75} y="72" width="150" height="66" rx="10" /><text x={seriesX} y="96" textAnchor="middle">Series {elementName(solution.series)}</text><text x={seriesX} y="121" textAnchor="middle">{formatReactiveElement(solution.series)}</text></g>
      <g className="l-network-element shunt"><rect x={shuntX - 75} y="139" width="150" height="66" rx="10" /><text x={shuntX} y="163" textAnchor="middle">Shunt {elementName(solution.shunt)}</text><text x={shuntX} y="188" textAnchor="middle">{formatReactiveElement(solution.shunt)}</text></g>
      <g className="l-network-labels"><text x="70" y="78" textAnchor="middle">System</text><text x="610" y="78" textAnchor="middle">Measured load</text><text x="340" y="238" textAnchor="middle">Common return</text></g>
    </svg>
    <dl><div><dt>Series element</dt><dd>{elementName(solution.series)} · {formatReactiveElement(solution.series)}</dd></div><div><dt>Shunt element</dt><dd>{elementName(solution.shunt)} · {formatReactiveElement(solution.shunt)}</dd></div><div><dt>Ideal input check</dt><dd>{solution.inputResistanceOhms.toFixed(3)} {solution.inputReactanceOhms < 0 ? '−' : '+'} j{Math.abs(solution.inputReactanceOhms).toFixed(3)} Ω</dd></div></dl>
  </article>;
}

export function LNetworkDiagram({ solutions }: { solutions: LNetworkSolution[] }) {
  return <figure className="l-network-figure">
    <div className="l-network-solution-grid">{solutions.map((solution, index) => <Circuit solution={solution} index={index} key={`${solution.topology}-${solution.series.reactanceOhms}-${solution.shunt.susceptanceSiemens}`} />)}</div>
    <figcaption>Ideal lumped-element topologies at one frequency · The shunt component connects from the labelled node to the common return. Layout, grounding, component parasitics, and lead inductance are not represented.</figcaption>
  </figure>;
}
