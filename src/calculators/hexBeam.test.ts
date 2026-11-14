/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateHexBeam } from './hexBeam';

describe('G3TXQ broadband hex beam', () => {
  it('reproduces the published five-band PVC wire schedule', () => {
    const result = calculateHexBeam({ bands: ['20m', '17m', '15m', '12m', '10m'], wireGauge: '14-16' });
    expect(result.elements).toHaveLength(5);
    expect(result.elements[0].halfDriverMetres).toBeCloseTo(214 * 0.0254, 12);
    expect(result.elements[0].reflectorMetres).toBeCloseTo(404 * 0.0254, 12);
    expect(result.elements[0].tipSpacerMetres).toBeCloseTo(24 * 0.0254, 12);
    expect(result.spreaderCount).toBe(6);
    expect(result.publishedDiameterMetres).toBeCloseTo(21.6 * 0.3048, 12);
  });

  it('applies the published wire-gauge factor to conductors but not tip spacers', () => {
    const baseline = calculateHexBeam({ bands: ['10m'], wireGauge: '14-16' });
    const twelveGauge = calculateHexBeam({ bands: ['10m'], wireGauge: '12' });
    expect(twelveGauge.elements[0].halfDriverMetres).toBeCloseTo(baseline.elements[0].halfDriverMetres * 1.004, 12);
    expect(twelveGauge.elements[0].reflectorMetres).toBeCloseTo(baseline.elements[0].reflectorMetres * 1.004, 12);
    expect(twelveGauge.elements[0].tipSpacerMetres).toBe(baseline.elements[0].tipSpacerMetres);
  });

  it('orders selected bands from lowest to highest frequency', () => {
    const result = calculateHexBeam({ bands: ['6m', '20m', '12m'], wireGauge: '18' });
    expect(result.elements.map((element) => element.band)).toEqual(['20m', '12m', '6m']);
    expect(result.warnings).toHaveLength(1);
  });

  it('rejects empty, duplicate, and unsupported selections', () => {
    expect(() => calculateHexBeam({ bands: [], wireGauge: '14-16' })).toThrow(RangeError);
    expect(() => calculateHexBeam({ bands: ['20m', '20m'], wireGauge: '14-16' })).toThrow(RangeError);
    expect(() => calculateHexBeam({ bands: ['40m' as '20m'], wireGauge: '14-16' })).toThrow(RangeError);
    expect(() => calculateHexBeam({ bands: ['20m'], wireGauge: '22' as '14-16' })).toThrow(RangeError);
  });
});
