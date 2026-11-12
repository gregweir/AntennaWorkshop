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
export const EXPOSURE_PROJECT_FILE_VERSION = 1;
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

function source(value: unknown): ExposureProjectSourceInput {
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
    linkedModels: validatedLinkedModels
  };
}

function evaluationPoint(value: unknown): ExposureEvaluationPointInput {
  if (!value || typeof value !== 'object') throw new TypeError('Every evaluation point must be an object.');
  const candidate = value as Record<string, unknown>;
  return {
    id: text(candidate.id, 'Evaluation-point identifier', 100),
    label: text(candidate.label, 'Evaluation-point label', 120),
    horizontalDistanceMetres: finiteNumber(candidate.horizontalDistanceMetres, 'Horizontal distance'),
    heightMetres: finiteNumber(candidate.heightMetres, 'Evaluation-point height')
  };
}

function projectData(value: unknown): ExposureProjectData {
  if (!value || typeof value !== 'object') throw new TypeError('The project record is missing.');
  const candidate = value as Record<string, unknown>;
  if (!isJurisdiction(candidate.jurisdiction)) throw new TypeError('The project jurisdiction is not supported.');
  if (!isEnvironment(candidate.environment)) throw new TypeError('The exposure environment is not supported.');
  if (typeof candidate.sourceInventoryComplete !== 'boolean') throw new TypeError('The source-inventory state is invalid.');
  if (!Array.isArray(candidate.sources) || !Array.isArray(candidate.evaluationPoints)) {
    throw new TypeError('The project must contain source and evaluation-point arrays.');
  }
  const project: ExposureProjectData = {
    title: text(candidate.title, 'Project title', 160),
    jurisdiction: candidate.jurisdiction,
    environment: candidate.environment,
    sourceInventoryComplete: candidate.sourceInventoryComplete,
    sources: candidate.sources.map(source),
    evaluationPoints: candidate.evaluationPoints.map(evaluationPoint)
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
  if (candidate.schemaVersion !== EXPOSURE_PROJECT_FILE_VERSION) throw new TypeError('This project-file version is not supported.');
  return createExposureProjectFile(
    projectData(candidate.project),
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
