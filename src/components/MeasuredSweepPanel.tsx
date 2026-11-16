/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { formatFrequencyRange, getBandsForJurisdiction, type AmateurBand } from '../bands/catalog';
import { estimateTouchstoneThresholdWindows, nearestTouchstonePoint, nearestTouchstonePointIndex, parseTouchstoneS1p, summarizeTouchstoneRanges, summarizeTouchstoneSweep, type TouchstonePoint, type TouchstoneSweep, type TouchstoneSweepSummary, type TouchstoneThresholdWindow } from '../lib/touchstone';
import { serializeTouchstoneComparisonCsv, touchstoneReportFilename } from '../lib/touchstoneReport';
import { downloadBlob } from '../lib/download';
import type { JurisdictionCode } from '../regulations/catalog';
import { StepByStepHelp } from './ContextHelp';
import { SweepSmithChart } from './SweepSmithChart';
import type { MeasurementSweepHandoff } from '../workflows/measurementWorkflow';
import type { AntennaPlanMeasurementAnalysis } from '../projects/antennaPlans';
import { capturePrintPreview, PrintPreviewDialog, type PrintPreviewContent } from './PrintPreviewDialog';

interface Props {
  jurisdiction: JurisdictionCode;
  incomingSweep: MeasurementSweepHandoff | null;
  onIncomingSweepConsumed: () => void;
  onSavePlanAnalysis: (planId: string, measurementId: string, analysis: AntennaPlanMeasurementAnalysis) => void;
}

const CHART = { width: 920, height: 360, left: 72, right: 24, top: 28, bottom: 58 };

