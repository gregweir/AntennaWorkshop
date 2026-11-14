/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateHexBeam } from '../calculators/hexBeam';
import { formatLength, type UnitSystem } from '../lib/units';

type HexBeamResult = ReturnType<typeof calculateHexBeam>;

export function HexBeamDiagram({ result, unitSystem }: { result: HexBeamResult; unitSystem: UnitSystem }) {
  const longest = result.elements[0].radiatingWireMetres;
  return <figure className="antenna-figure hex-beam-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 500" role="img" aria-labelledby="hex-title hex-desc">
      <title id="hex-title">G3TXQ broadband hex-beam six-spreader and wire-layer diagram</title>
      <desc id="hex-desc">Top view of six radial spreaders with nested M-shaped driven elements, rear U-shaped reflectors, and tip spacers for {result.elements.map((element) => element.band).join(', ')}. The published turning radius is {formatLength(result.publishedTurningRadiusMetres, unitSystem)}.</desc>
      <defs><marker id="hex-arrow" markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" /></marker></defs>
      <g className="diagram-grid" aria-hidden="true">{Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="455" />)}{Array.from({ length: 9 }, (_, index) => <line key={`h-${index}`} x1="30" y1={30 + index * 50} x2="730" y2={30 + index * 50} />)}</g>
      <g className="hex-spreaders"><line x1="380" y1="235" x2="380" y2="65" /><line x1="380" y1="235" x2="527" y2="150" /><line x1="380" y1="235" x2="527" y2="320" /><line x1="380" y1="235" x2="380" y2="405" /><line x1="380" y1="235" x2="233" y2="320" /><line x1="380" y1="235" x2="233" y2="150" /><circle cx="380" cy="235" r="13" /></g>
      <g className="hex-wire-layers">{result.elements.map((element, index) => {
        const scale = 0.47 + 0.53 * element.radiatingWireMetres / longest;
        return <g key={element.band} className={`hex-layer hex-layer-${index + 1}`} transform={`translate(380 235) scale(${scale}) translate(-380 -235)`}><path className="hex-driver" d="M233 320 L233 150 L380 235 L527 150 L527 320" /><path className="hex-reflector" d="M233 337 L305 380 L380 405 L455 380 L527 337" /><line className="hex-tip-spacer" x1="233" y1="320" x2="233" y2="337" /><line className="hex-tip-spacer" x1="527" y1="320" x2="527" y2="337" /></g>;
      })}</g>
      <g className="hex-feed"><circle cx="380" cy="235" r="8" /><text x="400" y="230">COMMON CENTRE-POST FEED</text></g>
      <g className="hex-direction"><line x1="380" y1="68" x2="380" y2="22" markerEnd="url(#hex-arrow)" /><text x="400" y="38">FORWARD REFERENCE</text></g>
      <g className="hex-legend">{result.elements.map((element, index) => <g key={element.band} transform={`translate(${80 + index * 105} 458)`}><line className={`hex-layer-${index + 1}`} x1="0" y1="0" x2="28" y2="0" /><text x="36" y="5">{element.band}</text></g>)}</g>
      <g className="dimension-lines"><line x1="65" y1="430" x2="695" y2="430" /><line x1="65" y1="420" x2="65" y2="440" /><line x1="695" y1="420" x2="695" y2="440" /><text x="380" y="425" textAnchor="middle">PUBLISHED DIAMETER · {formatLength(result.publishedDiameterMetres, unitSystem)}</text></g>
    </svg>
    <figcaption>Conceptual top view of the documented M-shaped drivers, rear U-shaped reflectors, two tip spacers per band, and six-spreader framework · Layer paths are not cutting templates or structural drawings.</figcaption>
  </figure>;
}
