/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import {
  calculateExposureProject,
  type ExposureProjectInput
} from './exposureProject';

const project: ExposureProjectInput = {
  jurisdiction: 'CA',
  environment: 'uncontrolled',
  sourceInventoryComplete: true,
  sources: [
    {
      id: 'vhf', label: 'VHF vertical', frequencyMHz: 146,
      transmitterPowerWatts: 50, dutyCyclePercent: 50, feedSystemLossDb: 1,
      antennaGainDbi: 2.15, antennaLargestDimensionMetres: 1,
      antennaCentreHeightMetres: 10
    },
    {
      id: 'uhf', label: 'UHF vertical', frequencyMHz: 446,
      transmitterPowerWatts: 25, dutyCyclePercent: 25, feedSystemLossDb: 1.5,
      antennaGainDbi: 5, antennaLargestDimensionMetres: 0.5,
      antennaCentreHeightMetres: 12
    }
  ],
  evaluationPoints: [
    { id: 'yard', label: 'Yard', horizontalDistanceMetres: 15, heightMetres: 1.5 },
    { id: 'property-line', label: 'Property line', horizontalDistanceMetres: 30, heightMetres: 1.5 }
  ]
};

describe('integrated exposure project', () => {
  it('derives source separation and aggregates calculated contributions at every point', () => {
    const result = calculateExposureProject(project);
    const yard = result.pointResults[0];
    expect(yard.sourceResults[0].separationDistanceMetres).toBeCloseTo(Math.hypot(15, 8.5), 10);
    expect(yard.aggregate.totalFractionOfReferenceLevel).toBeCloseTo(
      yard.sourceResults.reduce((sum, source) => sum + source.screen.fractionOfReferenceLevel, 0),
      10
    );
    expect(yard.aggregate.contributions.map((source) => source.id)).toEqual(['vhf', 'uhf']);
  });

  it('identifies the point with the greatest normalized exposure', () => {
    const result = calculateExposureProject(project);
    expect(result.worstPointId).toBe('yard');
    expect(result.pointResults[0].aggregate.totalFractionOfReferenceLevel)
      .toBeGreaterThan(result.pointResults[1].aggregate.totalFractionOfReferenceLevel);
  });

  it('marks the project inconclusive until the source inventory is complete', () => {
    const result = calculateExposureProject({ ...project, sourceInventoryComplete: false });
    expect(result.status).toBe('screening-inconclusive');
    expect(result.pointResults.every((point) => point.status === 'screening-inconclusive')).toBe(true);
  });

  it('refuses far-field interpretation when any source is too close to a point', () => {
    const result = calculateExposureProject({
      ...project,
      evaluationPoints: [{ id: 'antenna', label: 'At antenna', horizontalDistanceMetres: 0.05, heightMetres: 10 }]
    });
    expect(result.status).toBe('method-inapplicable');
    expect(result.pointResults[0].status).toBe('method-inapplicable');
  });

  it('escalates when an aggregate point reaches its screening trigger', () => {
    const result = calculateExposureProject({
      ...project,
      sources: project.sources.map((source) => ({ ...source, transmitterPowerWatts: 1000 })),
      evaluationPoints: [{ id: 'close', label: 'Close point', horizontalDistanceMetres: 5, heightMetres: 1.5 }]
    });
    expect(result.pointResults[0].aggregate.totalFractionOfReferenceLevel).toBeGreaterThanOrEqual(0.5);
    expect(result.status).toBe('further-analysis-required');
  });

  it('rejects malformed project geometry and identities', () => {
    expect(() => calculateExposureProject({ ...project, sources: [] })).toThrow(/one and eight/);
    expect(() => calculateExposureProject({ ...project, evaluationPoints: [] })).toThrow(/one and twelve/);
    expect(() => calculateExposureProject({ ...project, sources: [project.sources[0], project.sources[0]] })).toThrow(/unique/);
    expect(() => calculateExposureProject({
      ...project,
      evaluationPoints: [{ id: 'same', label: 'At centre', horizontalDistanceMetres: 0, heightMetres: 10 }],
      sources: [project.sources[0]]
    })).toThrow(/coincide/);
  });
});
