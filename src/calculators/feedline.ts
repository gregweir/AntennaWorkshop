/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface FeedlineInput {
  transmitterPowerWatts: number;
  cableLengthMetres: number;
  matchedLossDbPer100Metres: number;
  accessoryLossDb: number;
  swr: number;
}

export interface FeedlineResult {
  cableLossDb: number;
  pathLossDb: number;
  forwardPowerAtAntennaWatts: number;
  reflectionCoefficient: number;
  reflectedPowerPercent: number;
  returnLossDb: number;
  mismatchLossDb: number;
  acceptedPowerWatts: number;
  reflectedPowerWatts: number;
  pathDissipationWatts: number;
  acceptedEfficiencyPercent: number;
}

export type StubTermination = 'open' | 'short';
export type StubFraction = 0.25 | 0.5;

export interface CoaxialStubInput {
  frequencyMHz: number;
  velocityFactor: number;
  fraction: StubFraction;
  termination: StubTermination;
  trimAllowancePercent: number;
}

export type GainReference = 'dBi' | 'dBd';

export interface RadiatedPowerInput {
  transmitterPowerWatts: number;
  feedSystemLossDb: number;
  antennaGainDb: number;
  gainReference: GainReference;
}

export const FEEDLINE_MODEL = {
  id: 'feedline-first-order-power-budget',
  version: '1.0.0',
  reviewedOn: '2026-11-11',
  sources: [
    {
      title: 'ARRL — RF Exposure Chapter 5: feed-line losses and decibels',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/RF%20Exposure%20Chapter%205.pdf'
    },
    {
      title: 'Rohde & Schwarz — RF Fundamentals Part 3: reflection and VSWR',
      url: 'https://cdn.rohde-schwarz.com/ymkt/na/content/RF_fundamentals_seminar_materials/3_RF_Fun_-_Standing_Waves_Unc-Mismatch_VNA.pdf'
    }
  ]
} as const;

export const COAXIAL_STUB_MODEL = {
  id: 'lossless-coaxial-stub-physical-length',
  version: '1.0.0',
  reviewedOn: '2026-11-11',
  sources: [
    {
      title: 'ARRL — Feeding Your Station: velocity factor and quarter-wave lines',
      url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/128320.pdf'
    },
    {
      title: 'Keysight FieldFox — velocity factor definition and cable examples',
      url: 'https://helpfiles.keysight.com/csg/B_Series_FieldFox_WebHelp/Chapter_5_NA_%28Network_Analyzer%29_Mode.htm'
    }
  ]
} as const;

export const RADIATED_POWER_MODEL = {
  id: 'erp-eirp-antenna-system-budget',
  version: '1.0.0',
  reviewedOn: '2026-11-11',
  sources: [
    {
      title: 'ITU-T K.91 — ERP/EIRP evaluation and feeder loss',
      url: 'https://www.itu.int/epublications/publication/itu-t-k-91-2024-01-guidance-for-assessment-evaluation-and-monitoring-of-human-exposure-to-radio-frequency-electromagnetic-fields/en'
    },
    {
      title: 'ITU-R Radio Regulations terminology — EIRP, ERP, and antenna gain',
      url: 'https://www.itu.int/en/ITU-R/study-groups/Documents/ITU-R_Reference_Assist/Beta_Test_Version.aspx'
    }
  ]
} as const;

export function calculateFeedlineBudget(input: FeedlineInput): FeedlineResult {
  if (!Number.isFinite(input.transmitterPowerWatts) || input.transmitterPowerWatts <= 0) {
    throw new RangeError('Transmitter power must be greater than zero.');
  }
  if (!Number.isFinite(input.cableLengthMetres) || input.cableLengthMetres < 0 || input.cableLengthMetres > 100_000) {
    throw new RangeError('Cable length must be between zero and 100,000 metres.');
  }
  if (!Number.isFinite(input.matchedLossDbPer100Metres) || input.matchedLossDbPer100Metres < 0 || input.matchedLossDbPer100Metres > 100) {
    throw new RangeError('Matched cable loss must be between zero and 100 dB per 100 metres.');
  }
  if (!Number.isFinite(input.accessoryLossDb) || input.accessoryLossDb < 0 || input.accessoryLossDb > 100) {
    throw new RangeError('Accessory loss must be between zero and 100 dB.');
  }
  if (!Number.isFinite(input.swr) || input.swr < 1 || input.swr > 100) {
    throw new RangeError('SWR must be between 1 and 100.');
  }

  const cableLossDb = input.matchedLossDbPer100Metres * input.cableLengthMetres / 100;
  const pathLossDb = cableLossDb + input.accessoryLossDb;
  const forwardPowerAtAntennaWatts = input.transmitterPowerWatts * 10 ** (-pathLossDb / 10);
  const reflectionCoefficient = (input.swr - 1) / (input.swr + 1);
  const reflectedPowerFraction = reflectionCoefficient ** 2;
  const reflectedPowerPercent = reflectedPowerFraction * 100;
  const returnLossDb = reflectionCoefficient === 0 ? Number.POSITIVE_INFINITY : -20 * Math.log10(reflectionCoefficient);
  const mismatchLossDb = -10 * Math.log10(1 - reflectedPowerFraction);
  const acceptedPowerWatts = forwardPowerAtAntennaWatts * (1 - reflectedPowerFraction);

  return {
    cableLossDb,
    pathLossDb,
    forwardPowerAtAntennaWatts,
    reflectionCoefficient,
    reflectedPowerPercent,
    returnLossDb,
    mismatchLossDb,
    acceptedPowerWatts,
    reflectedPowerWatts: forwardPowerAtAntennaWatts - acceptedPowerWatts,
    pathDissipationWatts: input.transmitterPowerWatts - forwardPowerAtAntennaWatts,
    acceptedEfficiencyPercent: acceptedPowerWatts / input.transmitterPowerWatts * 100
  };
}

