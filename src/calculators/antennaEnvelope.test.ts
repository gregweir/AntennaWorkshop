/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateLargestAntennaDimension } from './antennaEnvelope';

describe('antenna physical envelope', () => {
  it('uses full linear span and the larger inverted-V extent', () => {
    expect(calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: 10 })).toBe(10);
    expect(calculateLargestAntennaDimension({ shape: 'inverted-v', endpointSpanMetres: 8, legMetres: 5 })).toBe(8);
  });

  it('includes diagonals for rectangular and boom-mounted antennas', () => {
    expect(calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: 3, depthMetres: 4 })).toBe(5);
    expect(calculateLargestAntennaDimension({ shape: 'parallel-elements', boomMetres: 4, firstElementMetres: 6, lastElementMetres: 2 })).toBeCloseTo(Math.sqrt(32));
  });

  it('includes vertical-to-radial diagonals and radial-field diameter', () => {
    expect(calculateLargestAntennaDimension({ shape: 'ground-mounted-vertical', radiatorMetres: 4, radialMetres: 3, radialFieldDiameterMetres: 6 })).toBe(6);
    expect(calculateLargestAntennaDimension({ shape: 'ground-plane', radiatorMetres: 5, radialDropMetres: 1, footprintDiameterMetres: 6 })).toBeCloseTo(Math.sqrt(45));
    expect(calculateLargestAntennaDimension({ shape: 'ground-plane', radiatorMetres: 4, radialDropMetres: 0, footprintDiameterMetres: 6 })).toBe(6);
  });

  it('uses a square diagonal and rejects malformed dimensions', () => {
    expect(calculateLargestAntennaDimension({ shape: 'loop', loopShape: 'square', primaryDimensionMetres: 2 })).toBeCloseTo(2 * Math.SQRT2);
    expect(calculateLargestAntennaDimension({ shape: 'loop', loopShape: 'circle', primaryDimensionMetres: 2 })).toBe(2);
    expect(() => calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: 0 })).toThrow(/greater than zero/i);
  });
});
