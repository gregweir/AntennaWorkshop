/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { evaluateGroundEffectsLesson, type GroundLessonEnvironment, type GroundLessonGeometry, type GroundLessonHeight, type GroundLessonReturn } from '../calculators/groundEffectsLesson';
import { formatLength, type UnitSystem } from '../lib/units';
import type { ExplanationDepth } from '../preferences';

interface Props { depth: ExplanationDepth; frequencyMHz: number; unitSystem: UnitSystem }

export function GroundEffectsLesson({ depth, frequencyMHz, unitSystem }: Props) {
  const [geometry, setGeometry] = useState<GroundLessonGeometry>('horizontal-wire');
  const [heightWavelengths, setHeightWavelengths] = useState<GroundLessonHeight>('0.25');
  const [returnSystem, setReturnSystem] = useState<GroundLessonReturn>('unspecified');
  const [environment, setEnvironment] = useState<GroundLessonEnvironment>('clear');
  const result = useMemo(() => evaluateGroundEffectsLesson({ frequencyMHz, geometry, heightWavelengths, returnSystem, environment }), [frequencyMHz, geometry, heightWavelengths, returnSystem, environment]);
  const antennaY = 170 - Math.min(result.heightRatio, 1) * 115;
  return <details className="ground-effects-lesson">
    <summary><span><strong>Interactive lesson: height, ground, and surroundings</strong><small>Describe the installation before interpreting its behavior.</small></span></summary>
    <div className="ground-effects-body">
      <div className="ground-effects-controls">
        <fieldset><legend>Antenna relationship</legend><button type="button" aria-pressed={geometry === 'horizontal-wire'} onClick={() => setGeometry('horizontal-wire')}>Horizontal wire</button><button type="button" aria-pressed={geometry === 'ground-referenced-vertical'} onClick={() => setGeometry('ground-referenced-vertical')}>Ground-referenced vertical</button></fieldset>
        <fieldset><legend>Height above local ground</legend>{(['0.1', '0.25', '0.5', '1'] as GroundLessonHeight[]).map((height) => <button key={height} type="button" aria-pressed={heightWavelengths === height} onClick={() => setHeightWavelengths(height)}>{height} λ</button>)}</fieldset>
        {geometry === 'ground-referenced-vertical' && <fieldset><legend>RF return system</legend><button type="button" aria-pressed={returnSystem === 'unspecified'} onClick={() => setReturnSystem('unspecified')}>Not documented</button><button type="button" aria-pressed={returnSystem === 'documented'} onClick={() => setReturnSystem('documented')}>Documented</button></fieldset>}
        <fieldset><legend>Immediate surroundings</legend><button type="button" aria-pressed={environment === 'clear'} onClick={() => setEnvironment('clear')}>Open-site assumption</button><button type="button" aria-pressed={environment === 'nearby-objects'} onClick={() => setEnvironment('nearby-objects')}>Nearby objects</button></fieldset>
      </div>
      <article className={`ground-effects-outcome ground-status-${result.status}`}><p className="eyebrow">{result.status === 'review-installation' ? 'Installation detail required' : 'Model and measure'}</p><h4>{result.headline}</h4><p>{heightWavelengths} λ at {frequencyMHz.toFixed(3)} MHz is {formatLength(result.heightMetres, unitSystem)} above the selected local-ground reference.</p></article>
      <div className="ground-effects-graphic"><svg viewBox="0 0 620 230" role="img" aria-labelledby="ground-effects-title ground-effects-desc"><title id="ground-effects-title">Conceptual antenna height and surroundings</title><desc id="ground-effects-desc">A cross-section shows the selected horizontal or vertical antenna above a local ground reference. A nearby structure appears only when selected. The drawing does not predict a radiation pattern.</desc><path className="local-ground" d="M20 190H600" /><path className="height-guide" d={`M75 190V${antennaY}`} />{geometry === 'horizontal-wire' ? <path className="lesson-antenna" d={`M130 ${antennaY}H480`} /> : <><path className="lesson-antenna" d={`M300 ${antennaY}V185`} />{returnSystem === 'documented' && <path className="return-system" d="M300 185L190 198M300 185L410 198" />}</>}{environment === 'nearby-objects' && <path className="nearby-object" d="M500 190V95H575V190M500 95L537 62L575 95" />}</svg><div className="ground-effects-legend"><span><i className="legend-antenna" />Selected antenna geometry</span><span><i className="legend-ground" />Local ground reference</span><span><i className="legend-context" />Context—not a pattern plot</span></div></div>
      {depth !== 'quick' && <div className="ground-effects-notes"><p><strong>Ground relationship:</strong> {result.groundMeaning}</p><p><strong>Surroundings:</strong> {result.objectMeaning}</p></div>}
      {depth === 'technical' && <p className="formula">Normalized height h/λ = physical height ÷ (c/f) · this geometric ratio supplies model context but does not solve ground reflection, return loss, or installed fields</p>}
      <div className="ground-effects-verification"><h4>What to document and verify</h4><ol>{result.checks.map((check) => <li key={check}>{check}</li>)}</ol><p><strong>Interpretation limit:</strong> this lesson does not calculate feedpoint impedance, resonance shift, soil loss, efficiency, gain, takeoff angle, azimuth or elevation pattern, field strength, exposure, or safe power.</p></div>
    </div>
  </details>;
}
