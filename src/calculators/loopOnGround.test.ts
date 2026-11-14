/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateLoopOnGround, LOOP_ON_GROUND_MODEL } from './loopOnGround';

const feet = (value: number) => value * 0.3048;

const referenceInput = {
  frequencyMHz: 7.1,
  sideLengthMetres: feet(15),
  receiveAxisBearingDegrees: 45,
  antennaWindingTurns: 5,
  coaxWindingTurns: 2,
  feedlineImpedanceOhms: 75,
  wireCutAllowancePercent: 2.5
};

describe('calculateLoopOnGround', () => {
  it('plans the published 15-foot square prototype', () => {
    const result = calculateLoopOnGround(referenceInput);

    expect(result.designPerimeterMetres).toBeCloseTo(feet(60), 10);
    expect(result.cutWireLengthMetres).toBeCloseTo(feet(61.5), 10);
    expect(result.diagonalMetres).toBeCloseTo(feet(15) * Math.SQRT2, 10);
    expect(result.enclosedAreaSquareMetres).toBeCloseTo(feet(15) ** 2, 10);
    expect(result.transformerTurnsRatio).toBe(2.5);
    expect(result.transformerImpedanceRatio).toBe(6.25);
    expect(result.nominalReferredAntennaImpedanceOhms).toBeCloseTo(468.75, 10);
    expect(result.warnings).toEqual([]);
  });

  it('maps the bidirectional low-angle axis normal to the feedpoint diagonal', () => {
    const result = calculateLoopOnGround(referenceInput);

    expect(result.receiveCompassPoint).toBe('NE');
    expect(result.reverseReceiveBearingDegrees).toBe(225);
    expect(result.reverseReceiveCompassPoint).toBe('SW');
    expect(result.feedpointBearingDegrees).toBe(315);
    expect(result.feedpointCompassPoint).toBe('NW');
    expect(result.oppositeCornerBearingDegrees).toBe(135);
    expect(result.directionDescription).toContain('45° NE and 225° SW');
  });

  it('warns about one-wavelength circumference, no allowance, and 1:1 winding', () => {
    const result = calculateLoopOnGround({ ...referenceInput, frequencyMHz: 30, antennaWindingTurns: 2, wireCutAllowancePercent: 0 });

    expect(result.warnings).toEqual(expect.arrayContaining([
      expect.stringContaining('at least one wavelength'),
      expect.stringContaining('No allowance'),
      expect.stringContaining('1:1 turns ratio')
    ]));
  });

  it('accepts supported boundaries and rejects invalid inputs', () => {
    const minimums = calculateLoopOnGround({ ...referenceInput, frequencyMHz: 0.001, sideLengthMetres: 0.1, receiveAxisBearingDegrees: 0, antennaWindingTurns: 1, coaxWindingTurns: 1, feedlineImpedanceOhms: 1, wireCutAllowancePercent: 0 });
    const maximums = calculateLoopOnGround({ ...referenceInput, frequencyMHz: 300_000, sideLengthMetres: 1_000, receiveAxisBearingDegrees: 359.999, antennaWindingTurns: 100, coaxWindingTurns: 100, feedlineImpedanceOhms: 1_000, wireCutAllowancePercent: 25 });

    expect(minimums.receiveCompassPoint).toBe('N');
    expect(maximums.cutWireLengthMetres).toBeCloseTo(maximums.designPerimeterMetres * 1.25, 10);
    expect(() => calculateLoopOnGround({ ...referenceInput, frequencyMHz: 0 })).toThrow(/Frequency/);
    expect(() => calculateLoopOnGround({ ...referenceInput, receiveAxisBearingDegrees: 360 })).toThrow(/less than 360/);
    expect(() => calculateLoopOnGround({ ...referenceInput, antennaWindingTurns: 2.5 })).toThrow(/whole number/);
    expect(() => calculateLoopOnGround({ ...referenceInput, feedlineImpedanceOhms: 0 })).toThrow(/Feedline/);
  });

  it('carries versioned source provenance', () => {
    expect(LOOP_ON_GROUND_MODEL).toMatchObject({ id: 'loop-on-ground-receive-planner', version: '1.0.0', reviewedOn: '2026-11-13' });
    expect(LOOP_ON_GROUND_MODEL.sources).toHaveLength(2);
  });
});
