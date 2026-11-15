/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { evaluateBalancePath, type CommonModePlan, type FeedlineForm, type FeedpointTopology, type ReturnPathPlan } from '../calculators/balancePathLesson';
import type { ExplanationDepth } from '../preferences';

interface Props { depth: ExplanationDepth }

function CurrentPathDiagram({ topology, feedline, hasControl, showOutside }: { topology: FeedpointTopology; feedline: FeedlineForm; hasControl: boolean; showOutside: boolean }) {
  const endFed = topology === 'end-fed';
  const asymmetric = topology === 'asymmetrical';
  const feedX = endFed ? 115 : 260;
  return <div className="balance-path-graphic"><svg viewBox="0 0 520 230" role="img" aria-labelledby="balance-path-title balance-path-desc">
    <title id="balance-path-title">Conceptual differential and common-mode current paths</title>
    <desc id="balance-path-desc">Solid teal paths show the intended conductor circuit. A dashed coral path appears when the selected scenario leaves a likely unintended outside-current route requiring attention.</desc>
    {!endFed && <><path className="intended-current" d={`M260 65L${asymmetric ? 75 : 40} 65`} /><path className="intended-current reverse" d="M260 65L480 65" /><circle className="feedpoint-node" cx="260" cy="65" r="8" /></>}
    {endFed && <><path className="intended-current" d="M115 65L480 65" /><circle className="feedpoint-node" cx="115" cy="65" r="8" /><path className="return-path" d="M115 72C70 100 65 145 110 190" /></>}
    <path className="feed-conductor" d={`M${feedX - 6} 74V205`} /><path className="feed-conductor reverse" d={`M${feedX + 6} 74V205`} />
    {feedline === 'coax' && <path className="coax-shield" d={`M${feedX - 12} 74V205M${feedX + 12} 74V205`} />}
    {hasControl && <rect className="common-mode-boundary" x={endFed ? 92 : 242} y="132" width="36" height="20" rx="6" />}
    {showOutside && <path className="outside-current" d={`${endFed ? 'M98' : 'M238'} 78C${endFed ? '75' : '218'} 115 ${endFed ? '155' : '315'} 160 ${endFed ? '130' : '285'} 208`} />}
  </svg><div className="balance-path-legend"><span><i className="legend-intended" />Intended conductor path</span><span><i className="legend-outside" />Possible unintended outside path</span><span><i className="legend-boundary" />Planned control boundary</span></div></div>;
}

const topologyOptions: Array<{ value: FeedpointTopology; label: string }> = [
  { value: 'balanced-centre', label: 'Balanced centre' },
  { value: 'asymmetrical', label: 'Asymmetrical' },
  { value: 'end-fed', label: 'End fed' }
];

export function BalanceCommonModeLesson({ depth }: Props) {
  const [topology, setTopology] = useState<FeedpointTopology>('balanced-centre');
  const [feedline, setFeedline] = useState<FeedlineForm>('coax');
  const [commonModePlan, setCommonModePlan] = useState<CommonModePlan>('none');
  const [returnPathPlan, setReturnPathPlan] = useState<ReturnPathPlan>('unspecified');
  const result = useMemo(() => evaluateBalancePath({ topology, feedline, commonModePlan, returnPathPlan }), [topology, feedline, commonModePlan, returnPathPlan]);
  return <details className="balance-common-mode-lesson">
    <summary><span><strong>Interactive lesson: balance and common-mode paths</strong><small>Trace the intended circuit—and what may become part of it.</small></span></summary>
    <div className="balance-common-mode-body">
      <div className="balance-lesson-controls">
        <fieldset><legend>Feedpoint geometry</legend>{topologyOptions.map((option) => <button key={option.value} type="button" aria-pressed={topology === option.value} onClick={() => setTopology(option.value)}>{option.label}</button>)}</fieldset>
        <fieldset><legend>Feedline</legend><button type="button" aria-pressed={feedline === 'coax'} onClick={() => setFeedline('coax')}>Coax</button><button type="button" aria-pressed={feedline === 'balanced-line'} onClick={() => setFeedline('balanced-line')}>Two-conductor line</button></fieldset>
        <fieldset><legend>Common-mode boundary</legend><button type="button" aria-pressed={commonModePlan === 'none'} onClick={() => setCommonModePlan('none')}>Not specified</button><button type="button" aria-pressed={commonModePlan === 'documented-control'} onClick={() => setCommonModePlan('documented-control')}>Documented control</button></fieldset>
        {topology === 'end-fed' && <fieldset><legend>Separate RF return path</legend><button type="button" aria-pressed={returnPathPlan === 'unspecified'} onClick={() => setReturnPathPlan('unspecified')}>Not specified</button><button type="button" aria-pressed={returnPathPlan === 'documented'} onClick={() => setReturnPathPlan('documented')}>Documented</button></fieldset>}
      </div>
      <div className={`balance-lesson-outcome balance-status-${result.status}`}><span>{result.status === 'requires-plan' ? 'Plan incomplete' : 'Installed verification required'}</span><h4>{result.headline}</h4><p>{result.intendedPath}</p></div>
      <CurrentPathDiagram topology={topology} feedline={feedline} hasControl={commonModePlan === 'documented-control'} showOutside={result.showUnintendedOutsidePath} />
      {depth !== 'quick' && <div className="balance-builder-notes"><p><strong>Feedline:</strong> {result.concern}</p><p><strong>Control:</strong> {result.controlMeaning}</p></div>}
      {depth === 'technical' && <p className="formula">I₁ = I differential + I common · I₂ = −I differential + I common · equal and opposite differential components cancel externally; common-mode components do not</p>}
      <div className="balance-verification"><h4>What to verify</h4><ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol><p><strong>Interpretation limit:</strong> topology and a named choke do not quantify installed current balance. This lesson does not calculate choke impedance, line current, radiation, loss, heating, exposure, or safe power.</p></div>
    </div>
  </details>;
}