export default function MeasuredSweepPanel({ jurisdiction, incomingSweep, onIncomingSweepConsumed, onSavePlanAnalysis }: Props) {
  const [sweep, setSweep] = useState<TouchstoneSweep | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [inspectionFrequencyText, setInspectionFrequencyText] = useState('');
  const [reviewBandId, setReviewBandId] = useState('');
  const [swrThresholdText, setSwrThresholdText] = useState('2');
  const [comparison, setComparison] = useState<TouchstoneSweep | null>(null);
  const [comparisonFileName, setComparisonFileName] = useState('');
  const [comparisonError, setComparisonError] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [calibrationContext, setCalibrationContext] = useState('');
  const [referenceState, setReferenceState] = useState('Reference');
  const [comparisonState, setComparisonState] = useState('Comparison');
  const [downloadMessage, setDownloadMessage] = useState('');
  const [linkedContext, setLinkedContext] = useState<MeasurementSweepHandoff | null>(incomingSweep);
  const [planSaveMessage, setPlanSaveMessage] = useState('');
  const [printPreview, setPrintPreview] = useState<PrintPreviewContent | null>(null);

  useEffect(() => {
    if (!incomingSweep) return;
    setLinkedContext(incomingSweep);
    let cancelled = false;
    const openIncomingSweep = async () => {
      setError('');
      try {
        const parsed = await readSweepFile(incomingSweep.file);
        if (cancelled) return;
        const bestIndex = parsed.points.reduce((best, point, index) => point.swr < parsed.points[best].swr ? index : best, 0);
        setSweep(parsed);
        setFileName(incomingSweep.file.name);
        setSelectedIndex(bestIndex);
        setInspectionFrequencyText(formatFrequencyInput(parsed.points[bestIndex].frequencyHz));
        setReportTitle(`${incomingSweep.planName} — ${incomingSweep.measurementLabel}`);
        setReferenceState(incomingSweep.measurementLabel);
        setCalibrationContext([
          incomingSweep.calibrationContext && `Calibration: ${incomingSweep.calibrationContext}`,
          incomingSweep.referencePlane && `Reference plane: ${incomingSweep.referencePlane}`,
          incomingSweep.installedGeometry && `Installed geometry: ${incomingSweep.installedGeometry}`,
          incomingSweep.adjustment && `Adjustment: ${incomingSweep.adjustment}`,
          incomingSweep.observations && `Recorded observations: ${incomingSweep.observations}`
        ].filter(Boolean).join('\n'));
      } catch (reason) {
        if (!cancelled) setError(reason instanceof Error ? reason.message : 'The linked sweep could not be read.');
      } finally {
        if (!cancelled) onIncomingSweepConsumed();
      }
    };
    void openIncomingSweep();
    return () => { cancelled = true; };
  }, [incomingSweep, onIncomingSweepConsumed]);

  const analysis = useMemo(() => sweep ? summarizeTouchstoneSweep(sweep) : null, [sweep]);
  const comparisonAnalysis = useMemo(() => comparison ? summarizeTouchstoneSweep(comparison) : null, [comparison]);
  const parsedSwrThreshold = Number(swrThresholdText);
  const swrThreshold = Number.isFinite(parsedSwrThreshold) && parsedSwrThreshold > 1 && parsedSwrThreshold <= 10 ? parsedSwrThreshold : null;
  const thresholdWindows = useMemo(() => sweep && swrThreshold ? estimateTouchstoneThresholdWindows(sweep, swrThreshold) : [], [sweep, swrThreshold]);
  const comparisonThresholdWindows = useMemo(() => comparison && swrThreshold ? estimateTouchstoneThresholdWindows(comparison, swrThreshold) : [], [comparison, swrThreshold]);
  const selected = sweep?.points[Math.min(selectedIndex, sweep.points.length - 1)] ?? null;
  const selectedComparison = selected && comparison ? nearestTouchstonePoint(comparison.points, selected.frequencyHz) : null;
  const bands = useMemo(() => {
    if (!sweep) return [];
    const lowerMHz = Math.min(sweep.points[0].frequencyHz, comparison?.points[0].frequencyHz ?? Number.POSITIVE_INFINITY) / 1e6;
    const upperMHz = Math.max(sweep.points.at(-1)!.frequencyHz, comparison?.points.at(-1)?.frequencyHz ?? 0) / 1e6;
    return getBandsForJurisdiction(jurisdiction).filter((band) => band.upperMHz >= lowerMHz && band.lowerMHz <= upperMHz);
  }, [comparison, jurisdiction, sweep]);
  const reviewBand = bands.find((band) => band.id === reviewBandId) ?? bands[0] ?? null;

  async function loadFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.currentTarget;
    setError('');
    try {
      const parsed = await readSweepFile(file);
      const bestIndex = parsed.points.reduce((best, point, index) => point.swr < parsed.points[best].swr ? index : best, 0);
      setSweep(parsed);
      setFileName(file.name);
      setSelectedIndex(bestIndex);
      setInspectionFrequencyText(formatFrequencyInput(parsed.points[bestIndex].frequencyHz));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'The file could not be read.');
    } finally {
      input.value = '';
    }
  }

  async function loadComparison(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const input = event.currentTarget;
    setComparisonError('');
    try {
      setComparison(await readSweepFile(file));
      setComparisonFileName(file.name);
    } catch (reason) {
      setComparisonError(reason instanceof Error ? reason.message : 'The comparison file could not be read.');
    } finally {
      input.value = '';
    }
  }

  function downloadCsv() {
    if (!sweep) return;
    const context = { title: reportTitle, calibrationContext, referenceState, comparisonState };
    const csv = serializeTouchstoneComparisonCsv(context, { fileName, sweep }, comparison ? { fileName: comparisonFileName, sweep: comparison } : null);
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), touchstoneReportFilename(reportTitle || fileName.replace(/\.s1p$/i, '')));
    setDownloadMessage(`Downloaded ${sweep.points.length.toLocaleString()} reference ${sweep.points.length === 1 ? 'point' : 'points'}${comparison ? ' with nearest comparison samples' : ''} as CSV.`);
  }

  function printReport() {
    setPrintPreview(capturePrintPreview(reportTitle || fileName || 'Measured sweep', 'sweep-report-print', ['.sweep-print-report']));
  }

  function saveAnalysisToPlan() {
    if (!linkedContext || !sweep || !analysis || !swrThreshold) return;
    const finiteOrNull = (value: number) => Number.isFinite(value) ? value : null;
    const summary: AntennaPlanMeasurementAnalysis = {
      analyzedAt: new Date().toISOString(),
      pointCount: sweep.points.length,
      referenceImpedanceOhms: sweep.referenceImpedanceOhms,
      lowerFrequencyHz: sweep.points[0].frequencyHz,
      upperFrequencyHz: sweep.points.at(-1)!.frequencyHz,
      minimumSwr: finiteOrNull(analysis.best.swr),
      minimumSwrFrequencyHz: analysis.best.frequencyHz,
      resonanceFrequencyHz: analysis.resonant.frequencyHz,
      resonanceResistanceOhms: finiteOrNull(analysis.resonant.resistanceOhms),
      resonanceReactanceOhms: finiteOrNull(analysis.resonant.reactanceOhms),
      threshold: swrThreshold,
      thresholdWindowCount: thresholdWindows.length,
      thresholdSpans: thresholdWindows.slice(0, 24).map((window) => ({
        lowerFrequencyHz: window.lower.frequencyHz,
        upperFrequencyHz: window.upper.frequencyHz,
        lowerBasis: window.lower.basis,
        upperBasis: window.upper.basis
      }))
    };
    try {
      onSavePlanAnalysis(linkedContext.planId, linkedContext.measurementId, summary);
      setPlanSaveMessage(`Saved this ${formatThreshold(swrThreshold)}:1 analysis summary to “${linkedContext.measurementLabel}”. The sweep file remains outside the plan.`);
    } catch (reason) {
      setPlanSaveMessage(reason instanceof Error ? reason.message : 'The analysis summary could not be saved to the antenna plan.');
    }
  }

  function inspectIndex(index: number) {
    if (!sweep) return;
    setSelectedIndex(index);
    setInspectionFrequencyText(formatFrequencyInput(sweep.points[index].frequencyHz));
  }

  function inspectFrequency(frequencyMHz: number) {
    if (!sweep || !Number.isFinite(frequencyMHz) || frequencyMHz <= 0) return;
    setInspectionFrequencyText(String(frequencyMHz));
    setSelectedIndex(nearestTouchstonePointIndex(sweep.points, frequencyMHz * 1e6));
  }

  const requestedInspectionHz = Number(inspectionFrequencyText) * 1e6;
  const inspectionOffsetHz = Number.isFinite(requestedInspectionHz) && requestedInspectionHz > 0 ? selected?.frequencyHz ? selected.frequencyHz - requestedInspectionHz : 0 : null;

  return <div className="measured-sweep-workbench">
    {linkedContext && <section className="linked-workflow linked-measurement" aria-labelledby="linked-measurement-heading"><div><p className="eyebrow">Linked antenna plan</p><h3 id="linked-measurement-heading">{linkedContext.planName}</h3><p>{linkedContext.measurementLabel} · the selected file is open only for this in-memory analysis session.</p></div><dl><div><dt>File</dt><dd>{linkedContext.file.name}</dd></div><div><dt>History</dt><dd>Entry saved; sweep contents not stored</dd></div></dl></section>}
    <StepByStepHelp title="Measure, import, and interpret a sweep" intro="Use the same reference plane and installation state throughout. The file stays in this browser and is not uploaded." steps={[
      { title: 'Calibrate at the intended reference plane', detail: 'Perform open, short, and load calibration at the cable end or fixture plane where the result must apply.' },
      { title: 'Sweep beyond the intended band', detail: 'Include enough frequency on both sides to show the full response rather than only the most favourable point.' },
      { title: 'Save one-port S-parameter data', detail: 'Export a Touchstone 1.x .s1p file containing S11 in RI, magnitude-angle, or dB-angle form.' },
      { title: 'Inspect the minimum and the usable span', detail: 'A low point is not enough by itself. Review bandwidth, resistance, reactance, and movement across the intended allocation.' },
      { title: 'Change one physical variable at a time', detail: 'Record the installed state, make a small adjustment, recalibrate when the reference plane changes, and compare a new sweep.' }
    ]} limit="Imported values describe the analyser data at its calibration plane. This view does not remove fixtures or feedline effects, correct calibration error, estimate uncertainty, prove radiation efficiency, diagnose common-mode current, or establish safe power or regulatory compliance." />

    <section className="sweep-import-card" aria-labelledby="sweep-import-heading">
      <div><p className="eyebrow">Local measurement</p><h3 id="sweep-import-heading">Open a one-port Touchstone sweep</h3><p>Supported: Touchstone 1.x `.s1p`, S11, RI / MA / DB, up to 10,000 points and 2 MB. The selected file is processed only on this device.</p></div>
      <label className="sweep-file-button"><span>{fileName || 'Choose .s1p file'}</span><input type="file" accept=".s1p" onChange={loadFile} /></label>
    </section>
    {error && <p className="form-error sweep-error" role="alert">{error}</p>}

    {!sweep && !error && <div className="diagram-placeholder sweep-placeholder"><strong>No sweep loaded</strong><span>Export S11 from a calibrated analyser, then choose the `.s1p` file above.</span></div>}
    {sweep && analysis && selected && <>
      <section className="sweep-comparison-import" aria-labelledby="sweep-comparison-heading">
        <div><p className="eyebrow">Optional comparison</p><h3 id="sweep-comparison-heading">Compare one physical change</h3><p>Use the same calibration plane, sweep range, point spacing, and installation conditions where practical. Different frequency grids are aligned to the nearest measured point.</p></div>
        <div className="sweep-comparison-actions"><label className="sweep-file-button sweep-file-button-secondary"><span>{comparisonFileName || 'Add comparison .s1p'}</span><input aria-label="Choose comparison .s1p file" type="file" accept=".s1p" onChange={loadComparison} /></label>{comparison && <button type="button" onClick={() => { setComparison(null); setComparisonFileName(''); setComparisonError(''); }}>Remove comparison</button>}</div>
      </section>
      {comparisonError && <p className="form-error sweep-error" role="alert">{comparisonError}</p>}
      <details className="sweep-report-tools">
        <summary><span><strong>Document and export this measurement</strong><small>Add reference-plane context, download the complete point grid, or print a concise handoff.</small></span></summary>
        <div className="sweep-report-fields">
          <label><span>Measurement title</span><input value={reportTitle} maxLength={120} placeholder="Example: 20 m dipole final tuning" onChange={(event) => setReportTitle(event.target.value)} /></label>
          <label><span>Reference state</span><input value={referenceState} maxLength={80} placeholder="Example: Before trim" onChange={(event) => setReferenceState(event.target.value)} /></label>
          <label><span>Comparison state</span><input value={comparisonState} maxLength={80} placeholder="Example: After trim" disabled={!comparison} onChange={(event) => setComparisonState(event.target.value)} /></label>
          <label className="sweep-report-context"><span>Calibration, reference plane, instrument, and conditions</span><textarea value={calibrationContext} maxLength={1200} rows={3} placeholder="Record where calibration was established and the setup details needed to reproduce the sweep." onChange={(event) => setCalibrationContext(event.target.value)} /></label>
        </div>
        <div className="sweep-report-actions"><button type="button" onClick={downloadCsv}>Download point CSV</button><button type="button" onClick={printReport}>Print measurement summary</button>{linkedContext && <button type="button" className="secondary-button" onClick={saveAnalysisToPlan}>Save summary to antenna plan</button>}</div>
        {downloadMessage && <p className="workflow-message" role="status">{downloadMessage}</p>}
        {planSaveMessage && <p className="workflow-message" role="status">{planSaveMessage}</p>}
        <p className="sweep-report-limit">The CSV aligns each reference frequency with the nearest measured comparison point and includes the frequency offset. Neither export identifies why the response changed.</p>
      </details>
      <div className="sweep-summary-grid" aria-label="Sweep summary">
        <SweepMetric label="Lowest SWR" value={`${formatRatio(analysis.best.swr)} : 1`} detail={`at ${formatMHz(analysis.best.frequencyHz)}`} />
        <SweepMetric label="2:1 span around minimum" value={analysis.twoToOne ? `${formatMHz(analysis.twoToOne.lower.frequencyHz)}–${formatMHz(analysis.twoToOne.upper.frequencyHz)}` : 'No points at or below 2:1'} detail={analysis.twoToOne ? formatBandwidth(analysis.twoToOne.upper.frequencyHz - analysis.twoToOne.lower.frequencyHz) : 'Review the calibration plane and antenna system.'} />
        <SweepMetric label="Closest to resonance" value={formatMHz(analysis.resonant.frequencyHz)} detail={`${formatImpedance(analysis.resonant)} · smallest |X| in file`} />
        <SweepMetric label="Sweep coverage" value={`${formatMHz(sweep.points[0].frequencyHz)}–${formatMHz(sweep.points.at(-1)!.frequencyHz)}`} detail={`${sweep.points.length.toLocaleString()} points · ${sweep.referenceImpedanceOhms} Ω reference`} />
      </div>

      {comparison && comparisonAnalysis && selectedComparison && <SweepComparisonTable reference={sweep} referenceName={fileName} referenceAnalysis={analysis} comparison={comparison} comparisonName={comparisonFileName} comparisonAnalysis={comparisonAnalysis} selected={selected} comparisonSelected={selectedComparison} />}

      <section className="sweep-chart-card" aria-labelledby="sweep-chart-heading">
        <div className="sweep-chart-heading"><div><p className="eyebrow">Frequency response</p><h3 id="sweep-chart-heading">SWR across the measured sweep</h3></div><p>{swrThreshold ? `Coral dash: ${formatThreshold(swrThreshold)}:1 analysis threshold.` : 'Enter a threshold from 1.01:1 to 10:1 to show the coral guide.'} Shading: amateur allocations. {comparison ? 'Dashed blue: comparison sweep.' : ''}</p></div>
        <SweepChart sweep={sweep} comparison={comparison} selectedIndex={selectedIndex} bands={bands} threshold={swrThreshold} />
        <div className="sweep-inspection-tools">
          <label className="sweep-frequency-entry"><span>Inspect frequency</span><span className="input-with-unit"><input aria-label="Inspect measured frequency" type="number" inputMode="decimal" min={sweep.points[0].frequencyHz / 1e6} max={sweep.points.at(-1)!.frequencyHz / 1e6} step="any" value={inspectionFrequencyText} onChange={(event) => { setInspectionFrequencyText(event.target.value); const frequencyMHz = Number(event.target.value); if (Number.isFinite(frequencyMHz) && frequencyMHz > 0) setSelectedIndex(nearestTouchstonePointIndex(sweep.points, frequencyMHz * 1e6)); }} /><span>MHz</span></span><small>Nearest measured sample: {formatMHz(selected.frequencyHz)}{inspectionOffsetHz !== null && inspectionOffsetHz !== 0 ? ` (${formatSignedFrequency(inspectionOffsetHz)} from request)` : ''}</small></label>
          <div className="sweep-inspection-shortcuts" aria-label="Inspection shortcuts"><span>Jump to</span><button type="button" onClick={() => inspectIndex(sweep.points.indexOf(analysis.best))}>Lowest SWR</button><button type="button" onClick={() => inspectIndex(sweep.points.indexOf(analysis.resonant))}>Closest resonance</button>{reviewBand && <button type="button" onClick={() => inspectFrequency(reviewBand.designMHz)}>{reviewBand.label} centre</button>}</div>
        </div>
        <label className="sweep-marker-control"><span>Scan measured points <strong>{selectedIndex + 1} of {sweep.points.length.toLocaleString()}</strong></span><input aria-label="Sweep inspection point" type="range" min={0} max={sweep.points.length - 1} value={selectedIndex} onChange={(event) => inspectIndex(Number(event.target.value))} /></label>
        <dl className="sweep-marker-values">
          <div><dt>SWR</dt><dd>{formatRatio(selected.swr)} : 1</dd></div>
          <div><dt>Return loss</dt><dd>{formatDecibels(selected.returnLossDb)}</dd></div>
          <div><dt>Impedance</dt><dd>{formatImpedance(selected)}</dd></div>
          <div><dt>Reflection magnitude</dt><dd>{selected.reflectionMagnitude.toFixed(4)}</dd></div>
        </dl>
        {selectedComparison && <p className="sweep-comparison-at-marker"><strong>Comparison near this frequency:</strong> {formatMHz(selectedComparison.frequencyHz)} · {formatRatio(selectedComparison.swr)} : 1 · {formatImpedance(selectedComparison)}. Difference from reference: {formatSigned(selectedComparison.swr - selected.swr, 3)} SWR.</p>}
        {bands.length > 0 && <p className="sweep-band-list"><strong>Allocations in view:</strong> {bands.map((band) => band.label).join(', ')}. Allocation shading is context, not operating authorization; verify licence class, mode, power, and local conditions.</p>}
      </section>

      <SweepThresholdReview thresholdText={swrThresholdText} threshold={swrThreshold} windows={thresholdWindows} comparisonWindows={comparison ? comparisonThresholdWindows : null} onThresholdChange={setSwrThresholdText} />

      {reviewBand && <SweepBandReview band={reviewBand} sweep={sweep} comparison={comparison} selectedBandId={reviewBand.id} bands={bands} onBandChange={setReviewBandId} onInspect={inspectFrequency} />}

      <section className="sweep-chart-card" aria-labelledby="sweep-smith-heading">
        <div className="sweep-chart-heading"><div><p className="eyebrow">Complex impedance path</p><h3 id="sweep-smith-heading">Smith-chart sweep trace</h3></div><p>Follow the trace to see whether resistance, reactance, or both move as frequency changes.</p></div>
        <SweepSmithChart reference={sweep} referenceName={fileName} comparison={comparison} comparisonName={comparisonFileName} selectedIndex={selectedIndex} />
      </section>

      <div className="explanation-grid sweep-explanation-grid">
        <article><p className="eyebrow">Read the curve</p><h3>Bandwidth matters with the minimum</h3><p>The lowest SWR is one sample. The contiguous 2:1 span around it shows how quickly mismatch changes, while the resistance and reactance at each point help distinguish a broad useful response from a narrow crossing.</p></article>
        <article><p className="eyebrow">Resonance and match</p><h3>Zero reactance is not automatically 50 Ω</h3><p>The point closest to X = 0 is the closest sampled series resonance. Its resistance may still differ greatly from the {sweep.referenceImpedanceOhms.toFixed(2)} Ω reference, so resonance and a low SWR need not occur at the same frequency.</p></article>
        <article className="caution-card"><p className="eyebrow">Measurement boundary</p><h3>The calibration plane defines the result</h3><p>Adapters, feedline, fixtures, nearby conductors, weather, installation height, and common-mode current can move the trace. Save the calibration and setup details with each file, and remeasure after final installation.</p></article>
        <article className="provenance-card"><p className="eyebrow">File interpretation</p><h3>Touchstone one-port S11</h3><p>The importer converts the complex reflection coefficient to impedance, SWR, and return loss using the file reference impedance. It does not modify the measured data or infer antenna efficiency.</p><ul><li><a href="https://www.ibis.org/touchstone_ver2.0/" target="_blank" rel="noreferrer">IBIS Touchstone specification</a></li></ul><small>Importer 1.0 · Touchstone 1.x subset</small></article>
      </div>
      <SweepPrintReport title={reportTitle} calibrationContext={calibrationContext} referenceState={referenceState} comparisonState={comparisonState} reference={sweep} referenceName={fileName} referenceAnalysis={analysis} selected={selected} comparison={comparison} comparisonName={comparisonFileName} comparisonAnalysis={comparisonAnalysis} comparisonSelected={selectedComparison} threshold={swrThreshold} thresholdWindows={thresholdWindows} comparisonThresholdWindows={comparisonThresholdWindows} />
    </>}
    {printPreview && <PrintPreviewDialog content={printPreview} onClose={() => setPrintPreview(null)} />}
  </div>;
}

function SweepMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
}

function SweepThresholdReview({ thresholdText, threshold, windows, comparisonWindows, onThresholdChange }: { thresholdText: string; threshold: number | null; windows: TouchstoneThresholdWindow[]; comparisonWindows: TouchstoneThresholdWindow[] | null; onThresholdChange: (value: string) => void }) {
  const widestFirst = [...windows].sort((first, second) => second.widthHz - first.widthHz);
  const displayed = [...(windows.length > 6 ? widestFirst.slice(0, 6) : windows)].sort((first, second) => first.lower.frequencyHz - second.lower.frequencyHz);
  const widest = widestFirst[0] ?? null;
  const comparisonWidest = comparisonWindows?.length ? [...comparisonWindows].sort((first, second) => second.widthHz - first.widthHz)[0] : null;
  return <section className="sweep-threshold-review" aria-labelledby="sweep-threshold-heading">
    <div className="sweep-threshold-heading"><div><p className="eyebrow">Response windows</p><h3 id="sweep-threshold-heading">Estimate crossings for a chosen SWR threshold</h3></div><div className="sweep-threshold-control"><label><span>SWR threshold</span><span className="input-with-unit"><input aria-label="SWR analysis threshold" type="number" inputMode="decimal" min="1.01" max="10" step="0.01" value={thresholdText} onChange={(event) => onThresholdChange(event.target.value)} /><span>: 1</span></span></label><div aria-label="Common SWR thresholds">{[1.5, 2, 3].map((value) => <button key={value} type="button" aria-pressed={threshold === value} onClick={() => onThresholdChange(String(value))}>{value}:1</button>)}</div></div></div>
    {!threshold && <p className="form-error" role="alert">Enter an SWR threshold greater than 1:1 and no more than 10:1.</p>}
    {threshold && <>
      <div className="sweep-threshold-summary"><article><span>Reference windows</span><strong>{windows.length.toLocaleString()}</strong><small>{windows.length ? `${windows.reduce((total, window) => total + window.measuredPointCount, 0).toLocaleString()} below-threshold samples in total` : `No measured samples at or below ${formatThreshold(threshold)}:1`}</small></article><article><span>Widest estimated window</span><strong>{widest ? formatBandwidth(widest.widthHz) : 'None'}</strong><small>{widest ? `${formatMHz(widest.lower.frequencyHz)}–${formatMHz(widest.upper.frequencyHz)}` : 'Raise the threshold or inspect the measured minimum.'}</small></article>{comparisonWindows && <article><span>Comparison windows</span><strong>{comparisonWindows.length.toLocaleString()}</strong><small>{comparisonWidest ? `Widest: ${formatBandwidth(comparisonWidest.widthHz)}` : `No samples at or below ${formatThreshold(threshold)}:1`}</small></article>}</div>
      {displayed.length > 0 && <><p className="sweep-threshold-scroll-hint">Swipe the table sideways to see the measured minimum and boundary basis.</p><div className="sweep-threshold-table-wrap" role="region" tabIndex={0} aria-label="Estimated SWR threshold windows"><table className="sweep-threshold-table"><thead><tr><th scope="col">Window</th><th scope="col">Estimated frequency range</th><th scope="col">Width</th><th scope="col">Measured minimum</th><th scope="col">Boundary basis</th></tr></thead><tbody>{displayed.map((window, index) => <tr key={`${window.lower.frequencyHz}-${window.upper.frequencyHz}`}><th scope="row">{index + 1}</th><td>{formatMHz(window.lower.frequencyHz)}–{formatMHz(window.upper.frequencyHz)}</td><td>{formatBandwidth(window.widthHz)}</td><td>{formatRatio(window.lowestSwr.swr)} : 1 at {formatMHz(window.lowestSwr.frequencyHz)}</td><td>{formatThresholdBoundary(window.lower)} / {formatThresholdBoundary(window.upper)}</td></tr>)}</tbody></table></div></>}
      {windows.length > displayed.length && <p className="sweep-threshold-more">Showing the six widest of {windows.length.toLocaleString()} separate windows; download the point CSV to inspect the complete sweep.</p>}
      <p className="sweep-threshold-limit">Interpolated crossings assume a straight SWR change only between adjacent finite samples. Sweep-edge and measured-sample bounds are not crossing estimates. The chosen ratio is an analysis aid, not an antenna, tuner, feedline, or transmitter acceptance limit.</p>
    </>}
  </section>;
}

