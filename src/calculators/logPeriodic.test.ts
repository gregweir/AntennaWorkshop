/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateLogPeriodic, LOG_PERIODIC_MODEL } from './logPeriodic';

const referenceInput = {
  lowerFrequencyMHz: 144,
  upperFrequencyMHz: 148,
  tau: 0.92,
  sigma: 0.12,
  activeRegionBandwidthFactor: 1.46,
  elementCutAllowancePercent: 2.5
};

describe('calculateLogPeriodic', () => {
  it('creates a Carrel-scaled six-element geometry for the 2 m band', () => {
    const result = calculateLogPeriodic(referenceInput);

    expect(result.elementCount).toBe(6);
    expect(result.apexHalfAngleDegrees).toBeCloseTo(9.462322, 6);
    expect(result.longestElementMetres).toBeCloseTo(1.040946, 6);
    expect(result.shortestElementMetres).toBeCloseTo(0.686068, 6);
    expect(result.boomSpanMetres).toBeCloseTo(1.064633, 6);
    expect(result.totalElementConductorMetres).toBeCloseTo(5.250091, 6);
    expect(result.actualStructureBandwidthRatio).toBeCloseTo(1.517263, 6);
    expect(result.shortestElementHalfWaveFrequencyMHz).toBeCloseTo(218.48587, 5);
    expect(result.maximumTerminationExtensionMetres).toBeCloseTo(0.260237, 6);
    expect(result.elements[0]).toMatchObject({ number: 1, connection: 'A-left / B-right' });
    expect(result.elements[1]).toMatchObject({ number: 2, connection: 'B-left / A-right' });
    expect(result.elements[0].spacingToNextMetres).toBeCloseTo(0.249827, 6);
    expect(result.elements[5].spacingToNextMetres).toBe(0);
  });

  it('preserves the geometric progression for every element and spacing', () => {
    const result = calculateLogPeriodic(referenceInput);

    for (let index = 1; index < result.elements.length; index += 1) {
      expect(result.elements[index].designLengthMetres / result.elements[index - 1].designLengthMetres).toBeCloseTo(referenceInput.tau, 12);
      expect(result.elements[index - 1].spacingToNextMetres / (2 * result.elements[index - 1].designLengthMetres)).toBeCloseTo(referenceInput.sigma, 12);
    }
  });

  it('warns about unsupported or fragile planning choices', () => {
    const result = calculateLogPeriodic({ ...referenceInput, sigma: 0.04, activeRegionBandwidthFactor: 1, elementCutAllowancePercent: 0 });

    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('below σ = 0.05'),
      expect.stringContaining('No structural bandwidth reserve'),
      expect.stringContaining('No element trimming')
    ]));
  });

  it('accepts the documented calculator boundaries', () => {
    const minimums = calculateLogPeriodic({ lowerFrequencyMHz: 0.001, upperFrequencyMHz: 0.002, tau: 0.5, sigma: 0.01, activeRegionBandwidthFactor: 1, elementCutAllowancePercent: 0 });
    const maximums = calculateLogPeriodic({ lowerFrequencyMHz: 299_999, upperFrequencyMHz: 300_000, tau: 0.5, sigma: 0.5, activeRegionBandwidthFactor: 5, elementCutAllowancePercent: 25 });

    expect(minimums.elements.length).toBeGreaterThanOrEqual(2);
    expect(maximums.elements.length).toBeGreaterThanOrEqual(2);
    expect(maximums.elements[0].cutLengthMetres).toBeCloseTo(maximums.longestElementMetres * 1.25, 12);
  });

  it('rejects invalid ranges and excessive element counts', () => {
    expect(() => calculateLogPeriodic({ ...referenceInput, upperFrequencyMHz: 144 })).toThrow(/greater than lower/);
    expect(() => calculateLogPeriodic({ ...referenceInput, tau: 1 })).toThrow(/Tau/);
    expect(() => calculateLogPeriodic({ ...referenceInput, sigma: 0 })).toThrow(/Sigma/);
    expect(() => calculateLogPeriodic({ ...referenceInput, activeRegionBandwidthFactor: 0.9 })).toThrow(/Active-region/);
    expect(() => calculateLogPeriodic({ ...referenceInput, lowerFrequencyMHz: 0.001, upperFrequencyMHz: 300_000, tau: 0.99 })).toThrow(/more than 96/);
  });

  it('carries versioned source provenance', () => {
    expect(LOG_PERIODIC_MODEL).toMatchObject({
      id: 'carrel-log-periodic-geometry',
      version: '1.0.0',
      reviewedOn: '2026-11-13'
    });
    expect(LOG_PERIODIC_MODEL.sources).toHaveLength(2);
  });
});
