/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import {
  calculateExposureProject,
  type ExposureEvaluationPointInput,
  type ExposureProjectInput,
  type ExposureProjectSourceInput
} from '../calculators/exposureProject';
import type { ExposureEnvironment, ExposureJurisdiction } from '../regulations/exposureLimits';

export interface ExposureProjectData extends ExposureProjectInput {
  title: string;
  evidenceEntries: ExposureEvidenceEntry[];
}

export type ExposureEvidenceCategory = 'assumption' | 'measurement' | 'source-reference' | 'review-note';
export type ExposureEvidenceScopeType = 'project' | 'source' | 'point';
export type ExposureEvidenceQualityCheck =
  | 'assumption-subject' | 'assumption-basis' | 'assumption-conservatism' | 'assumption-review-trigger'
  | 'measurement-value' | 'measurement-instrument' | 'measurement-method' | 'measurement-uncertainty'
  | 'source-identity' | 'source-revision' | 'source-location' | 'source-applicability'
  | 'review-scope' | 'review-conclusion' | 'review-limitations' | 'review-follow-up';

export interface ExposureEvidenceQualityPrompt {
  id: ExposureEvidenceQualityCheck;
  label: string;
}

export const exposureEvidenceQualityPrompts: Record<ExposureEvidenceCategory, ExposureEvidenceQualityPrompt[]> = {
  assumption: [
    { id: 'assumption-subject', label: 'Assumed value or condition is stated' },
    { id: 'assumption-basis', label: 'Source or rationale is identified' },
    { id: 'assumption-conservatism', label: 'Conservative effect is explained' },
    { id: 'assumption-review-trigger', label: 'Revision trigger is identified' }
  ],
  measurement: [
    { id: 'measurement-value', label: 'Measured value and units are recorded' },
    { id: 'measurement-instrument', label: 'Instrument and calibration status are recorded' },
    { id: 'measurement-method', label: 'Method and conditions are recorded' },
    { id: 'measurement-uncertainty', label: 'Uncertainty or repeatability is addressed' }
  ],
  'source-reference': [
    { id: 'source-identity', label: 'Document title and issuer are identified' },
    { id: 'source-revision', label: 'Revision or publication date is recorded' },
    { id: 'source-location', label: 'Page, section, or table is identified' },
    { id: 'source-applicability', label: 'Applicability to the entered value is explained' }
  ],
  'review-note': [
    { id: 'review-scope', label: 'Review scope is stated' },
    { id: 'review-conclusion', label: 'Conclusion is recorded' },
    { id: 'review-limitations', label: 'Open limitations are identified' },
    { id: 'review-follow-up', label: 'Follow-up responsibility is recorded' }
  ]
};
export type ExposureEvidenceRelatedField =
  | 'general' | 'jurisdiction' | 'environment' | 'sourceInventoryComplete'
  | 'frequencyMHz' | 'transmitterPowerWatts' | 'dutyCyclePercent' | 'feedSystemLossDb'
  | 'antennaGainDbi' | 'antennaLargestDimensionMetres' | 'antennaCentreHeightMetres'
  | 'eastOffsetMetres' | 'northOffsetMetres' | 'patternType' | 'bearingDegrees' | 'beamwidthDegrees'
  | 'heightMetres';

export interface ExposureEvidenceEntry {
  id: string;
  category: ExposureEvidenceCategory;
  title: string;
  detail: string;
  recordedOn: string;
  reviewer: string;
  referenceUrl?: string;
  scopeType: ExposureEvidenceScopeType;
  scopeId?: string;
  relatedField: ExposureEvidenceRelatedField;
  qualityChecks: ExposureEvidenceQualityCheck[];
}

export interface ExposureProjectFile {
  kind: typeof EXPOSURE_PROJECT_FILE_KIND;
  schemaVersion: typeof EXPOSURE_PROJECT_FILE_VERSION;
  projectId: string;
  savedAt: string;
  project: ExposureProjectData;
}

interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export const EXPOSURE_PROJECT_FILE_KIND = 'radiobook-antenna-workshop/exposure-project';
export const EXPOSURE_PROJECT_FILE_VERSION = 6;
export const EXPOSURE_PROJECT_LIBRARY_KEY = 'radiobook:antenna-workshop:exposure-projects:v1';
export const EXPOSURE_PROJECT_CURRENT_KEY = 'radiobook:antenna-workshop:current-exposure-project:v1';
export const EXPOSURE_PROJECT_LIBRARY_LIMIT = 24;

function isJurisdiction(value: unknown): value is ExposureJurisdiction {
  return value === 'CA' || value === 'US';
}

function isEnvironment(value: unknown): value is ExposureEnvironment {
  return value === 'uncontrolled' || value === 'controlled';
}

function finiteNumber(value: unknown, label: string): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new TypeError(`${label} must be a finite number.`);
  }
  return value;
}

function text(value: unknown, label: string, maximumLength: number): string {
  if (typeof value !== 'string' || !value.trim() || value.length > maximumLength) {
    throw new TypeError(`${label} must contain between 1 and ${maximumLength} characters.`);
  }
  return value.trim();
}

function evidenceCategory(value: unknown): ExposureEvidenceCategory {
  if (value === 'assumption' || value === 'measurement' || value === 'source-reference' || value === 'review-note') return value;
  throw new TypeError('The evidence category is not supported.');
}

function evidenceScopeType(value: unknown): ExposureEvidenceScopeType {
  if (value === 'project' || value === 'source' || value === 'point') return value;
  throw new TypeError('The evidence scope type is not supported.');
}

function evidenceRelatedField(value: unknown): ExposureEvidenceRelatedField {
  const fields: ExposureEvidenceRelatedField[] = ['general', 'jurisdiction', 'environment', 'sourceInventoryComplete', 'frequencyMHz', 'transmitterPowerWatts', 'dutyCyclePercent', 'feedSystemLossDb', 'antennaGainDbi', 'antennaLargestDimensionMetres', 'antennaCentreHeightMetres', 'eastOffsetMetres', 'northOffsetMetres', 'patternType', 'bearingDegrees', 'beamwidthDegrees', 'heightMetres'];
  if (fields.includes(value as ExposureEvidenceRelatedField)) return value as ExposureEvidenceRelatedField;
  throw new TypeError('The evidence-related input is not supported.');
}

