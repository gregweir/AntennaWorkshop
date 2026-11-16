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
export const ANTENNA_PLAN_VERSION = 2 as const;
export const ANTENNA_PLAN_LIBRARY_KEY = 'radiobook:antenna-workshop:antenna-plans:v1';
export const ANTENNA_PLAN_LIBRARY_LIMIT = 50;
export const ANTENNA_PLAN_MEASUREMENT_LIMIT = 24;
export const ANTENNA_PLAN_WORKSPACE_FIELD_LIMIT = 220;

export const ANTENNA_PROJECT_STAGES = ['choose', 'plan', 'build', 'measure', 'tune', 'verify', 'document'] as const;
export type AntennaProjectStage = typeof ANTENNA_PROJECT_STAGES[number];

export interface AntennaPlanProgress {
  completedStages: AntennaProjectStage[];
}

export interface AntennaPlanBuildRecord {
  asBuiltDimensions: string;
  constructionDeviations: string;
  commissioningNotes: string;
}

export interface AntennaPlanSweepReference {
  name: string;
  sizeBytes: number;
  lastModifiedAt: string | null;
  sha256: string | null;
}

export interface AntennaPlanThresholdSpan {
  lowerFrequencyHz: number;
  upperFrequencyHz: number;
  lowerBasis: 'interpolated' | 'sweep-edge' | 'measured-sample';
  upperBasis: 'interpolated' | 'sweep-edge' | 'measured-sample';
}

export interface AntennaPlanMeasurementAnalysis {
  analyzedAt: string;
  pointCount: number;
  referenceImpedanceOhms: number;
  lowerFrequencyHz: number;
  upperFrequencyHz: number;
  minimumSwr: number | null;
  minimumSwrFrequencyHz: number;
  resonanceFrequencyHz: number;
  resonanceResistanceOhms: number | null;
  resonanceReactanceOhms: number | null;
  threshold: number;
  thresholdWindowCount: number;
  thresholdSpans: AntennaPlanThresholdSpan[];
}

export interface AntennaPlanMeasurementRecord {
  id: string;
  recordedAt: string;
  label: string;
  sweep: AntennaPlanSweepReference | null;
  calibrationContext: string;
  referencePlane: string;
  installedGeometry: string;
  adjustment: string;
  observations: string;
  analysis: AntennaPlanMeasurementAnalysis | null;
}

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
  progress: AntennaPlanProgress;
  buildRecord: AntennaPlanBuildRecord;
  measurements: AntennaPlanMeasurementRecord[];
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

function normaliseProgress(value: unknown): AntennaPlanProgress | null {
  if (!isRecord(value) || !Array.isArray(value.completedStages)) return null;
  const stages = value.completedStages.filter((stage): stage is AntennaProjectStage => typeof stage === 'string' && ANTENNA_PROJECT_STAGES.includes(stage as AntennaProjectStage));
  if (stages.length !== value.completedStages.length) return null;
  return { completedStages: ANTENNA_PROJECT_STAGES.filter((stage) => stage === 'choose' || stage === 'plan' || stages.includes(stage)) };
}

function normaliseBuildRecord(value: unknown): AntennaPlanBuildRecord | null {
  if (value === undefined) return { asBuiltDimensions: '', constructionDeviations: '', commissioningNotes: '' };
  if (!isRecord(value)) return null;
  const fields = ['asBuiltDimensions', 'constructionDeviations', 'commissioningNotes'] as const;
  if (fields.some((field) => value[field] !== undefined && (typeof value[field] !== 'string' || value[field].length > 6_000))) return null;
  return {
    asBuiltDimensions: typeof value.asBuiltDimensions === 'string' ? value.asBuiltDimensions : '',
    constructionDeviations: typeof value.constructionDeviations === 'string' ? value.constructionDeviations : '',
    commissioningNotes: typeof value.commissioningNotes === 'string' ? value.commissioningNotes : ''
  };
}

function normaliseSweepReference(value: unknown): AntennaPlanSweepReference | null | false {
  if (value === null) return null;
  if (!isRecord(value)) return false;
  const name = requiredText(value.name, 255);
  const sizeBytes = value.sizeBytes;
  const lastModifiedAt = value.lastModifiedAt;
  const sha256 = value.sha256;
  if (!name || !Number.isInteger(sizeBytes) || (sizeBytes as number) < 0 || (sizeBytes as number) > 2_000_000
    || (lastModifiedAt !== null && !dateTime(lastModifiedAt))
    || (sha256 !== null && (typeof sha256 !== 'string' || !/^[a-f0-9]{64}$/i.test(sha256)))) return false;
  return { name, sizeBytes: sizeBytes as number, lastModifiedAt: lastModifiedAt as string | null, sha256: sha256 as string | null };
}

function finiteOrNull(value: unknown) {
  return value === null || (typeof value === 'number' && Number.isFinite(value)) ? value as number | null : false;
}

