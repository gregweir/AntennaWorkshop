/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { nearestTouchstonePointIndex, parseTouchstoneS1p, summarizeTouchstoneRanges } from './touchstone';

describe('Touchstone one-port parser', () => {
  it('parses RI data and derives impedance, SWR, and return loss', () => {
    const sweep = parseTouchstoneS1p('! analyser export\n# MHz S RI R 50\n100 0 0\n110 0.5 0');
    expect(sweep).toMatchObject({ format: 'RI', referenceImpedanceOhms: 50 });
    expect(sweep.points[0]).toMatchObject({ frequencyHz: 100e6, resistanceOhms: 50, reactanceOhms: 0, swr: 1 });
    expect(sweep.points[0].returnLossDb).toBe(Number.POSITIVE_INFINITY);
    expect(sweep.points[1].resistanceOhms).toBeCloseTo(150, 10);
    expect(sweep.points[1].swr).toBeCloseTo(3, 10);
    expect(sweep.points[1].returnLossDb).toBeCloseTo(6.0206, 4);
  });

  it('supports MA and DB angle formats with frequency units', () => {
    const ma = parseTouchstoneS1p('# kHz S MA R 75\n1000 0.5 90');
    expect(ma.points[0].frequencyHz).toBe(1e6);
    expect(ma.points[0].reflectionReal).toBeCloseTo(0, 12);
    expect(ma.points[0].reflectionImaginary).toBeCloseTo(0.5, 12);
    const db = parseTouchstoneS1p('# Hz S DB R 50\n1000000 -6.020599913 180');
    expect(db.points[0].reflectionReal).toBeCloseTo(-0.5, 10);
  });

  it('uses the version 1 defaults when option fields are omitted', () => {
    const sweep = parseTouchstoneS1p('#\n0.0142 0 0');
    expect(sweep).toMatchObject({ format: 'MA', referenceImpedanceOhms: 50 });
    expect(sweep.points[0].frequencyHz).toBeCloseTo(14.2e6, 5);
  });

  it('requires an option line before sweep data', () => {
    expect(() => parseTouchstoneS1p('14.2 0.25 0')).toThrow(/option line/i);
  });

  it('rejects unsupported, malformed, and unordered input', () => {
    expect(() => parseTouchstoneS1p('[Version] 2.0\n# MHz S RI R 50\n1 0 0')).toThrow(/2.x/);
    expect(() => parseTouchstoneS1p('# MHz Z RI R 50\n1 50 0')).toThrow(/scattering/);
    expect(() => parseTouchstoneS1p('# MHz S RI R 50\n2 0 0\n1 0 0')).toThrow(/increasing/);
    expect(() => parseTouchstoneS1p('# MHz S RI R 50\nnot data')).toThrow(/data row/);
    expect(() => parseTouchstoneS1p('# MHz S RI mystery\n1 0 0')).toThrow(/Unsupported Touchstone option/);
    expect(() => parseTouchstoneS1p('! comments only')).toThrow(/No one-port/);
  });

  it('represents an ideal open circuit without producing NaN impedance', () => {
    const point = parseTouchstoneS1p('# MHz S RI R 50\n1 1 0').points[0];
    expect(point.resistanceOhms).toBe(Number.POSITIVE_INFINITY);
    expect(point.reactanceOhms).toBe(0);
  });

  it('locates the nearest measured frequency by index', () => {
    const sweep = parseTouchstoneS1p('# MHz S RI R 50\n14.0 0.4 0\n14.2 0.1 0\n14.4 0.3 0');
    expect(nearestTouchstonePointIndex(sweep.points, 14.11e6)).toBe(1);
    expect(nearestTouchstonePointIndex(sweep.points, 13e6)).toBe(0);
    expect(nearestTouchstonePointIndex(sweep.points, 15e6)).toBe(2);
  });

  it('reviews measured points inside continuous and segmented ranges', () => {
    const sweep = parseTouchstoneS1p('# MHz S RI R 50\n3.4 0.5 0\n3.5 0.4 0\n3.6 0.1 0\n3.75 0.9 0\n3.78 0.2 0\n3.8 0.3 0\n3.9 0.6 0');
    const review = summarizeTouchstoneRanges(sweep, [{ lowerHz: 3.5e6, upperHz: 3.7e6 }, { lowerHz: 3.776e6, upperHz: 3.8e6 }]);
    expect(review.sweepSpansEveryRange).toBe(true);
    expect(review.points.map((point) => point.frequencyHz)).toEqual([3.5e6, 3.6e6, 3.78e6, 3.8e6]);
    expect(review.lowestSwr?.frequencyHz).toBe(3.6e6);
    expect(review.highestSwr?.frequencyHz).toBe(3.5e6);
  });
});
