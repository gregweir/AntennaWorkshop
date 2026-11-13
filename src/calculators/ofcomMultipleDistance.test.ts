/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateOfcomMultipleDistance, type OfcomMultipleSourceInput } from './ofcomMultipleDistance';

const source = (id: string, frequencyMHz: number, overrides: Partial<OfcomMultipleSourceInput> = {}): OfcomMultipleSourceInput => ({
  id, label: `Source ${id}`, maximumRadiatedPowerWatts: 100, powerBasis: 'EIRP', maximumTransmitSecondsInSixMinutes: 60,
  frequencyMHz, antennaLargestDimensionMetres: 0.2, ...overrides
});

describe('Ofcom conservative multiple-transmitter distance', () => {
  it('reproduces Ofcom’s published 450 and 1800 MHz example', () => {
    const result = calculateOfcomMultipleDistance({ sources: [source('a', 450), source('b', 1800)], highReflectionSurface: false });
    expect(result.totalEirpWatts).toBe(200);
    expect(result.combinedTransmitSeconds).toBe(120);
    expect(result.evaluations).toHaveLength(2);
    expect(result.governingFrequencyMHz).toBe(450);
    expect(result.complianceDistanceMetres).toBeCloseTo(2.46, 2);
  });

  it('normalizes ERP before summing total power', () => {
    const result = calculateOfcomMultipleDistance({ sources: [source('a', 145, { maximumRadiatedPowerWatts: 10, powerBasis: 'ERP' }), source('b', 145, { maximumRadiatedPowerWatts: 20 })], highReflectionSurface: false });
    expect(result.totalEirpWatts).toBeCloseTo(36.4);
    expect(result.evaluations).toHaveLength(1);
    expect(result.evaluations[0].sourceIdsAtFrequency).toEqual(['a', 'b']);
  });

  it('caps combined transmitter time at the calculator’s six-minute maximum', () => {
    const result = calculateOfcomMultipleDistance({ sources: [source('a', 145, { maximumTransmitSecondsInSixMinutes: 240 }), source('b', 433, { maximumTransmitSecondsInSixMinutes: 240 })], highReflectionSurface: false });
    expect(result.uncappedCombinedTransmitSeconds).toBe(480);
    expect(result.combinedTransmitSeconds).toBe(360);
    expect(result.transmissionTimeCapped).toBe(true);
  });

  it('selects the largest distance and propagates method limitations', () => {
    const result = calculateOfcomMultipleDistance({ sources: [source('a', 450, { antennaLargestDimensionMetres: 1 }), source('b', 1800)], highReflectionSurface: true });
    expect(result.status).toBe('method-limitation');
    expect(result.limitations).toHaveLength(2);
  });

  it('rejects malformed source collections and values', () => {
    expect(() => calculateOfcomMultipleDistance({ sources: [source('a', 145)], highReflectionSurface: false })).toThrow(RangeError);
    expect(() => calculateOfcomMultipleDistance({ sources: [source('a', 145), source('a', 433)], highReflectionSurface: false })).toThrow(RangeError);
    expect(() => calculateOfcomMultipleDistance({ sources: [source('a', 0.9), source('b', 433)], highReflectionSurface: false })).toThrow(RangeError);
    expect(() => calculateOfcomMultipleDistance({ sources: [source('a', 145, { maximumTransmitSecondsInSixMinutes: 0 }), source('b', 433)], highReflectionSurface: false })).toThrow(RangeError);
    expect(() => calculateOfcomMultipleDistance({ sources: [source('a', 145, { maximumTransmitSecondsInSixMinutes: 361 }), source('b', 433)], highReflectionSurface: false })).toThrow(RangeError);
  });
});
