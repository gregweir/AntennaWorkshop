/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useState } from 'react';
import { calculateExposureSensitivity, defaultExposureSensitivityRange, type ExposureSensitivitySample, type ExposureSensitivityVariable } from '../calculators/exposureSensitivity';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { exposureSensitivityCsvFilename, serializeExposureSensitivityCsv } from '../projects/exposureSensitivityCsv';
import type { ExposureProjectData } from '../projects/exposureProjectFiles';

interface Props {
  project: ExposureProjectData;
  unitSystem: UnitSystem;
}

const variableLabels: Record<ExposureSensitivityVariable, string> = {
  'transmitter-power': 'Transmitter output',
  'duty-cycle': 'Duty cycle',
  'antenna-height': 'Antenna centre height',
  'plan-distance': 'Point plan distance from selected source'
};

function formatValue(value: number, variable: ExposureSensitivityVariable, unitSystem: UnitSystem) {
  if (variable === 'antenna-height' || variable === 'plan-distance') return formatLength(value, unitSystem);
  const compact = Number(value.toFixed(2));
  return variable === 'transmitter-power' ? `${compact} W` : `${compact}%`;
}

function sampleStatus(sample: ExposureSensitivitySample) {
  if (sample.status === 'method-inapplicable') return 'Far-field method inapplicable at this sample';
  if (sample.status === 'further-analysis-required') return 'Further analysis required at this sample';
  if (sample.status === 'screening-inconclusive') return 'Source inventory incomplete';
  if (sample.status === 'invalid') return 'Input combination is invalid';
  return 'Below the preliminary screening trigger';
}

function linePath(samples: ExposureSensitivitySample[], x: (index: number) => number, y: (fraction: number) => number) {
  let drawing = false;
  return samples.map((sample, index) => {
    if (sample.totalFractionOfReferenceLevel === null) {
      drawing = false;
      return '';
    }
    const command = drawing ? 'L' : 'M';
    drawing = true;
    return `${command} ${x(index).toFixed(2)} ${y(sample.totalFractionOfReferenceLevel).toFixed(2)}`;
  }).join(' ');
}

