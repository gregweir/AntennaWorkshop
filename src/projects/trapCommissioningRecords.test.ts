/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { TRAP_COMMISSIONING_MODEL } from '../calculators/trapCommissioning';
import { deleteTrapCommissioningRecord, loadTrapCommissioningRecords, parseTrapCommissioningRecord, saveTrapCommissioningRecord, serializeTrapCommissioningRecord, trapCommissioningRecordFilename, TRAP_RECORD_LIBRARY_KEY, type TrapCommissioningRecord, type TrapRecordStorage } from './trapCommissioningRecords';

function exampleRecord(id = 'trap-1'): TrapCommissioningRecord {
  return {
    schemaVersion: 1,
    id,
    updatedAt: '2026-11-13T18:00:00.000Z',
    title: 'Portable 20 metre trap pair',
    measuredAt: '2026-11-13',
    instrument: 'VNA with calibrated fixture',
    fixture: 'Short leads, final enclosure installed',
    conditions: '21 °C, dry bench',
    notes: 'Retest after weather sealing.',
    modelId: TRAP_COMMISSIONING_MODEL.id,
    modelVersion: TRAP_COMMISSIONING_MODEL.version,
    input: {
      targetInductanceMicrohenries: 2.94,
      targetCapacitancePicofarads: 52.7,
      targetResonanceMHz: 12.785,
      inductanceTolerancePercent: 5,
      capacitanceTolerancePercent: 5,
      pairMatchingThresholdPercent: 3,
      trapA: { inductanceMicrohenries: 2.94, capacitancePicofarads: 52.7, measuredResonanceMHz: 12.78 },
      trapB: { inductanceMicrohenries: 3, capacitancePicofarads: 53, measuredResonanceMHz: 12.65 }
    }
  };
}

function memoryStorage(): TrapRecordStorage {
  const values = new Map<string, string>();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key)
  };
}

describe('trap commissioning records', () => {
  it('saves, replaces, sorts, and deletes validated records', () => {
    const storage = memoryStorage();
    saveTrapCommissioningRecord(exampleRecord(), storage);
    saveTrapCommissioningRecord({ ...exampleRecord('trap-2'), updatedAt: '2026-11-13T19:00:00.000Z', title: 'Second pair' }, storage);
    saveTrapCommissioningRecord({ ...exampleRecord(), updatedAt: '2026-11-13T20:00:00.000Z', title: 'Updated pair' }, storage);

    expect(loadTrapCommissioningRecords(storage).map((record) => record.title)).toEqual(['Updated pair', 'Second pair']);
    expect(storage.getItem(TRAP_RECORD_LIBRARY_KEY)).toContain('Updated pair');
    expect(deleteTrapCommissioningRecord('trap-1', storage)).toHaveLength(1);
    expect(deleteTrapCommissioningRecord('trap-2', storage)).toEqual([]);
    expect(storage.getItem(TRAP_RECORD_LIBRARY_KEY)).toBeNull();
  });

  it('round-trips a versioned JSON record under a new imported identity', () => {
    const serialized = serializeTrapCommissioningRecord(exampleRecord());
    const imported = parseTrapCommissioningRecord(serialized, 'imported-1', '2026-11-13T21:00:00.000Z');

    expect(imported.id).toBe('imported-1');
    expect(imported.updatedAt).toBe('2026-11-13T21:00:00.000Z');
    expect(imported.input.trapB.measuredResonanceMHz).toBe(12.65);
  });

  it('rejects malformed, unsupported, and physically invalid records', () => {
    expect(() => parseTrapCommissioningRecord('{', 'new-id', '2026-11-13T21:00:00.000Z')).toThrow('not valid JSON');
    expect(() => parseTrapCommissioningRecord(JSON.stringify({ ...exampleRecord(), schemaVersion: 2 }), 'new-id', '2026-11-13T21:00:00.000Z')).toThrow('not a supported');
    expect(() => saveTrapCommissioningRecord({ ...exampleRecord(), input: { ...exampleRecord().input, targetInductanceMicrohenries: 0 } })).toThrow('invalid or unsupported');
  });

  it('creates a filesystem-safe descriptive filename', () => {
    expect(trapCommissioningRecordFilename(' Portable 20 m / 15 m pair ')).toBe('portable-20-m-15-m-pair.trap-record.json');
    expect(trapCommissioningRecordFilename('')).toBe('trap-commissioning-record.trap-record.json');
  });
});