function SweepBandReview({ band, sweep, comparison, selectedBandId, bands, onBandChange, onInspect }: { band: AmateurBand; sweep: TouchstoneSweep; comparison: TouchstoneSweep | null; selectedBandId: string; bands: AmateurBand[]; onBandChange: (id: string) => void; onInspect: (frequencyMHz: number) => void }) {
  const ranges = (band.segments ?? [{ lowerMHz: band.lowerMHz, upperMHz: band.upperMHz }]).map((range) => ({ lowerHz: range.lowerMHz * 1e6, upperHz: range.upperMHz * 1e6 }));
  const referenceReview = summarizeTouchstoneRanges(sweep, ranges);
  const comparisonReview = comparison ? summarizeTouchstoneRanges(comparison, ranges) : null;
  const exactAllocationRanges = band.continuous !== false || Boolean(band.segments);
  const spanLabel = referenceReview.sweepSpansEveryRange
    ? exactAllocationRanges ? 'Spans the full allocation' : 'Spans the listed frequency range'
    : exactAllocationRanges ? 'Covers only part of the allocation' : 'Covers part of the listed frequency range';
  return <section className="sweep-band-review" aria-labelledby="sweep-band-review-heading">
    <div className="sweep-band-review-heading"><div><p className="eyebrow">Allocation context</p><h3 id="sweep-band-review-heading">Review the measured response within a band</h3></div><label><span>Band in this sweep</span><select aria-label="Band to review" value={selectedBandId} onChange={(event) => onBandChange(event.target.value)}>{bands.map((candidate) => <option key={candidate.id} value={candidate.id}>{candidate.label} · {formatFrequencyRange(candidate)}</option>)}</select></label></div>
    <div className="sweep-band-review-grid">
      <article><span>Sweep extent</span><strong>{spanLabel}</strong><small>{referenceReview.points.length.toLocaleString()} measured {referenceReview.points.length === 1 ? 'sample' : 'samples'} inside the listed {exactAllocationRanges ? `allocation${band.segments ? ' segments' : ''}` : 'frequency envelope'}.</small></article>
      <article><span>Lowest measured SWR in band</span><strong>{referenceReview.lowestSwr ? `${formatRatio(referenceReview.lowestSwr.swr)} : 1` : 'No in-band sample'}</strong><small>{referenceReview.lowestSwr ? formatMHz(referenceReview.lowestSwr.frequencyHz) : 'Widen the analyser sweep or increase its point coverage.'}</small></article>
      <article><span>Highest measured SWR in band</span><strong>{referenceReview.highestSwr ? `${formatRatio(referenceReview.highestSwr.swr)} : 1` : 'No in-band sample'}</strong><small>{referenceReview.highestSwr ? formatMHz(referenceReview.highestSwr.frequencyHz) : 'No response summary is available.'}</small></article>
      {comparisonReview && <article><span>Comparison in-band minimum</span><strong>{comparisonReview.lowestSwr ? `${formatRatio(comparisonReview.lowestSwr.swr)} : 1` : 'No in-band sample'}</strong><small>{comparisonReview.lowestSwr ? `${formatMHz(comparisonReview.lowestSwr.frequencyHz)} · ${comparisonReview.sweepSpansEveryRange ? 'full span' : 'partial span'}` : 'The comparison does not sample this allocation.'}</small></article>}
    </div>
    <div className="sweep-band-review-actions"><button type="button" onClick={() => onInspect(band.lowerMHz)}>Inspect {exactAllocationRanges ? 'lower edge' : 'listed lower bound'}</button><button type="button" onClick={() => onInspect(band.designMHz)}>Inspect band centre</button><button type="button" onClick={() => onInspect(band.upperMHz)}>Inspect {exactAllocationRanges ? 'upper edge' : 'listed upper bound'}</button></div>
    <p>These are sampled extrema, not guaranteed continuous-band limits. {band.note ? `${band.note} ` : ''}Allocation context does not establish operating privileges, antenna efficiency, acceptable SWR, or suitability for a transmitter.</p>
  </section>;
}

