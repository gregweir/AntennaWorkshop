/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateExposureProject, type ExposureProjectInput } from './exposureProject';
import type { ExposureScreenStatus } from './exposureScreen';

export type ExposureSensitivityVariable = 'transmitter-power' | 'duty-cycle' | 'antenna-height' | 'plan-distance';

export interface ExposureSensitivityOptions {
  sourceId: string;
  pointId: string;
  variable: ExposureSensitivityVariable;
  minimumValue: number;
  maximumValue: number;
  sampleCount?: number;
}

export interface ExposureSensitivitySample {
  inputValue: number;
  totalFractionOfReferenceLevel: number | null;
  status: ExposureScreenStatus | 'invalid';
}

export interface ExposureSensitivityCrossing {
  inputValue: number;
  direction: 'rising' | 'falling';
}

export interface ExposureSensitivityResult {
  variable: ExposureSensitivityVariable;
  sourceId: string;
  pointId: string;
  currentInputValue: number;
  currentFractionOfReferenceLevel: number;
  screeningTriggerFraction: number;
  samples: ExposureSensitivitySample[];
  thresholdCrossings: ExposureSensitivityCrossing[];
}

export interface ExposureSensitivityRange {
  minimumValue: number;
  maximumValue: number;
  currentValue: number;
}

export function interpolateSensitivityCrossings(samples: ExposureSensitivitySample[], thresholdFraction: number): ExposureSensitivityCrossing[] {
  if (!Number.isFinite(thresholdFraction) || thresholdFraction < 0) throw new RangeError('Sensitivity threshold must be zero or greater.');
  const crossings: ExposureSensitivityCrossing[] = [];
  for (let index = 0; index < samples.length - 1; index += 1) {
    const first = samples[index];
    const second = samples[index + 1];
    if (first.totalFractionOfReferenceLevel === null || second.totalFractionOfReferenceLevel === null || first.status === 'method-inapplicable' || second.status === 'method-inapplicable') continue;
    const firstDelta = first.totalFractionOfReferenceLevel - thresholdFraction;
    const secondDelta = second.totalFractionOfReferenceLevel - thresholdFraction;
    if (firstDelta === 0) {
      crossings.push({ inputValue: first.inputValue, direction: secondDelta >= firstDelta ? 'rising' : 'falling' });
      continue;
    }
    if (firstDelta * secondDelta > 0 || secondDelta === firstDelta) continue;
    const position = -firstDelta / (secondDelta - firstDelta);
    crossings.push({
      inputValue: first.inputValue + (second.inputValue - first.inputValue) * position,
      direction: secondDelta > firstDelta ? 'rising' : 'falling'
    });
  }
  const last = samples.at(-1);
  if (last?.totalFractionOfReferenceLevel === thresholdFraction && last.status !== 'method-inapplicable') {
    const previous = samples.at(-2)?.totalFractionOfReferenceLevel;
    crossings.push({ inputValue: last.inputValue, direction: previous === null || previous === undefined || last.totalFractionOfReferenceLevel >= previous ? 'rising' : 'falling' });
  }
  return crossings.filter((crossing, index) => index === 0 || Math.abs(crossing.inputValue - crossings[index - 1].inputValue) > 1e-9);
}

function selected(project: ExposureProjectInput, sourceId: string, pointId: string) {
  const source = project.sources.find((candidate) => candidate.id === sourceId);
  const point = project.evaluationPoints.find((candidate) => candidate.id === pointId);
  if (!source) throw new RangeError('The selected sensitivity source does not exist.');
  if (!point) throw new RangeError('The selected sensitivity point does not exist.');
  return { source, point };
}

function currentValue(project: ExposureProjectInput, sourceId: string, pointId: string, variable: ExposureSensitivityVariable) {
  const { source, point } = selected(project, sourceId, pointId);
  if (variable === 'transmitter-power') return source.transmitterPowerWatts;
  if (variable === 'duty-cycle') return source.dutyCyclePercent;
  if (variable === 'antenna-height') return source.antennaCentreHeightMetres;
  return Math.hypot(point.eastOffsetMetres - source.eastOffsetMetres, point.northOffsetMetres - source.northOffsetMetres);
}