function dateOnly(value: unknown): string {
  const date = text(value, 'Evidence review date', 10);
  const parsed = new Date(`${date}T00:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) {
    throw new TypeError('Evidence review date must be a valid YYYY-MM-DD date.');
  }
  return date;
}

function referenceUrl(value: unknown): string | undefined {
  if (value === undefined || value === null || value === '') return undefined;
  const url = text(value, 'Evidence reference URL', 1000);
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TypeError('Evidence reference URL must be a valid HTTP or HTTPS URL.');
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new TypeError('Evidence reference URL must use HTTP or HTTPS.');
  return parsed.toString();
}

function evidenceQualityChecks(value: unknown, category: ExposureEvidenceCategory): ExposureEvidenceQualityCheck[] {
  if (!Array.isArray(value)) throw new TypeError('Evidence quality checks must be an array.');
  const allowed = exposureEvidenceQualityPrompts[category].map((prompt) => prompt.id);
  const checks = value.map((check) => {
    if (typeof check !== 'string' || !allowed.includes(check as ExposureEvidenceQualityCheck)) throw new TypeError('An evidence quality check does not belong to the selected category.');
    return check as ExposureEvidenceQualityCheck;
  });
  if (new Set(checks).size !== checks.length) throw new TypeError('Evidence quality checks must be unique.');
  return checks;
}

function evidenceEntry(value: unknown, legacyScope = false, legacyQuality = false): ExposureEvidenceEntry {
  if (!value || typeof value !== 'object') throw new TypeError('Every evidence entry must be an object.');
  const candidate = value as Record<string, unknown>;
  const category = evidenceCategory(candidate.category);
  return {
    id: text(candidate.id, 'Evidence identifier', 100),
    category,
    title: text(candidate.title, 'Evidence title', 160),
    detail: text(candidate.detail, 'Evidence detail', 4000),
    recordedOn: dateOnly(candidate.recordedOn),
    reviewer: text(candidate.reviewer, 'Evidence reviewer', 160),
    referenceUrl: referenceUrl(candidate.referenceUrl),
    scopeType: legacyScope ? 'project' : evidenceScopeType(candidate.scopeType),
    scopeId: legacyScope || candidate.scopeId === undefined ? undefined : text(candidate.scopeId, 'Evidence scope identifier', 100),
    relatedField: legacyScope ? 'general' : evidenceRelatedField(candidate.relatedField),
    qualityChecks: legacyQuality ? [] : evidenceQualityChecks(candidate.qualityChecks, category)
  };
}

const projectEvidenceFields: ExposureEvidenceRelatedField[] = ['general', 'jurisdiction', 'environment', 'sourceInventoryComplete'];
const sourceEvidenceFields: ExposureEvidenceRelatedField[] = ['general', 'frequencyMHz', 'transmitterPowerWatts', 'dutyCyclePercent', 'feedSystemLossDb', 'antennaGainDbi', 'antennaLargestDimensionMetres', 'antennaCentreHeightMetres', 'eastOffsetMetres', 'northOffsetMetres', 'patternType', 'bearingDegrees', 'beamwidthDegrees'];
const pointEvidenceFields: ExposureEvidenceRelatedField[] = ['general', 'eastOffsetMetres', 'northOffsetMetres', 'heightMetres'];

function validateEvidenceScope(entry: ExposureEvidenceEntry, sources: ExposureProjectSourceInput[], points: ExposureEvaluationPointInput[]) {
  if (entry.scopeType === 'project') {
    if (entry.scopeId !== undefined || !projectEvidenceFields.includes(entry.relatedField)) throw new TypeError('Project evidence has an invalid scope or related input.');
    return;
  }
  if (!entry.scopeId) throw new TypeError('Scoped evidence must identify a station source or evaluation point.');
  if (entry.scopeType === 'source') {
    if (!sources.some((source) => source.id === entry.scopeId) || !sourceEvidenceFields.includes(entry.relatedField)) throw new TypeError('Station-source evidence has an invalid scope or related input.');
    return;
  }
  if (!points.some((point) => point.id === entry.scopeId) || !pointEvidenceFields.includes(entry.relatedField)) throw new TypeError('Evaluation-point evidence has an invalid scope or related input.');
}

function source(value: unknown, legacyGeometry = false, legacyPattern = false): ExposureProjectSourceInput {
  if (!value || typeof value !== 'object') throw new TypeError('Every station source must be an object.');
  const candidate = value as Record<string, unknown>;
  const linkedModels = candidate.linkedModels;
  const validatedLinkedModels = linkedModels && typeof linkedModels === 'object'
    ? {
        antennaDesignId: text((linkedModels as Record<string, unknown>).antennaDesignId, 'Linked antenna model identifier', 160),
        antennaDesignVersion: text((linkedModels as Record<string, unknown>).antennaDesignVersion, 'Linked antenna model version', 40),
        feedSystemId: text((linkedModels as Record<string, unknown>).feedSystemId, 'Linked feed-system model identifier', 160),
        feedSystemVersion: text((linkedModels as Record<string, unknown>).feedSystemVersion, 'Linked feed-system model version', 40)
      }
    : undefined;
  return {
    id: text(candidate.id, 'Source identifier', 100),
    label: text(candidate.label, 'Source label', 120),
    frequencyMHz: finiteNumber(candidate.frequencyMHz, 'Source frequency'),
    transmitterPowerWatts: finiteNumber(candidate.transmitterPowerWatts, 'Transmitter power'),
    dutyCyclePercent: finiteNumber(candidate.dutyCyclePercent, 'Duty cycle'),
    feedSystemLossDb: finiteNumber(candidate.feedSystemLossDb, 'Feed-system loss'),
    antennaGainDbi: finiteNumber(candidate.antennaGainDbi, 'Antenna gain'),
    antennaLargestDimensionMetres: finiteNumber(candidate.antennaLargestDimensionMetres, 'Largest antenna dimension'),
    antennaCentreHeightMetres: finiteNumber(candidate.antennaCentreHeightMetres, 'Antenna centre height'),
    eastOffsetMetres: legacyGeometry ? 0 : finiteNumber(candidate.eastOffsetMetres, 'Source east coordinate'),
    northOffsetMetres: legacyGeometry ? 0 : finiteNumber(candidate.northOffsetMetres, 'Source north coordinate'),
    patternType: legacyPattern ? 'unknown' : candidate.patternType as ExposureProjectSourceInput['patternType'],
    bearingDegrees: legacyPattern ? 0 : finiteNumber(candidate.bearingDegrees, 'Maximum-response bearing'),
    beamwidthDegrees: legacyPattern ? 90 : finiteNumber(candidate.beamwidthDegrees, 'Horizontal beamwidth'),
    linkedModels: validatedLinkedModels
  };
}

function evaluationPoint(value: unknown, legacyGeometry = false): ExposureEvaluationPointInput {
  if (!value || typeof value !== 'object') throw new TypeError('Every evaluation point must be an object.');
  const candidate = value as Record<string, unknown>;
  return {
    id: text(candidate.id, 'Evaluation-point identifier', 100),
    label: text(candidate.label, 'Evaluation-point label', 120),
    eastOffsetMetres: legacyGeometry
      ? finiteNumber(candidate.horizontalDistanceMetres, 'Horizontal distance')
      : finiteNumber(candidate.eastOffsetMetres, 'Evaluation-point east coordinate'),
    northOffsetMetres: legacyGeometry ? 0 : finiteNumber(candidate.northOffsetMetres, 'Evaluation-point north coordinate'),
    heightMetres: finiteNumber(candidate.heightMetres, 'Evaluation-point height')
  };
}

function projectData(value: unknown, legacyGeometry = false, legacyPattern = false, legacyEvidence = false, legacyEvidenceScope = false, legacyEvidenceQuality = false): ExposureProjectData {
  if (!value || typeof value !== 'object') throw new TypeError('The project record is missing.');
  const candidate = value as Record<string, unknown>;
  if (!isJurisdiction(candidate.jurisdiction)) throw new TypeError('The project jurisdiction is not supported.');
  if (!isEnvironment(candidate.environment)) throw new TypeError('The exposure environment is not supported.');
  if (typeof candidate.sourceInventoryComplete !== 'boolean') throw new TypeError('The source-inventory state is invalid.');
  if (!Array.isArray(candidate.sources) || !Array.isArray(candidate.evaluationPoints)) {
    throw new TypeError('The project must contain source and evaluation-point arrays.');
  }
  if (!legacyEvidence && !Array.isArray(candidate.evidenceEntries)) throw new TypeError('The project must contain an evidence-entry array.');
  const evidenceEntries = legacyEvidence ? [] : candidate.evidenceEntries as unknown[];
  if (evidenceEntries.length > 120) throw new TypeError('A project can contain at most 120 evidence entries.');
  const validatedSources = candidate.sources.map((item) => source(item, legacyGeometry, legacyPattern));
  const validatedPoints = candidate.evaluationPoints.map((item) => evaluationPoint(item, legacyGeometry));
  const validatedEvidenceEntries = evidenceEntries.map((entry) => evidenceEntry(entry, legacyEvidenceScope, legacyEvidenceQuality));
  if (new Set(validatedEvidenceEntries.map((entry) => entry.id)).size !== validatedEvidenceEntries.length) {
    throw new TypeError('Evidence identifiers must be unique within a project.');
  }
  validatedEvidenceEntries.forEach((entry) => validateEvidenceScope(entry, validatedSources, validatedPoints));
  const project: ExposureProjectData = {
    title: text(candidate.title, 'Project title', 160),
    jurisdiction: candidate.jurisdiction,
    environment: candidate.environment,
    sourceInventoryComplete: candidate.sourceInventoryComplete,
    sources: validatedSources,
    evaluationPoints: validatedPoints,
    evidenceEntries: validatedEvidenceEntries
  };
  calculateExposureProject(project);
  return project;
}

export function createExposureProjectFile(
  project: ExposureProjectData,
  projectId: string,
  savedAt = new Date().toISOString()
): ExposureProjectFile {
  const validatedProject = projectData(project);
  const validatedDate = new Date(savedAt);
  if (Number.isNaN(validatedDate.valueOf())) throw new TypeError('The project save date is invalid.');
  return {
    kind: EXPOSURE_PROJECT_FILE_KIND,
    schemaVersion: EXPOSURE_PROJECT_FILE_VERSION,
    projectId: text(projectId, 'Project identifier', 100),
    savedAt: validatedDate.toISOString(),
    project: validatedProject
  };
}

export function parseExposureProjectFile(serialized: string): ExposureProjectFile {
  const value = JSON.parse(serialized) as unknown;
  if (!value || typeof value !== 'object') throw new TypeError('The selected file is not a project record.');
  const candidate = value as Record<string, unknown>;
  if (candidate.kind !== EXPOSURE_PROJECT_FILE_KIND) throw new TypeError('The selected file is not an Antenna Workshop exposure project.');
  if (candidate.schemaVersion !== 1 && candidate.schemaVersion !== 2 && candidate.schemaVersion !== 3 && candidate.schemaVersion !== 4 && candidate.schemaVersion !== 5 && candidate.schemaVersion !== EXPOSURE_PROJECT_FILE_VERSION) throw new TypeError('This project-file version is not supported.');
  return createExposureProjectFile(
    projectData(candidate.project, candidate.schemaVersion === 1, candidate.schemaVersion === 1 || candidate.schemaVersion === 2, Number(candidate.schemaVersion) < 4, Number(candidate.schemaVersion) < 5, Number(candidate.schemaVersion) < 6),
    text(candidate.projectId, 'Project identifier', 100),
    text(candidate.savedAt, 'Project save date', 100)
  );
}

export function serializeExposureProjectFile(file: ExposureProjectFile): string {
  return `${JSON.stringify(createExposureProjectFile(file.project, file.projectId, file.savedAt), null, 2)}\n`;
}

export function loadExposureProjectLibrary(storage?: StorageLike): ExposureProjectFile[] {
  if (!storage) return [];
  try {
    const serialized = storage.getItem(EXPOSURE_PROJECT_LIBRARY_KEY);
    if (!serialized) return [];
    const candidates = JSON.parse(serialized) as unknown;
    if (!Array.isArray(candidates)) return [];
    return candidates
      .flatMap((candidate) => {
        try {
          return [parseExposureProjectFile(JSON.stringify(candidate))];
        } catch {
          return [];
        }
      })
      .sort((a, b) => b.savedAt.localeCompare(a.savedAt))
      .slice(0, EXPOSURE_PROJECT_LIBRARY_LIMIT);
  } catch {
    return [];
  }
}

export function saveExposureProjectFile(file: ExposureProjectFile, storage?: StorageLike): ExposureProjectFile[] {
  const validated = createExposureProjectFile(file.project, file.projectId, file.savedAt);
  const projects = [
    validated,
    ...loadExposureProjectLibrary(storage).filter((project) => project.projectId !== validated.projectId)
  ].slice(0, EXPOSURE_PROJECT_LIBRARY_LIMIT);
  try {
    storage?.setItem(EXPOSURE_PROJECT_LIBRARY_KEY, JSON.stringify(projects));
    storage?.setItem(EXPOSURE_PROJECT_CURRENT_KEY, validated.projectId);
  } catch {
    // The current session remains usable when browser storage is unavailable.
  }
  return projects;
}

export function deleteExposureProjectFile(projectId: string, storage?: StorageLike): ExposureProjectFile[] {
  const projects = loadExposureProjectLibrary(storage).filter((project) => project.projectId !== projectId);
  try {
    if (projects.length) storage?.setItem(EXPOSURE_PROJECT_LIBRARY_KEY, JSON.stringify(projects));
    else storage?.removeItem(EXPOSURE_PROJECT_LIBRARY_KEY);
    if (storage?.getItem(EXPOSURE_PROJECT_CURRENT_KEY) === projectId) storage.removeItem(EXPOSURE_PROJECT_CURRENT_KEY);
  } catch {
    // The current session remains usable when browser storage is unavailable.
  }
  return projects;
}

export function getCurrentExposureProjectId(storage?: StorageLike): string | null {
  try {
    return storage?.getItem(EXPOSURE_PROJECT_CURRENT_KEY) ?? null;
  } catch {
    return null;
  }
}

export function exposureProjectFilename(title: string): string {
  const slug = title.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70);
  return `${slug || 'station-assessment'}.antenna-project.json`;
}
