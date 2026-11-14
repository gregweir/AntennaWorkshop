/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { evaluateReceiveAntennaCandidates } from './receiveAntennaSelector';

const baseline = {
  referenceFrequencyMHz: 7.1,
  maximumHorizontalSpanMetres: 10,
  maximumSupportHeightMetres: 8,
  surfaceWireAllowed: true,
  groundReturnsAllowed: 2 as const,
  activeElectronicsAllowed: true,
  switchingAllowed: true,
  directionPreference: 'fixed-axis' as const
};

describe('evaluateReceiveAntennaCandidates', () => {
  it('evaluates every supported receive family without ranking performance', () => {
    const result = evaluateReceiveAntennaCandidates(baseline);

    expect(result.candidates.map(({ id }) => id)).toEqual(['beverage', 'flag-pennant', 'ewe', 'k9ay', 'loop-on-ground', 'active-receive-loop']);
    expect(result.candidates.find(({ id }) => id === 'beverage')?.status).toBe('blocked');
    expect(result.candidates.find(({ id }) => id === 'flag-pennant')?.status).toBe('fits');
    expect(result.candidates.find(({ id }) => id === 'active-receive-loop')?.status).toBe('fits');
  });

  it('uses a half-wavelength minimum route context for a Beverage', () => {
    const result = evaluateReceiveAntennaCandidates({ ...baseline, maximumHorizontalSpanMetres: 25 });
    const beverage = result.candidates.find(({ id }) => id === 'beverage')!;

    expect(beverage.minimumSpanMetres).toBeCloseTo(21.112, 3);
    expect(beverage.status).toBe('fits');
  });

  it('identifies the K9AY for four switched directions', () => {
    const result = evaluateReceiveAntennaCandidates({ ...baseline, directionPreference: 'four-directions' });

    expect(result.candidates.find(({ id }) => id === 'k9ay')?.status).toBe('fits');
    expect(result.candidates.find(({ id }) => id === 'active-receive-loop')?.status).toBe('tradeoffs');
    expect(result.candidates.find(({ id }) => id === 'loop-on-ground')?.status).toBe('blocked');
  });

  it('identifies the active loop for continuously rotatable nulls', () => {
    const result = evaluateReceiveAntennaCandidates({ ...baseline, directionPreference: 'rotatable-nulls' });

    expect(result.candidates.find(({ id }) => id === 'active-receive-loop')?.status).toBe('fits');
    expect(result.candidates.find(({ id }) => id === 'k9ay')?.status).toBe('tradeoffs');
  });

  it('explains site and system blockers independently', () => {
    const result = evaluateReceiveAntennaCandidates({
      ...baseline,
      maximumHorizontalSpanMetres: 1,
      maximumSupportHeightMetres: 2,
      surfaceWireAllowed: false,
      groundReturnsAllowed: 0,
      activeElectronicsAllowed: false,
      switchingAllowed: false
    });

    expect(result.candidates.find(({ id }) => id === 'ewe')?.blockers).toHaveLength(3);
    expect(result.candidates.find(({ id }) => id === 'k9ay')?.blockers).toHaveLength(4);
    expect(result.candidates.find(({ id }) => id === 'loop-on-ground')?.blockers).toContain('Requires a controlled area where insulated wire may lie on the surface.');
    expect(result.candidates.find(({ id }) => id === 'active-receive-loop')?.blockers).toContain('Requires a powered feedpoint amplifier and its protection system.');
  });

  it.each([
    [{ ...baseline, referenceFrequencyMHz: 0 }, 'Reference frequency'],
    [{ ...baseline, maximumHorizontalSpanMetres: 0 }, 'Maximum horizontal span'],
    [{ ...baseline, maximumSupportHeightMetres: -1 }, 'Maximum support height'],
    [{ ...baseline, groundReturnsAllowed: 3 as never }, 'Ground-return allowance'],
    [{ ...baseline, directionPreference: 'sideways' as never }, 'Direction preference']
  ])('rejects invalid input %#', (input, message) => {
    expect(() => evaluateReceiveAntennaCandidates(input)).toThrow(message);
  });
});
