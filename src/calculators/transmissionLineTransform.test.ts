/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTransmissionLineTransform } from './transmissionLineTransform';

describe('lossless transmission-line transformation', () => {
  it('reproduces the ARRL 0.3 wavelength Smith-chart example', () => {
    const frequencyMHz = 10;
    const wavelengthMetres = 299_792_458 / (frequencyMHz * 1_000_000);
    const result = calculateTransmissionLineTransform({ frequencyMHz, characteristicImpedanceOhms: 50, physicalLengthMetres: wavelengthMetres * 0.3, velocityFactor: 1, loadResistanceOhms: 25, loadReactanceOhms: 25 });
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
    const result = calculateTransmissionLineTransform({ frequencyMHz, characteristicImpedanceOhms: 50, physicalLengthMetres: quarterWaveMetres, velocityFactor: 0.66, loadResistanceOhms: 100, loadReactanceOhms: 0 });
    expect(result.wrappedElectricalLengthDegrees).toBeCloseTo(90, 10);
    expect(result.inputResistanceOhms).toBeCloseTo(25, 10);
    expect(result.inputReactanceOhms).toBeCloseTo(0, 10);
    expect(result.expectedReflectionRotationDegrees).toBeCloseTo(180, 10);
  });

  it('repeats the load every half wavelength', () => {
    const frequencyMHz = 14.2;
    const halfWaveMetres = 299_792_458 / (frequencyMHz * 1_000_000) * 0.8 / 2;
    const result = calculateTransmissionLineTransform({ frequencyMHz, characteristicImpedanceOhms: 75, physicalLengthMetres: halfWaveMetres, velocityFactor: 0.8, loadResistanceOhms: 40, loadReactanceOhms: -30 });
    expect(result.inputResistanceOhms).toBeCloseTo(40, 9);
    expect(result.inputReactanceOhms).toBeCloseTo(-30, 9);
  });

  it('rejects unsupported inputs', () => {
    const valid = { frequencyMHz: 14.2, characteristicImpedanceOhms: 50, physicalLengthMetres: 10, velocityFactor: 0.66, loadResistanceOhms: 100, loadReactanceOhms: -50 };
    expect(() => calculateTransmissionLineTransform({ ...valid, frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, characteristicImpedanceOhms: 0 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, physicalLengthMetres: -1 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, velocityFactor: 1.1 })).toThrow(RangeError);
    expect(() => calculateTransmissionLineTransform({ ...valid, loadResistanceOhms: Number.NaN })).toThrow(RangeError);
  });
});
