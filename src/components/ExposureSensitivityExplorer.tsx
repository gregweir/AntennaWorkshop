/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useState } from 'react';
import type { ExposureProjectInput } from '../calculators/exposureProject';
import { calculateExposureSensitivity, defaultExposureSensitivityRange, type ExposureSensitivitySample, type ExposureSensitivityVariable } from '../calculators/exposureSensitivity';
import { formatLength, type UnitSystem } from '../lib/units';

interface Props {
  project: ExposureProjectInput;
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
  const selectedSourceId = project.sources.some((source) => source.id === sourceId) ? sourceId : project.sources[0].id;
  const selectedPointId = project.evaluationPoints.some((point) => point.id === pointId) ? pointId : project.evaluationPoints[0].id;
  const range = useMemo(() => defaultExposureSensitivityRange(project, selectedSourceId, selectedPointId, variable), [project, selectedSourceId, selectedPointId, variable]);
  const analysis = useMemo(() => calculateExposureSensitivity(project, { sourceId: selectedSourceId, pointId: selectedPointId, variable, minimumValue: range.minimumValue, maximumValue: range.maximumValue, sampleCount: 25 }), [project, selectedSourceId, selectedPointId, variable, range]);
  useEffect(() => {
    const position = (range.currentValue - range.minimumValue) / (range.maximumValue - range.minimumValue);
    setPreviewIndex(Math.max(0, Math.min(24, Math.round(position * 24))));
  }, [selectedSourceId, selectedPointId, variable, range.currentValue, range.minimumValue, range.maximumValue]);
  const preview = analysis.samples[previewIndex] ?? analysis.samples[0];
  const validFractions = analysis.samples.flatMap((sample) => sample.totalFractionOfReferenceLevel === null ? [] : [sample.totalFractionOfReferenceLevel]);
  const maximumFraction = Math.max(analysis.screeningTriggerFraction, ...validFractions, 0.01) * 1.12;
  const x = (index: number) => 58 + index / (analysis.samples.length - 1) * 592;
  const y = (fraction: number) => 250 - fraction / maximumFraction * 205;
  const currentX = 58 + (range.currentValue - range.minimumValue) / (range.maximumValue - range.minimumValue) * 592;
  const previewX = x(previewIndex);
  const previewY = preview.totalFractionOfReferenceLevel === null ? 250 : y(preview.totalFractionOfReferenceLevel);
  const deltaPercentagePoints = preview.totalFractionOfReferenceLevel === null ? null : (preview.totalFractionOfReferenceLevel - analysis.currentFractionOfReferenceLevel) * 100;

  return <section className="sensitivity-explorer" aria-labelledby="sensitivity-heading">
    <div className="sensitivity-heading"><div><p className="eyebrow">Read-only what-if curve</p><h4 id="sensitivity-heading">Exposure sensitivity explorer</h4><p>Vary one input while every other saved project value remains fixed. Previewing a sample does not edit or save the project.</p></div><div className="sensitivity-controls">
      <label className="field"><span>Evaluation point</span><select aria-label="Sensitivity evaluation point" value={selectedPointId} onChange={(event) => setPointId(event.target.value)}>{project.evaluationPoints.map((point) => <option value={point.id} key={point.id}>{point.label}</option>)}</select></label>
      <label className="field"><span>Station source</span><select aria-label="Sensitivity station source" value={selectedSourceId} onChange={(event) => setSourceId(event.target.value)}>{project.sources.map((source) => <option value={source.id} key={source.id}>{source.label}</option>)}</select></label>
      <label className="field"><span>Variable</span><select aria-label="Sensitivity variable" value={variable} onChange={(event) => setVariable(event.target.value as ExposureSensitivityVariable)}>{Object.entries(variableLabels).map(([value, label]) => <option value={value} key={value}>{label}</option>)}</select></label>
    </div></div>
    <div className="sensitivity-layout">
      <figure className="sensitivity-chart">
        <svg viewBox="0 0 680 300" role="img" aria-labelledby="sensitivity-chart-title sensitivity-chart-desc">
          <title id="sensitivity-chart-title">{variableLabels[variable]} sensitivity at {project.evaluationPoints.find((point) => point.id === selectedPointId)?.label}</title>
          <desc id="sensitivity-chart-desc">Normalized exposure total across the displayed input range. The dashed horizontal line is the preliminary screening trigger, the vertical line is the saved project value, and the highlighted point is the slider preview.</desc>
          <g className="sensitivity-grid" aria-hidden="true">{[0, 0.25, 0.5, 0.75, 1].map((fraction) => <line key={fraction} x1="58" x2="650" y1={45 + fraction * 205} y2={45 + fraction * 205} />)}</g>
          <line className="sensitivity-trigger" x1="58" x2="650" y1={y(analysis.screeningTriggerFraction)} y2={y(analysis.screeningTriggerFraction)} />
          <text className="sensitivity-label" x="646" y={y(analysis.screeningTriggerFraction) - 7} textAnchor="end">screening trigger {(analysis.screeningTriggerFraction * 100).toFixed(0)}%</text>
          <line className="sensitivity-current-line" x1={currentX} x2={currentX} y1="45" y2="250" />
          <text className="sensitivity-label" x={currentX} y="36" textAnchor="middle">saved</text>
          <path className="sensitivity-curve" d={linePath(analysis.samples, x, y)} />
          <circle className={`sensitivity-preview-point sensitivity-preview-${preview.status}`} cx={previewX} cy={previewY} r="7" />
          <text className="sensitivity-axis-label" x="58" y="275" textAnchor="start">{formatValue(range.minimumValue, variable, unitSystem)}</text>
          <text className="sensitivity-axis-label" x="650" y="275" textAnchor="end">{formatValue(range.maximumValue, variable, unitSystem)}</text>
          <text className="sensitivity-axis-label" x="18" y="48" transform="rotate(-90 18 48)" textAnchor="end">normalized total</text>
        </svg>
        <figcaption>{variableLabels[variable]} from {formatValue(range.minimumValue, variable, unitSystem)} to {formatValue(range.maximumValue, variable, unitSystem)}. The curve uses the complete multi-source total at the selected point.</figcaption>
      </figure>
      <div className="sensitivity-preview">
        <label><span>Preview position</span><input aria-label="Sensitivity preview position" type="range" min="0" max="24" step="1" value={previewIndex} onChange={(event) => setPreviewIndex(Number(event.target.value))} /></label>
        <div className="sensitivity-preview-value"><p className="eyebrow">Previewed input</p><strong>{formatValue(preview.inputValue, variable, unitSystem)}</strong></div>
        <dl><div><dt>Normalized total</dt><dd>{preview.totalFractionOfReferenceLevel === null ? 'Unavailable' : `${(preview.totalFractionOfReferenceLevel * 100).toFixed(2)}%`}</dd></div><div><dt>Change from saved value</dt><dd>{deltaPercentagePoints === null ? 'Unavailable' : `${deltaPercentagePoints > 0 ? '+' : ''}${deltaPercentagePoints.toFixed(2)} points`}</dd></div></dl>
        <p className={`sensitivity-status sensitivity-status-${preview.status}`}>{sampleStatus(preview)}</p>
        <small>Educational sensitivity only. It does not optimize the station, apply pattern attenuation, establish exemption, or demonstrate compliance.</small>
      </div>
    </div>
  </section>;
}
