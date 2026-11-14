/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTransmissionLineTransform } from './transmissionLineTransform';

describe('uniform transmission-line transformation', () => {
  it('reproduces the ARRL 0.3 wavelength Smith-chart example', () => {
    const frequencyMHz = 10;
    const wavelengthMetres = 299_792_458 / (frequencyMHz * 1_000_000);
    const result = calculateTransmissionLineTransform({ frequencyMHz, characteristicImpedanceOhms: 50, physicalLengthMetres: wavelengthMetres * 0.3, velocityFactor: 1, matchedLossDbPer100Metres: 0, loadResistanceOhms: 25, loadReactanceOhms: 25 });
    expect(result.electricalLengthWavelengths).toBeCloseTo(0.3, 12);
    expect(result.inputResistanceOhms).toBeCloseTo(30, 0);
    expect(result.inputReactanceOhms).toBeCloseTo(-33, 0);
    expect(result.loadPoint.swr).toBeCloseTo(2.618034, 6);
    expect(result.inputPoint.swr).toBeCloseTo(result.loadPoint.swr, 10);
    expect(result.reflectionMagnitudeResidual).toBeLessThan(1e-12);
  });

  it('inverts resistance through a quarter-wave line', () => {
    const frequencyMHz = 100;
    const quarterWaveMetres = 299_792_458 / (frequencyMHz * 1_000_000) * 0.66 / 4;
    const result = calculateTransmissionLineTransform({ frequencyMHz, characteristicImpedanceOhms: 50, physicalLengthMetres: quarterWaveMetres, velocityFactor: 0.66, matchedLossDbPer100Metres: 0, loadResistanceOhms: 100, loadReactanceOhms: 0 });
    expect(result.wrappedElectricalLengthDegrees).toBeCloseTo(90, 10);
    expect(result.inputResistanceOhms).toBeCloseTo(25, 10);
    expect(result.inputReactanceOhms).toBeCloseTo(0, 10);
    expect(result.expectedReflectionRotationDegrees).toBeCloseTo(180, 10);
  });

  it('repeats the load every half wavelength', () => {
    const frequencyMHz = 14.2;
    const halfWaveMetres = 299_792_458 / (frequencyMHz * 1_000_000) * 0.8 / 2;
    const result = calculateTransmissionLineTransform({ frequencyMHz, characteristicImpedanceOhms: 75, physicalLengthMetres: halfWaveMetres, velocityFactor: 0.8, matchedLossDbPer100Metres: 0, loadResistanceOhms: 40, loadReactanceOhms: -30 });
    expect(result.inputResistanceOhms).toBeCloseTo(40, 9);
    expect(result.inputReactanceOhms).toBeCloseTo(-30, 9);
  });

  it('attenuates the reflected wave over its round trip', () => {
    const result = calculateTransmissionLineTransform({ frequencyMHz: 100, characteristicImpedanceOhms: 50, physicalLengthMetres: 100, velocityFactor: 0.66, matchedLossDbPer100Metres: 3, loadResistanceOhms: 100, loadReactanceOhms: 0 });
    expect(result.oneWayMatchedLossDb).toBeCloseTo(3, 12);
    expect(result.roundTripReflectionAttenuationDb).toBeCloseTo(6, 12);
    expect(result.loadPoint.reflectionMagnitude).toBeCloseTo(1 / 3, 12);
    expect(result.expectedInputReflectionMagnitude).toBeCloseTo((1 / 3) * 10 ** (-3 / 10), 12);
    expect(result.inputPoint.reflectionMagnitude).toBeCloseTo(result.expectedInputReflectionMagnitude, 12);
    expect(result.inputPoint.swr).toBeCloseTo(1.401140, 6);
    expect(result.reflectionMagnitudeResidual).toBeLessThan(1e-12);
    expect(result.matchedOneWayPowerRemainingPercent).toBeCloseTo(50.1187, 4);
  });

  it('keeps a matched load matched when attenuation is present', () => {
    const result = calculateTransmissionLineTransform({ frequencyMHz: 14.2, characteristicImpedanceOhms: 50, physicalLengthMetres: 30, velocityFactor: 0.8, matchedLossDbPer100Metres: 8, loadResistanceOhms: 50, loadReactanceOhms: 0 });
    expect(result.inputResistanceOhms).toBeCloseTo(50, 10);
    expect(result.inputReactanceOhms).toBeCloseTo(0, 10);
    expect(result.inputPoint.swr).toBeCloseTo(1, 10);
  });

  it('rejects unsupported inputs', () => {
    const valid = { frequencyMHz: 14.2, characteristicImpedanceOhms: 50, physicalLengthMetres: 10, velocityFactor: 0.66, matchedLossDbPer100Metres: 6, loadResistanceOhms: 100, loadReactanceOhms: -50 };
    expect(() => calculateTransmissionLineTransform({ ...valid, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, characteristicImpedanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, physicalLengthMetres: -1 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, velocityFactor: 1.1 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, matchedLossDbPer100Metres: -0.1 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, loadResistanceOhms: Number.NaN })).toThrow(RangeError);
  });
});
