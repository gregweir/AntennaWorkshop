/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateLinkedDipole, LINKED_DIPOLE_MODEL } from './linkedDipole';

const input = { frequenciesMHz: [7.1, 14.2, 28.4], lengthCorrectionFactor: 0.95, trimAllowancePercent: 2.5, linkGapMillimetres: 50, includedAngleDegrees: 120 };

describe('linked multiband dipole planner', () => {
  it('derives outward symmetric segments from the active half-wave lengths', () => {
    const result = calculateLinkedDipole(input);
    expect(result.bands.map((band) => band.frequencyMHz)).toEqual([28.4, 14.2, 7.1]);
    expect(result.segments).toHaveLength(3);
    expect(result.segments[0].finishedEachSideMetres).toBeCloseTo(result.bands[0].finishedLegMetres, 12);
    expect(result.segments[1].finishedEachSideMetres).toBeCloseTo(result.bands[1].finishedLegMetres - result.bands[0].finishedLegMetres, 12);
    expect(result.segments[2].finishedEachSideMetres).toBeCloseTo(result.bands[2].finishedLegMetres - result.bands[1].finishedLegMetres, 12);
  });

  it('keeps trim reserve on the wire segments rather than the mechanical link gaps', () => {
    const result = calculateLinkedDipole(input);
    expect(result.segments[1].cutEachSideMetres).toBeCloseTo(result.segments[1].finishedEachSideMetres * 1.025, 12);
    expect(result.longestMechanicalLegRouteMetres).toBeCloseTo(result.longestCutLegMetres + 0.1, 12);
    expect(result.totalWireCutMetres).toBeCloseTo(result.longestCutLegMetres * 2, 12);
  });

  it('produces an unambiguous symmetric link-state schedule', () => {
    const result = calculateLinkedDipole(input);
    expect(result.configurations[0]).toMatchObject({ frequencyMHz: 28.4, closedLinksPerSide: 0, firstOpenLinkFromFeed: 1 });
    expect(result.configurations[1]).toMatchObject({ frequencyMHz: 14.2, closedLinksPerSide: 1, firstOpenLinkFromFeed: 2 });
    expect(result.configurations[2]).toMatchObject({ frequencyMHz: 7.1, closedLinksPerSide: 2, firstOpenLinkFromFeed: null });
    expect(result.totalLinkCount).toBe(4);
  });

  it('calculates an inverted-V footprint from the complete mechanical route', () => {
    const result = calculateLinkedDipole(input);
    expect(result.supportSpanMetres).toBeCloseTo(2 * result.longestMechanicalLegRouteMetres * Math.sin(Math.PI / 3), 12);
    expect(result.endpointDropMetres).toBeCloseTo(result.longestMechanicalLegRouteMetres * 0.5, 12);
  });

  it('rejects duplicated bands and invalid construction choices', () => {
    expect(() => calculateLinkedDipole({ ...input, frequenciesMHz: [7.1] })).toThrow(RangeError);
    expect(() => calculateLinkedDipole({ ...input, frequenciesMHz: [7.1, 7.1] })).toThrow(RangeError);
    expect(() => calculateLinkedDipole({ ...input, frequenciesMHz: [7.1, 14.2, 21.2, 28.4, 50.1, 144] })).toThrow(RangeError);
    expect(() => calculateLinkedDipole({ ...input, includedAngleDegrees: 59 })).toThrow(RangeError);
    expect(() => calculateLinkedDipole({ ...input, linkGapMillimetres: 501 })).toThrow(RangeError);
  });

  it('retains source provenance and conservative interpretation limits', () => {
    const result = calculateLinkedDipole(input);
    expect(LINKED_DIPOLE_MODEL.sources).toHaveLength(3);
    expect(LINKED_DIPOLE_MODEL.reviewedOn).toBe('2026-11-16');
    expect(result.warnings.join(' ')).toContain('Never change links while transmitting');
    expect(result.warnings.join(' ')).toContain('does not establish installed impedance');
  });
});
