/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateOfcomComplianceDistance, type OfcomComplianceDistanceInput } from './ofcomComplianceDistance';

const input = (overrides: Partial<OfcomComplianceDistanceInput> = {}): OfcomComplianceDistanceInput => ({
  maximumRadiatedPowerWatts: 200,
  powerBasis: 'EIRP',
  maximumTransmitSecondsInSixMinutes: 120,
  frequencyMHz: 450,
  antennaLargestDimensionMetres: 0.2,
  highReflectionSurface: false,
  ...overrides
});

describe('Ofcom compliance distance', () => {
  it('reproduces Ofcom’s published multiple-transmitter 450 MHz example', () => {
    const result = calculateOfcomComplianceDistance(input());
    expect(result.complianceDistanceMetres).toBeCloseTo(2.46, 2);
    expect(result.averageEirpWatts).toBeCloseTo(66.667, 3);
    expect(result.powerDensityReferenceWattsPerSquareMetre).toBe(2.25);
    expect(result.status).toBe('compliance-distance-calculated');
  });

  it('uses the largest E- or H-field distance below 10 MHz', () => {
    const result = calculateOfcomComplianceDistance(input({ frequencyMHz: 3.5, antennaLargestDimensionMetres: 20 }));
    expect(result.powerDensityReferenceWattsPerSquareMetre).toBeNull();
    expect(result.complianceDistanceMetres).toBe(Math.max(result.distanceFromElectricFieldMetres!, result.distanceFromMagneticFieldMetres!));
  });

  it('preserves the official frequency and reflection boundaries', () => {
    expect(calculateOfcomComplianceDistance(input({ frequencyMHz: 10 })).powerDensityReferenceWattsPerSquareMetre).toBe(2);
    expect(calculateOfcomComplianceDistance(input({ frequencyMHz: 400 })).powerDensityReferenceWattsPerSquareMetre).toBe(2);
    expect(calculateOfcomComplianceDistance(input({ frequencyMHz: 400.0001 })).powerDensityReferenceWattsPerSquareMetre).toBeCloseTo(2.0000005);
    expect(calculateOfcomComplianceDistance(input({ frequencyMHz: 2000 })).powerDensityReferenceWattsPerSquareMetre).toBe(10);
    expect(calculateOfcomComplianceDistance(input({ frequencyMHz: 12 })).reflectionCoefficient).toBe(1);
    expect(calculateOfcomComplianceDistance(input({ frequencyMHz: 12.0001 })).reflectionCoefficient).toBe(0.6);
  });

  it('converts ERP using Ofcom’s 1.64 factor and identifies the low-power branch inclusively', () => {
    const result = calculateOfcomComplianceDistance(input({ powerBasis: 'ERP', maximumRadiatedPowerWatts: 100 / 1.64, maximumTransmitSecondsInSixMinutes: 36 }));
    expect(result.eirpWatts).toBe(100);
    expect(result.averageEirpWatts).toBeLessThanOrEqual(10);
    expect(result.status).toBe('no-further-assessment-required');
  });

  it('flags electrically long antennas and highly reflective surfaces', () => {
    const result = calculateOfcomComplianceDistance(input({ antennaLargestDimensionMetres: 1, highReflectionSurface: true }));
    expect(result.electricallyShortAntenna).toBe(false);
    expect(result.status).toBe('method-limitation');
    expect(result.limitations).toHaveLength(2);
  });

  it('rejects unsupported frequency, time, dimension, power, and basis inputs', () => {
    expect(() => calculateOfcomComplianceDistance(input({ frequencyMHz: 0.999 }))).toThrow(RangeError);
    expect(() => calculateOfcomComplianceDistance(input({ maximumTransmitSecondsInSixMinutes: 361 }))).toThrow(RangeError);
    expect(() => calculateOfcomComplianceDistance(input({ antennaLargestDimensionMetres: 0 }))).toThrow(RangeError);
    expect(() => calculateOfcomComplianceDistance(input({ maximumRadiatedPowerWatts: 0 }))).toThrow(RangeError);
    expect(() => calculateOfcomComplianceDistance(input({ powerBasis: 'watts' as 'EIRP' }))).toThrow(RangeError);
  });
});
