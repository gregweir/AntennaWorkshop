/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectSourceInput } from '../calculators/exposureProject';

export interface AntennaDesignHandoff {
  handoffId: string;
  label: string;
  frequencyMHz: number;
  largestDimensionMetres: number;
  antennaModelId: string;
  antennaModelVersion: string;
}

export interface StationSourceTransfer {
  transferId: string;
  source: Omit<ExposureProjectSourceInput, 'id'>;
}

export interface StationSourceSystemInput {
  transmitterPowerWatts: number;
  dutyCyclePercent: number;
  feedSystemLossDb: number;
  antennaGainDbi: number;
  antennaCentreHeightMetres: number;
  eastOffsetMetres: number;
  northOffsetMetres: number;
  feedSystemModelId: string;
  feedSystemModelVersion: string;
}

function finiteInRange(value: number, label: string, minimum: number, maximum: number) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function createAntennaDesignHandoff(handoff: AntennaDesignHandoff): AntennaDesignHandoff {
  if (!handoff.handoffId || !handoff.label.trim() || !handoff.antennaModelId || !handoff.antennaModelVersion) {
    throw new TypeError('A linked antenna design requires identifiers, a label, and model provenance.');
  }
  finiteInRange(handoff.frequencyMHz, 'Frequency', 0.001, 300_000);
  finiteInRange(handoff.largestDimensionMetres, 'Largest antenna dimension', 0.001, 100_000);
  return { ...handoff, label: handoff.label.trim() };
}

export function createStationSourceTransfer(
  transferId: string,
  antenna: AntennaDesignHandoff,
  system: StationSourceSystemInput
): StationSourceTransfer {
  const design = createAntennaDesignHandoff(antenna);
  if (!transferId || !system.feedSystemModelId || !system.feedSystemModelVersion) {
    throw new TypeError('A station-source transfer requires identifiers and model provenance.');
  }
  finiteInRange(system.transmitterPowerWatts, 'Transmitter power', 0.001, 100_000_000);
  finiteInRange(system.dutyCyclePercent, 'Duty cycle', 0.01, 100);
  finiteInRange(system.feedSystemLossDb, 'Feed-system loss', 0, 100);
  finiteInRange(system.antennaGainDbi, 'Antenna gain', -100, 100);
  finiteInRange(system.antennaCentreHeightMetres, 'Antenna centre height', 0, 100_000);
  finiteInRange(system.eastOffsetMetres, 'Antenna east coordinate', -1_000_000, 1_000_000);
  finiteInRange(system.northOffsetMetres, 'Antenna north coordinate', -1_000_000, 1_000_000);
  return {
    transferId,
    source: {
      label: design.label,
      frequencyMHz: design.frequencyMHz,
      transmitterPowerWatts: system.transmitterPowerWatts,
      dutyCyclePercent: system.dutyCyclePercent,
      feedSystemLossDb: system.feedSystemLossDb,
      antennaGainDbi: system.antennaGainDbi,
      antennaLargestDimensionMetres: design.largestDimensionMetres,
      antennaCentreHeightMetres: system.antennaCentreHeightMetres,
      eastOffsetMetres: system.eastOffsetMetres,
      northOffsetMetres: system.northOffsetMetres,
      patternType: 'unknown',
      bearingDegrees: 0,
      beamwidthDegrees: 90,
      linkedModels: {
        antennaDesignId: design.antennaModelId,
        antennaDesignVersion: design.antennaModelVersion,
        feedSystemId: system.feedSystemModelId,
        feedSystemVersion: system.feedSystemModelVersion
      }
    }
  };
}
