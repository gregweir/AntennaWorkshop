/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectInput, ExposureProjectResult, ExposureProjectSourceInput, ExposureEvaluationPointInput } from './exposureProject';

export type ScenarioPointChange = 'higher' | 'lower' | 'unchanged' | 'added' | 'removed';

export interface ExposureScenarioPointComparison {
  pointId: string;
  label: string;
  baselineFraction: number | null;
  currentFraction: number | null;
  deltaFraction: number | null;
  change: ScenarioPointChange;
}

export interface ExposureScenarioComparison {
  jurisdiction: ExposureProjectResult['jurisdiction'];
  environment: ExposureProjectResult['environment'];
  points: ExposureScenarioPointComparison[];
  greatestAbsoluteDeltaPointId: string | null;
}

export type ScenarioInputValue = string | number | boolean | null;
export type ScenarioInputValueKind = 'text' | 'boolean' | 'frequency' | 'power' | 'percent' | 'decibel' | 'gain' | 'length' | 'degrees';
export type ScenarioInputEntityKind = 'project' | 'source' | 'point';
export type ScenarioInputChangeKind = 'changed' | 'added' | 'removed';

export interface ExposureScenarioInputChange {
  entityKind: ScenarioInputEntityKind;
  entityId: string;
  entityLabel: string;
  fieldKey: string;
  fieldLabel: string;
  valueKind: ScenarioInputValueKind;
  baselineValue: ScenarioInputValue;
  currentValue: ScenarioInputValue;
  changeKind: ScenarioInputChangeKind;
}

export interface ExposureScenarioInput extends ExposureProjectInput {
  title?: string;
}

interface FieldDescriptor<T> {
  key: keyof T;
  label: string;
  kind: ScenarioInputValueKind;
}

const sourceFields: FieldDescriptor<ExposureProjectSourceInput>[] = [
  { key: 'label', label: 'Source label', kind: 'text' },
  { key: 'frequencyMHz', label: 'Frequency', kind: 'frequency' },
  { key: 'transmitterPowerWatts', label: 'Transmitter output', kind: 'power' },
  { key: 'dutyCyclePercent', label: 'Duty cycle', kind: 'percent' },
  { key: 'feedSystemLossDb', label: 'Feed-system loss', kind: 'decibel' },
  { key: 'antennaGainDbi', label: 'Maximum antenna gain', kind: 'gain' },
  { key: 'antennaLargestDimensionMetres', label: 'Largest antenna dimension', kind: 'length' },
  { key: 'antennaCentreHeightMetres', label: 'Antenna centre height', kind: 'length' },
  { key: 'eastOffsetMetres', label: 'East position', kind: 'length' },
  { key: 'northOffsetMetres', label: 'North position', kind: 'length' },
  { key: 'patternType', label: 'Azimuth pattern', kind: 'text' },
  { key: 'bearingDegrees', label: 'Maximum-response bearing', kind: 'degrees' },
  { key: 'beamwidthDegrees', label: 'Horizontal beamwidth', kind: 'degrees' }
];

const pointFields: FieldDescriptor<ExposureEvaluationPointInput>[] = [
  { key: 'label', label: 'Location label', kind: 'text' },
  { key: 'eastOffsetMetres', label: 'East position', kind: 'length' },
  { key: 'northOffsetMetres', label: 'North position', kind: 'length' },
  { key: 'heightMetres', label: 'Point height', kind: 'length' }
];

function fieldChanges<T extends object>(entityKind: ScenarioInputEntityKind, entityId: string, entityLabel: string, baseline: T, current: T, fields: FieldDescriptor<T>[]): ExposureScenarioInputChange[] {
  return fields.flatMap((field) => baseline[field.key] === current[field.key] ? [] : [{
    entityKind,
    entityId,
    entityLabel,
    fieldKey: String(field.key),
    fieldLabel: field.label,
    valueKind: field.kind,
    baselineValue: baseline[field.key] as ScenarioInputValue,
    currentValue: current[field.key] as ScenarioInputValue,
    changeKind: 'changed' as const
  }]);
}

