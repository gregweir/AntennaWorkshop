/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState, type ChangeEvent } from 'react';
import { getBandsForJurisdiction } from '../bands/catalog';
import { nearestTouchstonePoint, parseTouchstoneS1p, summarizeTouchstoneSweep, type TouchstonePoint, type TouchstoneSweep, type TouchstoneSweepSummary } from '../lib/touchstone';
import { serializeTouchstoneComparisonCsv, touchstoneReportFilename } from '../lib/touchstoneReport';
import type { JurisdictionCode } from '../regulations/catalog';
import { StepByStepHelp } from './ContextHelp';
import { SweepSmithChart } from './SweepSmithChart';

interface Props {
  jurisdiction: JurisdictionCode;
}

const CHART = { width: 920, height: 360, left: 72, right: 24, top: 28, bottom: 58 };

export default function MeasuredSweepPanel({ jurisdiction }: Props) {
  const [sweep, setSweep] = useState<TouchstoneSweep | null>(null);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [comparison, setComparison] = useState<TouchstoneSweep | null>(null);
  const [comparisonFileName, setComparisonFileName] = useState('');
  const [comparisonError, setComparisonError] = useState('');
  const [reportTitle, setReportTitle] = useState('');
  const [calibrationContext, setCalibrationContext] = useState('');
  const [referenceState, setReferenceState] = useState('Reference');
  const [comparisonState, setComparisonState] = useState('Comparison');
  const [downloadMessage, setDownloadMessage] = useState('');

  const analysis = useMemo(() => sweep ? summarizeTouchstoneSweep(sweep) : null, [sweep]);
  const comparisonAnalysis = useMemo(() => comparison ? summarizeTouchstoneSweep(comparison) : null, [comparison]);
  const selected = sweep?.points[Math.min(selectedIndex, sweep.points.length - 1)] ?? null;
  const selectedComparison = selected && comparison ? nearestTouchstonePoint(comparison.points, selected.frequencyHz) : null;
  const bands = useMemo(() => {
    if (!sweep) return [];
    const lowerMHz = Math.min(sweep.points[0].frequencyHz, comparison?.points[0].frequencyHz ?? Number.POSITIVE_INFINITY) / 1e6;
    const upperMHz = Math.max(sweep.points.at(-1)!.frequencyHz, comparison?.points.at(-1)?.frequencyHz ?? 0) / 1e6;
    return getBandsForJurisdiction(jurisdiction).filter((band) => band.upperMHz >= lowerMHz && band.lowerMHz <= upperMHz);
  }, [comparison, jurisdiction, sweep]);

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
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = touchstoneReportFilename(reportTitle || fileName.replace(/\.s1p$/i, ''));
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloadMessage(`Downloaded ${sweep.points.length.toLocaleString()} reference ${sweep.points.length === 1 ? 'point' : 'points'}${comparison ? ' with nearest comparison samples' : ''} as CSV.`);
  }

  function printReport() {
    const printClass = 'sweep-report-print';
    const cleanup = () => document.body.classList.remove(printClass);
    document.body.classList.add(printClass);
    window.addEventListener('afterprint', cleanup, { once: true });
    try {
      window.print();
    } finally {
      window.setTimeout(cleanup, 0);
    }
  }

  return <div className="measured-sweep-workbench">
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
        <div className="sweep-report-actions"><button type="button" onClick={downloadCsv}>Download point CSV</button><button type="button" onClick={printReport}>Print measurement summary</button></div>
        {downloadMessage && <p className="workflow-message" role="status">{downloadMessage}</p>}
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
        <div className="sweep-chart-heading"><div><p className="eyebrow">Frequency response</p><h3 id="sweep-chart-heading">SWR across the measured sweep</h3></div><p>Coral dash: 2:1. Shading: amateur allocations. {comparison ? 'Dashed blue: comparison sweep.' : ''}</p></div>
        <SweepChart sweep={sweep} comparison={comparison} selectedIndex={selectedIndex} bands={bands} />
        <label className="sweep-marker-control"><span>Inspection point <strong>{formatMHz(selected.frequencyHz)}</strong></span><input aria-label="Sweep inspection point" type="range" min={0} max={sweep.points.length - 1} value={selectedIndex} onChange={(event) => setSelectedIndex(Number(event.target.value))} /></label>
        <dl className="sweep-marker-values">
          <div><dt>SWR</dt><dd>{formatRatio(selected.swr)} : 1</dd></div>
          <div><dt>Return loss</dt><dd>{formatDecibels(selected.returnLossDb)}</dd></div>
          <div><dt>Impedance</dt><dd>{formatImpedance(selected)}</dd></div>
          <div><dt>Reflection magnitude</dt><dd>{selected.reflectionMagnitude.toFixed(4)}</dd></div>
        </dl>
        {selectedComparison && <p className="sweep-comparison-at-marker"><strong>Comparison near this frequency:</strong> {formatMHz(selectedComparison.frequencyHz)} · {formatRatio(selectedComparison.swr)} : 1 · {formatImpedance(selectedComparison)}. Difference from reference: {formatSigned(selectedComparison.swr - selected.swr, 3)} SWR.</p>}
        {bands.length > 0 && <p className="sweep-band-list"><strong>Allocations in view:</strong> {bands.map((band) => band.label).join(', ')}. Allocation shading is context, not operating authorization; verify licence class, mode, power, and local conditions.</p>}
      </section>

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
      <SweepPrintReport title={reportTitle} calibrationContext={calibrationContext} referenceState={referenceState} comparisonState={comparisonState} reference={sweep} referenceName={fileName} referenceAnalysis={analysis} selected={selected} comparison={comparison} comparisonName={comparisonFileName} comparisonAnalysis={comparisonAnalysis} comparisonSelected={selectedComparison} />
    </>}
  </div>;
}

