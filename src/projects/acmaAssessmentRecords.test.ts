/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { describe, expect, it } from 'vitest';
import { ACMA_RECORD_LIBRARY_KEY, acmaRecordRequiredGaps, createAcmaAssessmentRecord, deleteAcmaAssessmentRecord, loadAcmaAssessmentRecords, saveAcmaAssessmentRecord, serializeAcmaAssessmentRecord, type StorageLike } from './acmaAssessmentRecords';

function memoryStorage(initial?: string): StorageLike {
  const values = new Map<string, string>();
  if (initial) values.set(ACMA_RECORD_LIBRARY_KEY, initial);
  return { getItem: (key) => values.get(key) ?? null, setItem: (key, value) => { values.set(key, value); }, removeItem: (key) => { values.delete(key); } };
}

describe('ACMA assessment record library', () => {
  it('saves, updates, and deletes versioned records', () => {
    const storage = memoryStorage();
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    expect(saveAcmaAssessmentRecord(record, storage)).toHaveLength(1);
    saveAcmaAssessmentRecord({ ...record, title: 'Updated', updatedAt: '2026-11-13T11:00:00.000Z' }, storage);
    expect(loadAcmaAssessmentRecords(storage)).toMatchObject([{ id: 'record-1', title: 'Updated' }]);
    expect(deleteAcmaAssessmentRecord('record-1', storage)).toEqual([]);
  });

  it('ignores malformed local data without overwriting it', () => {
    expect(loadAcmaAssessmentRecords(memoryStorage('{bad json'))).toEqual([]);
    expect(loadAcmaAssessmentRecords(memoryStorage(JSON.stringify([{ schemaVersion: 99 }])))).toEqual([]);
  });

  it('derives conditional documentation gaps without claiming verification', () => {
    const record = createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z');
    expect(acmaRecordRequiredGaps(record)).toContain('compliance declaration made and retained');
    expect(acmaRecordRequiredGaps({ ...record, operatorType: 'body-corporate', agentUsed: true })).toEqual(expect.arrayContaining(['corporate registration number', 'corporate declarant name', 'corporate declarant position', 'agent agreement reference']));
  });

  it('serializes a validated portable record', () => {
    const serialized = serializeAcmaAssessmentRecord(createAcmaAssessmentRecord('record-1', '2026-11-13T10:00:00.000Z'));
    expect(JSON.parse(serialized)).toMatchObject({ schemaVersion: 1, id: 'record-1' });
  });
});
