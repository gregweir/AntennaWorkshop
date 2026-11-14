/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';

export function FoldedDipoleDiagram({ spanMetres, spacingMetres, unitSystem }: { spanMetres: number; spacingMetres: number; unitSystem: UnitSystem }) {
  return <figure className="antenna-figure folded-dipole-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 360" role="img" aria-labelledby="folded-dipole-title folded-dipole-desc">
      <title id="folded-dipole-title">Equal-conductor folded dipole construction diagram</title>
      <desc id="folded-dipole-desc">Two parallel conductors, each {formatLength(spanMetres, unitSystem)} long, are joined at both ends and separated by {formatLength(spacingMetres, unitSystem)}. The lower conductor is opened and balanced-fed at its centre.</desc>
      <g className="folded-dipole-wire"><path d="M95 115 H665 V215 H405 M355 215 H95 Z" /></g>
      <g className="folded-dipole-feed"><circle cx="355" cy="215" r="6" /><circle cx="405" cy="215" r="6" /><path d="M355 221 V300 M405 221 V300" /><text x="380" y="330" textAnchor="middle">BALANCED FEED · MATCH AS MEASURED</text></g>
      <g className="dimension-lines"><line x1="95" y1="70" x2="665" y2="70" /><line x1="95" y1="60" x2="95" y2="80" /><line x1="665" y1="60" x2="665" y2="80" /><text x="380" y="55" textAnchor="middle">EACH PARALLEL CONDUCTOR · {formatLength(spanMetres, unitSystem)}</text><line x1="710" y1="115" x2="710" y2="215" /><line x1="700" y1="115" x2="720" y2="115" /><line x1="700" y1="215" x2="720" y2="215" /><text x="725" y="168" transform="rotate(90 725 168)" textAnchor="middle">{formatLength(spacingMetres, unitSystem)} SPACING</text></g>
      <g className="folded-dipole-labels"><text x="105" y="102">JOIN</text><text x="655" y="102" textAnchor="end">JOIN</text><text x="380" y="142" textAnchor="middle">CONTINUOUS FOLDED SIDE</text><text x="380" y="198" textAnchor="middle">CENTRE GAP IN FED SIDE</text></g>
    </svg>
    <figcaption>Keep both long conductors parallel and equal, maintain the entered centre-to-centre spacing, join both ends securely, and place the balanced feed gap at the exact centre of one conductor.</figcaption>
  </figure>;
}
