/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateCoaxialStub, calculateFeedlineBudget, calculateRadiatedPower } from './feedline';

describe('feedline power budget', () => {
  it('applies cable and accessory loss in decibels', () => {
    const result = calculateFeedlineBudget({
      transmitterPowerWatts: 100,
      cableLengthMetres: 50,
      matchedLossDbPer100Metres: 4,
      accessoryLossDb: 1,
      swr: 1
    });
    expect(result.cableLossDb).toBe(2);
    expect(result.pathLossDb).toBe(3);
    expect(result.forwardPowerAtAntennaWatts).toBeCloseTo(50.1187, 4);
    expect(result.acceptedPowerWatts).toBeCloseTo(result.forwardPowerAtAntennaWatts, 10);
    expect(result.returnLossDb).toBe(Number.POSITIVE_INFINITY);
  });

  it('derives reflection quantities from SWR', () => {
    const result = calculateFeedlineBudget({
      transmitterPowerWatts: 100,
      cableLengthMetres: 0,
      matchedLossDbPer100Metres: 0,
      accessoryLossDb: 0,
      swr: 3
    });
    expect(result.reflectionCoefficient).toBe(0.5);
    expect(result.reflectedPowerPercent).toBe(25);
    expect(result.returnLossDb).toBeCloseTo(6.0206, 4);
    expect(result.mismatchLossDb).toBeCloseTo(1.2494, 4);
    expect(result.acceptedPowerWatts).toBe(75);
  });

  it('rejects invalid physical inputs', () => {
    expect(() => calculateFeedlineBudget({ transmitterPowerWatts: 0, cableLengthMetres: 10, matchedLossDbPer100Metres: 3, accessoryLossDb: 0, swr: 1.5 })).toThrow(RangeError);
    expect(() => calculateFeedlineBudget({ transmitterPowerWatts: 100, cableLengthMetres: 10, matchedLossDbPer100Metres: 3, accessoryLossDb: 0, swr: 0.9 })).toThrow(RangeError);
  });
});

describe('coaxial stub length', () => {
  it('reproduces the ARRL 14.1 MHz quarter-wave polyethylene example', () => {
    const result = calculateCoaxialStub({ frequencyMHz: 14.1, velocityFactor: 0.66, fraction: 0.25, termination: 'short', trimAllowancePercent: 0 });
    expect(result.physicalLengthMetres).toBeCloseTo(3.5082, 4);
    expect(result.electricalLengthDegrees).toBe(90);
    expect(result.inputImpedanceBehavior).toBe('high');
  });

  it('maps ideal open and short terminations at quarter and half wavelengths', () => {
    expect(calculateCoaxialStub({ frequencyMHz: 146, velocityFactor: 0.8, fraction: 0.25, termination: 'open', trimAllowancePercent: 5 }).inputImpedanceBehavior).toBe('low');
    expect(calculateCoaxialStub({ frequencyMHz: 146, velocityFactor: 0.8, fraction: 0.5, termination: 'open', trimAllowancePercent: 5 }).inputImpedanceBehavior).toBe('high');
    expect(calculateCoaxialStub({ frequencyMHz: 146, velocityFactor: 0.8, fraction: 0.5, termination: 'short', trimAllowancePercent: 5 }).inputImpedanceBehavior).toBe('low');
  });

  it('rejects invalid stub inputs', () => {
    expect(() => calculateCoaxialStub({ frequencyMHz: 0, velocityFactor: 0.66, fraction: 0.25, termination: 'short', trimAllowancePercent: 5 })).toThrow(RangeError);
    expect(() => calculateCoaxialStub({ frequencyMHz: 14.1, velocityFactor: 1.01, fraction: 0.25, termination: 'short', trimAllowancePercent: 5 })).toThrow(RangeError);
    expect(() => calculateCoaxialStub({ frequencyMHz: 14.1, velocityFactor: 0.66, fraction: 0.25, termination: 'short', trimAllowancePercent: 30 })).toThrow(RangeError);
  });
});

describe('ERP and EIRP', () => {
  it('applies feed-system loss and isotropic antenna gain', () => {
    const result = calculateRadiatedPower({ transmitterPowerWatts: 100, feedSystemLossDb: 2, antennaGainDb: 6, gainReference: 'dBi' });
    expect(result.antennaInputPowerWatts).toBeCloseTo(63.0957, 4);
    expect(result.eirpWatts).toBeCloseTo(251.1886, 4);
    expect(result.antennaGainDbd).toBeCloseTo(3.85, 10);
    expect(result.eirpWatts / result.erpWatts).toBeCloseTo(10 ** (2.15 / 10), 10);
  });

  it('treats zero dBd as unity ERP gain', () => {
    const result = calculateRadiatedPower({ transmitterPowerWatts: 50, feedSystemLossDb: 0, antennaGainDb: 0, gainReference: 'dBd' });
    expect(result.erpWatts).toBeCloseTo(50, 10);
    expect(result.eirpWatts).toBeCloseTo(50 * 10 ** (2.15 / 10), 10);
  });

  it('rejects invalid radiated-power inputs', () => {
    expect(() => calculateRadiatedPower({ transmitterPowerWatts: 0, feedSystemLossDb: 0, antennaGainDb: 0, gainReference: 'dBi' })).toThrow(RangeError);
    expect(() => calculateRadiatedPower({ transmitterPowerWatts: 100, feedSystemLossDb: -1, antennaGainDb: 0, gainReference: 'dBi' })).toThrow(RangeError);
    expect(() => calculateRadiatedPower({ transmitterPowerWatts: 100, feedSystemLossDb: 0, antennaGainDb: 101, gainReference: 'dBi' })).toThrow(RangeError);
  });
});