function normaliseMeasurementAnalysis(value: unknown): AntennaPlanMeasurementAnalysis | null | false {
  if (value === undefined || value === null) return null;
  if (!isRecord(value) || !dateTime(value.analyzedAt) || !Array.isArray(value.thresholdSpans) || value.thresholdSpans.length > 24) return false;
  const numericFields = ['pointCount', 'referenceImpedanceOhms', 'lowerFrequencyHz', 'upperFrequencyHz', 'minimumSwrFrequencyHz', 'resonanceFrequencyHz', 'threshold', 'thresholdWindowCount'] as const;
  if (numericFields.some((field) => typeof value[field] !== 'number' || !Number.isFinite(value[field]) || (value[field] as number) < 0)
    || !Number.isInteger(value.pointCount) || (value.pointCount as number) < 1 || (value.pointCount as number) > 10_000
    || !Number.isInteger(value.thresholdWindowCount) || (value.thresholdWindowCount as number) < value.thresholdSpans.length
    || (value.threshold as number) <= 1 || (value.threshold as number) > 10 || (value.lowerFrequencyHz as number) > (value.upperFrequencyHz as number)) return false;
  const minimumSwr = finiteOrNull(value.minimumSwr);
  const resonanceResistanceOhms = finiteOrNull(value.resonanceResistanceOhms);
  const resonanceReactanceOhms = finiteOrNull(value.resonanceReactanceOhms);
  if (minimumSwr === false || resonanceResistanceOhms === false || resonanceReactanceOhms === false) return false;
  const bases = ['interpolated', 'sweep-edge', 'measured-sample'];
  const thresholdSpans: AntennaPlanThresholdSpan[] = [];
  for (const span of value.thresholdSpans) {
    if (!isRecord(span)
      || typeof span.lowerFrequencyHz !== 'number' || !Number.isFinite(span.lowerFrequencyHz)
      || typeof span.upperFrequencyHz !== 'number' || !Number.isFinite(span.upperFrequencyHz)
      || span.lowerFrequencyHz < 0 || span.lowerFrequencyHz > span.upperFrequencyHz
      || typeof span.lowerBasis !== 'string' || !bases.includes(span.lowerBasis)
      || typeof span.upperBasis !== 'string' || !bases.includes(span.upperBasis)) return false;
    thresholdSpans.push({ lowerFrequencyHz: span.lowerFrequencyHz, upperFrequencyHz: span.upperFrequencyHz, lowerBasis: span.lowerBasis as AntennaPlanThresholdSpan['lowerBasis'], upperBasis: span.upperBasis as AntennaPlanThresholdSpan['upperBasis'] });
  }
  return {
    analyzedAt: value.analyzedAt as string,
    pointCount: value.pointCount as number,
    referenceImpedanceOhms: value.referenceImpedanceOhms as number,
    lowerFrequencyHz: value.lowerFrequencyHz as number,
    upperFrequencyHz: value.upperFrequencyHz as number,
    minimumSwr,
    minimumSwrFrequencyHz: value.minimumSwrFrequencyHz as number,
    resonanceFrequencyHz: value.resonanceFrequencyHz as number,
    resonanceResistanceOhms,
    resonanceReactanceOhms,
    threshold: value.threshold as number,
    thresholdWindowCount: value.thresholdWindowCount as number,
    thresholdSpans
  };
}

function normaliseMeasurements(value: unknown): AntennaPlanMeasurementRecord[] | null {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > ANTENNA_PLAN_MEASUREMENT_LIMIT) return null;
  const records: AntennaPlanMeasurementRecord[] = [];
  for (const candidate of value) {
    if (!isRecord(candidate) || !dateTime(candidate.recordedAt)) return null;
    const id = requiredText(candidate.id, 100);
    const label = requiredText(candidate.label, 120);
    const sweep = normaliseSweepReference(candidate.sweep);
    const analysis = normaliseMeasurementAnalysis(candidate.analysis);
    const textFields = ['calibrationContext', 'referencePlane', 'installedGeometry', 'adjustment', 'observations'] as const;
    if (!id || records.some((record) => record.id === id) || !label || sweep === false || analysis === false || textFields.some((field) => typeof candidate[field] !== 'string' || candidate[field].length > 4_000)) return null;
    records.push({
      id,
      recordedAt: candidate.recordedAt as string,
      label,
      sweep,
      calibrationContext: candidate.calibrationContext as string,
      referencePlane: candidate.referencePlane as string,
      installedGeometry: candidate.installedGeometry as string,
      adjustment: candidate.adjustment as string,
      observations: candidate.observations as string,
      analysis
    });
  }
  return records.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
}

function normalisePlan(value: unknown): AntennaPlan | null {
  if (!isRecord(value)
    || value.kind !== ANTENNA_PLAN_KIND
    || (value.schemaVersion !== 1 && value.schemaVersion !== ANTENNA_PLAN_VERSION)
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
  const progress = value.schemaVersion === 1
    ? { completedStages: ['choose', 'plan'] as AntennaProjectStage[] }
    : normaliseProgress(value.progress);
  const buildRecord = normaliseBuildRecord(value.buildRecord);
  const measurements = normaliseMeasurements(value.measurements);

  if (!id || !name || !modelId || !modelVersion
    || !(antennaType in ANTENNA_DESIGNS)
    || !['CA', 'US', 'GB', 'AU'].includes(jurisdiction)
    || (unitSystem !== 'metric' && unitSystem !== 'imperial')
    || !progress || !buildRecord || !measurements
    || workspaceEntries.length < 2 || workspaceEntries.length > ANTENNA_PLAN_WORKSPACE_FIELD_LIMIT
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
    progress,
    buildRecord,
    measurements,
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

export function saveAntennaPlanMeasurementAnalysis(planId: string, measurementId: string, analysis: AntennaPlanMeasurementAnalysis, storage?: AntennaPlanStorage): AntennaPlan {
  const plan = loadAntennaPlans(storage).find((candidate) => candidate.id === planId);
  if (!plan) throw new TypeError('The originating antenna plan is no longer available in this browser.');
  if (!plan.measurements.some((record) => record.id === measurementId)) throw new TypeError('The originating measurement entry is no longer available in this plan.');
  const normalized = normaliseMeasurementAnalysis(analysis);
  if (!normalized) throw new TypeError('The measured-sweep summary is invalid.');
  const updated: AntennaPlan = {
    ...plan,
    updatedAt: new Date().toISOString(),
    measurements: plan.measurements.map((record) => record.id === measurementId ? { ...record, analysis: normalized } : record)
  };
  saveAntennaPlan(updated, storage);
  return updated;
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
