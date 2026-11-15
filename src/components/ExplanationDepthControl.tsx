/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExplanationDepth } from '../preferences';

interface Props {
  value: ExplanationDepth;
  onChange: (value: ExplanationDepth) => void;
}

const options: Array<{ value: ExplanationDepth; label: string; detail: string }> = [
  { value: 'quick', label: 'Quick', detail: 'Decision and required next check' },
  { value: 'builder', label: 'Builder', detail: 'Construction reasoning and workflow' },
  { value: 'technical', label: 'Technical', detail: 'Model identity and evidence boundary' }
];

export function ExplanationDepthControl({ value, onChange }: Props) {
  return <section className="explanation-depth" aria-labelledby="explanation-depth-title">
    <div><p className="eyebrow">Learning depth</p><h3 id="explanation-depth-title">Choose how much reasoning to show</h3><p>Results, safety limits, inputs, and advanced controls stay available at every level.</p></div>
    <div className="explanation-depth-options" role="group" aria-label="Explanation depth">
      {options.map((option) => <button key={option.value} type="button" aria-pressed={value === option.value} onClick={() => onChange(option.value)}><strong>{option.label}</strong><small>{option.detail}</small></button>)}
    </div>
  </section>;
}
