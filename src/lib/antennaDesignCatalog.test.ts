/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { ANTENNA_DESIGNS, filterAntennaDesigns, getGuidedDesigns } from './antennaDesignCatalog';

describe('antenna design catalog', () => {
  it('contains every design with searchable guidance metadata', () => {
    expect(Object.keys(ANTENNA_DESIGNS)).toHaveLength(28);
    expect(Object.values(ANTENNA_DESIGNS).every((design) => design.tags.length > 0 && design.guidedGoals.length > 0)).toBe(true);
  });

  it('filters by category without hiding matching names', () => {
    expect(filterAntennaDesigns('', 'receive')).toEqual(['beverage', 'compact-receive', 'k9ay', 'loop-on-ground', 'active-receive-loop']);
    expect(filterAntennaDesigns('loop', 'receive')).toEqual(['k9ay', 'loop-on-ground', 'active-receive-loop']);
  });

  it('searches names, descriptions, and tags with all entered terms', () => {
    expect(filterAntennaDesigns('shortened coil', 'all')).toEqual(['loaded-dipole', 'loaded-vertical']);
    expect(filterAntennaDesigns('circular polarization', 'all')).toEqual(['axial-helix']);
    expect(filterAntennaDesigns('no support', 'all')).toEqual(['loop-on-ground']);
    expect(filterAntennaDesigns('zs6bkw', 'all')).toEqual(['g5rv']);
  });

  it('returns transmit-capable designs for guided transmit goals', () => {
    expect(getGuidedDesigns('transmit', 'vertical-footprint')).toEqual(['jpole', 'slim-jim', 'discone', 'loaded-vertical', 'ground-mounted-vertical', 'ground-plane']);
    expect(getGuidedDesigns('transmit', 'limited-space')).toEqual(['loaded-dipole', 'small-loop', 'loaded-vertical']);
  });

  it('keeps receive-only designs out of transmit results', () => {
    const transmit = getGuidedDesigns('transmit', 'all');
    const receive = getGuidedDesigns('receive', 'all');
    expect(transmit).toHaveLength(23);
    expect(receive).toHaveLength(5);
    expect(transmit.some((type) => ANTENNA_DESIGNS[type].receiveOnly)).toBe(false);
    expect(receive.every((type) => ANTENNA_DESIGNS[type].receiveOnly)).toBe(true);
  });

  it('returns the intended receive direction-control choices', () => {
    expect(getGuidedDesigns('receive', 'direction-control')).toEqual(['beverage', 'compact-receive', 'k9ay', 'active-receive-loop']);
    expect(getGuidedDesigns('receive', 'surface-installation')).toEqual(['loop-on-ground']);
  });
});
