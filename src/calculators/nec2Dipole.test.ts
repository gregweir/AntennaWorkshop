/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { generateNec2Dipole } from './nec2Dipole';

const input = () => ({ frequencyMHz: 14.2, spanMetres: 10.03, heightMetres: 10, conductorDiameterMillimetres: 1.6, segmentCount: 21, ground: 'free-space' as const });

describe('bounded NEC-2 dipole export', () => {
  it('emits an 80-column GW card and centre-segment voltage source', () => {
    const result = generateNec2Dipole(input());
    const lines = result.deck.trimEnd().split('\n');
    const gw = lines.find((line) => line.startsWith('GW'))!;
    expect(gw).toHaveLength(80);
    expect(gw.slice(2, 5)).toBe('  1');
    expect(gw.slice(5, 10)).toBe('   21');
    expect(result.centreSegment).toBe(11);
    expect(lines.find((line) => line.startsWith('EX'))?.slice(10, 15)).toBe('   11');
    expect(lines.filter((line) => ['GW', 'GN', 'FR', 'EX'].includes(line.slice(0, 2))).every((line) => line.length === 80)).toBe(true);
    expect(lines.filter((line) => line.startsWith('CM')).every((line) => line.length <= 80)).toBe(true);
    expect(lines.at(-2)).toBe('XQ');
    expect(lines.at(-1)).toBe('EN');
  });

  it('encodes free space and perfect ground explicitly', () => {
    expect(generateNec2Dipole(input()).deck).toContain('GE  0\nGN -1');
    const ground = generateNec2Dipole({ ...input(), ground: 'perfect-ground' });
    expect(ground.deck).toContain('GE  1\nGN  1');
    expect(ground.deck).toContain(' 10.000000');
  });

  it('reports segmentation ratios', () => {
    const result = generateNec2Dipole(input());
    expect(result.segmentLengthWavelengths).toBeLessThan(0.05);
    expect(result.segmentLengthToRadius).toBeGreaterThan(8);
  });

  it('rejects even, overlong, extremely short, thick-wire, and ground-contact models', () => {
    expect(() => generateNec2Dipole({ ...input(), segmentCount: 20 })).toThrow(/odd integer/);
    expect(() => generateNec2Dipole({ ...input(), segmentCount: 3 })).toThrow(/0.05 wavelength/);
    expect(() => generateNec2Dipole({ ...input(), segmentCount: 999 })).toThrow(/0.001 wavelength/);
    expect(() => generateNec2Dipole({ ...input(), conductorDiameterMillimetres: 200 })).toThrow(/eight conductor radii/);
    expect(() => generateNec2Dipole({ ...input(), ground: 'perfect-ground', heightMetres: 0 })).toThrow(/ten conductor radii/);
  });
});
