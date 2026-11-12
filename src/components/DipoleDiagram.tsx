/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface DipoleDiagramProps {
  totalMetres: number;
  legMetres: number;
  frequencyMHz: number;
  unitSystem: UnitSystem;
}

export function DipoleDiagram({
  totalMetres,
  legMetres,
  frequencyMHz,
  unitSystem
}: DipoleDiagramProps) {
  const totalLabel = formatLength(totalMetres, unitSystem);
  const legLabel = formatLength(legMetres, unitSystem);

  return (
    <figure className="antenna-figure">
      <svg
        className="dipole-diagram"
        viewBox="0 0 760 330"
        role="img"
        aria-labelledby="dipole-title dipole-description"
      >
        <title id="dipole-title">Dimensioned centre-fed half-wave dipole</title>
        <desc id="dipole-description">
          Two equal wire legs extend from a centre feedpoint. Each cut leg is {legLabel}, for a total of{' '}
          {totalLabel} at {frequencyMHz.toFixed(3)} megahertz.
        </desc>

        <DiagramDefinitions prefix="dipole" />
        <DiagramGrid />

        <g className="dimension-lines">
          <line x1="70" y1="82" x2="70" y2="132" />
          <line x1="690" y1="82" x2="690" y2="132" />
        </g>
        <SvgDimension prefix="dipole" x1={70} y1={72} x2={690} y2={72} label={`Total cut length · ${totalLabel}`} labelX={380} labelY={54} />
        <SvgDimension prefix="dipole" x1={70} y1={254} x2={368} y2={254} label={`Leg A · ${legLabel}`} labelX={219} labelY={280} />
        <SvgDimension prefix="dipole" x1={392} y1={254} x2={690} y2={254} label={`Leg B · ${legLabel}`} labelX={541} labelY={280} />

        <g className="antenna-wire">
          <line x1="70" y1="160" x2="359" y2="160" />
          <line x1="401" y1="160" x2="690" y2="160" />
          <circle cx="70" cy="160" r="6" />
          <circle cx="690" cy="160" r="6" />
        </g>

        <Feedpoint x={380} y={160} label="centre feedpoint" />

        <g className="end-labels">
          <text x="70" y="192" textAnchor="middle">end insulator</text>
          <text x="690" y="192" textAnchor="middle">end insulator</text>
        </g>
      </svg>
      <figcaption>
        Construction drawing · Starting dimensions include the selected trimming allowance and are not to scale.
      </figcaption>
    </figure>
  );
}