function SweepComparisonTable({ reference, referenceName, referenceAnalysis, comparison, comparisonName, comparisonAnalysis, selected, comparisonSelected }: {
  reference: TouchstoneSweep;
  referenceName: string;
  referenceAnalysis: TouchstoneSweepSummary;
  comparison: TouchstoneSweep;
  comparisonName: string;
  comparisonAnalysis: TouchstoneSweepSummary;
  selected: TouchstonePoint;
  comparisonSelected: TouchstonePoint;
}) {
  const referenceBandwidth = referenceAnalysis.twoToOne ? referenceAnalysis.twoToOne.upper.frequencyHz - referenceAnalysis.twoToOne.lower.frequencyHz : null;
  const comparisonBandwidth = comparisonAnalysis.twoToOne ? comparisonAnalysis.twoToOne.upper.frequencyHz - comparisonAnalysis.twoToOne.lower.frequencyHz : null;
  return <section className="sweep-comparison-card" aria-labelledby="sweep-comparison-results-heading">
    <div className="sweep-chart-heading"><div><p className="eyebrow">Before and after</p><h3 id="sweep-comparison-results-heading">What changed in the measured response?</h3></div><p>Differences describe these two files only; they do not identify the physical cause.</p></div>
    {reference.referenceImpedanceOhms !== comparison.referenceImpedanceOhms && <p className="comparison-warning" role="note"><strong>Reference impedances differ:</strong> {reference.referenceImpedanceOhms} Ω versus {comparison.referenceImpedanceOhms} Ω. SWR and chart-centre comparisons are not on the same basis.</p>}
    <p className="sweep-table-scroll-hint">Swipe the table sideways to see both files and the calculated change.</p>
    <div className="sweep-comparison-table-wrap" role="region" tabIndex={0} aria-label="Scrollable sweep comparison table"><table className="sweep-comparison-table">
      <thead><tr><th scope="col">Measurement</th><th scope="col">Reference<br /><small>{referenceName}</small></th><th scope="col">Comparison<br /><small>{comparisonName}</small></th><th scope="col">Change</th></tr></thead>
      <tbody>
        <tr><th scope="row">Lowest SWR</th><td>{formatRatio(referenceAnalysis.best.swr)} : 1<br /><small>{formatMHz(referenceAnalysis.best.frequencyHz)}</small></td><td>{formatRatio(comparisonAnalysis.best.swr)} : 1<br /><small>{formatMHz(comparisonAnalysis.best.frequencyHz)}</small></td><td>{formatSigned(comparisonAnalysis.best.swr - referenceAnalysis.best.swr, 3)} SWR<br /><small>{formatSignedFrequency(comparisonAnalysis.best.frequencyHz - referenceAnalysis.best.frequencyHz)}</small></td></tr>
        <tr><th scope="row">Contiguous 2:1 span</th><td>{referenceBandwidth === null ? 'None' : formatBandwidth(referenceBandwidth)}</td><td>{comparisonBandwidth === null ? 'None' : formatBandwidth(comparisonBandwidth)}</td><td>{referenceBandwidth === null || comparisonBandwidth === null ? 'Not comparable' : formatSignedFrequency(comparisonBandwidth - referenceBandwidth)}</td></tr>
        <tr><th scope="row">Closest sampled resonance</th><td>{formatMHz(referenceAnalysis.resonant.frequencyHz)}<br /><small>{formatImpedance(referenceAnalysis.resonant)}</small></td><td>{formatMHz(comparisonAnalysis.resonant.frequencyHz)}<br /><small>{formatImpedance(comparisonAnalysis.resonant)}</small></td><td>{formatSignedFrequency(comparisonAnalysis.resonant.frequencyHz - referenceAnalysis.resonant.frequencyHz)}</td></tr>
        <tr><th scope="row">Inspection point</th><td>{formatMHz(selected.frequencyHz)}<br /><small>{formatRatio(selected.swr)} : 1 · {formatImpedance(selected)}</small></td><td>{formatMHz(comparisonSelected.frequencyHz)}<br /><small>{formatRatio(comparisonSelected.swr)} : 1 · {formatImpedance(comparisonSelected)}</small></td><td>{formatSigned(comparisonSelected.swr - selected.swr, 3)} SWR<br /><small>nearest sampled frequencies</small></td></tr>
      </tbody>
    </table></div>
  </section>;
}

