/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  presetLabel: string;
  radiatorMetres: number;
  legMetres: number;
  matchingSectionMetres: number;
  matchingSectionImpedanceOhms: number;
  unitSystem: UnitSystem;
}

export function G5rvDiagram({ presetLabel, radiatorMetres, legMetres, matchingSectionMetres, matchingSectionImpedanceOhms, unitSystem }: Props) {
  return <svg className="dipole-diagram g5rv-diagram" viewBox="0 0 760 430" role="img" aria-labelledby="g5rv-title g5rv-description">
    <title id="g5rv-title">Dimensioned {presetLabel} antenna system</title>
    <desc id="g5rv-description">Two equal horizontal radiator legs connect to a specified two-conductor matching section, followed by a coax transition with common-mode control and a station matching network.</desc>
    <DiagramDefinitions prefix="g5rv" />
    <SvgDimension prefix="g5rv-total" x1={70} y1={58} x2={690} y2={58} label={`Radiator · ${formatLength(radiatorMetres, unitSystem)}`} labelX={380} labelY={40} />
    <line className="radiator" x1="70" y1="132" x2="370" y2="132" />
    <line className="radiator" x1="390" y1="132" x2="690" y2="132" />
    <circle className="feedpoint" cx="380" cy="132" r="13" />
    <text className="feedpoint-label" x="380" y="111" textAnchor="middle">centre junction</text>
    <SvgDimension prefix="g5rv-left" x1={70} y1={176} x2={370} y2={176} label={`${formatLength(legMetres, unitSystem)} leg`} labelX={220} labelY={196} />
    <SvgDimension prefix="g5rv-right" x1={390} y1={176} x2={690} y2={176} label={`${formatLength(legMetres, unitSystem)} leg`} labelX={540} labelY={196} />
    <g className="balanced-line"><line x1="370" y1="145" x2="370" y2="305" /><line x1="390" y1="145" x2="390" y2="305" />{Array.from({ length: 9 }, (_, index) => <line key={index} x1="370" y1={158 + index * 17} x2="390" y2={158 + index * 17} />)}</g>
    <text className="diagram-caption" x="415" y="225">{matchingSectionImpedanceOhms} Ω matching section</text>
    <text className="diagram-caption" x="415" y="245">physical · {formatLength(matchingSectionMetres, unitSystem)}</text>
    <g className="g5rv-transition"><rect x="318" y="305" width="124" height="45" rx="8" /><text x="380" y="324" textAnchor="middle">line transition</text><text x="380" y="339" textAnchor="middle">+ choke</text></g>
    <line className="doublet-coax" x1="442" y1="328" x2="535" y2="328" />
    <text className="diagram-caption" x="489" y="316" textAnchor="middle">coax</text>
    <g className="g5rv-tuner"><rect x="535" y="305" width="130" height="45" rx="8" /><text x="600" y="324" textAnchor="middle">matching network</text><text x="600" y="339" textAnchor="middle">and radio</text></g>
    <text className="diagram-note" x="380" y="395" textAnchor="middle">Radiator + matching section = one system. Verify the transition, tuner range, and each band.</text>
  </svg>;
}