export function ExposureSensitivityExplorer({ project, unitSystem }: Props) {
  const [sourceId, setSourceId] = useState(project.sources[0].id);
  const [pointId, setPointId] = useState(project.evaluationPoints[0].id);
  const [variable, setVariable] = useState<ExposureSensitivityVariable>('transmitter-power');
  const [previewIndex, setPreviewIndex] = useState(12);
  const [customRange, setCustomRange] = useState<{ key: string; minimumValue: number; maximumValue: number } | null>(null);
  const [downloadMessage, setDownloadMessage] = useState('');
  const selectedSourceId = project.sources.some((source) => source.id === sourceId) ? sourceId : project.sources[0].id;
  const selectedPointId = project.evaluationPoints.some((point) => point.id === pointId) ? pointId : project.evaluationPoints[0].id;
  const defaultRange = useMemo(() => defaultExposureSensitivityRange(project, selectedSourceId, selectedPointId, variable), [project, selectedSourceId, selectedPointId, variable]);
  const rangeKey = `${selectedSourceId}:${selectedPointId}:${variable}:${defaultRange.currentValue}`;
  const range = customRange?.key === rangeKey ? { ...customRange, currentValue: defaultRange.currentValue } : defaultRange;
  const rangeError = !Number.isFinite(range.minimumValue) || !Number.isFinite(range.maximumValue)
    ? 'Enter finite range limits.'
    : range.minimumValue >= range.maximumValue
      ? 'Range minimum must be less than range maximum.'
      : variable === 'transmitter-power' && range.minimumValue <= 0
        ? 'Transmitter output must remain greater than zero.'
        : variable === 'duty-cycle' && (range.minimumValue < 0.01 || range.maximumValue > 100)
          ? 'Duty-cycle range must remain between 0.01% and 100%.'
          : (variable === 'antenna-height' || variable === 'plan-distance') && range.minimumValue < 0
            ? 'Height and distance ranges cannot be negative.'
            : '';
  const calculationRange = rangeError ? defaultRange : range;
  const analysis = useMemo(() => calculateExposureSensitivity(project, { sourceId: selectedSourceId, pointId: selectedPointId, variable, minimumValue: calculationRange.minimumValue, maximumValue: calculationRange.maximumValue, sampleCount: 41 }), [project, selectedSourceId, selectedPointId, variable, calculationRange.minimumValue, calculationRange.maximumValue]);
  useEffect(() => {
    const position = (calculationRange.currentValue - calculationRange.minimumValue) / (calculationRange.maximumValue - calculationRange.minimumValue);
    setPreviewIndex(Math.max(0, Math.min(40, Math.round(position * 40))));
  }, [selectedSourceId, selectedPointId, variable, calculationRange.currentValue, calculationRange.minimumValue, calculationRange.maximumValue]);
  const preview = analysis.samples[previewIndex] ?? analysis.samples[0];
  const validFractions = analysis.samples.flatMap((sample) => sample.totalFractionOfReferenceLevel === null ? [] : [sample.totalFractionOfReferenceLevel]);
  const maximumFraction = Math.max(analysis.screeningTriggerFraction, ...validFractions, 0.01) * 1.12;
  const x = (index: number) => 58 + index / (analysis.samples.length - 1) * 592;
  const y = (fraction: number) => 250 - fraction / maximumFraction * 205;
  const currentX = 58 + (calculationRange.currentValue - calculationRange.minimumValue) / (calculationRange.maximumValue - calculationRange.minimumValue) * 592;
  const xValue = (value: number) => 58 + (value - calculationRange.minimumValue) / (calculationRange.maximumValue - calculationRange.minimumValue) * 592;
  const previewX = x(previewIndex);
  const previewY = preview.totalFractionOfReferenceLevel === null ? 250 : y(preview.totalFractionOfReferenceLevel);
  const deltaPercentagePoints = preview.totalFractionOfReferenceLevel === null ? null : (preview.totalFractionOfReferenceLevel - analysis.currentFractionOfReferenceLevel) * 100;
  const usesLength = variable === 'antenna-height' || variable === 'plan-distance';
  const rangeUnit = usesLength ? unitSystem === 'metric' ? 'm' : 'ft' : variable === 'transmitter-power' ? 'W' : '%';
  const displayRangeValue = (value: number) => usesLength && unitSystem === 'imperial' ? metresToFeet(value) : value;
  const readRangeValue = (value: number) => usesLength && unitSystem === 'imperial' ? feetToMetres(value) : value;
  const updateRange = (field: 'minimumValue' | 'maximumValue', displayValue: number) => setCustomRange({
    key: rangeKey,
    minimumValue: field === 'minimumValue' ? readRangeValue(displayValue) : range.minimumValue,
    maximumValue: field === 'maximumValue' ? readRangeValue(displayValue) : range.maximumValue
  });
  const sourceLabel = project.sources.find((source) => source.id === selectedSourceId)?.label ?? selectedSourceId;
  const pointLabel = project.evaluationPoints.find((point) => point.id === selectedPointId)?.label ?? selectedPointId;
  const relationToTrigger = (sample: ExposureSensitivitySample) => sample.totalFractionOfReferenceLevel === null
    ? 'Unavailable'
    : Math.abs(sample.totalFractionOfReferenceLevel - analysis.screeningTriggerFraction) < 1e-9
      ? 'At trigger'
      : sample.totalFractionOfReferenceLevel < analysis.screeningTriggerFraction ? 'Below trigger' : 'Above trigger';
  const downloadCsv = () => {
    const csv = serializeExposureSensitivityCsv(analysis, { sourceLabel, pointLabel, variableLabel: variableLabels[variable], unitSystem });
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = exposureSensitivityCsvFilename(project.title, variable);
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    setDownloadMessage(`Downloaded ${analysis.samples.length} sensitivity samples and ${analysis.thresholdCrossings.length} interpolated ${analysis.thresholdCrossings.length === 1 ? 'crossing' : 'crossings'} as CSV.`);
  };

  return <section className="sensitivity-explorer" aria-labelledby="sensitivity-heading">
    <div className="sensitivity-heading"><div><p className="eyebrow">Read-only what-if curve</p><h4 id="sensitivity-heading">Exposure sensitivity explorer</h4><p>Vary one input while every other saved project value remains fixed. Previewing a sample does not edit or save the project.</p></div><div className="sensitivity-controls">
      <label className="field"><span>Evaluation point</span><select aria-label="Sensitivity evaluation point" value={selectedPointId} onChange={(event) => setPointId(event.target.value)}>{project.evaluationPoints.map((point) => <option value={point.id} key={point.id}>{point.label}</option>)}</select></label>
      <label className="field"><span>Station source</span><select aria-label="Sensitivity station source" value={selectedSourceId} onChange={(event) => setSourceId(event.target.value)}>{project.sources.map((source) => <option value={source.id} key={source.id}>{source.label}</option>)}</select></label>
      <label className="field"><span>Variable</span><select aria-label="Sensitivity variable" value={variable} onChange={(event) => setVariable(event.target.value as ExposureSensitivityVariable)}>{Object.entries(variableLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
      <label className="field sensitivity-range-field"><span>Range minimum</span><span className="input-with-unit"><input aria-label="Sensitivity range minimum" type="number" step="any" value={Number(displayRangeValue(range.minimumValue).toFixed(3))} onChange={(event) => updateRange('minimumValue', Number(event.target.value))} /><span>{rangeUnit}</span></span></label>
      <label className="field sensitivity-range-field"><span>Range maximum</span><span className="input-with-unit"><input aria-label="Sensitivity range maximum" type="number" step="any" value={Number(displayRangeValue(range.maximumValue).toFixed(3))} onChange={(event) => updateRange('maximumValue', Number(event.target.value))} /><span>{rangeUnit}</span></span></label>
    </div></div>
    {rangeError && <p className="validation-message sensitivity-range-error" role="alert">{rangeError} The chart is showing the default range until this is corrected.</p>}
    <div className="sensitivity-layout">
      <figure className="sensitivity-chart">
        <svg viewBox="0 0 680 300" role="img" aria-labelledby="sensitivity-chart-title sensitivity-chart-desc">
          <title id="sensitivity-chart-title">{variableLabels[variable]} sensitivity at {project.evaluationPoints.find((point) => point.id === selectedPointId)?.label}</title>
          <desc id="sensitivity-chart-desc">Normalized exposure total across the displayed input range. The dashed horizontal line is the preliminary screening trigger, the vertical line is the saved project value, crossing markers are interpolated estimates, and the highlighted point is the slider preview.</desc>
          <g className="sensitivity-grid" aria-hidden="true">{[0, 0.25, 0.5, 0.75, 1].map((fraction) => <line key={fraction} x1="58" x2="650" y1={45 + fraction * 205} y2={45 + fraction * 205} />)}</g>
          <line className="sensitivity-trigger" x1="58" x2="650" y1={y(analysis.screeningTriggerFraction)} y2={y(analysis.screeningTriggerFraction)} />
          <text className="sensitivity-label" x="646" y={y(analysis.screeningTriggerFraction) - 7} textAnchor="end">screening trigger {(analysis.screeningTriggerFraction * 100).toFixed(0)}%</text>
          <line className="sensitivity-current-line" x1={currentX} x2={currentX} y1="45" y2="250" />
          <text className="sensitivity-label" x={currentX} y="36" textAnchor="middle">saved</text>
          <path className="sensitivity-curve" d={linePath(analysis.samples, x, y)} />
          {analysis.thresholdCrossings.map((crossing, index) => <g className="sensitivity-crossing" key={`${crossing.inputValue}-${index}`}><line x1={xValue(crossing.inputValue)} x2={xValue(crossing.inputValue)} y1={y(analysis.screeningTriggerFraction)} y2="250" /><circle cx={xValue(crossing.inputValue)} cy={y(analysis.screeningTriggerFraction)} r="5" /></g>)}
          <circle className={`sensitivity-preview-point sensitivity-preview-${preview.status}`} cx={previewX} cy={previewY} r="7" />
          <text className="sensitivity-axis-label" x="58" y="275" textAnchor="start">{formatValue(calculationRange.minimumValue, variable, unitSystem)}</text>
          <text className="sensitivity-axis-label" x="650" y="275" textAnchor="end">{formatValue(calculationRange.maximumValue, variable, unitSystem)}</text>
          <text className="sensitivity-axis-label" x="18" y="48" transform="rotate(-90 18 48)" textAnchor="end">normalized total</text>
        </svg>
        <figcaption>{variableLabels[variable]} from {formatValue(calculationRange.minimumValue, variable, unitSystem)} to {formatValue(calculationRange.maximumValue, variable, unitSystem)}. The curve uses the complete multi-source total at the selected point.</figcaption>
      </figure>
      <div className="sensitivity-preview">
        <label><span>Preview position</span><input aria-label="Sensitivity preview position" type="range" min="0" max="40" step="1" value={previewIndex} onChange={(event) => setPreviewIndex(Number(event.target.value))} /></label>
        <div className="sensitivity-preview-value"><p className="eyebrow">Previewed input</p><strong>{formatValue(preview.inputValue, variable, unitSystem)}</strong></div>
        <dl><div><dt>Normalized total</dt><dd>{preview.totalFractionOfReferenceLevel === null ? 'Unavailable' : `${(preview.totalFractionOfReferenceLevel * 100).toFixed(2)}%`}</dd></div><div><dt>Change from saved value</dt><dd>{deltaPercentagePoints === null ? 'Unavailable' : `${deltaPercentagePoints > 0 ? '+' : ''}${deltaPercentagePoints.toFixed(2)} points`}</dd></div></dl>
        <p className={`sensitivity-status sensitivity-status-${preview.status}`}>{sampleStatus(preview)}</p>
        <div className="sensitivity-crossing-summary"><strong>Estimated trigger {analysis.thresholdCrossings.length === 1 ? 'crossing' : 'crossings'}</strong>{analysis.thresholdCrossings.length ? <ul>{analysis.thresholdCrossings.map((crossing, index) => <li key={`${crossing.inputValue}-${index}`}>{formatValue(crossing.inputValue, variable, unitSystem)} · {crossing.direction}</li>)}</ul> : <span>No valid crossing in the displayed range.</span>}<small>Interpolated between adjacent valid samples; not a compliance limit.</small></div>
        <small>Educational sensitivity only. It does not optimize the station, apply pattern attenuation, establish exemption, or demonstrate compliance.</small>
      </div>
    </div>
    <div className="sensitivity-data-actions">
      <div><h5>Inspect the plotted data</h5><p>The table and CSV contain every plotted sample. Crossing rows in the CSV are separately labelled as interpolated estimates.</p></div>
      <button type="button" className="secondary-button" onClick={downloadCsv}>Download CSV</button>
    </div>
    <p className="sensitivity-download-message" role="status" aria-live="polite">{downloadMessage}</p>
    <details className="sensitivity-data-table">
      <summary>View all {analysis.samples.length} sensitivity samples</summary>
      <div className="sensitivity-table-scroll" tabIndex={0} aria-label="Scrollable sensitivity sample table">
        <table>
          <caption>{variableLabels[variable]} sensitivity samples for {sourceLabel} at {pointLabel}. Values use {rangeUnit}.</caption>
          <thead><tr><th scope="col">Sample</th><th scope="col">Input</th><th scope="col">Normalized total</th><th scope="col">Trigger relation</th><th scope="col">Evaluation status</th></tr></thead>
          <tbody>{analysis.samples.map((sample, index) => <tr key={`${sample.inputValue}-${index}`} className={index === previewIndex ? 'sensitivity-table-previewed' : undefined}><th scope="row">{index + 1}</th><td>{formatValue(sample.inputValue, variable, unitSystem)}</td><td>{sample.totalFractionOfReferenceLevel === null ? 'Unavailable' : `${(sample.totalFractionOfReferenceLevel * 100).toFixed(4)}%`}</td><td>{relationToTrigger(sample)}</td><td>{sampleStatus(sample)}</td></tr>)}</tbody>
        </table>
      </div>
      <small>Rows are sampled calculations. Estimated crossings are interpolated between eligible rows and are included separately in the CSV.</small>
    </details>
  </section>;
}