function SweepPrintReport({ title, calibrationContext, referenceState, comparisonState, reference, referenceName, referenceAnalysis, selected, comparison, comparisonName, comparisonAnalysis, comparisonSelected, threshold, thresholdWindows, comparisonThresholdWindows }: {
  title: string;
  calibrationContext: string;
  referenceState: string;
  comparisonState: string;
  reference: TouchstoneSweep;
  referenceName: string;
  referenceAnalysis: TouchstoneSweepSummary;
  selected: TouchstonePoint;
  comparison: TouchstoneSweep | null;
  comparisonName: string;
  comparisonAnalysis: TouchstoneSweepSummary | null;
  comparisonSelected: TouchstonePoint | null;
  threshold: number | null;
  thresholdWindows: TouchstoneThresholdWindow[];
  comparisonThresholdWindows: TouchstoneThresholdWindow[];
}) {
  const widestThresholdWindow = thresholdWindows.length ? [...thresholdWindows].sort((first, second) => second.widthHz - first.widthHz)[0] : null;
  const widestComparisonThresholdWindow = comparisonThresholdWindows.length ? [...comparisonThresholdWindows].sort((first, second) => second.widthHz - first.widthHz)[0] : null;
  return <article className="sweep-print-report" aria-label="Printable antenna sweep measurement summary">
    <header className="sweep-print-heading"><img src="/antennas/TartanleafLogo.jpg" alt="" width="64" height="64" /><div><p>RadioBook Antenna Workshop · Measured sweep record</p><h1>{title.trim() || 'Antenna sweep measurement'}</h1><span>Touchstone 1.x one-port S11 summary</span></div></header>
    <div className="sweep-print-warning"><strong>Measurement record — not a diagnosis or compliance document</strong><span>This report reproduces imported analyser data and user-entered context. It does not verify calibration, infer antenna efficiency, identify why a response changed, establish safe power, or determine regulatory compliance.</span></div>
    <section><h2>Measurement context</h2><dl className="sweep-print-grid"><PrintField label="Calibration and reference plane" value={calibrationContext} wide /><PrintField label="Reference state" value={referenceState} /><PrintField label="Comparison state" value={comparison ? comparisonState : 'No comparison loaded'} /><PrintField label="Generated" value={new Date().toLocaleString()} /></dl></section>
    <section><h2>{referenceState.trim() || 'Reference'} sweep</h2><dl className="sweep-print-grid"><PrintField label="Source file" value={referenceName} /><PrintField label="Reference impedance" value={`${reference.referenceImpedanceOhms} Ω`} /><PrintField label="Sweep coverage" value={`${formatMHz(reference.points[0].frequencyHz)}–${formatMHz(reference.points.at(-1)!.frequencyHz)} · ${reference.points.length.toLocaleString()} points`} wide /><PrintField label="Lowest SWR" value={`${formatRatio(referenceAnalysis.best.swr)} : 1 at ${formatMHz(referenceAnalysis.best.frequencyHz)}`} /><PrintField label="Closest sampled resonance" value={`${formatMHz(referenceAnalysis.resonant.frequencyHz)} · ${formatImpedance(referenceAnalysis.resonant)}`} /><PrintField label="Contiguous 2:1 span" value={formatTwoToOne(referenceAnalysis)} /></dl></section>
    {comparison && comparisonAnalysis && <section><h2>{comparisonState.trim() || 'Comparison'} sweep</h2><dl className="sweep-print-grid"><PrintField label="Source file" value={comparisonName} /><PrintField label="Reference impedance" value={`${comparison.referenceImpedanceOhms} Ω`} /><PrintField label="Sweep coverage" value={`${formatMHz(comparison.points[0].frequencyHz)}–${formatMHz(comparison.points.at(-1)!.frequencyHz)} · ${comparison.points.length.toLocaleString()} points`} wide /><PrintField label="Lowest SWR" value={`${formatRatio(comparisonAnalysis.best.swr)} : 1 at ${formatMHz(comparisonAnalysis.best.frequencyHz)} · change ${formatSigned(comparisonAnalysis.best.swr - referenceAnalysis.best.swr, 3)} SWR`} /><PrintField label="Closest sampled resonance" value={`${formatMHz(comparisonAnalysis.resonant.frequencyHz)} · ${formatImpedance(comparisonAnalysis.resonant)} · shift ${formatSignedFrequency(comparisonAnalysis.resonant.frequencyHz - referenceAnalysis.resonant.frequencyHz)}`} /><PrintField label="Contiguous 2:1 span" value={`${formatTwoToOne(comparisonAnalysis)}${comparisonAnalysis.twoToOne && referenceAnalysis.twoToOne ? ` · width change ${formatSignedFrequency((comparisonAnalysis.twoToOne.upper.frequencyHz - comparisonAnalysis.twoToOne.lower.frequencyHz) - (referenceAnalysis.twoToOne.upper.frequencyHz - referenceAnalysis.twoToOne.lower.frequencyHz))}` : ''}`} /></dl></section>}
    {threshold && <section><h2>Chosen SWR threshold analysis</h2><dl className="sweep-print-grid"><PrintField label="Threshold" value={`${formatThreshold(threshold)} : 1`} /><PrintField label="Reference windows" value={`${thresholdWindows.length.toLocaleString()} · ${widestThresholdWindow ? `widest ${formatBandwidth(widestThresholdWindow.widthHz)}` : 'none measured'}`} /><PrintField label="Reference widest range" value={widestThresholdWindow ? `${formatMHz(widestThresholdWindow.lower.frequencyHz)}–${formatMHz(widestThresholdWindow.upper.frequencyHz)} · ${formatThresholdBoundary(widestThresholdWindow.lower)} / ${formatThresholdBoundary(widestThresholdWindow.upper)}` : 'No measured samples at or below threshold'} wide />{comparison && <PrintField label="Comparison windows" value={`${comparisonThresholdWindows.length.toLocaleString()} · ${widestComparisonThresholdWindow ? `widest ${formatBandwidth(widestComparisonThresholdWindow.widthHz)}` : 'none measured'}`} />}</dl></section>}
    <section><h2>Selected inspection point</h2><dl className="sweep-print-grid"><PrintField label={`${referenceState.trim() || 'Reference'} point`} value={`${formatMHz(selected.frequencyHz)} · ${formatRatio(selected.swr)} : 1 · ${formatDecibels(selected.returnLossDb)} return loss · ${formatImpedance(selected)}`} wide />{comparisonSelected && <PrintField label={`${comparisonState.trim() || 'Comparison'} nearest point`} value={`${formatMHz(comparisonSelected.frequencyHz)} · ${formatRatio(comparisonSelected.swr)} : 1 · ${formatDecibels(comparisonSelected.returnLossDb)} return loss · ${formatImpedance(comparisonSelected)} · change ${formatSigned(comparisonSelected.swr - selected.swr, 3)} SWR`} wide />}</dl></section>
    <footer><p>The companion CSV contains every reference point and, when loaded, the nearest comparison point with its frequency offset.</p><p>Generated from RadioBook Antenna Workshop · Tartanleaf.com Inc. · Greg Weir, VA1GW</p></footer>
  </article>;
}

