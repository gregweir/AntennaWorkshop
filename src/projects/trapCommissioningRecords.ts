/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateTrapCommissioning, TRAP_COMMISSIONING_MODEL, type TrapCommissioningInput } from '../calculators/trapCommissioning';

export const TRAP_RECORD_LIBRARY_KEY = 'radiobook:antenna-workshop:trap-commissioning-records:v1';
export const TRAP_RECORD_VERSION = 1 as const;

export interface TrapRecordStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface TrapCommissioningRecord {
  schemaVersion: typeof TRAP_RECORD_VERSION;
  id: string;
  updatedAt: string;
  title: string;
  measuredAt: string;
  instrument: string;
  fixture: string;
  conditions: string;
  notes: string;
  modelId: typeof TRAP_COMMISSIONING_MODEL.id;
  modelVersion: typeof TRAP_COMMISSIONING_MODEL.version;
  input: TrapCommissioningInput;
}

type UnknownRecord = Record<string, unknown>;
const textFields: Array<keyof Pick<TrapCommissioningRecord, 'title' | 'measuredAt' | 'instrument' | 'fixture' | 'conditions' | 'notes'>> = ['title', 'measuredAt', 'instrument', 'fixture', 'conditions', 'notes'];

function normaliseRecord(value: unknown): TrapCommissioningRecord | null {
  if (!value || typeof value !== 'object') return null;
  const candidate = value as UnknownRecord;
  if (candidate.schemaVersion !== TRAP_RECORD_VERSION
    || typeof candidate.id !== 'string' || !candidate.id.trim()
    || typeof candidate.updatedAt !== 'string' || !Number.isFinite(Date.parse(candidate.updatedAt))
    || !textFields.every((field) => typeof candidate[field] === 'string')
    || (candidate.measuredAt !== '' && !Number.isFinite(Date.parse(String(candidate.measuredAt))))
    || candidate.modelId !== TRAP_COMMISSIONING_MODEL.id
    || candidate.modelVersion !== TRAP_COMMISSIONING_MODEL.version
    || !candidate.input || typeof candidate.input !== 'object') return null;

  try {
    calculateTrapCommissioning(candidate.input as TrapCommissioningInput);
  } catch {
    return null;
  }
  return candidate as unknown as TrapCommissioningRecord;
}

export function validateTrapCommissioningRecord(record: TrapCommissioningRecord): TrapCommissioningRecord {
  const normalised = normaliseRecord(record);
  if (!normalised) throw new TypeError('The trap commissioning record is invalid or unsupported.');
  return normalised;
}

export function loadTrapCommissioningRecords(storage?: TrapRecordStorage): TrapCommissioningRecord[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(TRAP_RECORD_LIBRARY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normaliseRecord).filter((record): record is TrapCommissioningRecord => record !== null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  } catch {
    return [];
  }
}

export function saveTrapCommissioningRecord(record: TrapCommissioningRecord, storage?: TrapRecordStorage): TrapCommissioningRecord[] {
  const valid = validateTrapCommissioningRecord(record);
  const existing = loadTrapCommissioningRecords(storage);
  const next = [valid, ...existing.filter((candidate) => candidate.id !== valid.id)].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  storage?.setItem(TRAP_RECORD_LIBRARY_KEY, JSON.stringify(next));
  return next;
}

export function deleteTrapCommissioningRecord(id: string, storage?: TrapRecordStorage): TrapCommissioningRecord[] {
  const next = loadTrapCommissioningRecords(storage).filter((record) => record.id !== id);
  if (next.length) storage?.setItem(TRAP_RECORD_LIBRARY_KEY, JSON.stringify(next));
  else storage?.removeItem(TRAP_RECORD_LIBRARY_KEY);
  return next;
}

export function parseTrapCommissioningRecord(serialized: string, importedId: string, importedAt: string): TrapCommissioningRecord {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new TypeError('The selected file is not valid JSON.');
  }
  const normalised = normaliseRecord(parsed);
  if (!normalised) throw new TypeError('The selected file is not a supported trap commissioning record.');
  if (!importedId.trim() || !Number.isFinite(Date.parse(importedAt))) throw new TypeError('The imported record requires a new identifier and valid import time.');
  return { ...normalised, id: importedId, updatedAt: importedAt };
}

export function serializeTrapCommissioningRecord(record: TrapCommissioningRecord): string {
  return `${JSON.stringify(validateTrapCommissioningRecord(record), null, 2)}\n`;
}

export function trapCommissioningRecordFilename(title: string): string {
  const safe = title.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'trap-commissioning-record';
  return `${safe}.trap-record.json`;
}
