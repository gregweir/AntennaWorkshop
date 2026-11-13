/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateCompactReceive, COMPACT_RECEIVE_MODEL, COMPACT_RECEIVE_PRESETS } from './compactReceive';

const referenceInput = {
  frequencyMHz: 1.9,
  geometry: 'flag' as const,
  horizontalSpanMetres: 8.84,
  verticalHeightMetres: 4.27,
  bottomClearanceMetres: 1.83,
  receiveBearingDegrees: 45,
  terminationResistanceOhms: 945,
  assumedAntennaImpedanceOhms: 945,
  feedlineImpedanceOhms: 50,
  wireCutAllowancePercent: 2.5
};

describe('calculateCompactReceive', () => {
  it('plans the documented Flag geometry and direction convention', () => {
    const result = calculateCompactReceive(referenceInput);

    expect(result.designWireLengthMetres).toBeCloseTo(26.22, 10);
    expect(result.cutWireLengthMetres).toBeCloseTo(26.8755, 10);
    expect(result.impedanceTransformationRatio).toBeCloseTo(18.9, 10);
    expect(result.transformerTurnsRatio).toBeCloseTo(Math.sqrt(18.9), 10);
    expect(result.receiveCompassPoint).toBe('NE');
    expect(result.nullBearingDegrees).toBe(225);
    expect(result.directionDescription).toContain('feed end at 45° NE');
    expect(result.directionDescription).toContain('termination at 225° SW');
    expect(result.requiresGroundReturns).toBe(false);
    expect(result.warnings).toEqual([]);
  });

  it('calculates a point-fed Pennant from one vertical and two sloping sides', () => {
    const result = calculateCompactReceive({ ...referenceInput, geometry: 'pennant', terminationResistanceOhms: 860, assumedAntennaImpedanceOhms: 903 });

    expect(result.slopingSideMetres).toBeCloseTo(Math.hypot(8.84, 4.27 / 2), 10);
    expect(result.designWireLengthMetres).toBeCloseTo(4.27 + 2 * Math.hypot(8.84, 4.27 / 2), 10);
    expect(result.terminationDifferencePercent).toBeLessThan(5);
    expect(result.warnings).toEqual([]);
  });

  it('calculates an EWE and preserves its ground-system warning', () => {
    const preset = COMPACT_RECEIVE_PRESETS.ewe;
    const result = calculateCompactReceive({ ...referenceInput, geometry: 'ewe', ...preset, receiveBearingDegrees: 270 });

    expect(result.designWireLengthMetres).toBeCloseTo(13.716, 10);
    expect(result.receiveCompassPoint).toBe('W');
    expect(result.nullCompassPoint).toBe('E');
    expect(result.requiresGroundReturns).toBe(true);
    expect(result.warnings).toContainEqual(expect.stringContaining('depends on two ground returns'));
  });

  it('warns about configuration assumptions without predicting performance', () => {
    const result = calculateCompactReceive({
      ...referenceInput,
      frequencyMHz: 30,
      bottomClearanceMetres: 0,
      terminationResistanceOhms: 100,
      wireCutAllowancePercent: 0
    });

    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('provide practical clearance'),
      expect.stringContaining('more than 25%'),
      expect.stringContaining('No connection'),
      expect.stringContaining('electrically large')
    ]));
  });

  it('accepts supported boundaries and rejects invalid values', () => {
    const minimums = calculateCompactReceive({ ...referenceInput, frequencyMHz: 0.001, horizontalSpanMetres: 0.1, verticalHeightMetres: 0.1, bottomClearanceMetres: 0, receiveBearingDegrees: 0, terminationResistanceOhms: 1, assumedAntennaImpedanceOhms: 1, feedlineImpedanceOhms: 1, wireCutAllowancePercent: 0 });
    const maximums = calculateCompactReceive({ ...referenceInput, frequencyMHz: 300_000, horizontalSpanMetres: 1_000, verticalHeightMetres: 100, bottomClearanceMetres: 100, receiveBearingDegrees: 359.999, terminationResistanceOhms: 10_000, assumedAntennaImpedanceOhms: 10_000, feedlineImpedanceOhms: 1_000, wireCutAllowancePercent: 25 });

    expect(minimums.receiveCompassPoint).toBe('N');
    expect(maximums.cutWireLengthMetres).toBeCloseTo(maximums.designWireLengthMetres * 1.25, 10);
    expect(() => calculateCompactReceive({ ...referenceInput, frequencyMHz: 0 })).toThrow(/Frequency/);
    expect(() => calculateCompactReceive({ ...referenceInput, geometry: 'invalid' as never })).toThrow(/Geometry/);
    expect(() => calculateCompactReceive({ ...referenceInput, receiveBearingDegrees: 360 })).toThrow(/less than 360/);
    expect(() => calculateCompactReceive({ ...referenceInput, feedlineImpedanceOhms: 0 })).toThrow(/Feedline/);
  });

  it('carries versioned source provenance and documented presets', () => {
    expect(COMPACT_RECEIVE_MODEL).toMatchObject({ id: 'compact-terminated-receive-planner', version: '1.0.0', reviewedOn: '2026-11-13' });
    expect(COMPACT_RECEIVE_MODEL.sources).toHaveLength(2);
    expect(COMPACT_RECEIVE_PRESETS.flag.terminationResistanceOhms).toBe(945);
    expect(COMPACT_RECEIVE_PRESETS.pennant.terminationResistanceOhms).toBe(860);
    expect(COMPACT_RECEIVE_PRESETS.ewe.terminationResistanceOhms).toBe(850);
  });
});
