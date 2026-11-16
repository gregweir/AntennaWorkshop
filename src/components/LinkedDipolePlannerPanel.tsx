/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId } from 'react';
import { LINKED_DIPOLE_MODEL, type calculateLinkedDipole } from '../calculators/linkedDipole';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';

type Result = ReturnType<typeof calculateLinkedDipole>;

export function LinkedDipoleGuide() {
  return <StepByStepHelp title="Build and tune a linked multiband dipole" intro="Use this sequence to keep the active electrical length, mechanical link system, and tuning order unambiguous. Experienced builders can leave the guide closed." steps={[
    { title: 'Choose one frequency in each band', detail: 'The highest-frequency section is nearest the feedpoint. Every lower-frequency configuration adds one equal extension on each side.' },
    { title: 'Build symmetric link pairs', detail: 'Use identical insulators, clips, pigtails, strain relief, and electrical reference points on the left and right legs. Label link pair L1 nearest the feedpoint.' },
    { title: 'Cut every segment long', detail: 'Use the raw-cut schedule, then record the finished electrical length between consistent reference planes. The displayed link gap is mechanical context, not a length correction.' },
    { title: 'Tune from inside outward', detail: 'Open L1 on both sides and tune the shortest, highest-frequency state first. Then close that pair, open the next pair, and tune the next lower band without disturbing finished inner segments.' },
    { title: 'Verify every deployment state', detail: 'Raise the complete antenna in its intended flat-top or inverted-V geometry and measure each band. Recheck earlier states after any outer-segment adjustment.' },
    { title: 'Operate links safely', detail: 'Remove transmit power before approaching or changing a link. Verify contact integrity, insulation, strain relief, clearance, common-mode control, and link heating at the intended power.' }
  ]} limit="This planner calculates symmetric half-wave starting segments and link states. It does not predict installed impedance, SWR, bandwidth, efficiency, pattern, contact heating, power handling, structural capacity, exposure, or safe access." />;
}

function NumericField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: string; onChange: (value: number) => void }) {
  const id = useId();
  const invalid = !Number.isFinite(value) || value < min || value > max;
  return <div className={`field${invalid ? ' field-invalid' : ''}`}><span className="field-label-with-help"><label htmlFor={id}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={id} aria-label={label} aria-invalid={invalid || undefined} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span>{invalid && <small className="field-validation">Enter a value from {min} to {max} {unit}.</small>}<small>{help}</small></div>;
}

export function LinkedDipoleControls({ additionalFrequencyTexts, setAdditionalFrequencyTexts, linkGapMillimetres, setLinkGapMillimetres, includedAngleDegrees, setIncludedAngleDegrees, primaryFrequencyMHz }: { additionalFrequencyTexts: string[]; setAdditionalFrequencyTexts: (value: string[] | ((current: string[]) => string[])) => void; linkGapMillimetres: number; setLinkGapMillimetres: (value: number) => void; includedAngleDegrees: number; setIncludedAngleDegrees: (value: number) => void; primaryFrequencyMHz: number }) {
  return <fieldset className="linked-dipole-editor"><legend>Portable bands, links, and support geometry</legend><p>The primary frequency above and each added frequency become one symmetric link state. The calculator sorts them from the shortest inner state to the longest complete dipole.</p>
    <div className="linked-frequency-list">{additionalFrequencyTexts.map((frequency, index) => <div className="linked-frequency-row" key={index}><label htmlFor={`linked-frequency-${index}`}>Additional band {index + 2}</label><span className="input-with-unit"><input id={`linked-frequency-${index}`} aria-label={`Linked dipole band ${index + 2} frequency`} inputMode="decimal" type="number" min="0.001" step="0.001" value={frequency} onChange={(event) => setAdditionalFrequencyTexts((current) => current.map((value, candidate) => candidate === index ? event.target.value : value))} /><span>MHz</span></span>{additionalFrequencyTexts.length > 1 && <button type="button" className="quiet-button" aria-label={`Remove linked dipole band ${index + 2}`} onClick={() => setAdditionalFrequencyTexts((current) => current.filter((_, candidate) => candidate !== index))}>Remove</button>}</div>)}</div>
    {additionalFrequencyTexts.length < 4 && <button type="button" className="secondary-button" onClick={() => setAdditionalFrequencyTexts((current) => [...current, (primaryFrequencyMHz * (current.length + 2)).toFixed(3)])}>Add band</button>}
    <div className="linked-construction-fields"><NumericField label="Finished gap at each open link" value={linkGapMillimetres} min={0} max={500} step={1} unit="mm" help="Record the same mechanical gap and clip geometry at every symmetric pair." tooltip="This is the finished separation between adjacent wire sections when a link is open. It affects the physical route but is not used as an electrical length correction." onChange={setLinkGapMillimetres} /><NumericField label="Included support angle" value={includedAngleDegrees} min={60} max={180} step={1} unit="°" help="180° represents a flat top; smaller values show an inverted-V footprint." tooltip="The support angle converts the complete mechanical leg route into horizontal span and endpoint drop. It does not predict impedance or pattern." onChange={setIncludedAngleDegrees} /></div>
  </fieldset>;
}

