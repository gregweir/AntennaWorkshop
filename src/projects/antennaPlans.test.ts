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
  saveAntennaPlanMeasurementAnalysis,
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
  progress: { completedStages: ['choose', 'plan', 'build'] },
  buildRecord: { asBuiltDimensions: 'Two 5.08 m legs', constructionDeviations: 'Centre raised 0.3 m', commissioningNotes: 'Calibrated at the feedpoint' },
  measurements: [{
    id: 'measurement-1', recordedAt: '2026-11-14T13:30:00.000Z', label: 'Initial installed sweep',
    sweep: { name: 'initial.s1p', sizeBytes: 128, lastModifiedAt: '2026-11-14T13:00:00.000Z', sha256: 'a'.repeat(64) },
    calibrationContext: 'One-port calibration at the feedline end', referencePlane: 'Station end of feedline',
    installedGeometry: 'Final support height', adjustment: '', observations: 'Minimum sampled SWR near 14.1 MHz', analysis: null
  }],
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
    expect(imported.progress.completedStages).toEqual(['choose', 'plan', 'build']);
    expect(imported.buildRecord.commissioningNotes).toBe('Calibrated at the feedpoint');
    expect(imported.measurements[0]).toMatchObject({ label: 'Initial installed sweep', sweep: { name: 'initial.s1p', sizeBytes: 128 } });
  });

  it('migrates version 1 plans into the connected project journey', () => {
    const legacy = { ...plan, schemaVersion: 1, progress: undefined, buildRecord: undefined, measurements: undefined };
    const imported = parseAntennaPlan(JSON.stringify(legacy), 'plan-legacy', '2026-11-14T15:00:00.000Z');
    expect(imported.schemaVersion).toBe(ANTENNA_PLAN_VERSION);
    expect(imported.progress.completedStages).toEqual(['choose', 'plan']);
    expect(imported.buildRecord).toEqual({ asBuiltDimensions: '', constructionDeviations: '', commissioningNotes: '' });
    expect(imported.measurements).toEqual([]);
  });

  it('keeps the automatically established selection and planning stages in version 2 files', () => {
    const imported = parseAntennaPlan(JSON.stringify({ ...plan, progress: { completedStages: ['measure'] } }), 'plan-progress', '2026-11-14T16:00:00.000Z');
    expect(imported.progress.completedStages).toEqual(['choose', 'plan', 'measure']);
  });

  it('adds a blank build record when an earlier version 2 file does not contain one', () => {
    const imported = parseAntennaPlan(JSON.stringify({ ...plan, buildRecord: undefined, measurements: undefined }), 'plan-v2-early', '2026-11-14T16:30:00.000Z');
    expect(imported.buildRecord).toEqual({ asBuiltDimensions: '', constructionDeviations: '', commissioningNotes: '' });
    expect(imported.measurements).toEqual([]);
  });

  it('writes a bounded sweep summary back to its originating measurement entry', () => {
    const local = storage();
    saveAntennaPlan(plan, local);
    const updated = saveAntennaPlanMeasurementAnalysis('plan-1', 'measurement-1', {
      analyzedAt: '2026-11-14T17:00:00.000Z', pointCount: 3, referenceImpedanceOhms: 50,
      lowerFrequencyHz: 14_000_000, upperFrequencyHz: 14_400_000,
      minimumSwr: 1.222, minimumSwrFrequencyHz: 14_200_000,
      resonanceFrequencyHz: 14_200_000, resonanceResistanceOhms: 40.91, resonanceReactanceOhms: 0,
      threshold: 2, thresholdWindowCount: 1,
      thresholdSpans: [{ lowerFrequencyHz: 14_100_000, upperFrequencyHz: 14_300_000, lowerBasis: 'interpolated', upperBasis: 'interpolated' }]
    }, local);
    expect(updated.measurements[0].analysis).toMatchObject({ pointCount: 3, minimumSwr: 1.222, thresholdWindowCount: 1 });
    expect(loadAntennaPlans(local)[0].measurements[0].analysis?.thresholdSpans).toHaveLength(1);
  });

  it('rejects malformed and unsupported imports', () => {
    expect(() => parseAntennaPlan('{', 'new', '2026-11-14T14:00:00.000Z')).toThrow(/valid JSON/);
    expect(() => parseAntennaPlan(JSON.stringify({ ...plan, schemaVersion: 99 }), 'new', '2026-11-14T14:00:00.000Z')).toThrow(/supported antenna plan/);
    expect(() => parseAntennaPlan(JSON.stringify({ ...plan, measurements: [{ ...plan.measurements[0], sweep: { ...plan.measurements[0].sweep, sha256: 'not-a-digest' } }] }), 'new', '2026-11-14T14:00:00.000Z')).toThrow(/supported antenna plan/);
    expect(() => parseAntennaPlan(JSON.stringify({ ...plan, measurements: [plan.measurements[0], plan.measurements[0]] }), 'new', '2026-11-14T14:00:00.000Z')).toThrow(/supported antenna plan/);
  });

  it('restores only values compatible with the current workspace shape', () => {
    const fallback = { frequencyText: '7.100', trimAllowancePercent: 2.5, bands: ['20m', '10m'] };
    expect(restoreAntennaPlanWorkspace({ frequencyText: 14.2, trimAllowancePercent: 3, bands: ['40m'] }, fallback)).toEqual({ frequencyText: '7.100', trimAllowancePercent: 3, bands: ['40m'] });
  });

  it('creates a portable filename', () => {
    expect(antennaPlanFilename(' 20 m / Field Dipole ')).toBe('20-m-field-dipole.antenna-plan.json');
  });
});
