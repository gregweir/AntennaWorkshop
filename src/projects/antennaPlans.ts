/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { ANTENNA_DESIGNS, type AntennaType } from '../lib/antennaDesignCatalog';
import type { UnitSystem } from '../lib/units';
import type { JurisdictionCode } from '../regulations/catalog';

export const ANTENNA_PLAN_KIND = 'radiobook-antenna-workshop/antenna-plan';
export const ANTENNA_PLAN_VERSION = 1 as const;
export const ANTENNA_PLAN_LIBRARY_KEY = 'radiobook:antenna-workshop:antenna-plans:v1';
export const ANTENNA_PLAN_LIBRARY_LIMIT = 50;

export type AntennaPlanValue = string | number | boolean | null | AntennaPlanValue[];
export type AntennaPlanWorkspace = Record<string, AntennaPlanValue>;

export interface AntennaPlan {
  kind: typeof ANTENNA_PLAN_KIND;
  schemaVersion: typeof ANTENNA_PLAN_VERSION;
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
  antennaType: AntennaType;
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  modelId: string;
  modelVersion: string;
  workspace: AntennaPlanWorkspace;
}

export interface AntennaPlanStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function isPlanValue(value: unknown, depth = 0): value is AntennaPlanValue {
  if (depth > 3) return false;
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return true;
  if (typeof value === 'number') return Number.isFinite(value);
  return Array.isArray(value) && value.length <= 24 && value.every((entry) => isPlanValue(entry, depth + 1));
}

function requiredText(value: unknown, maximumLength: number): string | null {
  return typeof value === 'string' && value.trim() && value.length <= maximumLength ? value.trim() : null;
}

function dateTime(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

function normalisePlan(value: unknown): AntennaPlan | null {
  if (!isRecord(value)
    || value.kind !== ANTENNA_PLAN_KIND
    || value.schemaVersion !== ANTENNA_PLAN_VERSION
    || !dateTime(value.createdAt)
    || !dateTime(value.updatedAt)
    || !isRecord(value.workspace)) return null;

  const id = requiredText(value.id, 100);
  const name = requiredText(value.name, 120);
  const modelId = requiredText(value.modelId, 160);
  const modelVersion = requiredText(value.modelVersion, 40);
  const antennaType = value.antennaType as AntennaType;
  const jurisdiction = value.jurisdiction as JurisdictionCode;
  const unitSystem = value.unitSystem as UnitSystem;
  const workspaceEntries = Object.entries(value.workspace);

  if (!id || !name || !modelId || !modelVersion
    || !(antennaType in ANTENNA_DESIGNS)
    || !['CA', 'US', 'GB', 'AU'].includes(jurisdiction)
    || (unitSystem !== 'metric' && unitSystem !== 'imperial')
    || workspaceEntries.length < 2 || workspaceEntries.length > 180
    || workspaceEntries.some(([key, entry]) => !/^[a-z][A-Za-z0-9]*$/.test(key) || !isPlanValue(entry))) return null;

  return {
    kind: ANTENNA_PLAN_KIND,
    schemaVersion: ANTENNA_PLAN_VERSION,
    id,
    name,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    antennaType,
    jurisdiction,
    unitSystem,
    modelId,
    modelVersion,
    workspace: value.workspace as AntennaPlanWorkspace
  };
}

export function validateAntennaPlan(plan: AntennaPlan): AntennaPlan {
  const valid = normalisePlan(plan);
  if (!valid) throw new TypeError('The antenna plan is invalid or uses an unsupported format.');
  return valid;
}

export function loadAntennaPlans(storage?: AntennaPlanStorage): AntennaPlan[] {
  if (!storage) return [];
  try {
    const parsed: unknown = JSON.parse(storage.getItem(ANTENNA_PLAN_LIBRARY_KEY) ?? '[]');
    if (!Array.isArray(parsed)) return [];
    return parsed.map(normalisePlan).filter((plan): plan is AntennaPlan => plan !== null).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, ANTENNA_PLAN_LIBRARY_LIMIT);
  } catch {
    return [];
  }
}

export function saveAntennaPlan(plan: AntennaPlan, storage?: AntennaPlanStorage): AntennaPlan[] {
  const valid = validateAntennaPlan(plan);
  const next = [valid, ...loadAntennaPlans(storage).filter((candidate) => candidate.id !== valid.id)]
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .slice(0, ANTENNA_PLAN_LIBRARY_LIMIT);
  storage?.setItem(ANTENNA_PLAN_LIBRARY_KEY, JSON.stringify(next));
  return next;
}

export function deleteAntennaPlan(id: string, storage?: AntennaPlanStorage): AntennaPlan[] {
  const next = loadAntennaPlans(storage).filter((plan) => plan.id !== id);
  if (next.length) storage?.setItem(ANTENNA_PLAN_LIBRARY_KEY, JSON.stringify(next));
  else storage?.removeItem(ANTENNA_PLAN_LIBRARY_KEY);
  return next;
}

export function parseAntennaPlan(serialized: string, importedId: string, importedAt: string): AntennaPlan {
  let parsed: unknown;
  try {
    parsed = JSON.parse(serialized);
  } catch {
    throw new TypeError('The selected file is not valid JSON.');
  }
  const plan = normalisePlan(parsed);
  if (!plan) throw new TypeError('The selected file is not a supported antenna plan.');
  if (!requiredText(importedId, 100) || !dateTime(importedAt)) throw new TypeError('The imported plan requires a new identifier and valid import time.');
  return { ...plan, id: importedId, name: `${plan.name} (imported)`, createdAt: importedAt, updatedAt: importedAt };
}

export function serializeAntennaPlan(plan: AntennaPlan): string {
  return `${JSON.stringify(validateAntennaPlan(plan), null, 2)}\n`;
}

export function antennaPlanFilename(name: string): string {
  const safe = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'antenna-plan';
  return `${safe}.antenna-plan.json`;
}

export function restoreAntennaPlanWorkspace<T extends AntennaPlanWorkspace>(stored: AntennaPlanWorkspace, fallback: T): T {
  const restored: AntennaPlanWorkspace = {};
  for (const [key, fallbackValue] of Object.entries(fallback)) {
    const candidate = stored[key];
    const samePrimitive = typeof candidate === typeof fallbackValue && !Array.isArray(candidate) && !Array.isArray(fallbackValue);
    const sameArray = Array.isArray(candidate) && Array.isArray(fallbackValue)
      && candidate.length <= 24
      && candidate.every((entry, index) => isPlanValue(entry) && (fallbackValue[index] === undefined || typeof entry === typeof fallbackValue[index]));
    restored[key] = samePrimitive || sameArray ? candidate : fallbackValue;
  }
  return restored as T;
}
