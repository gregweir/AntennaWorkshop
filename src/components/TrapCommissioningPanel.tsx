/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, useMemo, useRef, useState } from 'react';
import { calculateTrapCommissioning, TRAP_COMMISSIONING_MODEL } from '../calculators/trapCommissioning';
import { deleteTrapCommissioningRecord, loadTrapCommissioningRecords, parseTrapCommissioningRecord, saveTrapCommissioningRecord, serializeTrapCommissioningRecord, trapCommissioningRecordFilename, TRAP_RECORD_VERSION, type TrapCommissioningRecord } from '../projects/trapCommissioningRecords';
import { HelpTip, StepByStepHelp } from './ContextHelp';

interface Props {
  targetInductanceMicrohenries: number;
  targetCapacitancePicofarads: number;
  targetResonanceMHz: number;
}

function signedPercent(value: number) {
  return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
}

function MeasurementField({ label, value, unit, min, max, step, help, onChange }: { label: string; value: number; unit: string; min: number; max: number; step: number; help: string; onChange: (value: number) => void }) {
  const inputId = useId();
  return <label className="field" htmlFor={inputId}><span>{label}</span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></label>;
}

function ThresholdState({ within }: { within: boolean }) {
  return <span className={within ? 'pair-state pair-state-within' : 'pair-state pair-state-outside'}>{within ? 'Within threshold' : 'Outside threshold'}</span>;
}

function ResonanceComparison({ targetMHz, trapAMHz, trapBMHz }: { targetMHz: number; trapAMHz: number; trapBMHz: number }) {
  const values = [targetMHz, trapAMHz, trapBMHz];
  let minimum = Math.min(...values);
  let maximum = Math.max(...values);
  const padding = Math.max((maximum - minimum) * 0.25, targetMHz * 0.01);
  minimum -= padding;
  maximum += padding;
  const position = (value: number) => 110 + (value - minimum) / (maximum - minimum) * 540;
  return <figure className="trap-resonance-comparison">
    <svg viewBox="0 0 760 210" role="img" aria-labelledby="trap-comparison-title trap-comparison-desc">
      <title id="trap-comparison-title">Measured trap resonance comparison</title>
      <desc id="trap-comparison-desc">Target resonance is {targetMHz.toFixed(3)} megahertz. Trap A measured {trapAMHz.toFixed(3)} megahertz and Trap B measured {trapBMHz.toFixed(3)} megahertz.</desc>
      <line className="comparison-axis" x1="110" y1="115" x2="650" y2="115" />
      <line className="comparison-target" x1={position(targetMHz)} y1="52" x2={position(targetMHz)} y2="165" />
      <circle className="comparison-trap-a" cx={position(trapAMHz)} cy="96" r="10" />
      <circle className="comparison-trap-b" cx={position(trapBMHz)} cy="134" r="10" />
      <g className="comparison-labels">
        <text x={position(targetMHz)} y="36" textAnchor="middle">Target · {targetMHz.toFixed(3)} MHz</text>
        <text x={position(trapAMHz)} y="78" textAnchor="middle">A · {trapAMHz.toFixed(3)}</text>
        <text x={position(trapBMHz)} y="161" textAnchor="middle">B · {trapBMHz.toFixed(3)}</text>
        <text x="110" y="195" textAnchor="middle">{minimum.toFixed(3)}</text>
        <text x="650" y="195" textAnchor="middle">{maximum.toFixed(3)} MHz</text>
      </g>
    </svg>
    <figcaption>Measured-resonance comparison · Positions show frequency difference only, not trap Q, bandwidth, loss, or power capability.</figcaption>
  </figure>;
}