function SweepMetric({ label, value, detail }: { label: string; value: string; detail: string }) {
  return <article><p>{label}</p><strong>{value}</strong><small>{detail}</small></article>;
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

function SweepPrintReport({ title, calibrationContext, referenceState, comparisonState, reference, referenceName, referenceAnalysis, selected, comparison, comparisonName, comparisonAnalysis, comparisonSelected }: {
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
}) {
  return <article className="sweep-print-report" aria-label="Printable antenna sweep measurement summary">
    <header className="sweep-print-heading"><img src="/antennas/TartanleafLogo.jpg" alt="" width="64" height="64" /><div><p>RadioBook Antenna Workshop · Measured sweep record</p><h1>{title.trim() || 'Antenna sweep measurement'}</h1><span>Touchstone 1.x one-port S11 summary</span></div></header>
    <div className="sweep-print-warning"><strong>Measurement record — not a diagnosis or compliance document</strong><span>This report reproduces imported analyser data and user-entered context. It does not verify calibration, infer antenna efficiency, identify why a response changed, establish safe power, or determine regulatory compliance.</span></div>
    <section><h2>Measurement context</h2><dl className="sweep-print-grid"><PrintField label="Calibration and reference plane" value={calibrationContext} wide /><PrintField label="Reference state" value={referenceState} /><PrintField label="Comparison state" value={comparison ? comparisonState : 'No comparison loaded'} /><PrintField label="Generated" value={new Date().toLocaleString()} /></dl></section>
    <section><h2>{referenceState.trim() || 'Reference'} sweep</h2><dl className="sweep-print-grid"><PrintField label="Source file" value={referenceName} /><PrintField label="Reference impedance" value={`${reference.referenceImpedanceOhms} Ω`} /><PrintField label="Sweep coverage" value={`${formatMHz(reference.points[0].frequencyHz)}–${formatMHz(reference.points.at(-1)!.frequencyHz)} · ${reference.points.length.toLocaleString()} points`} wide /><PrintField label="Lowest SWR" value={`${formatRatio(referenceAnalysis.best.swr)} : 1 at ${formatMHz(referenceAnalysis.best.frequencyHz)}`} /><PrintField label="Closest sampled resonance" value={`${formatMHz(referenceAnalysis.resonant.frequencyHz)} · ${formatImpedance(referenceAnalysis.resonant)}`} /><PrintField label="Contiguous 2:1 span" value={formatTwoToOne(referenceAnalysis)} /></dl></section>
    {comparison && comparisonAnalysis && <section><h2>{comparisonState.trim() || 'Comparison'} sweep</h2><dl className="sweep-print-grid"><PrintField label="Source file" value={comparisonName} /><PrintField label="Reference impedance" value={`${comparison.referenceImpedanceOhms} Ω`} /><PrintField label="Sweep coverage" value={`${formatMHz(comparison.points[0].frequencyHz)}–${formatMHz(comparison.points.at(-1)!.frequencyHz)} · ${comparison.points.length.toLocaleString()} points`} wide /><PrintField label="Lowest SWR" value={`${formatRatio(comparisonAnalysis.best.swr)} : 1 at ${formatMHz(comparisonAnalysis.best.frequencyHz)} · change ${formatSigned(comparisonAnalysis.best.swr - referenceAnalysis.best.swr, 3)} SWR`} /><PrintField label="Closest sampled resonance" value={`${formatMHz(comparisonAnalysis.resonant.frequencyHz)} · ${formatImpedance(comparisonAnalysis.resonant)} · shift ${formatSignedFrequency(comparisonAnalysis.resonant.frequencyHz - referenceAnalysis.resonant.frequencyHz)}`} /><PrintField label="Contiguous 2:1 span" value={`${formatTwoToOne(comparisonAnalysis)}${comparisonAnalysis.twoToOne && referenceAnalysis.twoToOne ? ` · width change ${formatSignedFrequency((comparisonAnalysis.twoToOne.upper.frequencyHz - comparisonAnalysis.twoToOne.lower.frequencyHz) - (referenceAnalysis.twoToOne.upper.frequencyHz - referenceAnalysis.twoToOne.lower.frequencyHz))}` : ''}`} /></dl></section>}
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

function SweepChart({ sweep, comparison, selectedIndex, bands }: { sweep: TouchstoneSweep; comparison: TouchstoneSweep | null; selectedIndex: number; bands: ReturnType<typeof getBandsForJurisdiction> }) {
  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const firstHz = Math.min(sweep.points[0].frequencyHz, comparison?.points[0].frequencyHz ?? Number.POSITIVE_INFINITY);
  const lastHz = Math.max(sweep.points.at(-1)!.frequencyHz, comparison?.points.at(-1)?.frequencyHz ?? 0);
  const spanHz = Math.max(lastHz - firstHz, 1);
  const allPoints = comparison ? [...sweep.points, ...comparison.points] : sweep.points;
  const finitePeak = Math.max(...allPoints.map((point) => Number.isFinite(point.swr) ? point.swr : 10));
  const yMaximum = Math.max(3, Math.min(10, Math.ceil(finitePeak)));
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

  return <svg className="sweep-chart" viewBox={`0 0 ${CHART.width} ${CHART.height}`} role="img" aria-label={`SWR sweep from ${formatMHz(firstHz)} to ${formatMHz(lastHz)}. Selected reference point ${formatMHz(selected.frequencyHz)}, SWR ${formatRatio(selected.swr)} to one.${comparisonSelected ? ` Nearest comparison point SWR ${formatRatio(comparisonSelected.swr)} to one.` : ''}`}>
    <rect className="sweep-chart-plot" x={CHART.left} y={CHART.top} width={innerWidth} height={innerHeight} />
    {visibleBands.map((band, index) => {
      const lower = Math.max(firstHz, band.lowerMHz * 1e6);
      const upper = Math.min(lastHz, band.upperMHz * 1e6);
      return upper > lower ? <rect key={`${band.id}-${index}`} className="sweep-chart-band" x={x(lower)} y={CHART.top} width={Math.max(1, x(upper) - x(lower))} height={innerHeight} /> : null;
    })}
    {tickValues.map((tick) => <g key={tick}><line className={tick === 2 ? 'sweep-threshold-line' : 'sweep-grid-line'} x1={CHART.left} x2={CHART.width - CHART.right} y1={y(tick)} y2={y(tick)} /><text x={CHART.left - 12} y={y(tick) + 5} textAnchor="end">{tick}:1</text></g>)}
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

function formatBandwidth(spanHz: number) {
  return spanHz >= 1e6 ? `${(spanHz / 1e6).toFixed(3)} MHz wide` : `${(spanHz / 1e3).toFixed(1)} kHz wide`;
}

function formatRatio(value: number) {
  return Number.isFinite(value) ? value.toFixed(value < 10 ? 3 : 1) : '∞';
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
