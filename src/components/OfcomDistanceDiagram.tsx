/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { OfcomComplianceDistanceResult } from '../calculators/ofcomComplianceDistance';

export function OfcomDistanceDiagram({ result }: { result: OfcomComplianceDistanceResult }) {
  return <figure className="antenna-figure ofcom-distance-figure">
    <svg className="dipole-diagram" viewBox="0 0 720 320" role="img" aria-labelledby="ofcom-distance-title ofcom-distance-description">
      <title id="ofcom-distance-title">Ofcom compliance-distance geometry</title>
      <desc id="ofcom-distance-description">Conceptual side view showing an antenna, a conservative circular exclusion boundary, and a person outside the calculated compliance distance.</desc>
      <rect className="fcc-diagram-surface" x="1" y="1" width="718" height="318" rx="14" />
      <text className="diagram-kicker" x="24" y="30">OFCOM EMF CALCULATOR V1.1</text>
      <text className="diagram-title" x="24" y="56">public exclusion distance</text>
      <line className="diagram-ground" x1="35" y1="270" x2="685" y2="270" />
      <line className="ofcom-mast" x1="180" y1="270" x2="180" y2="92" />
      <line className="ofcom-antenna" x1="125" y1="92" x2="235" y2="92" />
      <circle className="ofcom-distance-zone" cx="180" cy="92" r="118" />
      <line className="dimension-line" x1="180" y1="235" x2="540" y2="235" />
      <line className="dimension-tick" x1="180" y1="226" x2="180" y2="244" />
      <line className="dimension-tick" x1="540" y1="226" x2="540" y2="244" />
      <text className="dimension-text" x="360" y="225" textAnchor="middle">R = {result.complianceDistanceMetres.toFixed(2)} m minimum</text>
      <circle className="ofcom-person" cx="560" cy="178" r="16" />
      <line className="ofcom-person-line" x1="560" y1="194" x2="560" y2="240" />
      <line className="ofcom-person-line" x1="560" y1="208" x2="535" y2="226" />
      <line className="ofcom-person-line" x1="560" y1="208" x2="585" y2="226" />
      <line className="ofcom-person-line" x1="560" y1="240" x2="542" y2="270" />
      <line className="ofcom-person-line" x1="560" y1="240" x2="578" y2="270" />
      <text className="diagram-annotation" x="24" y="300">Conceptual only · measure from the closest part of the antenna</text>
    </svg>
    <figcaption>The drawn circle is illustrative, not to scale. The calculation does not model antenna pattern, terrain, buildings, or site access.</figcaption>
  </figure>;
}
