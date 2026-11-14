/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { calculateTransmissionLineCascade } from './transmissionLineCascade';
import { calculateTransmissionLineTransform } from './transmissionLineTransform';

const section = { characteristicImpedanceOhms: 50, physicalLengthMetres: 10, velocityFactor: 0.66, matchedLossDbPer100Metres: 6 };

describe('transmission-line cascade', () => {
  it('matches the single-section calculation', () => {
    const cascade = calculateTransmissionLineCascade({ frequencyMHz: 146.52, loadResistanceOhms: 100, loadReactanceOhms: -50, sections: [section] });
    const single = calculateTransmissionLineTransform({ frequencyMHz: 146.52, loadResistanceOhms: 100, loadReactanceOhms: -50, ...section });
    expect(cascade.inputResistanceOhms).toBeCloseTo(single.inputResistanceOhms, 12);
    expect(cascade.inputReactanceOhms).toBeCloseTo(single.inputReactanceOhms, 12);
    expect(cascade.totalOneWayMatchedLossDb).toBeCloseTo(0.6, 12);
  });

  it('combines identical adjacent sections like one longer section', () => {
    const cascade = calculateTransmissionLineCascade({ frequencyMHz: 14.2, loadResistanceOhms: 35, loadReactanceOhms: 20, sections: [{ ...section, physicalLengthMetres: 7 }, { ...section, physicalLengthMetres: 13 }] });
    const single = calculateTransmissionLineTransform({ frequencyMHz: 14.2, loadResistanceOhms: 35, loadReactanceOhms: 20, ...section, physicalLengthMetres: 20 });
    expect(cascade.inputResistanceOhms).toBeCloseTo(single.inputResistanceOhms, 10);
    expect(cascade.inputReactanceOhms).toBeCloseTo(single.inputReactanceOhms, 10);
    expect(cascade.totalPhysicalLengthMetres).toBe(20);
    expect(cascade.totalOneWayDelayNanoseconds).toBeCloseTo(single.oneWayDelayNanoseconds, 10);
  });

  it('uses the output of the load-side section as the next termination', () => {
    const frequencyMHz = 100;
    const quarterWaveMetres = 299_792_458 / (frequencyMHz * 1_000_000) * 0.66 / 4;
    const cascade = calculateTransmissionLineCascade({
      frequencyMHz,
      loadResistanceOhms: 100,
      loadReactanceOhms: 0,
      sections: [
        { characteristicImpedanceOhms: 50, physicalLengthMetres: quarterWaveMetres, velocityFactor: 0.66, matchedLossDbPer100Metres: 0 },
        { characteristicImpedanceOhms: 75, physicalLengthMetres: 0, velocityFactor: 0.8, matchedLossDbPer100Metres: 0 }
      ]
    });
    expect(cascade.sections[0].transform.inputResistanceOhms).toBeCloseTo(25, 10);
    expect(cascade.sections[1].terminatingResistanceOhms).toBeCloseTo(25, 10);
    expect(cascade.inputResistanceOhms).toBeCloseTo(25, 10);
    expect(cascade.nearEndPoint.swr).toBeCloseTo(3, 10);
  });

  it('rejects an empty or oversized cascade', () => {
    const base = { frequencyMHz: 14.2, loadResistanceOhms: 50, loadReactanceOhms: 0 };
    expect(() => calculateTransmissionLineCascade({ ...base, sections: [] })).toThrow(RangeError);
    expect(() => calculateTransmissionLineCascade({ ...base, sections: [section, section, section, section, section] })).toThrow(RangeError);
  });
});
