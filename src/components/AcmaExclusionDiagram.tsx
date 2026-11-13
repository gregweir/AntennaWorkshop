/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { AcmaExclusionDistanceResult } from '../calculators/acmaExclusionDistance';
import { formatLength, type UnitSystem } from '../lib/units';

interface Props { result: AcmaExclusionDistanceResult; unitSystem: UnitSystem; }

export function AcmaExclusionDiagram({ result, unitSystem }: Props) {
  const maximum = Math.max(result.exclusionDistanceMetres, result.farFieldBoundaryMetres) * 1.18;
  const position = (value: number) => 105 + Math.min(value / maximum, 1) * 430;
  const exclusionX = position(result.exclusionDistanceMetres);
  const farFieldX = position(result.farFieldBoundaryMetres);
  return <figure className="acma-exclusion-diagram">
    <svg viewBox="0 0 640 300" role="img" aria-labelledby="acma-exclusion-title acma-exclusion-desc">
      <title id="acma-exclusion-title">ACMA simple RF exclusion-distance geometry</title>
      <desc id="acma-exclusion-desc">The calculated exclusion distance is {formatLength(result.exclusionDistanceMetres, unitSystem)}. The Amateur Class Licence far-field boundary is {formatLength(result.farFieldBoundaryMetres, unitSystem)}.</desc>
      <rect className="acma-near-field-zone" x="105" y="58" width={Math.max(farFieldX - 105, 2)} height="185" rx="12" />
      <line className="acma-distance-axis" x1="75" y1="243" x2="570" y2="243" />
      <g className="acma-antenna-symbol"><line x1="105" y1="78" x2="105" y2="243" /><line x1="70" y1="112" x2="140" y2="112" /><line x1="78" y1="90" x2="132" y2="134" /><line x1="132" y1="90" x2="78" y2="134" /><text x="105" y="268" textAnchor="middle">ANTENNA</text></g>
      <g className="acma-boundary acma-far-boundary"><line x1={farFieldX} y1="48" x2={farFieldX} y2="243" /><text x={farFieldX} y="30" textAnchor="middle">FAR-FIELD CHECK</text><text x={farFieldX} y="48" textAnchor="middle">{formatLength(result.farFieldBoundaryMetres, unitSystem)}</text></g>
      <g className="acma-boundary acma-exclusion-boundary"><line x1={exclusionX} y1="82" x2={exclusionX} y2="243" /><text x={exclusionX} y="66" textAnchor="middle">EXCLUSION DISTANCE</text><text x={exclusionX} y="84" textAnchor="middle">{formatLength(result.exclusionDistanceMetres, unitSystem)}</text></g>
      <g className="acma-person-symbol" transform={`translate(${Math.min(exclusionX + 42, 575)} 0)`}><circle cx="0" cy="156" r="11" /><line x1="0" y1="167" x2="0" y2="211" /><line x1="-18" y1="184" x2="18" y2="184" /><line x1="0" y1="211" x2="-15" y2="239" /><line x1="0" y1="211" x2="15" y2="239" /></g>
    </svg>
    <figcaption>Geometry check · The numerical workbook result is interpreted only when it reaches beyond the displayed Class Licence far-field boundary.</figcaption>
  </figure>;
}
