/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId } from 'react';
import { SLEEVE_DIPOLE_MODEL, type SleeveDipoleConstruction } from '../calculators/sleeveDipole';
import { HelpTip, StepByStepHelp } from './ContextHelp';

export function SleeveDipoleGuide() {
  return <StepByStepHelp title="Build and tune a sleeve or coaxial vertical dipole" intro="Use this sequence to keep the two external quarter-wave elements equal while routing coax through the lower element. Experienced builders can leave the guide closed." steps={[
    { title: 'Choose one design frequency', detail: 'Select the intended centre frequency and calculate two equal corrected quarter-wave external elements.' },
    { title: 'Choose the lower-element construction', detail: 'Use a hollow conductive sleeve around the coax or fold the coax braid back over its jacket. The lower section is a radiating dipole element, not a ground radial.' },
    { title: 'Keep the feedpoint mechanically clear', detail: 'Connect the upper radiator to the coax centre and the top of the sleeve or folded braid to the coax shield without shorting them or allowing water into the cable.' },
    { title: 'Route coax inside the sleeve', detail: 'Run the feedline down the centre and out below the open sleeve end. Keep mast, support, and cable routing as symmetrical and non-conductive as practical.' },
    { title: 'Install before trimming', detail: 'Include the selected allowance on both external elements, add final support and weatherproofing, then raise the antenna in its intended clear vertical position.' },
    { title: 'Measure the complete system', detail: 'Sweep at low analyser power, trim both external elements symmetrically, and measure common-mode current below the sleeve. Add or revise choking when required; do not use coax velocity factor to resize the radiating surfaces.' }
  ]} limit="This planner supplies starting cut geometry and a mechanical clearance check. It does not predict impedance, SWR, bandwidth, efficiency, gain, installed pattern, common-mode current, structural safety, weatherproofing, or RF exposure." />;
}

function MillimetreField({ label, tooltip, value, min, max, help, validationMessage, onChange }: { label: string; tooltip: string; value: number; min: number; max: number; help: string; validationMessage?: string; onChange: (value: number) => void }) {
  const id = useId();
  const helpId = `${id}-help`;
  const errorId = `${id}-error`;
  const invalid = !Number.isFinite(value) || value < min || value > max || Boolean(validationMessage);
  return <div className={`field${invalid ? ' field-invalid' : ''}`}>
    <span className="field-label-with-help"><label htmlFor={id}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span>
    <span className="input-with-unit"><input id={id} aria-label={label} aria-describedby={`${helpId}${invalid ? ` ${errorId}` : ''}`} aria-invalid={invalid || undefined} type="number" min={min} max={max} step="0.1" value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>mm</span></span>
    {invalid && <small id={errorId} className="field-validation">{validationMessage ?? `Enter a value from ${min} to ${max} mm.`}</small>}
    <small id={helpId}>{help}</small>
  </div>;
}

export function SleeveDipoleControls({ construction, setConstruction, feedlineOutsideDiameterMillimetres, setFeedlineOutsideDiameterMillimetres, sleeveInsideDiameterMillimetres, setSleeveInsideDiameterMillimetres }: { construction: SleeveDipoleConstruction; setConstruction: (construction: SleeveDipoleConstruction) => void; feedlineOutsideDiameterMillimetres: number; setFeedlineOutsideDiameterMillimetres: (value: number) => void; sleeveInsideDiameterMillimetres: number; setSleeveInsideDiameterMillimetres: (value: number) => void }) {
  return <fieldset className="sleeve-dipole-editor">
    <legend>Coaxial lower-element construction</legend>
    <div className="field"><span className="field-label-with-help"><span>Construction</span><HelpTip label="Sleeve dipole construction">A rigid conductive tube or wire cage can form the hollow lower element. A portable coaxial version folds the shield braid back over the cable jacket. Both are external quarter-wave surfaces and require installed tuning.</HelpTip></span><div className="segmented-control" role="group" aria-label="Sleeve dipole construction"><button type="button" className={construction === 'rigid-sleeve' ? 'is-selected' : ''} aria-pressed={construction === 'rigid-sleeve'} onClick={() => setConstruction('rigid-sleeve')}>Rigid sleeve</button><button type="button" className={construction === 'foldback-braid' ? 'is-selected' : ''} aria-pressed={construction === 'foldback-braid'} onClick={() => setConstruction('foldback-braid')}>Fold-back braid</button></div><small>The coax feedline continues down inside the lower element and exits below its open end.</small></div>
    <MillimetreField label="Feedline outside diameter" tooltip="Enter the finished outside diameter of the coax, including its jacket. This is a mechanical fit input only and is not used to estimate impedance or electrical length." value={feedlineOutsideDiameterMillimetres} min={0.1} max={250} help="Mechanical outside diameter; coax velocity factor is deliberately not requested." onChange={setFeedlineOutsideDiameterMillimetres} />
    {construction === 'rigid-sleeve' && <MillimetreField label="Rigid sleeve inside diameter" tooltip="Enter the clear inside diameter through which the coax must pass. The calculated clearance is mechanical only; sleeve diameter, wall thickness, and conductor shape still affect the installed antenna." value={sleeveInsideDiameterMillimetres} min={0.2} max={1000} help="Must exceed the coax outside diameter and leave room for assembly, insulation, drainage, and movement." validationMessage={sleeveInsideDiameterMillimetres <= feedlineOutsideDiameterMillimetres ? 'Rigid sleeve inside diameter must be greater than the feedline outside diameter.' : undefined} onChange={setSleeveInsideDiameterMillimetres} />}
  </fieldset>;
}

export function SleeveDipoleEducation() {
  const model = SLEEVE_DIPOLE_MODEL;
  return <div className="explanation-grid">
    <article><p className="eyebrow">Build and verify</p><h3>Keep two equal external elements and one controlled cable exit</h3><p>Connect the upper radiator to coax centre and the top of the sleeve or folded braid to the shield. Route the coax down inside the lower element and out below its open end, then install the final support and weatherproofing before sweeping the antenna.</p></article>
    <article><p className="eyebrow">Calculation</p><h3>Corrected free-space quarter waves—not coax line length</h3><p className="formula">λ = c ÷ f · each external element = λ ÷ 4 × correction · cut = element × (1 + allowance)</p><p>The coaxial cable velocity factor applies to fields inside the transmission line and is not used to size the exposed upper radiator or the sleeve’s external radiating surface. The mechanical diameters do not predict impedance.</p></article>
    <article className="caution-card"><p className="eyebrow">Feedline isolation and mounting</p><h3>A quarter-wave sleeve is an intended current boundary, not proof of balance</h3><p>Measure common-mode current on the coax below the sleeve and add or revise choking if required. Conductive masts, wet support material, braid stretch, jacket dielectric, sealing, connectors, and cable routing can shift resonance and disturb the pattern. Keep the upper end inaccessible and assess RF exposure for the installed antenna.</p></article>
    <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>NTIA identifies the sleeve antenna as a vertical dipole fed through one hollow element. NASA documents a quarter-wave sleeve whose external surface forms one dipole element while the inner sleeve acts as an isolating structure. ARRL supplies the practical VHF/UHF fold-back-braid construction. Dimensions remain starting values until the complete installation is measured.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
  </div>;
}
