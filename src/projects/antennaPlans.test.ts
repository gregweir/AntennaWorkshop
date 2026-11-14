/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import {
  ANTENNA_PLAN_KIND,
  ANTENNA_PLAN_VERSION,
  antennaPlanFilename,
  deleteAntennaPlan,
  loadAntennaPlans,
  parseAntennaPlan,
  restoreAntennaPlanWorkspace,
  saveAntennaPlan,
  serializeAntennaPlan,
  type AntennaPlan,
  type AntennaPlanStorage
} from './antennaPlans';

function storage(): AntennaPlanStorage {
  const values = new Map<string, string>();
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: (key) => values.delete(key) };
}

const plan: AntennaPlan = {
  kind: ANTENNA_PLAN_KIND,
  schemaVersion: ANTENNA_PLAN_VERSION,
  id: 'plan-1',
  name: '20 metre dipole',
  createdAt: '2026-11-14T12:00:00.000Z',
  updatedAt: '2026-11-14T12:00:00.000Z',
  antennaType: 'dipole',
  jurisdiction: 'CA',
  unitSystem: 'metric',
  modelId: 'half-wave-dipole',
  modelVersion: '1.0.0',
  workspace: { antennaType: 'dipole', frequencyText: '14.200', trimAllowancePercent: 2.5, fanAdditionalFrequencyTexts: ['21.200', '28.400'] }
};

describe('antenna plan files', () => {
  it('saves, loads, replaces, and deletes local plans', () => {
    const local = storage();
    expect(saveAntennaPlan(plan, local)).toHaveLength(1);
    saveAntennaPlan({ ...plan, name: 'Revised plan', updatedAt: '2026-11-14T13:00:00.000Z' }, local);
    expect(loadAntennaPlans(local)).toMatchObject([{ id: 'plan-1', name: 'Revised plan' }]);
    expect(deleteAntennaPlan('plan-1', local)).toEqual([]);
  });

  it('round-trips an exported plan and assigns a fresh identity on import', () => {
    const imported = parseAntennaPlan(serializeAntennaPlan(plan), 'plan-2', '2026-11-14T14:00:00.000Z');
    expect(imported).toMatchObject({ id: 'plan-2', name: '20 metre dipole (imported)', createdAt: '2026-11-14T14:00:00.000Z' });
    expect(imported.workspace.frequencyText).toBe('14.200');
  });

  it('rejects malformed and unsupported imports', () => {
    expect(() => parseAntennaPlan('{', 'new', '2026-11-14T14:00:00.000Z')).toThrow(/valid JSON/);
    expect(() => parseAntennaPlan(JSON.stringify({ ...plan, schemaVersion: 99 }), 'new', '2026-11-14T14:00:00.000Z')).toThrow(/supported antenna plan/);
  });

  it('restores only values compatible with the current workspace shape', () => {
    const fallback = { frequencyText: '7.100', trimAllowancePercent: 2.5, bands: ['20m', '10m'] };
    expect(restoreAntennaPlanWorkspace({ frequencyText: 14.2, trimAllowancePercent: 3, bands: ['40m'] }, fallback)).toEqual({ frequencyText: '7.100', trimAllowancePercent: 3, bands: ['40m'] });
  });

  it('creates a portable filename', () => {
    expect(antennaPlanFilename(' 20 m / Field Dipole ')).toBe('20-m-field-dipole.antenna-plan.json');
  });
});
