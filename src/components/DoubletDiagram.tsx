/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, Feedpoint, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  legMetres: number;
  totalMetres: number;
  feedlineMetres: number;
  feedlineImpedanceOhms: number;
  unitSystem: UnitSystem;
}

export function DoubletDiagram({ legMetres, totalMetres, feedlineMetres, feedlineImpedanceOhms, unitSystem }: Props) {
  return <figure className="antenna-figure">
    <svg className="dipole-diagram doublet-diagram" viewBox="0 0 760 410" role="img" aria-labelledby="doublet-title doublet-description">
      <title id="doublet-title">Dimensioned balanced-line multiband doublet</title>
      <desc id="doublet-description">Two equal wire legs form the radiator. A two-conductor balanced feedline runs from the centre feedpoint to an antenna tuner and short coax connection to the transceiver.</desc>
      <DiagramDefinitions prefix="doublet" />
      <DiagramGrid />
      <SvgDimension prefix="doublet" x1={70} y1={66} x2={690} y2={66} label={`Radiator · ${formatLength(totalMetres, unitSystem)}`} labelX={380} labelY={48} />
      <g className="antenna-wire"><line x1="70" y1="125" x2="359" y2="125" /><line x1="401" y1="125" x2="690" y2="125" /><circle cx="70" cy="125" r="5" /><circle cx="690" cy="125" r="5" /></g>
      <Feedpoint x={380} y={125} label="balanced centre feedpoint" labelY={105} />
      <g className="balanced-line"><line x1="370" y1="148" x2="370" y2="305" /><line x1="390" y1="148" x2="390" y2="305" />{Array.from({ length: 9 }, (_, index) => <line key={index} x1="370" y1={160 + index * 17} x2="390" y2={160 + index * 17} />)}</g>
      <text className="diagram-caption" x="415" y="220">{feedlineImpedanceOhms} Ω balanced line</text>
      <text className="diagram-caption" x="415" y="239">{formatLength(feedlineMetres, unitSystem)} physical length</text>
      <g className="doublet-tuner"><rect x="315" y="305" width="130" height="48" rx="8" /><text x="380" y="334" textAnchor="middle">antenna tuner</text></g>
      <line className="doublet-coax" x1="445" y1="329" x2="530" y2="329" />
      <g className="doublet-radio"><rect x="530" y="305" width="130" height="48" rx="8" /><text x="595" y="334" textAnchor="middle">transceiver</text></g>
      <text className="diagram-caption" x="487" y="317" textAnchor="middle">short coax</text>
      <text className="diagram-caption" x="205" y="155" textAnchor="middle">equal leg · {formatLength(legMetres, unitSystem)}</text>
      <text className="diagram-caption" x="555" y="155" textAnchor="middle">equal leg · {formatLength(legMetres, unitSystem)}</text>
    </svg>
    <figcaption>System drawing · The tuner-side impedance is installation- and frequency-dependent and is not calculated.</figcaption>
  </figure>;
}