export function defaultExposureSensitivityRange(project: ExposureProjectInput, sourceId: string, pointId: string, variable: ExposureSensitivityVariable): ExposureSensitivityRange {
  const current = currentValue(project, sourceId, pointId, variable);
  if (variable === 'transmitter-power') return { minimumValue: Math.max(0.001, current * 0.25), maximumValue: Math.max(1, current * 2), currentValue: current };
  if (variable === 'duty-cycle') return { minimumValue: Math.max(0.01, current * 0.25), maximumValue: Math.min(100, Math.max(current, current * 2)), currentValue: current };
  if (variable === 'antenna-height') return { minimumValue: 0, maximumValue: Math.max(10, current * 2), currentValue: current };
  return { minimumValue: Math.max(0.1, current * 0.25), maximumValue: Math.max(10, current * 2), currentValue: current };
}

function projectAtValue(project: ExposureProjectInput, options: ExposureSensitivityOptions, value: number): ExposureProjectInput {
  const { source, point } = selected(project, options.sourceId, options.pointId);
  const sources = project.sources.map((candidate) => candidate.id !== source.id ? candidate : {
    ...candidate,
    ...(options.variable === 'transmitter-power' ? { transmitterPowerWatts: value } : {}),
    ...(options.variable === 'duty-cycle' ? { dutyCyclePercent: value } : {}),
    ...(options.variable === 'antenna-height' ? { antennaCentreHeightMetres: value } : {})
  });
  let evaluationPoints = project.evaluationPoints;
  if (options.variable === 'plan-distance') {
    const deltaEast = point.eastOffsetMetres - source.eastOffsetMetres;
    const deltaNorth = point.northOffsetMetres - source.northOffsetMetres;
    const currentDistance = Math.hypot(deltaEast, deltaNorth);
    const unitEast = currentDistance === 0 ? 1 : deltaEast / currentDistance;
    const unitNorth = currentDistance === 0 ? 0 : deltaNorth / currentDistance;
    evaluationPoints = project.evaluationPoints.map((candidate) => candidate.id !== point.id ? candidate : {
      ...candidate,
      eastOffsetMetres: source.eastOffsetMetres + unitEast * value,
      northOffsetMetres: source.northOffsetMetres + unitNorth * value
    });
  }
  return { ...project, sources, evaluationPoints };
}

export function calculateExposureSensitivity(project: ExposureProjectInput, options: ExposureSensitivityOptions): ExposureSensitivityResult {
  const sampleCount = options.sampleCount ?? 25;
  if (!Number.isInteger(sampleCount) || sampleCount < 2 || sampleCount > 101) throw new RangeError('Sensitivity sample count must be between 2 and 101.');
  if (!Number.isFinite(options.minimumValue) || !Number.isFinite(options.maximumValue) || options.minimumValue >= options.maximumValue) throw new RangeError('Sensitivity range must have finite, increasing bounds.');
  selected(project, options.sourceId, options.pointId);
  const baseline = calculateExposureProject(project);
  const baselinePoint = baseline.pointResults.find((point) => point.point.id === options.pointId)!;
  const samples = Array.from({ length: sampleCount }, (_, index): ExposureSensitivitySample => {
    const inputValue = options.minimumValue + (options.maximumValue - options.minimumValue) * index / (sampleCount - 1);
    try {
      const result = calculateExposureProject(projectAtValue(project, options, inputValue));
      const pointResult = result.pointResults.find((point) => point.point.id === options.pointId)!;
      return { inputValue, totalFractionOfReferenceLevel: pointResult.aggregate.totalFractionOfReferenceLevel, status: pointResult.status };
    } catch {
      return { inputValue, totalFractionOfReferenceLevel: null, status: 'invalid' };
    }
  });
  return {
    variable: options.variable,
    sourceId: options.sourceId,
    pointId: options.pointId,
    currentInputValue: currentValue(project, options.sourceId, options.pointId, options.variable),
    currentFractionOfReferenceLevel: baselinePoint.aggregate.totalFractionOfReferenceLevel,
    screeningTriggerFraction: baselinePoint.aggregate.screeningTriggerFraction,
    samples,
    thresholdCrossings: interpolateSensitivityCrossings(samples, baselinePoint.aggregate.screeningTriggerFraction)
  };
}
