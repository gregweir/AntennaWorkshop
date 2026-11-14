/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it, vi } from 'vitest';
import { loadAntennaPickerMode, saveAntennaPickerMode } from './antennaPickerPreference';

describe('antenna picker preference', () => {
  it('defaults missing and unrecognized values to the guided picker', () => {
    expect(loadAntennaPickerMode({ getItem: () => null, setItem: vi.fn() })).toBe('guided');
    expect(loadAntennaPickerMode({ getItem: () => 'unexpected', setItem: vi.fn() })).toBe('guided');
  });

  it('restores an explicit workbench preference', () => {
    expect(loadAntennaPickerMode({ getItem: () => 'workbench', setItem: vi.fn() })).toBe('workbench');
  });

  it('saves either supported picker mode', () => {
    const setItem = vi.fn();
    const storage = { getItem: () => null, setItem };
    saveAntennaPickerMode(storage, 'workbench');
    saveAntennaPickerMode(storage, 'guided');
    expect(setItem).toHaveBeenNthCalledWith(1, 'radiobook:antenna-workshop:picker-mode:v1', 'workbench');
    expect(setItem).toHaveBeenNthCalledWith(2, 'radiobook:antenna-workshop:picker-mode:v1', 'guided');
  });

  it('falls back without throwing when browser storage is unavailable', () => {
    const unavailable = {
      getItem: () => { throw new Error('unavailable'); },
      setItem: () => { throw new Error('unavailable'); }
    };
    expect(loadAntennaPickerMode(unavailable)).toBe('guided');
    expect(() => saveAntennaPickerMode(unavailable, 'workbench')).not.toThrow();
  });
});