function PrintField({ label, value, wide = false }: { label: string; value: string; wide?: boolean }) {
  return <div className={wide ? 'sweep-print-field sweep-print-wide' : 'sweep-print-field'}><dt>{label}</dt><dd>{value.trim() || 'Not recorded'}</dd></div>;
}

function formatTwoToOne(summary: TouchstoneSweepSummary) {
  return summary.twoToOne ? `${formatMHz(summary.twoToOne.lower.frequencyHz)}–${formatMHz(summary.twoToOne.upper.frequencyHz)} · ${formatBandwidth(summary.twoToOne.upper.frequencyHz - summary.twoToOne.lower.frequencyHz)}` : 'No measured points at or below 2:1';
}

function SweepChart({ sweep, comparison, selectedIndex, bands, threshold }: { sweep: TouchstoneSweep; comparison: TouchstoneSweep | null; selectedIndex: number; bands: ReturnType<typeof getBandsForJurisdiction>; threshold: number | null }) {
  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const firstHz = Math.min(sweep.points[0].frequencyHz, comparison?.points[0].frequencyHz ?? Number.POSITIVE_INFINITY);
  const lastHz = Math.max(sweep.points.at(-1)!.frequencyHz, comparison?.points.at(-1)?.frequencyHz ?? 0);
  const spanHz = Math.max(lastHz - firstHz, 1);
  const allPoints = comparison ? [...sweep.points, ...comparison.points] : sweep.points;
  const finitePeak = Math.max(...allPoints.map((point) => Number.isFinite(point.swr) ? point.swr : 10));
  const yMaximum = Math.max(3, Math.min(10, Math.ceil(Math.max(finitePeak, threshold ?? 0))));
  const x = (frequencyHz: number) => CHART.left + (frequencyHz - firstHz) / spanHz * innerWidth;
  const y = (swr: number) => CHART.top + (1 - (Math.min(swr, yMaximum) - 1) / (yMaximum - 1)) * innerHeight;
  const sampleEvery = Math.max(1, Math.ceil(sweep.points.length / 1200));
  const plotPoints = sweep.points.filter((_, index) => index % sampleEvery === 0 || index === sweep.points.length - 1);
  const comparisonSampleEvery = comparison ? Math.max(1, Math.ceil(comparison.points.length / 1200)) : 1;
  const comparisonPlotPoints = comparison?.points.filter((_, index) => index % comparisonSampleEvery === 0 || index === comparison.points.length - 1) ?? [];
  const selected = sweep.points[selectedIndex];
  const comparisonSelected = comparison ? nearestTouchstonePoint(comparison.points, selected.frequencyHz) : null;
  const visibleBands = bands.flatMap((band) => (band.segments ?? [{ lowerMHz: band.lowerMHz, upperMHz: band.upperMHz }]).map((segment) => ({ ...segment, id: band.id })));
  const tickValues = [1, 2, ...Array.from({ length: Math.max(0, yMaximum - 2) }, (_, index) => index + 3)].filter((value) => value <= yMaximum);

  return <svg className="sweep-chart" viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label={`SWR sweep from ${formatMHz(firstHz)} to ${formatMHz(lastHz)}. Selected reference point ${formatMHz(selected.frequencyHz)}, SWR ${formatRatio(selected.swr)} to one.${threshold ? ` Analysis threshold ${formatThreshold(threshold)} to one.` : ''}${comparisonSelected ? ` Nearest comparison point SWR ${formatRatio(comparisonSelected.swr)} to one.` : ''}`}>
    <rect className="sweep-chart-plot" x={CHART.left} y={CHART.top} width={innerWidth} height={innerHeight} />
    {visibleBands.map((band, index) => {
      const lower = Math.max(firstHz, band.lowerMHz * 1e6);
      const upper = Math.min(lastHz, band.upperMHz * 1e6);
      return upper > lower ? <rect key={`${band.id}-${index}`} className="sweep-chart-band" x={x(lower)} y={CHART.top} width={Math.max(1, x(upper) - x(lower))} height={innerHeight} /> : null;
    })}
    {tickValues.map((tick) => <g key={tick}><line className="sweep-grid-line" x1={CHART.left} x2={CHART.width - CHART.right} y1={y(tick)} y2={y(tick)} /><text x={CHART.left - 12} y={y(tick) + 5} textAnchor="end">{tick}:1</text></g>)}
    {threshold && <line className="sweep-threshold-line" x1={CHART.left} x2={CHART.width - CHART.right} y1={y(threshold)} y2={y(threshold)} />}
    <polyline className="sweep-trace" points={plotPoints.map((point) => `${x(point.frequencyHz).toFixed(2)},${y(point.swr).toFixed(2)}`).join(' ')} />
    {comparison && <polyline className="sweep-trace-comparison" points={comparisonPlotPoints.map((point) => `${x(point.frequencyHz).toFixed(2)},${y(point.swr).toFixed(2)}`).join(' ')} />}
    <line className="sweep-marker-line" x1={x(selected.frequencyHz)} x2={x(selected.frequencyHz)} y1={CHART.top} y2={CHART.top + innerHeight} />
    <circle className="sweep-marker-point" cx={x(selected.frequencyHz)} cy={y(selected.swr)} r="6" />
    {comparisonSelected && <circle className="sweep-marker-point-comparison" cx={x(comparisonSelected.frequencyHz)} cy={y(comparisonSelected.swr)} r="6" />}
    <text x={CHART.left} y={CHART.height - 20}>{formatMHz(firstHz)}</text>
    <text x={CHART.width - CHART.right} y={CHART.height - 20} textAnchor="end">{formatMHz(lastHz)}</text>
    <text className="sweep-axis-label" x={CHART.left + innerWidth / 2} y={CHART.height - 4} textAnchor="middle">Frequency</text>
  </svg>;
}

