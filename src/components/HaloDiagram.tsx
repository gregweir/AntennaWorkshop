/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { HaloShape } from '../calculators/halo';
import { formatLength, type UnitSystem } from '../lib/units';

export function HaloDiagram({ shape, widthMetres, armMetres, farGapMetres, feedGapMetres, unitSystem }: { shape: HaloShape; widthMetres: number; armMetres: number; farGapMetres: number; feedGapMetres: number; unitSystem: UnitSystem }) {
  const circular = shape === 'circular';
  return <figure className="antenna-figure halo-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 480" role="img" aria-labelledby="halo-title halo-desc">
      <title id="halo-title">Dimensioned {circular ? 'circular halo' : 'square squalo'} construction diagram</title>
      <desc id="halo-desc">Top view of a half-wave dipole bent into an open {circular ? 'circle' : 'square'}. Each arm from the bottom feedpoint to the top far-end opening is {formatLength(armMetres, unitSystem)}. The centreline width is {formatLength(widthMetres, unitSystem)}, the far-end opening is {formatLength(farGapMetres, unitSystem)}, and the feedpoint opening is {formatLength(feedGapMetres, unitSystem)}.</desc>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="430" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      {circular ? <g className="halo-radiator"><path d="M360 345 A145 145 0 0 1 354 61" /><path d="M406 61 A145 145 0 0 1 400 345" /></g> : <g className="halo-radiator"><path d="M360 345 H220 V65 H354" /><path d="M406 65 H540 V345 H400" /></g>}
      <g className="halo-terminals"><circle cx="354" cy={circular ? 61 : 65} r="7" /><circle cx="406" cy={circular ? 61 : 65} r="7" /><circle cx="360" cy="345" r="7" /><circle cx="400" cy="345" r="7" /><line x1="380" y1="345" x2="380" y2="397" /><rect x="337" y="382" width="86" height="30" rx="8" /><text x="380" y="403" textAnchor="middle">FEED</text></g>
      <g className="halo-labels"><text x="380" y="28" textAnchor="middle">FAR-END OPENING · {formatLength(farGapMetres, unitSystem)}</text><text x="380" y="370" textAnchor="middle">FEEDPOINT OPENING · {formatLength(feedGapMetres, unitSystem)}</text><text x="110" y="190">EACH ARM</text><text x="110" y="214">{formatLength(armMetres, unitSystem)}</text></g>
      <g className="dimension-lines"><line x1={circular ? 235 : 220} y1="460" x2={circular ? 525 : 540} y2="460" /><line x1={circular ? 235 : 220} y1="450" x2={circular ? 235 : 220} y2="470" /><line x1={circular ? 525 : 540} y1="450" x2={circular ? 525 : 540} y2="470" /><text x="380" y="450" textAnchor="middle">CENTRELINE WIDTH · {formatLength(widthMetres, unitSystem)}</text></g>
    </svg>
    <figcaption>{circular ? 'Circular halo' : 'Square halo (squalo)'} · Top-view construction geometry only; bend shape, conductor size, support, feed system, height, and surroundings change the installed result.</figcaption>
  </figure>;
}
