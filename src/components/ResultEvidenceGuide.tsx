/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { RESULT_EVIDENCE, type ResultEvidenceKind } from '../lib/resultEvidence';

export function ResultEvidenceBadge({ kind }: { kind: ResultEvidenceKind }) {
  return <span className={`result-evidence-badge result-evidence-${kind}`}>{RESULT_EVIDENCE[kind].label}</span>;
}

export function ResultEvidenceGuide() {
  return <aside className="result-evidence-guide" aria-labelledby="result-evidence-title">
    <div>
      <p className="eyebrow">How to read these results</p>
      <h3 id="result-evidence-title">Know what the number means before cutting</h3>
    </div>
    <dl>{(Object.keys(RESULT_EVIDENCE) as ResultEvidenceKind[]).map((kind) => <div key={kind}>
      <dt><ResultEvidenceBadge kind={kind} /></dt>
      <dd>{RESULT_EVIDENCE[kind].explanation}</dd>
    </div>)}</dl>
  </aside>;
}
