/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ReactNode } from 'react';

interface HelpTipProps {
  label: string;
  children: ReactNode;
}

interface StepByStepHelpProps {
  title: string;
  intro: string;
  steps: Array<{ title: string; detail: string }>;
  limit?: string;
}

export function HelpTip({ label, children }: HelpTipProps) {
  return <details className="context-help">
    <summary aria-label={`Help: ${label}`} title={`Help: ${label}`}><span aria-hidden="true">?</span></summary>
    <div className="context-help-panel" role="note"><strong>{label}</strong><p>{children}</p></div>
  </details>;
}

export function StepByStepHelp({ title, intro, steps, limit }: StepByStepHelpProps) {
  return <details className="step-by-step-help">
    <summary><span>Optional guided help</span><strong>{title}</strong></summary>
    <div><p>{intro}</p><ol>{steps.map((step) => <li key={step.title}><strong>{step.title}</strong><span>{step.detail}</span></li>)}</ol>{limit && <p className="step-by-step-limit"><strong>Limit:</strong> {limit}</p>}</div>
  </details>;
}
