/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureScenarioComparison, ExposureScenarioInputChange, ExposureScenarioPointComparison, ScenarioInputValue, ScenarioInputValueKind } from '../calculators/exposureScenarioComparison';
import { formatLength, type UnitSystem } from '../lib/units';

interface BaselineOption {
  id: string;
  title: string;
}

interface Props {
  currentTitle: string;
  baselineTitle: string | null;
  baselineOptions: BaselineOption[];
  selectedBaselineId: string;
  comparison: ExposureScenarioComparison | null;
  comparisonError: string;
  inputChanges: ExposureScenarioInputChange[];
  unitSystem: UnitSystem;
  onBaselineChange: (projectId: string) => void;
}

function percent(fraction: number | null) {
  return fraction === null ? '—' : `${(fraction * 100).toFixed(2)}%`;
}

function delta(point: ExposureScenarioPointComparison) {
  if (point.deltaFraction === null) return point.change === 'added' ? 'Added point' : 'Removed point';
  const percentagePoints = point.deltaFraction * 100;
  return `${percentagePoints > 0 ? '+' : ''}${percentagePoints.toFixed(2)} percentage points`;
}

function barWidth(value: number | null, point: ExposureScenarioPointComparison) {
  if (value === null) return 0;
  const maximum = Math.max(point.baselineFraction ?? 0, point.currentFraction ?? 0, Number.EPSILON);
  return value / maximum * 100;
}

function compactNumber(value: number) {
  return Number(value.toFixed(3)).toString();
}

function formatInputValue(value: ScenarioInputValue, kind: ScenarioInputValueKind, unitSystem: UnitSystem) {
  if (value === null) return 'Not present';
  if (kind === 'boolean') return value ? 'Complete' : 'Incomplete';
  if (typeof value !== 'number') return String(value);
  if (kind === 'length') return formatLength(value, unitSystem);
  if (kind === 'frequency') return `${compactNumber(value)} MHz`;
  if (kind === 'power') return `${compactNumber(value)} W`;
  if (kind === 'percent') return `${compactNumber(value)}%`;
  if (kind === 'decibel') return `${compactNumber(value)} dB`;
  if (kind === 'gain') return `${compactNumber(value)} dBi`;
  if (kind === 'degrees') return `${compactNumber(value)}°`;
  return compactNumber(value);
}

export function ExposureScenarioComparisonPanel({ currentTitle, baselineTitle, baselineOptions, selectedBaselineId, comparison, comparisonError, inputChanges, unitSystem, onBaselineChange }: Props) {
  return <section className="scenario-comparison" aria-labelledby="scenario-comparison-heading">
    <div className="scenario-comparison-heading">
      <div><p className="eyebrow">What-if planning</p><h4 id="scenario-comparison-heading">Compare saved station scenarios</h4><p>Compare normalized point totals without changing either project. Duplicate a project before editing to preserve a clean baseline.</p></div>
      <label className="field"><span>Baseline project</span><select aria-label="Scenario comparison baseline" value={selectedBaselineId} onChange={(event) => onBaselineChange(event.target.value)}><option value="">Choose a saved baseline</option>{baselineOptions.map((option) => <option value={option.id} key={option.id}>{option.title}</option>)}</select></label>
    </div>
    {!selectedBaselineId && <p className="scenario-comparison-empty">Choose another saved project, or use “Duplicate as scenario” before changing the current project.</p>}
    {comparisonError && <p className="validation-message" role="alert">{comparisonError}</p>}
    {comparison && baselineTitle && <>
      <div className="scenario-comparison-legend"><span><i className="scenario-baseline-swatch" />Baseline: {baselineTitle}</span><span><i className="scenario-current-swatch" />Current: {currentTitle}</span><small>Bars are scaled within each point. Positive deltas mean the current scenario is higher. This comparison is not a compliance determination.</small></div>
      <div className="scenario-point-grid">{comparison.points.map((point) => <article className={`scenario-point-card scenario-change-${point.change}${point.pointId === comparison.greatestAbsoluteDeltaPointId ? ' scenario-greatest-change' : ''}`} key={point.pointId}>
        <div><p className="eyebrow">{point.pointId === comparison.greatestAbsoluteDeltaPointId ? 'Greatest absolute change' : 'Evaluation point'}</p><h5>{point.label}</h5></div>
        <dl><div><dt>Baseline</dt><dd>{percent(point.baselineFraction)}</dd></div><div><dt>Current</dt><dd>{percent(point.currentFraction)}</dd></div></dl>
        <div className="scenario-bars" aria-hidden="true"><i className="scenario-baseline-bar" style={{ width: `${barWidth(point.baselineFraction, point)}%` }} /><i className="scenario-current-bar" style={{ width: `${barWidth(point.currentFraction, point)}%` }} /></div>
        <strong>{delta(point)}</strong><span>{point.change === 'higher' ? 'Higher in current scenario' : point.change === 'lower' ? 'Lower in current scenario' : point.change === 'unchanged' ? 'No calculated change' : point.change === 'added' ? 'Not present in baseline' : 'Not present in current scenario'}</span>
      </article>)}</div>
      <section className="scenario-input-audit" aria-labelledby="scenario-input-audit-heading"><div><p className="eyebrow">Input audit · {inputChanges.length} {inputChanges.length === 1 ? 'change' : 'changes'}</p><h5 id="scenario-input-audit-heading">What changed between these projects</h5><p>Sources and points are matched by stable identity. Display units follow the current unit setting.</p></div>{inputChanges.length === 0 ? <p className="scenario-no-changes">No input differences were found.</p> : <ul>{inputChanges.map((change) => <li className={`scenario-input-change scenario-input-${change.changeKind}`} key={`${change.entityKind}-${change.entityId}-${change.fieldKey}`}><div><strong>{change.entityLabel}</strong><span>{change.fieldLabel}</span></div><div className="scenario-input-values"><span>{formatInputValue(change.baselineValue, change.valueKind, unitSystem)}</span><b aria-hidden="true">→</b><span>{formatInputValue(change.currentValue, change.valueKind, unitSystem)}</span></div></li>)}</ul>}</section>
    </>}
  </section>;
}
