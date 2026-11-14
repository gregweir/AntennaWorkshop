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

export function ResultEvidenceGuide({ title = 'Know what the number means before cutting' }: { title?: string }) {
  return <aside className="result-evidence-guide" aria-labelledby="result-evidence-title">
    <div>
      <p className="eyebrow">How to read these results</p>
      <h3 id="result-evidence-title">{title}</h3>
    </div>
    <dl>{(Object.keys(RESULT_EVIDENCE) as ResultEvidenceKind[]).map((kind) => <div key={kind}>
      <dt><ResultEvidenceBadge kind={kind} /></dt>
      <dd>{RESULT_EVIDENCE[kind].explanation}</dd>
    </div>)}</dl>
  </aside>;
}

export interface EvidenceResultItem {
  term: string;
  value: string;
  kind: ResultEvidenceKind;
}

export function EvidenceResultSummary({ headline, primary, primaryKind, items }: { headline: string; primary: string; primaryKind: ResultEvidenceKind; items: EvidenceResultItem[] }) {
  return <div className="result-summary evidence-result-summary" aria-live="polite">
    <p>{headline}</p>
    <strong>{primary}</strong>
    <ResultEvidenceBadge kind={primaryKind} />
    <dl>{items.map(({ term, value, kind }) => <div key={term} data-evidence={kind}><dt>{term}</dt><dd>{value}</dd><ResultEvidenceBadge kind={kind} /></div>)}</dl>
  </div>;
}

export function ResultEvidenceKey() {
  return <details className="result-evidence-key">
    <summary>What do the result labels mean?</summary>
    <ResultEvidenceGuide title="Know what each result means" />
  </details>;
}
