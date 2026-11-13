/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type ArpansaExposureScenario = 'general-public' | 'occupational';
export type ArpansaReferenceValue = number | 'ES' | null;

export interface ArpansaFieldReference {
  averagingMinutes: number;
  electricFieldVoltsPerMetre: ArpansaReferenceValue;
  magneticFieldAmpsPerMetre: ArpansaReferenceValue;
  incidentPowerDensityWattsPerSquareMetre: ArpansaReferenceValue;
}

export interface ArpansaReferenceResult {
  frequencyMHz: number;
  scenario: ArpansaExposureScenario;
  wholeBody: ArpansaFieldReference;
  local: ArpansaFieldReference;
  peakField: { electricFieldVoltsPerMetre: number; magneticFieldAmpsPerMetre: number } | null;
  limbCurrentMilliamps: number | null;
  modelId: string;
  modelVersion: string;
}

export const ARPANSA_REFERENCE_MODEL = {
  id: 'arpansa-rps-s1-rev1-reference-levels',
  version: '1.0.0',
  sourceRevision: 'RPS S-1 (Rev. 1), 2021, Tables 4, 5, 7 and 8',
  reviewedOn: '2026-11-13',
  applicabilityMHz: [0.1, 300_000] as const,
  source: {
    title: 'ARPANSA RPS S-1 (Rev. 1) — RF exposure standard',
    url: 'https://www.arpansa.gov.au/regulation-and-licensing/regulatory-publications/radiation-protection-series/codes-and-standards/rpss-1'
  }
} as const;

function validateFrequency(frequencyMHz: number) {
  if (!Number.isFinite(frequencyMHz) || frequencyMHz < 0.1 || frequencyMHz > 300_000) {
    throw new RangeError('RPS S-1 reference-level applicability is 0.1 to 300,000 MHz.');
  }
}

function wholeBodyReference(frequencyMHz: number, scenario: ArpansaExposureScenario): ArpansaFieldReference {
  const occupational = scenario === 'occupational';
  const lowBoundary = occupational ? 6.943 : 6.27;
  if (frequencyMHz <= lowBoundary) return {
    averagingMinutes: 30,
    electricFieldVoltsPerMetre: 'ES',
    magneticFieldAmpsPerMetre: (occupational ? 4.9 : 2.2) / frequencyMHz,
    incidentPowerDensityWattsPerSquareMetre: null
  };
  if (frequencyMHz <= 30) return {
    averagingMinutes: 30,
    electricFieldVoltsPerMetre: (occupational ? 660 : 300) / frequencyMHz ** 0.7,
    magneticFieldAmpsPerMetre: (occupational ? 4.9 : 2.2) / frequencyMHz,
    incidentPowerDensityWattsPerSquareMetre: null
  };
  if (frequencyMHz <= 400) return {
    averagingMinutes: 30,
    electricFieldVoltsPerMetre: occupational ? 61 : 27.7,
    magneticFieldAmpsPerMetre: occupational ? 0.16 : 0.073,
    incidentPowerDensityWattsPerSquareMetre: occupational ? 10 : 2
  };
  if (frequencyMHz <= 2_000) return {
    averagingMinutes: 30,
    electricFieldVoltsPerMetre: (occupational ? 3 : 1.375) * Math.sqrt(frequencyMHz),
    magneticFieldAmpsPerMetre: (occupational ? 0.008 : 0.0037) * Math.sqrt(frequencyMHz),
    incidentPowerDensityWattsPerSquareMetre: frequencyMHz / (occupational ? 40 : 200)
  };
  return {
    averagingMinutes: 30,
    electricFieldVoltsPerMetre: null,
    magneticFieldAmpsPerMetre: null,
    incidentPowerDensityWattsPerSquareMetre: occupational ? 50 : 10
  };
}

function localReference(frequencyMHz: number, scenario: ArpansaExposureScenario): ArpansaFieldReference {
  const occupational = scenario === 'occupational';
  const lowestBoundary = occupational ? 0.135 : 0.233;
  if (frequencyMHz <= lowestBoundary) return {
    averagingMinutes: 6,
    electricFieldVoltsPerMetre: 'ES',
    magneticFieldAmpsPerMetre: 'ES',
    incidentPowerDensityWattsPerSquareMetre: null
  };
  if (frequencyMHz <= 10) return {
    averagingMinutes: 6,
    electricFieldVoltsPerMetre: 'ES',
    magneticFieldAmpsPerMetre: (occupational ? 10.8 : 4.9) / frequencyMHz,
    incidentPowerDensityWattsPerSquareMetre: null
  };
  if (frequencyMHz <= 30) return {
    averagingMinutes: 6,
    electricFieldVoltsPerMetre: (occupational ? 1504 : 671) / frequencyMHz ** 0.7,
    magneticFieldAmpsPerMetre: (occupational ? 10.8 : 4.9) / frequencyMHz,
    incidentPowerDensityWattsPerSquareMetre: null
  };
  if (frequencyMHz <= 400) return {
    averagingMinutes: 6,
    electricFieldVoltsPerMetre: occupational ? 139 : 62,
    magneticFieldAmpsPerMetre: occupational ? 0.36 : 0.163,
    incidentPowerDensityWattsPerSquareMetre: occupational ? 50 : 10
  };
  if (frequencyMHz <= 2_000) return {
    averagingMinutes: 6,
    electricFieldVoltsPerMetre: (occupational ? 10.58 : 4.72) * frequencyMHz ** 0.43,
    magneticFieldAmpsPerMetre: (occupational ? 0.0274 : 0.0123) * frequencyMHz ** 0.43,
    incidentPowerDensityWattsPerSquareMetre: (occupational ? 0.29 : 0.058) * frequencyMHz ** 0.86
  };
  let powerDensity = occupational ? 200 : 40;
  if (frequencyMHz > 6_000 && frequencyMHz < 300_000) {
    powerDensity = (occupational ? 275 : 55) / (frequencyMHz / 1_000) ** 0.177;
  } else if (frequencyMHz === 300_000) powerDensity = occupational ? 100 : 20;
  return {
    averagingMinutes: 6,
    electricFieldVoltsPerMetre: null,
    magneticFieldAmpsPerMetre: null,
    incidentPowerDensityWattsPerSquareMetre: powerDensity
  };
}

export function getArpansaReferenceLevels(frequencyMHz: number, scenario: ArpansaExposureScenario): ArpansaReferenceResult {
  validateFrequency(frequencyMHz);
  if (scenario !== 'general-public' && scenario !== 'occupational') throw new RangeError('Exposure scenario must be general-public or occupational.');
  return {
    frequencyMHz,
    scenario,
    wholeBody: wholeBodyReference(frequencyMHz, scenario),
    local: localReference(frequencyMHz, scenario),
    peakField: frequencyMHz <= 10 ? {
      electricFieldVoltsPerMetre: scenario === 'occupational' ? 170 : 83,
      magneticFieldAmpsPerMetre: scenario === 'occupational' ? 80 : 21
    } : null,
    limbCurrentMilliamps: frequencyMHz <= 110 ? (scenario === 'occupational' ? 100 : 45) : null,
    modelId: ARPANSA_REFERENCE_MODEL.id,
    modelVersion: ARPANSA_REFERENCE_MODEL.version
  };
}
