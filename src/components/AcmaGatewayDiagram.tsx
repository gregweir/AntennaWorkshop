/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { AcmaAssessmentResult } from '../calculators/acmaAssessment';

interface Props { result: AcmaAssessmentResult; }

export function AcmaGatewayDiagram({ result }: Props) {
  const lowRisk = result.status === 'low-risk-station';
  return <svg className="acma-gateway-diagram" viewBox="0 0 760 260" role="img" aria-labelledby="acma-diagram-title acma-diagram-description">
    <title id="acma-diagram-title">Australian amateur station EME assessment gateway</title>
    <desc id="acma-diagram-description">The entered station follows the {lowRisk ? 'low-risk station' : 'higher-risk assessment'} branch.</desc>
    <path className="acma-diagram-line" d="M185 70H285M475 70H575M380 112V170" />
    <g className="acma-diagram-box"><rect x="20" y="28" width="165" height="84" rx="12" /><text x="102" y="58">STATION INPUTS</text><text x="102" y="82">power · access</text><text x="102" y="100">height · EIRP</text></g>
    <g className="acma-diagram-box"><rect x="285" y="28" width="190" height="84" rx="12" /><text x="380" y="58">SCHEDULE 1</text><text x="380" y="82">clause 3 low-risk</text><text x="380" y="100">thresholds</text></g>
    <g className={`acma-diagram-box ${lowRisk ? 'acma-diagram-active' : ''}`}><rect x="575" y="28" width="165" height="84" rx="12" /><text x="657" y="58">LOW-RISK PATH</text><text x="657" y="82">clauses 4 and 6</text><text x="657" y="100">not mandatory</text></g>
    <g className={`acma-diagram-box ${!lowRisk ? 'acma-diagram-active acma-diagram-alert' : ''}`}><rect x="285" y="170" width="190" height="70" rx="12" /><text x="380" y="199">HIGHER-RISK PATH</text><text x="380" y="222">assessment + records</text></g>
    <text className="acma-diagram-note" x="20" y="245">Public exposure condition continues on both paths</text>
  </svg>;
}
