/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { TurnstileQuadratureOrder } from '../calculators/turnstile';
import { formatLength, type UnitSystem } from '../lib/units';

export function TurnstileDiagram({ dipoleSpanMetres, phaseLineMetres, quadratureOrder, unitSystem }: { dipoleSpanMetres: number; phaseLineMetres: number; quadratureOrder: TurnstileQuadratureOrder; unitSystem: UnitSystem }) {
  const bPhase = quadratureOrder === 'b-lags-a' ? '−90°' : '+90°';
  return <figure className="antenna-figure turnstile-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 410" role="img" aria-labelledby="turnstile-title turnstile-desc">
      <title id="turnstile-title">Dimensioned crossed-dipole turnstile construction diagram</title>
      <desc id="turnstile-desc">Top view of two equal half-wave dipoles crossing at right angles. Each dipole spans {formatLength(dipoleSpanMetres, unitSystem)}. Dipole A is the zero-degree phase reference and Dipole B is driven at {bPhase}. The displayed quarter-wave line reference is {formatLength(phaseLineMetres, unitSystem)}.</desc>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="380" />)}{Array.from({ length: 7 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}</g>
      <g className="turnstile-dipole turnstile-dipole-a"><line x1="105" y1="165" x2="355" y2="165" /><line x1="405" y1="165" x2="655" y2="165" /><text x="125" y="145">DIPOLE A · 0° REFERENCE</text></g>
      <g className="turnstile-dipole turnstile-dipole-b"><line x1="380" y1="35" x2="380" y2="140" /><line x1="380" y1="190" x2="380" y2="295" /><text x="402" y="60">DIPOLE B · {bPhase}</text></g>
      <g className="turnstile-feed"><circle cx="355" cy="165" r="7" /><circle cx="405" cy="165" r="7" /><circle cx="380" cy="140" r="7" /><circle cx="380" cy="190" r="7" /><path d="M355 172 L335 325 H365" /><path className="phase-path" d="M405 172 C500 225 490 325 395 325" /><rect x="315" y="315" width="100" height="48" rx="8" /><text x="365" y="345" textAnchor="middle">EQUAL SPLIT</text></g>
      <g className="dimension-lines"><line x1="105" y1="385" x2="655" y2="385" /><line x1="105" y1="375" x2="105" y2="395" /><line x1="655" y1="375" x2="655" y2="395" /><text x="380" y="405" textAnchor="middle">EACH DIPOLE · {formatLength(dipoleSpanMetres, unitSystem)}</text></g>
      <g className="turnstile-labels"><text x="475" y="285">¼λ PATH DIFFERENCE</text><text x="475" y="307">{formatLength(phaseLineMetres, unitSystem)} · ENTERED VF</text><text x="380" y="18" textAnchor="middle">TOP VIEW · 90° BETWEEN DIPOLES</text></g>
    </svg>
    <figcaption>Equal crossed radiators and an ideal quadrature target · The feed network must deliver equal amplitude and the measured relative phase at the antenna ports; the drawing is not a splitter or matching-network design.</figcaption>
  </figure>;
}
