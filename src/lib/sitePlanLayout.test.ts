/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { createSitePlanViewport, snapSiteCoordinate } from './sitePlanLayout';

describe('interactive site-plan layout', () => {
  it('round-trips signed coordinates while preserving one plan scale', () => {
    const viewport = createSitePlanViewport([
      { eastMetres: -5, northMetres: 2 },
      { eastMetres: 25, northMetres: 12 }
    ]);
    const point = viewport.toCanvas({ eastMetres: 10, northMetres: -2 });
    const roundTrip = viewport.fromCanvas(point);
    expect(roundTrip.eastMetres).toBeCloseTo(10, 10);
    expect(roundTrip.northMetres).toBeCloseTo(-2, 10);
    const eastPixelsPerMetre = viewport.toCanvas({ eastMetres: 1, northMetres: 0 }).x - viewport.toCanvas({ eastMetres: 0, northMetres: 0 }).x;
    const northPixelsPerMetre = viewport.toCanvas({ eastMetres: 0, northMetres: 1 }).y - viewport.toCanvas({ eastMetres: 0, northMetres: 0 }).y;
    expect(Math.abs(northPixelsPerMetre)).toBeCloseTo(eastPixelsPerMetre, 10);
  });

  it('provides a usable minimum extent for coincident positions', () => {
    const viewport = createSitePlanViewport([{ eastMetres: 0, northMetres: 0 }]);
    expect(viewport.maximumEastMetres - viewport.minimumEastMetres).toBeGreaterThanOrEqual(10);
    expect(viewport.eastGridMetres).toContain(0);
    expect(viewport.northGridMetres).toContain(0);
  });

  it('clamps pointer conversion to the visible drawing and snaps precisely', () => {
    const viewport = createSitePlanViewport([{ eastMetres: 0, northMetres: 0 }]);
    expect(viewport.fromCanvas({ x: -100, y: 1000 })).toEqual({
      eastMetres: viewport.minimumEastMetres,
      northMetres: viewport.minimumNorthMetres
    });
    expect(snapSiteCoordinate(-2.46)).toBe(-2.5);
    expect(snapSiteCoordinate(2.46, 1)).toBe(2);
  });

  it('rejects missing and malformed positions', () => {
    expect(() => createSitePlanViewport([])).toThrow(/at least one/i);
    expect(() => createSitePlanViewport([{ eastMetres: Number.NaN, northMetres: 0 }])).toThrow(/finite/i);
    expect(() => snapSiteCoordinate(1, 0)).toThrow(/greater than zero/i);
  });
});