export function calculateCoaxialStub(input: CoaxialStubInput) {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0) {
    throw new RangeError('Frequency must be greater than zero.');
  }
  if (!Number.isFinite(input.velocityFactor) || input.velocityFactor <= 0 || input.velocityFactor > 1) {
    throw new RangeError('Velocity factor must be greater than zero and no more than one.');
  }
  if (input.fraction !== 0.25 && input.fraction !== 0.5) {
    throw new RangeError('Stub fraction must be one quarter or one half wavelength.');
  }
  if (input.termination !== 'open' && input.termination !== 'short') {
    throw new RangeError('Stub termination must be open or shorted.');
  }
  if (!Number.isFinite(input.trimAllowancePercent) || input.trimAllowancePercent < 0 || input.trimAllowancePercent > 25) {
    throw new RangeError('Trim allowance must be between zero and 25 percent.');
  }

  const freeSpaceWavelengthMetres = 299_792_458 / (input.frequencyMHz * 1_000_000);
  const guidedWavelengthMetres = freeSpaceWavelengthMetres * input.velocityFactor;
  const physicalLengthMetres = guidedWavelengthMetres * input.fraction;
  const cutLengthMetres = physicalLengthMetres * (1 + input.trimAllowancePercent / 100);
  const designFrequencyPeriodNanoseconds = 1_000 / input.frequencyMHz;
  const oneWayDelayNanoseconds = designFrequencyPeriodNanoseconds * input.fraction;
  const inputImpedanceBehavior = input.fraction === 0.25
    ? input.termination === 'short' ? 'high' : 'low'
    : input.termination === 'short' ? 'low' : 'high';

  return {
    freeSpaceWavelengthMetres,
    guidedWavelengthMetres,
    physicalLengthMetres,
    cutLengthMetres,
    electricalLengthDegrees: input.fraction * 360,
    oneWayDelayNanoseconds,
    inputImpedanceBehavior
  } as const;
}

export function calculateRadiatedPower(input: RadiatedPowerInput) {
  if (!Number.isFinite(input.transmitterPowerWatts) || input.transmitterPowerWatts <= 0) {
    throw new RangeError('Transmitter power must be greater than zero.');
  }
  if (!Number.isFinite(input.feedSystemLossDb) || input.feedSystemLossDb < 0 || input.feedSystemLossDb > 100) {
    throw new RangeError('Feed-system loss must be between zero and 100 dB.');
  }
  if (!Number.isFinite(input.antennaGainDb) || input.antennaGainDb < -100 || input.antennaGainDb > 100) {
    throw new RangeError('Antenna gain must be between -100 and 100 dB.');
  }
  if (input.gainReference !== 'dBi' && input.gainReference !== 'dBd') {
    throw new RangeError('Gain reference must be dBi or dBd.');
  }

  const antennaInputPowerWatts = input.transmitterPowerWatts * 10 ** (-input.feedSystemLossDb / 10);
  const antennaGainDbi = input.gainReference === 'dBi' ? input.antennaGainDb : input.antennaGainDb + 2.15;
  const antennaGainDbd = input.gainReference === 'dBd' ? input.antennaGainDb : input.antennaGainDb - 2.15;
  const eirpWatts = antennaInputPowerWatts * 10 ** (antennaGainDbi / 10);
  const erpWatts = antennaInputPowerWatts * 10 ** (antennaGainDbd / 10);

  return {
    antennaInputPowerWatts,
    antennaGainDbi,
    antennaGainDbd,
    eirpWatts,
    erpWatts,
    eirpDbw: 10 * Math.log10(eirpWatts),
    erpDbw: 10 * Math.log10(erpWatts),
    eirpDbm: 10 * Math.log10(eirpWatts * 1000),
    systemGainDb: antennaGainDbi - input.feedSystemLossDb,
    feedSystemEfficiencyPercent: antennaInputPowerWatts / input.transmitterPowerWatts * 100
  };
}