export function LinkedDipoleConstruction({ result, unitSystem }: { result: Result; unitSystem: UnitSystem }) {
  return <section className="linked-dipole-construction" aria-labelledby="linked-schedule-title"><div className="linked-construction-heading"><div><p className="eyebrow">Portable cut and switching worksheet</p><h3 id="linked-schedule-title">Symmetric segment and link schedule</h3></div><span className="analysis-fit analysis-fit-caution">Tune shortest state first</span></div>
    <div className="table-scroll"><table><thead><tr><th>Pair</th><th>Purpose</th><th>Finished each side</th><th>Raw cut each side</th><th>Outer junction</th></tr></thead><tbody>{result.segments.map((segment, index) => <tr key={segment.id}><th scope="row">{segment.id}</th><td>{segment.role} · reaches {segment.reachesFrequencyMHz.toFixed(3)} MHz</td><td>{formatLength(segment.finishedEachSideMetres, unitSystem)}</td><td>{formatLength(segment.cutEachSideMetres, unitSystem)}</td><td>{segment.linkAfter ? `Link pair L${index + 1}` : 'End insulators'}</td></tr>)}</tbody></table></div>
    <h4>Operating states</h4><div className="table-scroll"><table><thead><tr><th>Frequency</th><th>Symmetric link state</th><th>Active finished span</th><th>Wire cut through active segments</th></tr></thead><tbody>{result.configurations.map((configuration) => <tr key={configuration.frequencyMHz}><th scope="row">{configuration.frequencyMHz.toFixed(3)} MHz</th><td>{configuration.state}</td><td>{formatLength(configuration.finishedTotalMetres, unitSystem)}</td><td>{formatLength(configuration.cutTotalThroughActiveSegmentsMetres, unitSystem)}</td></tr>)}</tbody></table></div>
    <p className="linked-construction-note">Close or open the same numbered link on both sides with RF removed. “Wire cut” includes the entered trimming reserve; it excludes mechanical link gaps, clips, pigtails, knots, and insulators.</p>
  </section>;
}

export function LinkedDipoleEducation() {
  const model = LINKED_DIPOLE_MODEL;
  return <div className="explanation-grid"><article><p className="eyebrow">Why the links work</p><h3>Only the connected inner wire is active</h3><p>Opening the first symmetric link pair leaves the shortest inner dipole connected. Closing that pair adds equal wire on both sides for the next lower frequency. Each additional closed pair extends the same balanced feedpoint outward.</p></article><article><p className="eyebrow">Calculation</p><h3>Each extension is a difference, not another dipole</h3><p className="formula">active total = c ÷ f × 0.5 × correction · each new segment = next half-leg − previous half-leg</p><p>Cut reserve is applied to each physical wire segment. Link and termination geometry remain part of installed tuning.</p></article><article className="caution-card"><p className="eyebrow">Portable operation</p><h3>Convenient band changes still require an RF-safe procedure</h3><p>De-energize the transmitter before touching links. Treat supports, trip hazards, public access, wet insulation, contact heating, feedline current, overhead conductors, and the complete RF-exposure assessment as deployment responsibilities.</p></article><article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>ARRL supplies the half-wave dipole starting relationship and installed adjustment requirement. SOTABEAMS documents symmetric linked-dipole construction, the highest-band open-link state, lower-band closed states, and inside-out tuning order.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article></div>;
}