function formatMHz(frequencyHz: number) {
  const value = frequencyHz / 1e6;
  return `${value.toLocaleString(undefined, { maximumFractionDigits: value < 30 ? 4 : 3 })} MHz`;
}

function formatFrequencyInput(frequencyHz: number) {
  return (frequencyHz / 1e6).toFixed(6).replace(/0+$/, '').replace(/\.$/, '');
}

function formatBandwidth(spanHz: number) {
  return spanHz >= 1e6 ? `${(spanHz / 1e6).toFixed(3)} MHz wide` : `${(spanHz / 1e3).toFixed(1)} kHz wide`;
}

function formatRatio(value: number) {
  return Number.isFinite(value) ? value.toFixed(value < 10 ? 3 : 1) : '∞';
}

function formatThreshold(value: number) {
  return value.toLocaleString(undefined, { minimumFractionDigits: value % 1 === 0 ? 0 : 1, maximumFractionDigits: 2 });
}

function formatThresholdBoundary(boundary: TouchstoneThresholdWindow['lower']) {
  if (boundary.basis === 'interpolated') return 'interpolated crossing';
  if (boundary.basis === 'sweep-edge') return 'sweep edge';
  return 'measured sample bound';
}

function formatDecibels(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(2)} dB` : '∞ dB';
}

function formatImpedance(point: TouchstonePoint) {
  const sign = point.reactanceOhms < 0 ? '−' : '+';
  return `${finiteNumber(point.resistanceOhms)} ${sign} j${finiteNumber(Math.abs(point.reactanceOhms))} Ω`;
}

function finiteNumber(value: number) {
  return Number.isFinite(value) ? value.toFixed(2) : '∞';
}

async function readSweepFile(file: File) {
  if (!file.name.toLowerCase().endsWith('.s1p')) throw new Error('Choose a one-port Touchstone file with the .s1p extension.');
  if (file.size > 2_000_000) throw new Error('The file exceeds the 2 MB local import limit.');
  return parseTouchstoneS1p(await file.text());
}

function formatSigned(value: number, decimals: number) {
  if (!Number.isFinite(value)) return 'not finite';
  if (Math.abs(value) < 10 ** -decimals / 2) return value.toFixed(decimals);
  return `${value > 0 ? '+' : '−'}${Math.abs(value).toFixed(decimals)}`;
}

function formatSignedFrequency(frequencyHz: number) {
  const sign = frequencyHz > 0 ? '+' : frequencyHz < 0 ? '−' : '';
  const absolute = Math.abs(frequencyHz);
  return absolute >= 1e6 ? `${sign}${(absolute / 1e6).toFixed(3)} MHz` : `${sign}${(absolute / 1e3).toFixed(1)} kHz`;
}