export function TrapCommissioningPanel({ targetInductanceMicrohenries, targetCapacitancePicofarads, targetResonanceMHz }: Props) {
  const headingId = useId();
  const importInput = useRef<HTMLInputElement>(null);
  const initialRecords = useMemo(() => loadTrapCommissioningRecords(window.localStorage), []);
  const [records, setRecords] = useState(initialRecords);
  const [activeRecordId, setActiveRecordId] = useState<string>(() => crypto.randomUUID());
  const [recordTitle, setRecordTitle] = useState(`Trap pair · ${targetResonanceMHz.toFixed(3)} MHz`);
  const [measuredAt, setMeasuredAt] = useState(new Date().toISOString().slice(0, 10));
  const [instrument, setInstrument] = useState('');
  const [fixture, setFixture] = useState('');
  const [conditions, setConditions] = useState('');
  const [notes, setNotes] = useState('');
  const [recordMessage, setRecordMessage] = useState('Unsaved measurement record');
  const [targetInductance, setTargetInductance] = useState(targetInductanceMicrohenries);
  const [targetCapacitance, setTargetCapacitance] = useState(targetCapacitancePicofarads);
  const [targetResonance, setTargetResonance] = useState(targetResonanceMHz);
  const [trapAInductance, setTrapAInductance] = useState(Number(targetInductanceMicrohenries.toFixed(3)));
  const [trapACapacitance, setTrapACapacitance] = useState(Number(targetCapacitancePicofarads.toFixed(2)));
  const [trapAResonance, setTrapAResonance] = useState(Number(targetResonanceMHz.toFixed(3)));
  const [trapBInductance, setTrapBInductance] = useState(Number(targetInductanceMicrohenries.toFixed(3)));
  const [trapBCapacitance, setTrapBCapacitance] = useState(Number(targetCapacitancePicofarads.toFixed(2)));
  const [trapBResonance, setTrapBResonance] = useState(Number(targetResonanceMHz.toFixed(3)));
  const [inductanceTolerance, setInductanceTolerance] = useState(5);
  const [capacitanceTolerance, setCapacitanceTolerance] = useState(5);
  const [pairThreshold, setPairThreshold] = useState(2);
  const result = useMemo(() => {
    try {
      return calculateTrapCommissioning({
        targetInductanceMicrohenries: targetInductance,
        targetCapacitancePicofarads: targetCapacitance,
        targetResonanceMHz: targetResonance,
        inductanceTolerancePercent: inductanceTolerance,
        capacitanceTolerancePercent: capacitanceTolerance,
        pairMatchingThresholdPercent: pairThreshold,
        trapA: { inductanceMicrohenries: trapAInductance, capacitancePicofarads: trapACapacitance, measuredResonanceMHz: trapAResonance },
        trapB: { inductanceMicrohenries: trapBInductance, capacitancePicofarads: trapBCapacitance, measuredResonanceMHz: trapBResonance }
      });
    } catch {
      return null;
    }
  }, [capacitanceTolerance, inductanceTolerance, pairThreshold, targetCapacitance, targetInductance, targetResonance, trapACapacitance, trapAInductance, trapAResonance, trapBCapacitance, trapBInductance, trapBResonance]);

  const buildRecord = (updatedAt: string): TrapCommissioningRecord => ({
    schemaVersion: TRAP_RECORD_VERSION,
    id: activeRecordId,
    updatedAt,
    title: recordTitle,
    measuredAt,
    instrument,
    fixture,
    conditions,
    notes,
    modelId: TRAP_COMMISSIONING_MODEL.id,
    modelVersion: TRAP_COMMISSIONING_MODEL.version,
    input: {
      targetInductanceMicrohenries: targetInductance,
      targetCapacitancePicofarads: targetCapacitance,
      targetResonanceMHz: targetResonance,
      inductanceTolerancePercent: inductanceTolerance,
      capacitanceTolerancePercent: capacitanceTolerance,
      pairMatchingThresholdPercent: pairThreshold,
      trapA: { inductanceMicrohenries: trapAInductance, capacitancePicofarads: trapACapacitance, measuredResonanceMHz: trapAResonance },
      trapB: { inductanceMicrohenries: trapBInductance, capacitancePicofarads: trapBCapacitance, measuredResonanceMHz: trapBResonance }
    }
  });
  const applyRecord = (record: TrapCommissioningRecord, message: string) => {
    setActiveRecordId(record.id);
    setRecordTitle(record.title);
    setMeasuredAt(record.measuredAt);
    setInstrument(record.instrument);
    setFixture(record.fixture);
    setConditions(record.conditions);
    setNotes(record.notes);
    setTargetInductance(record.input.targetInductanceMicrohenries);
    setTargetCapacitance(record.input.targetCapacitancePicofarads);
    setTargetResonance(record.input.targetResonanceMHz);
    setInductanceTolerance(record.input.inductanceTolerancePercent);
    setCapacitanceTolerance(record.input.capacitanceTolerancePercent);
    setPairThreshold(record.input.pairMatchingThresholdPercent);
    setTrapAInductance(record.input.trapA.inductanceMicrohenries);
    setTrapACapacitance(record.input.trapA.capacitancePicofarads);
    setTrapAResonance(record.input.trapA.measuredResonanceMHz);
    setTrapBInductance(record.input.trapB.inductanceMicrohenries);
    setTrapBCapacitance(record.input.trapB.capacitancePicofarads);
    setTrapBResonance(record.input.trapB.measuredResonanceMHz);
    setRecordMessage(message);
  };
  const startNewRecord = () => {
    const roundedInductance = Number(targetInductanceMicrohenries.toFixed(3));
    const roundedCapacitance = Number(targetCapacitancePicofarads.toFixed(2));
    const roundedResonance = Number(targetResonanceMHz.toFixed(3));
    setActiveRecordId(crypto.randomUUID());
    setRecordTitle(`Trap pair · ${targetResonanceMHz.toFixed(3)} MHz`);
    setMeasuredAt(new Date().toISOString().slice(0, 10));
    setInstrument(''); setFixture(''); setConditions(''); setNotes('');
    setTargetInductance(targetInductanceMicrohenries); setTargetCapacitance(targetCapacitancePicofarads); setTargetResonance(targetResonanceMHz);
    setInductanceTolerance(5); setCapacitanceTolerance(5); setPairThreshold(2);
    setTrapAInductance(roundedInductance); setTrapBInductance(roundedInductance);
    setTrapACapacitance(roundedCapacitance); setTrapBCapacitance(roundedCapacitance);
    setTrapAResonance(roundedResonance); setTrapBResonance(roundedResonance);
    setRecordMessage('New unsaved measurement record');
  };
  const saveRecord = () => {
    try {
      const record = buildRecord(new Date().toISOString());
      setRecords(saveTrapCommissioningRecord(record, window.localStorage));
      setRecordMessage('Measurement record saved on this device');
    } catch {
      setRecordMessage('The record could not be saved. Check the measurement fields and download or print a copy.');
    }
  };
  const selectRecord = (id: string) => {
    const selected = records.find((record) => record.id === id);
    if (selected) applyRecord(selected, 'Saved measurement record opened');
  };
  const removeRecord = () => {
    if (!records.some((record) => record.id === activeRecordId)) { startNewRecord(); return; }
    if (!window.confirm('Delete this saved trap commissioning record from this browser?')) return;
    setRecords(deleteTrapCommissioningRecord(activeRecordId, window.localStorage));
    startNewRecord();
    setRecordMessage('Saved measurement record deleted from this device');
  };
  const downloadRecord = () => {
    try {
      const record = buildRecord(new Date().toISOString());
      const url = URL.createObjectURL(new Blob([serializeTrapCommissioningRecord(record)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = trapCommissioningRecordFilename(record.title);
      anchor.click();
      URL.revokeObjectURL(url);
      setRecordMessage('JSON measurement record downloaded');
    } catch {
      setRecordMessage('The record could not be downloaded. Check the measurement fields.');
    }
  };
  const importRecord = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parseTrapCommissioningRecord(await file.text(), crypto.randomUUID(), new Date().toISOString());
      const savedRecords = saveTrapCommissioningRecord(imported, window.localStorage);
      setRecords(savedRecords);
      applyRecord(imported, 'JSON record imported as a new local copy');
    } catch (error) {
      setRecordMessage(error instanceof Error ? error.message : 'The selected record could not be imported.');
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };

  return <section className="trap-commissioning-panel" aria-labelledby={headingId}>
    <div className="trap-commissioning-heading"><div><p className="eyebrow">As-built measurement record</p><h3 id={headingId}>Commission and match the trap pair</h3></div><dl><div><dt>Target L</dt><dd>{targetInductance.toFixed(2)} µH</dd></div><div><dt>Target C</dt><dd>{targetCapacitance.toFixed(1)} pF</dd></div><div><dt>Target resonance</dt><dd>{targetResonance.toFixed(3)} MHz</dd></div></dl></div>
    <StepByStepHelp title="Measure and commission two traps" intro="Use the worksheet only after both traps are fully assembled with their final leads, enclosure, and mounting arrangement." steps={[
      { title: 'Calibrate at the fixture plane', detail: 'Calibrate or compensate the LCR, impedance, or network-analyser fixture according to its instructions before attaching either trap.' },
      { title: 'Measure completed Trap A', detail: 'Record inductance and capacitance using documented test frequency and fixture conditions, then measure the assembled parallel resonance directly.' },
      { title: 'Repeat without changing the setup', detail: 'Measure Trap B with the same leads, fixture, instrument settings, environment, and connection geometry so the comparison remains meaningful.' },
      { title: 'Compare target deviation separately', detail: 'Use the selected L and C windows to see how each component compares with its design target; these windows do not establish antenna performance.' },
      { title: 'Sort the pair by measured values', detail: 'Use the separate pair threshold to identify how closely the two traps agree. Adjust or rebuild as needed, then repeat every measurement.' },
      { title: 'Install and verify at low power', detail: 'Tune the complete antenna on both bands, then verify trap temperature, voltage clearance, stability, common-mode current, and match at intended power and duty cycle.' }
    ]} limit="This worksheet records nominal and measured values. It does not establish measurement uncertainty, trap Q, bandwidth, loss, voltage or current rating, heating, weather resistance, antenna efficiency, or safe operating power." />

    <section className="trap-record-workspace" aria-labelledby="trap-record-heading">
      <div className="trap-record-heading"><div><p className="eyebrow">Portable build record</p><h4 id="trap-record-heading">Identify, save, and export this measurement set</h4></div><span className="model-badge">Local record v{TRAP_RECORD_VERSION}</span></div>
      <div className="trap-record-privacy" role="note"><strong>Records stay in this browser unless you print or download them.</strong><span>Browser storage can be cleared or lost. Keep a separate copy with the physical trap pair.</span></div>
      <div className="trap-record-library">
        <label className="field"><span>Saved trap records on this device</span><select aria-label="Saved trap commissioning records" value={records.some((record) => record.id === activeRecordId) ? activeRecordId : ''} onChange={(event) => selectRecord(event.target.value)}><option value="">Unsaved record</option>{records.map((record) => <option key={record.id} value={record.id}>{record.title || 'Untitled trap pair'} · {new Date(record.updatedAt).toLocaleDateString()}</option>)}</select></label>
        <div className="trap-record-actions"><button type="button" onClick={startNewRecord}>New record</button><button type="button" onClick={saveRecord}>Save record</button><button type="button" onClick={downloadRecord}>Download JSON</button><label className="trap-record-import"><span>Import JSON</span><input ref={importInput} type="file" accept=".json,application/json" aria-label="Import trap commissioning record JSON" onChange={(event) => void importRecord(event.target.files?.[0])} /></label><button type="button" onClick={() => window.print()}>Print worksheet</button><button type="button" className="danger-button" onClick={removeRecord}>Delete saved record</button></div>
        <p role="status" aria-live="polite">{recordMessage}</p>
      </div>
      <fieldset className="trap-record-details"><legend>Record details</legend>
        <label className="field trap-record-wide"><span>Build or pair label</span><input value={recordTitle} onChange={(event) => { setRecordTitle(event.target.value); setRecordMessage('Unsaved changes'); }} /></label>
        <label className="field"><span>Measurement date</span><input aria-label="Trap measurement date" type="date" value={measuredAt} onChange={(event) => { setMeasuredAt(event.target.value); setRecordMessage('Unsaved changes'); }} /></label>
        <label className="field"><span>Instrument and calibration</span><input value={instrument} onChange={(event) => { setInstrument(event.target.value); setRecordMessage('Unsaved changes'); }} placeholder="Instrument, serial, calibration or compensation" /></label>
        <label className="field"><span>Fixture and lead arrangement</span><textarea rows={3} value={fixture} onChange={(event) => { setFixture(event.target.value); setRecordMessage('Unsaved changes'); }} placeholder="Fixture plane, lead length, enclosure and connection geometry" /></label>
        <label className="field"><span>Measurement conditions</span><textarea rows={3} value={conditions} onChange={(event) => { setConditions(event.target.value); setRecordMessage('Unsaved changes'); }} placeholder="Temperature, environment and test frequencies" /></label>
        <label className="field trap-record-wide"><span>Construction and follow-up notes</span><textarea rows={3} value={notes} onChange={(event) => { setNotes(event.target.value); setRecordMessage('Unsaved changes'); }} placeholder="Component details, adjustments, retest actions and installed verification" /></label>
      </fieldset>
      <section className="trap-record-print-details" aria-label="Trap record details for printing"><h4>{recordTitle || 'Untitled trap pair'}</h4><dl><div><dt>Measurement date</dt><dd>{measuredAt || 'Not recorded'}</dd></div><div><dt>Instrument and calibration</dt><dd>{instrument || 'Not recorded'}</dd></div><div><dt>Fixture and lead arrangement</dt><dd>{fixture || 'Not recorded'}</dd></div><div><dt>Measurement conditions</dt><dd>{conditions || 'Not recorded'}</dd></div><div className="trap-record-wide"><dt>Construction and follow-up notes</dt><dd>{notes || 'Not recorded'}</dd></div></dl></section>
    </section>

    <div className="trap-measurement-grid">
      <fieldset><legend>Trap A measurements</legend>
        <MeasurementField label="Trap A measured inductance" value={trapAInductance} unit="µH" min={0.001} max={1_000_000} step={0.001} help="Record the completed coil under documented fixture and test-frequency conditions." onChange={(value) => { setTrapAInductance(value); setRecordMessage('Unsaved changes'); }} />
        <MeasurementField label="Trap A measured capacitance" value={trapACapacitance} unit="pF" min={0.001} max={1_000_000_000} step={0.01} help="Record the installed capacitor or measured completed-network value and method." onChange={(value) => { setTrapACapacitance(value); setRecordMessage('Unsaved changes'); }} />
        <MeasurementField label="Trap A measured resonance" value={trapAResonance} unit="MHz" min={0.001} max={300_000} step={0.001} help="Measure the assembled parallel resonance directly with its final leads and enclosure." onChange={(value) => { setTrapAResonance(value); setRecordMessage('Unsaved changes'); }} />
      </fieldset>
      <fieldset><legend>Trap B measurements</legend>
        <MeasurementField label="Trap B measured inductance" value={trapBInductance} unit="µH" min={0.001} max={1_000_000} step={0.001} help="Use the same instrument, fixture, frequency, lead geometry, and calibration as Trap A." onChange={(value) => { setTrapBInductance(value); setRecordMessage('Unsaved changes'); }} />
        <MeasurementField label="Trap B measured capacitance" value={trapBCapacitance} unit="pF" min={0.001} max={1_000_000_000} step={0.01} help="Use the same measurement definition and completed-network state as Trap A." onChange={(value) => { setTrapBCapacitance(value); setRecordMessage('Unsaved changes'); }} />
        <MeasurementField label="Trap B measured resonance" value={trapBResonance} unit="MHz" min={0.001} max={300_000} step={0.001} help="Measure the assembled parallel resonance directly without changing the fixture setup." onChange={(value) => { setTrapBResonance(value); setRecordMessage('Unsaved changes'); }} />
      </fieldset>
    </div>

    <fieldset className="trap-thresholds"><legend>Comparison windows</legend>
      <MeasurementField label="Inductance target tolerance" value={inductanceTolerance} unit="%" min={0} max={50} step={0.1} help="A user-selected target window for recording and sorting, not a performance specification." onChange={(value) => { setInductanceTolerance(value); setRecordMessage('Unsaved changes'); }} />
      <MeasurementField label="Capacitance target tolerance" value={capacitanceTolerance} unit="%" min={0} max={50} step={0.1} help="A user-selected target window; use the actual capacitor data and measurement method." onChange={(value) => { setCapacitanceTolerance(value); setRecordMessage('Unsaved changes'); }} />
      <div className="field"><span className="field-label-with-help"><label htmlFor="trap-pair-threshold">Pair-matching threshold</label><HelpTip label="Pair-matching threshold">This compares Trap A with Trap B using difference divided by their average. It is a workbench sorting threshold only and does not predict antenna balance, loss, heating, voltage, current, or safe power.</HelpTip></span><span className="input-with-unit"><input id="trap-pair-threshold" aria-label="Pair-matching threshold" type="number" min="0.01" max="100" step="0.1" value={pairThreshold} onChange={(event) => { setPairThreshold(Number(event.target.value)); setRecordMessage('Unsaved changes'); }} /><span>%</span></span><small>Applied separately to L, C, calculated resonance, and measured resonance.</small></div>
    </fieldset>

    {!result ? <p className="validation-message" role="alert">Enter positive measured values and comparison thresholds within the displayed limits.</p> : <>
      <div className="trap-commissioning-results">
        <div className="trap-result-table-wrap"><table><caption>Target and measured trap comparison</caption><thead><tr><th scope="col">Quantity</th><th scope="col">Trap A</th><th scope="col">Trap B</th><th scope="col">Pair spread</th></tr></thead><tbody>
          <tr><th scope="row">Inductance</th><td data-label="Trap A">{result.trapA.inductanceMicrohenries.toFixed(3)} µH <small>{signedPercent(result.trapA.inductanceDeviationPercent)} target</small></td><td data-label="Trap B">{result.trapB.inductanceMicrohenries.toFixed(3)} µH <small>{signedPercent(result.trapB.inductanceDeviationPercent)} target</small></td><td data-label="Pair spread">{result.inductancePairSpreadPercent.toFixed(2)}% <ThresholdState within={result.inductancePairWithinThreshold} /></td></tr>
          <tr><th scope="row">Capacitance</th><td data-label="Trap A">{result.trapA.capacitancePicofarads.toFixed(2)} pF <small>{signedPercent(result.trapA.capacitanceDeviationPercent)} target</small></td><td data-label="Trap B">{result.trapB.capacitancePicofarads.toFixed(2)} pF <small>{signedPercent(result.trapB.capacitanceDeviationPercent)} target</small></td><td data-label="Pair spread">{result.capacitancePairSpreadPercent.toFixed(2)}% <ThresholdState within={result.capacitancePairWithinThreshold} /></td></tr>
          <tr><th scope="row">LC-calculated resonance</th><td data-label="Trap A">{result.trapA.calculatedResonanceMHz.toFixed(3)} MHz <small>{signedPercent(result.trapA.calculatedResonanceDeviationPercent)} target</small></td><td data-label="Trap B">{result.trapB.calculatedResonanceMHz.toFixed(3)} MHz <small>{signedPercent(result.trapB.calculatedResonanceDeviationPercent)} target</small></td><td data-label="Pair spread">{result.calculatedResonancePairSpreadPercent.toFixed(2)}% <ThresholdState within={result.calculatedResonancePairWithinThreshold} /></td></tr>
          <tr><th scope="row">Instrument-measured resonance</th><td data-label="Trap A">{result.trapA.measuredResonanceMHz.toFixed(3)} MHz <small>{signedPercent(result.trapA.measuredResonanceDeviationPercent)} target</small></td><td data-label="Trap B">{result.trapB.measuredResonanceMHz.toFixed(3)} MHz <small>{signedPercent(result.trapB.measuredResonanceDeviationPercent)} target</small></td><td data-label="Pair spread">{result.measuredResonancePairSpreadPercent.toFixed(2)}% <ThresholdState within={result.measuredResonancePairWithinThreshold} /></td></tr>
        </tbody></table></div>
        <aside><p className="eyebrow">Ideal tolerance envelope</p><strong>{result.idealToleranceResonanceMinimumMHz.toFixed(3)}–{result.idealToleranceResonanceMaximumMHz.toFixed(3)} MHz</strong><p>Mathematical resonance range from the selected target L and C windows only. It excludes correlation, measurement uncertainty, leads, enclosure, coil self-capacitance, and loss.</p></aside>
      </div>
      <ResonanceComparison targetMHz={targetResonance} trapAMHz={result.trapA.measuredResonanceMHz} trapBMHz={result.trapB.measuredResonanceMHz} />
    </>}
    <article className="caution-card"><p className="eyebrow">Interpretation boundary</p><h4>Matched readings do not establish a safe trap</h4><p>Agreement between two traps improves construction consistency, but it does not demonstrate adequate Q, insulation, capacitor RF-current capability, voltage clearance, thermal stability, enclosure safety, weather resistance, or antenna-system performance. Preserve the instrument, calibration, fixture, frequency, temperature, and lead arrangement with the record, then verify the installed antenna at progressively higher power.</p></article>
    <footer className="trap-commissioning-source"><span>Model {TRAP_COMMISSIONING_MODEL.version} · {TRAP_COMMISSIONING_MODEL.id}</span>{TRAP_COMMISSIONING_MODEL.sources.map((source) => <a key={source.url} href={source.url} target="_blank" rel="noreferrer">{source.title}</a>)}</footer>
  </section>;
}
