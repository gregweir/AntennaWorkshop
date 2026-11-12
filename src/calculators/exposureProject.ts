/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import {
  calculateExposureAggregation,
  type ExposureAggregationResult
} from './exposureAggregation';
import {
  calculateExposureScreen,
  type ExposureScreenResult,
  type ExposureScreenStatus
} from './exposureScreen';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';

export interface ExposureProjectSourceInput {
  id: string;
  label: string;
  frequencyMHz: number;
  transmitterPowerWatts: number;
  dutyCyclePercent: number;
  feedSystemLossDb: number;
  antennaGainDbi: number;
  antennaLargestDimensionMetres: number;
  antennaCentreHeightMetres: number;
  linkedModels?: {
    antennaDesignId: string;
    antennaDesignVersion: string;
    feedSystemId: string;
    feedSystemVersion: string;
  };
}

export interface ExposureEvaluationPointInput {
  id: string;
  label: string;
  horizontalDistanceMetres: number;
  heightMetres: number;
}

export interface ExposureProjectInput {
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  sourceInventoryComplete: boolean;
  sources: ExposureProjectSourceInput[];
  evaluationPoints: ExposureEvaluationPointInput[];
}

export interface ExposureProjectSourceResult {
  source: ExposureProjectSourceInput;
  separationDistanceMetres: number;
  screen: ExposureScreenResult;
}

export interface ExposureProjectPointResult {
  point: ExposureEvaluationPointInput;
  status: ExposureScreenStatus;
  aggregate: ExposureAggregationResult;
  sourceResults: ExposureProjectSourceResult[];
}

export interface ExposureProjectResult {
  status: ExposureScreenStatus;
  jurisdiction: ExposureJurisdiction;
  environment: ExposureEnvironment;
  sourceInventoryComplete: boolean;
  pointResults: ExposureProjectPointResult[];
  worstPointId: string;
}

export const EXPOSURE_PROJECT_MODEL = {
  id: 'multi-source-multi-point-far-field-project',
  version: '1.0.0',
  reviewedOn: '2026-11-11'
} as const;

function validateIdentity(id: string, label: string, ids: Set<string>, noun: string) {
  if (!id || ids.has(id)) throw new RangeError(`Every ${noun} must have a unique identifier.`);
  ids.add(id);
  if (!label.trim()) throw new RangeError(`Every ${noun} must have a label.`);
}

function validateFinite(value: number, label: string, minimum: number, maximum: number) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function overallStatus(pointResults: ExposureProjectPointResult[]): ExposureScreenStatus {
  if (pointResults.some((point) => point.status === 'method-inapplicable')) return 'method-inapplicable';
  if (pointResults.some((point) => point.status === 'further-analysis-required')) return 'further-analysis-required';
  if (pointResults.some((point) => point.status === 'screening-inconclusive')) return 'screening-inconclusive';
  return 'below-screening-trigger';
}

export function calculateExposureProject(input: ExposureProjectInput): ExposureProjectResult {
  if (input.sources.length === 0 || input.sources.length > 8) {
    throw new RangeError('Provide between one and eight station RF sources.');
  }
  if (input.evaluationPoints.length === 0 || input.evaluationPoints.length > 12) {
    throw new RangeError('Provide between one and twelve evaluation points.');
  }

  const sourceIds = new Set<string>();
  for (const source of input.sources) {
    validateIdentity(source.id, source.label, sourceIds, 'station RF source');
    validateFinite(source.antennaCentreHeightMetres, 'Antenna centre height', 0, 100_000);
  }
  const pointIds = new Set<string>();
  for (const point of input.evaluationPoints) {
    validateIdentity(point.id, point.label, pointIds, 'evaluation point');
    validateFinite(point.horizontalDistanceMetres, 'Horizontal distance', 0, 1_000_000);
    validateFinite(point.heightMetres, 'Evaluation-point height', 0, 100_000);
  }

  const pointResults = input.evaluationPoints.map((point): ExposureProjectPointResult => {
    const sourceResults = input.sources.map((source): ExposureProjectSourceResult => {
      const separationDistanceMetres = Math.hypot(
        point.horizontalDistanceMetres,
        source.antennaCentreHeightMetres - point.heightMetres
      );
      if (separationDistanceMetres < 0.001) {
        throw new RangeError('An evaluation point cannot coincide with an antenna radiation centre.');
      }
      const screen = calculateExposureScreen({
        jurisdiction: input.jurisdiction,
        environment: input.environment,
        frequencyMHz: source.frequencyMHz,
        transmitterPowerWatts: source.transmitterPowerWatts,
        dutyCyclePercent: source.dutyCyclePercent,
        feedSystemLossDb: source.feedSystemLossDb,
        antennaGainDbi: source.antennaGainDbi,
        antennaLargestDimensionMetres: source.antennaLargestDimensionMetres,
        separationDistanceMetres,
        nearbySourcesAssessed: true
      });
      return { source, separationDistanceMetres, screen };
    });
    const aggregate = calculateExposureAggregation(
      input.jurisdiction,
      input.environment,
      sourceResults.map(({ source, screen }) => ({
        id: source.id,
        label: source.label,
        frequencyMHz: source.frequencyMHz,
        powerDensityWattsPerSquareMetre: screen.estimatedPowerDensityWattsPerSquareMetre
      })),
      input.sourceInventoryComplete
    );
    const status: ExposureScreenStatus = sourceResults.some(({ screen }) => screen.status === 'method-inapplicable')
      ? 'method-inapplicable'
      : aggregate.status;
    return { point, status, aggregate, sourceResults };
  });

  const worstPoint = pointResults.reduce((worst, point) =>
    point.aggregate.totalFractionOfReferenceLevel > worst.aggregate.totalFractionOfReferenceLevel ? point : worst
  );

  return {
    status: overallStatus(pointResults),
    jurisdiction: input.jurisdiction,
    environment: input.environment,
    sourceInventoryComplete: input.sourceInventoryComplete,
    pointResults,
    worstPointId: worstPoint.point.id
  };
}
