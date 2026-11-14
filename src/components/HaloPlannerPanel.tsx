/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId } from 'react';
import type { HaloShape } from '../calculators/halo';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';

export function HaloGuide() {
  return <StepByStepHelp title="Build and tune a halo or squalo" intro="Use this sequence to bend a half-wave dipole into a controlled open ring while keeping geometry, matching, and measured performance distinct. Experienced builders can leave the guide closed." steps={[
    { title: 'Choose one design frequency', detail: 'Use the frequency where the finished antenna should resonate. A halo is normally a narrowband VHF or UHF antenna, so a band name alone is not a cutting frequency.' },
    { title: 'Choose the circle or square form', detail: 'Both shapes use the same corrected half-wave radiator. The calculator adds the two physical openings to establish a centreline perimeter and then derives the circular diameter or square side.' },
    { title: 'Set both construction openings', detail: 'Enter the far-end gap and the smaller feedpoint separation. Keep them mechanically stable and include the real terminal and insulator arrangement in any detailed model.' },
    { title: 'Cut two equal arms long', detail: 'Build both arms from the same conductor and preserve the displayed trimming allowance. Bend symmetrically from the feedpoint toward the opposite opening.' },
    { title: 'Engineer the balanced feed', detail: 'Choose matching and common-mode control from the measured complex feedpoint impedance. Do not infer a direct 50-ohm match from the outline alone.' },
    { title: 'Install and tune in place', detail: 'Mount the antenna in its final plane and height, keep the feedline and supports from unbalancing it, trim symmetrically at low analyser power, and verify resonance, match, common mode, bandwidth, pattern, heating, and RF exposure.' }
  ]} limit="This planner provides cut and centreline geometry. It does not predict resonance after bending, feedpoint impedance, matching, bandwidth, efficiency, gain, azimuth ripple, elevation pattern, common-mode current, exposure, or safe power." />;
}

export function HaloEducation() {
  return <>
    <article>
      <p className="eyebrow">Bent-dipole geometry</p>
      <h3>One half-wave radiator, two controlled openings</h3>
      <p className="formula">reference perimeter = cut radiator + far gap + feed gap</p>
      <p>ARRL defines the halo as a half-wave dipole bent into a circle or square. This construction layout preserves the corrected dipole cut length and uses the entered openings to derive the centreline envelope; it does not claim that bending leaves resonance or impedance unchanged.</p>
    </article>
    <article className="caution-card">
      <p className="eyebrow">Halo tuning and pattern</p>
      <h3>A compact outline is not a guaranteed match or perfect circle of coverage</h3>
      <p>Conductor diameter, bend radius, both openings, feed hardware, mast, supports, feedline routing, height, ground, and nearby metal affect resonance, impedance, polarization, bandwidth, and azimuth pattern. Model the finished structure when performance matters, use a balanced feed and common-mode control, and trim both arms equally after installation.</p>
    </article>
  </>;
}

function GapField({ label, tooltip, valueMetres, unitSystem, help, onChange }: { label: string; tooltip: string; valueMetres: number; unitSystem: UnitSystem; help: string; onChange: (metres: number) => void }) {
  const id = useId();
  const shown = unitSystem === 'metric' ? valueMetres : metresToFeet(valueMetres);
  return <div className="field">
    <span className="field-label-with-help"><label htmlFor={id}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span>
    <span className="input-with-unit"><input id={id} aria-label={label} type="number" min={unitSystem === 'metric' ? 0.001 : 0.003} max={unitSystem === 'metric' ? 10 : 32.8} step={unitSystem === 'metric' ? 0.005 : 0.01} value={Number(shown.toFixed(3))} onChange={(event) => onChange(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span>
    <small>{help}</small>
  </div>;
}

export function HaloControls({ shape, setShape, farEndGapMetres, setFarEndGapMetres, feedpointGapMetres, setFeedpointGapMetres, unitSystem }: { shape: HaloShape; setShape: (shape: HaloShape) => void; farEndGapMetres: number; setFarEndGapMetres: (metres: number) => void; feedpointGapMetres: number; setFeedpointGapMetres: (metres: number) => void; unitSystem: UnitSystem }) {
  return <fieldset className="halo-editor">
    <legend>Open-ring geometry</legend>
    <label className="field"><span className="field-label-with-help"><span>Halo shape</span><HelpTip label="Halo shape">A halo bends the half-wave dipole into an open circle. The square form is commonly called a squalo. The two outlines share radiator length but require separate structural and electromagnetic modelling.</HelpTip></span><select aria-label="Halo shape" value={shape} onChange={(event) => setShape(event.target.value as HaloShape)}><option value="circular">Circular halo</option><option value="square">Square halo (squalo)</option></select><small>Dimensions follow the conductor centreline, before conductor thickness or support hardware.</small></label>
    <GapField label="Far-end opening" tooltip="Physical centreline opening between the two remote dipole ends, opposite the feedpoint. This gap affects the finished capacitance and resonance, so preserve it while tuning symmetrically." valueMetres={farEndGapMetres} unitSystem={unitSystem} help="Included in the reference perimeter but not in the conductor cut length." onChange={setFarEndGapMetres} />
    <GapField label="Feedpoint opening" tooltip="Physical centreline separation between the two feed terminals. Include the real connector, insulating block, and attachment geometry when transferring this plan to a model or build." valueMetres={feedpointGapMetres} unitSystem={unitSystem} help="The feedpoint is opposite the far-end opening in the displayed symmetrical layout." onChange={setFeedpointGapMetres} />
  </fieldset>;
}
