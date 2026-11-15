/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId } from 'react';
import type { ExplanationDepth } from '../preferences';

interface Props {
  current: string;
  why: string;
  boundary: string;
  depth?: ExplanationDepth;
  technical?: string;
}

export function InputImpactPanel({ current, why, boundary, depth = 'builder', technical }: Props) {
  const headingId = useId();
  return <section className="input-impact-panel" aria-labelledby={headingId}>
    <div className="input-impact-heading"><p className="eyebrow">Live input impact</p><h3 id={headingId}>What these inputs affect</h3></div>
    <div className="input-impact-grid">
      <article><strong>Current consequence</strong><p>{current}</p></article>
      {depth !== 'quick' && <article><strong>Why it matters</strong><p>{why}</p></article>}
      <article><strong>Boundary and next check</strong><p>{boundary}</p></article>
      {depth === 'technical' && technical && <article><strong>Model and evidence</strong><p>{technical}</p></article>}
    </div>
  </section>;
}
