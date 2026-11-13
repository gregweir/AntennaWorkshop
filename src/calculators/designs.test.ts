/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateBasicYagi, calculateEfhw, calculateFanDipole, calculateFullWaveLoop, calculateGroundMountedVertical, calculateGroundPlane, calculateInvertedV, calculateJpole, calculateMoxon, calculateOcfd, calculateSlimJim } from './designs';

describe('additional antenna calculators', () => {
  it('derives inverted-V construction geometry', () => {
    const result = calculateInvertedV({
      frequencyMHz: 14.2,
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 0,
      includedAngleDegrees: 120
    });
    expect(result.legMetres).toBeCloseTo(5.0141, 4);
    expect(result.endpointSpanMetres).toBeCloseTo(8.6847, 4);
    expect(result.apexDropMetres).toBeCloseTo(2.5071, 4);
  });

  it('calculates a drooped quarter-wave ground plane', () => {
    const result = calculateGroundPlane({
      frequencyMHz: 146,
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 2.5,
      radialCount: 4,
      radialSlopeDegrees: 45
    });
    expect(result.radiatorMetres).toBeCloseTo(0.499868, 6);
    expect(result.totalRadialWireMetres).toBeCloseTo(result.radialMetres * 4, 10);
    expect(result.footprintDiameterMetres).toBeCloseTo(Math.SQRT2 * result.radialMetres, 10);
  });

  it('converts loop perimeter into dimensions for each supported shape', () => {
    const common = { frequencyMHz: 7.1, lengthCorrectionFactor: 1.02, trimAllowancePercent: 0 };
    const square = calculateFullWaveLoop({ ...common, shape: 'square' });
    const triangle = calculateFullWaveLoop({ ...common, shape: 'triangle' });
    const circle = calculateFullWaveLoop({ ...common, shape: 'circle' });
    expect(square.perimeterMetres).toBeCloseTo(43.068776, 6);
    expect(square.primaryDimensionMetres).toBeCloseTo(square.perimeterMetres / 4, 10);
    expect(triangle.primaryDimensionMetres).toBeCloseTo(triangle.perimeterMetres / 3, 10);
    expect(circle.primaryDimensionMetres).toBeCloseTo(circle.perimeterMetres / Math.PI, 10);
  });

  it('rejects geometry outside supported limits', () => {
    expect(() => calculateInvertedV({ frequencyMHz: 7, lengthCorrectionFactor: 0.95, trimAllowancePercent: 0, includedAngleDegrees: 20 })).toThrow(RangeError);
    expect(() => calculateGroundPlane({ frequencyMHz: 7, lengthCorrectionFactor: 0.95, trimAllowancePercent: 0, radialCount: 2, radialSlopeDegrees: 45 })).toThrow(RangeError);
  });

  it('calculates a ground-mounted quarter-wave vertical and radial field', () => {
    const result = calculateGroundMountedVertical({ frequencyMHz: 7.1, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, radialCount: 32, radialLengthMultiplier: 1 });
    expect(result.radiatorMetres).toBeCloseTo(10.279, 3);
    expect(result.radialMetres).toBeCloseTo(result.resonantLengthMetres, 12);
    expect(result.totalRadialWireMetres).toBeCloseTo(result.radialMetres * 32, 12);
    expect(result.radialFieldDiameterMetres).toBeCloseTo(result.radialMetres * 2, 12);
  });

  it('rejects unsupported ground-mounted radial systems', () => {
    expect(() => calculateGroundMountedVertical({ frequencyMHz: 7.1, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, radialCount: 3, radialLengthMultiplier: 1 })).toThrow(RangeError);
    expect(() => calculateGroundMountedVertical({ frequencyMHz: 7.1, lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, radialCount: 32, radialLengthMultiplier: 2.5 })).toThrow(RangeError);
  });

  it('calculates an EFHW radiator and nominal transformer result', () => {
    const result = calculateEfhw({
      frequencyMHz: 7.1,
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 2.5,
      transformerRatio: 49,
      estimatedEndImpedanceOhms: 2450
    });
    expect(result.radiatorMetres).toBeCloseTo(20.557951, 6);
    expect(result.transformedImpedanceOhms).toBe(50);
    expect(result.turnsRatio).toBe(7);
    result.harmonicFrequenciesMHz.forEach((item, index) => {
      expect(item.frequencyMHz).toBeCloseTo([7.1, 14.2, 21.3, 28.4][index], 10);
    });
  });

  it('rejects unsupported EFHW transformer assumptions', () => {
    expect(() => calculateEfhw({ frequencyMHz: 7.1, lengthCorrectionFactor: 0.95, trimAllowancePercent: 0, transformerRatio: 2, estimatedEndImpedanceOhms: 2450 })).toThrow(RangeError);
  });

  it('calculates unequal OCFD legs and nominal transformation', () => {
    const result = calculateOcfd({
      frequencyMHz: 7.1,
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 2.5,
      feedpointPercentFromEnd: 33.333,
      transformerRatio: 4,
      estimatedFeedpointImpedanceOhms: 200
    });
    expect(result.shortLegMetres).toBeCloseTo(6.8526, 4);
    expect(result.longLegMetres).toBeCloseTo(13.7054, 4);
    expect(result.legLengthRatio).toBeCloseTo(2, 4);
    expect(result.transformedImpedanceOhms).toBe(50);
    expect(result.turnsRatio).toBe(2);
  });

  it('rejects an OCFD feedpoint beyond the supported range', () => {
    expect(() => calculateOcfd({ frequencyMHz: 7.1, lengthCorrectionFactor: 0.95, trimAllowancePercent: 0, feedpointPercentFromEnd: 5, transformerRatio: 4, estimatedFeedpointImpedanceOhms: 200 })).toThrow(RangeError);
  });

  it('calculates and sorts independently cut fan-dipole elements', () => {
    const result = calculateFanDipole({
      frequenciesMHz: [28.4, 7.1, 14.2],
      lengthCorrectionFactor: 0.95,
      trimAllowancePercent: 2.5
    });
    expect(result.elements.map((element) => element.frequencyMHz)).toEqual([7.1, 14.2, 28.4]);
    expect(result.elements[0].cutTotalMetres).toBeCloseTo(20.557951, 6);
    expect(result.elements[1].cutTotalMetres).toBeCloseTo(result.elements[0].cutTotalMetres / 2, 10);
    expect(result.longestSpanMetres).toBe(result.elements[0].cutTotalMetres);
    expect(result.totalWireMetres).toBeCloseTo(result.elements.reduce((total, element) => total + element.cutTotalMetres, 0), 12);
  });

  it('rejects duplicate or unsupported fan-dipole frequency sets', () => {
    expect(() => calculateFanDipole({ frequenciesMHz: [7.1], lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5 })).toThrow(RangeError);
    expect(() => calculateFanDipole({ frequenciesMHz: [7.1, 7.1], lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5 })).toThrow(RangeError);
    expect(() => calculateFanDipole({ frequenciesMHz: [7.1, 14.2, 21.2, 28.4, 50.1, 144.2, 432.1], lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5 })).toThrow(RangeError);
  });

  it('calculates a twin-lead J-pole as 3/4 and 1/4 wavelength elements', () => {
    const result = calculateJpole({
      frequencyMHz: 146,
      lengthCorrectionFactor: 0.83,
      trimAllowancePercent: 2.5,
      feedpointPercentOfStub: 7.5
    });
    expect(result.longElementMetres).toBeCloseTo(1.3102, 4);
    expect(result.matchingStubMetres).toBeCloseTo(result.longElementMetres / 3, 10);
    expect(result.halfWaveRadiatorMetres).toBeCloseTo(result.matchingStubMetres * 2, 10);
    expect(result.feedpointFromShortMetres).toBeCloseTo(result.matchingStubMetres * 0.075, 10);
  });

  it('rejects an impractical J-pole tap position', () => {
    expect(() => calculateJpole({ frequencyMHz: 146, lengthCorrectionFactor: 0.83, trimAllowancePercent: 0, feedpointPercentOfStub: 30 })).toThrow(RangeError);
  });

  it('calculates coherent Slim Jim conductor segments', () => {
    const result = calculateSlimJim({
      frequencyMHz: 146,
      lengthCorrectionFactor: 0.83,
      trimAllowancePercent: 2.5,
      feedpointPercentOfStub: 7.5,
      gapPercentOfStub: 5
    });
    expect(result.overallHeightMetres).toBeCloseTo(1.3102, 4);
    expect(result.interruptionGapMetres).toBeCloseTo(result.matchingStubMetres * 0.05, 10);
    expect(result.upperFoldedSectionMetres + result.interruptionGapMetres + result.matchingStubMetres).toBeCloseTo(result.overallHeightMetres, 10);
    expect(result.totalConductorMetres).toBeCloseTo(result.overallHeightMetres + result.matchingStubMetres + result.upperFoldedSectionMetres, 10);
  });

  it('rejects an unsupported Slim Jim gap', () => {
    expect(() => calculateSlimJim({ frequencyMHz: 146, lengthCorrectionFactor: 0.83, trimAllowancePercent: 0, feedpointPercentOfStub: 7.5, gapPercentOfStub: 20 })).toThrow(RangeError);
  });

  it('reproduces the ARRL 435 MHz MoxGen reference dimensions', () => {
    const result = calculateMoxon({ frequencyMHz: 435, conductorDiameterMillimetres: 2.05232 });
    const metresPerInch = 0.0254;
    expect(result.aMetres / metresPerInch).toBeCloseTo(9.73, 2);
    expect(result.bMetres / metresPerInch).toBeCloseTo(1.25, 2);
    expect(result.cMetres / metresPerInch).toBeCloseTo(0.49, 2);
    expect(result.dMetres / metresPerInch).toBeCloseTo(1.88, 2);
    expect(result.eMetres).toBeCloseTo(result.bMetres + result.cMetres + result.dMetres, 12);
  });

  it('rejects Moxon conductor ratios outside the regression range', () => {
    expect(() => calculateMoxon({ frequencyMHz: 435, conductorDiameterMillimetres: 0.001 })).toThrow(RangeError);
    expect(() => calculateMoxon({ frequencyMHz: 435, conductorDiameterMillimetres: 20 })).toThrow(RangeError);
  });

  it('scales the NBS three-element Yagi reference geometry', () => {
    const result = calculateBasicYagi({ frequencyMHz: 146 });
    expect(result.reflectorMetres / result.wavelengthMetres).toBeCloseTo(0.482, 12);
    expect(result.drivenElementMetres / result.wavelengthMetres).toBeCloseTo(0.5, 12);
    expect(result.directorMetres / result.wavelengthMetres).toBeCloseTo(0.424, 12);
    expect(result.boomLengthMetres / result.wavelengthMetres).toBeCloseTo(0.4, 12);
    expect(result.referenceElementDiameterMetres / result.wavelengthMetres).toBeCloseTo(0.0085, 12);
    expect(result.constructionToleranceMetres / result.wavelengthMetres).toBeCloseTo(0.003, 12);
  });

  it('rejects an invalid basic Yagi frequency', () => {
    expect(() => calculateBasicYagi({ frequencyMHz: 0 })).toThrow(RangeError);
    expect(() => calculateBasicYagi({ frequencyMHz: Number.NaN })).toThrow(RangeError);
  });
});
