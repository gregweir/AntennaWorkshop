/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateK9ay, K9AY_MODEL } from './k9ay';

const feet = (value: number) => value * 0.3048;

const referenceInput = {
  frequencyMHz: 1.9,
  apexHeightMetres: feet(25),
  halfWidthMetres: feet(15),
  lowerCornerHeightMetres: feet(5),
  firstReceiveBearingDegrees: 45,
  selectedDirectionIndex: 0,
  terminationResistanceOhms: 390,
  assumedAntennaImpedanceOhms: 450,
  feedlineImpedanceOhms: 50,
  wireCutAllowancePercent: 4.14
};

describe('calculateK9ay', () => {
  it('plans the published quasi-delta geometry and two-loop wire requirement', () => {
    const result = calculateK9ay(referenceInput);

    expect(result.upperSlopingSideMetres).toBeCloseTo(feet(25), 10);
    expect(result.lowerSlopingSideMetres).toBeCloseTo(feet(Math.hypot(15, 5)), 10);
    expect(result.designWireLengthPerLoopMetres).toBeCloseTo(feet(2 * (25 + Math.hypot(15, 5))), 10);
    expect(result.cutWireLengthPerLoopMetres).toBeCloseTo(feet(85), 2);
    expect(result.totalWireForTwoLoopsMetres).toBeCloseTo(result.cutWireLengthPerLoopMetres * 2, 10);
    expect(result.footprintDiameterMetres).toBeCloseTo(feet(30), 10);
    expect(result.transformerTurnsRatio).toBe(3);
    expect(result.warnings).toEqual([]);
  });

  it('maps two crossed loops and reversal into four receive directions', () => {
    const result = calculateK9ay({ ...referenceInput, selectedDirectionIndex: 3 });

    expect(result.directions.map(({ bearingDegrees, compassPoint }) => `${bearingDegrees} ${compassPoint}`)).toEqual(['45 NE', '135 SE', '225 SW', '315 NW']);
    expect(result.directions.map(({ loop, reversed }) => [loop, reversed])).toEqual([[1, false], [2, false], [1, true], [2, true]]);
    expect(result.selectedDirection).toMatchObject({ bearingDegrees: 315, compassPoint: 'NW', loop: 2, reversed: true, terminationBearingDegrees: 135, terminationCompassPoint: 'SE' });
    expect(result.directionDescription).toContain('Loop 2, reversed state');
    expect(result.directionDescription).toContain('feed end at 315° NW');
  });

  it('warns when the loop is too large electrically or assumptions need review', () => {
    const result = calculateK9ay({ ...referenceInput, frequencyMHz: 7.2, terminationResistanceOhms: 100, wireCutAllowancePercent: 0 });

    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('at least 0.30 wavelength'),
      expect.stringContaining('more than 25%'),
      expect.stringContaining('No allowance')
    ]));
  });

  it('accepts supported boundaries and rejects invalid geometry and switching', () => {
    const minimums = calculateK9ay({ ...referenceInput, frequencyMHz: 0.001, apexHeightMetres: 0.2, halfWidthMetres: 0.1, lowerCornerHeightMetres: 0.1, firstReceiveBearingDegrees: 0, selectedDirectionIndex: 0, terminationResistanceOhms: 1, assumedAntennaImpedanceOhms: 1, feedlineImpedanceOhms: 1, wireCutAllowancePercent: 0 });
    const maximums = calculateK9ay({ ...referenceInput, frequencyMHz: 300_000, apexHeightMetres: 100, halfWidthMetres: 100, lowerCornerHeightMetres: 99.9, firstReceiveBearingDegrees: 359.999, selectedDirectionIndex: 3, terminationResistanceOhms: 10_000, assumedAntennaImpedanceOhms: 10_000, feedlineImpedanceOhms: 1_000, wireCutAllowancePercent: 25 });

    expect(minimums.selectedDirection.compassPoint).toBe('N');
    expect(maximums.cutWireLengthPerLoopMetres).toBeCloseTo(maximums.designWireLengthPerLoopMetres * 1.25, 10);
    expect(() => calculateK9ay({ ...referenceInput, lowerCornerHeightMetres: referenceInput.apexHeightMetres })).toThrow(/below apex/);
    expect(() => calculateK9ay({ ...referenceInput, selectedDirectionIndex: 4 })).toThrow(/whole number/);
    expect(() => calculateK9ay({ ...referenceInput, firstReceiveBearingDegrees: 360 })).toThrow(/less than 360/);
    expect(() => calculateK9ay({ ...referenceInput, feedlineImpedanceOhms: 0 })).toThrow(/Feedline/);
  });

  it('carries versioned source provenance', () => {
    expect(K9AY_MODEL).toMatchObject({ id: 'k9ay-four-direction-loop-planner', version: '1.0.0', reviewedOn: '2026-11-13' });
    expect(K9AY_MODEL.sources).toHaveLength(2);
  });
});
