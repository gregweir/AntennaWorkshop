/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { SleeveDipoleConstruction } from '../calculators/sleeveDipole';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  upperRadiatorMetres: number;
  sleeveMetres: number;
  construction: SleeveDipoleConstruction;
  unitSystem: UnitSystem;
}

export function SleeveDipoleDiagram({ upperRadiatorMetres, sleeveMetres, construction, unitSystem }: Props) {
  const foldback = construction === 'foldback-braid';
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 430" role="img" aria-labelledby="sleeve-dipole-title sleeve-dipole-desc">
      <title id="sleeve-dipole-title">Dimensioned sleeve or coaxial vertical dipole</title>
      <desc id="sleeve-dipole-desc">A vertical half-wave dipole has an upper quarter-wave radiator measuring {formatLength(upperRadiatorMetres, unitSystem)} and a lower {foldback ? 'folded-back braid' : 'conductive sleeve'} measuring {formatLength(sleeveMetres, unitSystem)} around the descending coaxial feedline.</desc>
      <DiagramDefinitions prefix="sleeve-dipole" />
      <DiagramGrid />
      <g className="antenna-wire"><path d="M380 205 V48" /><circle cx="380" cy="48" r="5" /></g>
      <g className="transformer-box"><rect x="356" y="205" width="48" height="24" rx="6" /><text x="380" y="222" textAnchor="middle">FEED</text></g>
      <g className="return-path"><path d="M348 229 V365 H412 V229 Z" /><path d="M380 229 V405" /><text x="430" y="292">{foldback ? 'FOLD-BACK BRAID' : 'CONDUCTIVE SLEEVE'}</text><text x="430" y="315">lower dipole element</text></g>
      <g className="coax-path"><path d="M380 365 V405" /><text x="400" y="398">coax exits below sleeve</text></g>
      <SvgDimension prefix="sleeve-upper" x1={310} y1={48} x2={310} y2={205} label={`Upper · ${formatLength(upperRadiatorMetres, unitSystem)}`} labelX={220} labelY={128} />
      <SvgDimension prefix="sleeve-lower" x1={310} y1={229} x2={310} y2={365} label={`Sleeve · ${formatLength(sleeveMetres, unitSystem)}`} labelX={215} labelY={300} />
      <g className="hazard-labels"><text x="530" y="92">HIGH RF VOLTAGE</text><text x="530" y="114">AT UPPER END</text></g>
    </svg>
    <figcaption>Construction section · The two external quarter-wave surfaces form the dipole; the internal coax route is not a third radiator by design.</figcaption>
  </figure>;
}