function entityChanges<T extends { id: string; label: string }>(entityKind: 'source' | 'point', baselineItems: T[], currentItems: T[], fields: FieldDescriptor<T>[]): ExposureScenarioInputChange[] {
  const baselineById = new Map(baselineItems.map((item) => [item.id, item]));
  const currentById = new Map(currentItems.map((item) => [item.id, item]));
  return [...new Set([...baselineById.keys(), ...currentById.keys()])].flatMap((id) => {
    const baseline = baselineById.get(id);
    const current = currentById.get(id);
    if (!baseline || !current) {
      const item = current ?? baseline!;
      return [{
        entityKind,
        entityId: id,
        entityLabel: item.label,
        fieldKey: entityKind,
        fieldLabel: entityKind === 'source' ? 'Station source' : 'Evaluation point',
        valueKind: 'text' as const,
        baselineValue: baseline ? baseline.label : null,
        currentValue: current ? current.label : null,
        changeKind: current ? 'added' as const : 'removed' as const
      }];
    }
    return fieldChanges(entityKind, id, current.label, baseline, current, fields);
  });
}

export function compareExposureScenarioInputs(baseline: ExposureScenarioInput, current: ExposureScenarioInput): ExposureScenarioInputChange[] {
  const changes: ExposureScenarioInputChange[] = [];
  if (baseline.title !== current.title) changes.push({ entityKind: 'project', entityId: 'project', entityLabel: 'Project', fieldKey: 'title', fieldLabel: 'Project title', valueKind: 'text', baselineValue: baseline.title ?? null, currentValue: current.title ?? null, changeKind: 'changed' });
  if (baseline.sourceInventoryComplete !== current.sourceInventoryComplete) changes.push({ entityKind: 'project', entityId: 'project', entityLabel: 'Project', fieldKey: 'sourceInventoryComplete', fieldLabel: 'Source inventory confirmation', valueKind: 'boolean', baselineValue: baseline.sourceInventoryComplete, currentValue: current.sourceInventoryComplete, changeKind: 'changed' });
  changes.push(...entityChanges('source', baseline.sources, current.sources, sourceFields));
  changes.push(...entityChanges('point', baseline.evaluationPoints, current.evaluationPoints, pointFields));
  return changes;
}

export function compareExposureScenarios(
  baseline: ExposureProjectResult,
  current: ExposureProjectResult
): ExposureScenarioComparison {
  if (baseline.jurisdiction !== current.jurisdiction || baseline.environment !== current.environment) {
    throw new RangeError('Scenario comparison requires the same jurisdiction and exposure environment.');
  }
  const baselineById = new Map(baseline.pointResults.map((point) => [point.point.id, point]));
  const currentById = new Map(current.pointResults.map((point) => [point.point.id, point]));
  const pointIds = [...new Set([...baselineById.keys(), ...currentById.keys()])];
  const points = pointIds.map((pointId): ExposureScenarioPointComparison => {
    const baselinePoint = baselineById.get(pointId);
    const currentPoint = currentById.get(pointId);
    const baselineFraction = baselinePoint?.aggregate.totalFractionOfReferenceLevel ?? null;
    const currentFraction = currentPoint?.aggregate.totalFractionOfReferenceLevel ?? null;
    const deltaFraction = baselineFraction === null || currentFraction === null ? null : currentFraction - baselineFraction;
    const change: ScenarioPointChange = baselinePoint === undefined
      ? 'added'
      : currentPoint === undefined
        ? 'removed'
        : Math.abs(deltaFraction ?? 0) < 1e-12
          ? 'unchanged'
          : (deltaFraction ?? 0) > 0 ? 'higher' : 'lower';
    return {
      pointId,
      label: currentPoint?.point.label ?? baselinePoint?.point.label ?? pointId,
      baselineFraction,
      currentFraction,
      deltaFraction,
      change
    };
  });
  const comparablePoints = points.filter((point) => point.deltaFraction !== null);
  const greatest = comparablePoints.length
    ? comparablePoints.reduce((largest, point) => Math.abs(point.deltaFraction ?? 0) > Math.abs(largest.deltaFraction ?? 0) ? point : largest)
    : null;
  return {
    jurisdiction: current.jurisdiction,
    environment: current.environment,
    points,
    greatestAbsoluteDeltaPointId: greatest?.pointId ?? null
  };
}
