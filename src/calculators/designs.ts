/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface CommonDesignInput {
  frequencyMHz: number;
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
}

export interface InvertedVInput extends CommonDesignInput {
  includedAngleDegrees: number;
}

export interface GroundPlaneInput extends CommonDesignInput {
  radialCount: number;
  radialSlopeDegrees: number;
}

export interface GroundMountedVerticalInput extends CommonDesignInput {
  radialCount: number;
  radialLengthMultiplier: number;
}

export interface EfhwInput extends CommonDesignInput {
  transformerRatio: number;
  estimatedEndImpedanceOhms: number;
}

export interface OcfdInput extends CommonDesignInput {
  feedpointPercentFromEnd: number;
  transformerRatio: number;
  estimatedFeedpointImpedanceOhms: number;
}

export interface FanDipoleInput {
  frequenciesMHz: number[];
  lengthCorrectionFactor: number;
  trimAllowancePercent: number;
}

export interface JpoleInput extends CommonDesignInput {
  feedpointPercentOfStub: number;
}

export interface SlimJimInput extends CommonDesignInput {
  feedpointPercentOfStub: number;
  gapPercentOfStub: number;
}

export interface MoxonInput {
  frequencyMHz: number;
  conductorDiameterMillimetres: number;
}

export interface BasicYagiInput {
  frequencyMHz: number;
}

export type LoopShape = 'square' | 'triangle' | 'circle';

export interface FullWaveLoopInput extends CommonDesignInput {
  shape: LoopShape;
}

export const ANTENNA_MODELS = {
  invertedV: {
    id: 'inverted-v',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL — Radio Antennas and How They Operate',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8409030.pdf'
      }
    ]
  },
  groundPlane: {
    id: 'quarter-wave-ground-plane',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL — Some Plain Facts About Multiband Vertical Antennas',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/QST_Sep_1972_p14-16_28.pdf'
      }
    ]
  },
  groundMountedVertical: {
    id: 'ground-mounted-quarter-wave-vertical',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL — Radio Antennas and How They Operate',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8409030.pdf'
      },
      {
        title: 'ARRL — Some Plain Facts About Multiband Vertical Antennas',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/QST_Sep_1972_p14-16_28.pdf'
      }
    ]
  },
  fullWaveLoop: {
    id: 'full-wave-loop',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL — Radio Antennas and How They Operate',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/8409030.pdf'
      }
    ]
  },
  efhw: {
    id: 'end-fed-half-wave',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL — End-Fed Half-Wave Antenna Kit',
        url: 'https://www.arrl.org/end-fed-half-wave-antenna-kit'
      },
      {
        title: 'ARRL — Build Your Field Day Antenna',
        url: 'https://www.arrl.org/files/file/Pubs/Field%20Day%20Insert.pdf'
      }
    ]
  },
  ocfd: {
    id: 'off-centre-fed-dipole',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL QST Product Review — Off-center-fed dipole principles',
        url: 'https://www.arrl.org/files/file/ProductReviewsForDeb/2014/pr112014.pdf'
      },
      {
        title: 'ARRL Extra Class Study Guide — OCFD multiband purpose',
        url: 'https://www.arrl.org/files/file/Extra%20Class%20License%20Manual/Extra%20Class%20Study%20Guide.pdf'
      }
    ]
  },
  fanDipole: {
    id: 'parallel-fan-dipole',
    version: '1.0.0',
    reviewedOn: '2026-11-13',
    sources: [
      {
        title: 'ARRL — Wire Antennas for the Beginner',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/0683033.pdf'
      },
      {
        title: 'ARRL — Lab Notes: Multiband Dipoles Compared',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/9611073.pdf'
      }
    ]
  },
  jpole: {
    id: 'single-band-j-pole',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL — An Easy Dual-Band VHF/UHF Antenna',
        url: 'https://www.arrl.org/files/file/Public%20Service/TrainingModules/jpole-dual-band.pdf'
      },
      {
        title: 'ARRL — The DBJ-1: A VHF-UHF Dual-Band J-Pole',
        url: 'https://www.arrl.org/files/file/Technology/tis/info/pdf/0302038.pdf'
      }
    ]
  },
  slimJim: {
    id: 'single-band-slim-jim',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL QST — Dual Band VHF/UHF Slim Jim Antenna listing',
        url: 'https://www.arrl.org/files/file/QST/This%20Month%20in%20QST/December%202011/TOC.pdf'
      },
      {
        title: 'RSGB — Slim Jim practical construction skills',
        url: 'https://rsgb.org/main/blog/news/rsgb-notices/2021/03/08/useful-practical-skills-videos-slim-jim-antenna-and-a-simple-balun/'
      }
    ]
  },
  moxon: {
    id: 'moxon-rectangle-cebik-regression',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'ARRL QST — Moxon Mighty Mite and MoxGen methodology',
        url: 'https://www.arrl.org/files/file/QST%20Binaries/Oct2011/QS1011ShacklefordRev2.pdf'
      },
      {
        title: 'L. B. Cebik, W4RNL — Moxon regression equations and model',
        url: 'https://www.cqham.ru/cebik_i.htm'
      }
    ]
  },
  basicYagi: {
    id: 'nbs-three-element-0.4-wavelength-yagi',
    version: '1.0.0',
    reviewedOn: '2026-11-11',
    sources: [
      {
        title: 'NBS Technical Note 688 — Yagi Antenna Design',
        url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/TN/nbstechnicalnote688.pdf'
      },
      {
        title: 'NIST publication record — Yagi Antenna Design',
        url: 'https://www.nist.gov/publications/yagi-antenna-design'
      }
    ]
  }
} as const;

function validateCommon(input: CommonDesignInput) {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0) {
    throw new RangeError('Frequency must be greater than zero.');
  }
  if (!Number.isFinite(input.lengthCorrectionFactor) || input.lengthCorrectionFactor <= 0 || input.lengthCorrectionFactor > 1.2) {
    throw new RangeError('Length correction factor must be greater than zero and no more than 1.2.');
  }
  if (!Number.isFinite(input.trimAllowancePercent) || input.trimAllowancePercent < 0 || input.trimAllowancePercent > 25) {
    throw new RangeError('Trim allowance must be between zero and 25 percent.');
  }
}

function commonLengths(input: CommonDesignInput, wavelengthFraction: number) {
  validateCommon(input);
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const resonantLengthMetres = wavelengthMetres * wavelengthFraction * input.lengthCorrectionFactor;
  const cutLengthMetres = resonantLengthMetres * (1 + input.trimAllowancePercent / 100);
  return { wavelengthMetres, resonantLengthMetres, cutLengthMetres };
}

export function calculateFanDipole(input: FanDipoleInput) {
  if (!Array.isArray(input.frequenciesMHz) || input.frequenciesMHz.length < 2 || input.frequenciesMHz.length > 6) {
    throw new RangeError('A fan dipole requires between two and six design frequencies.');
  }
  if (new Set(input.frequenciesMHz.map((frequency) => frequency.toFixed(9))).size !== input.frequenciesMHz.length) {
    throw new RangeError('Each fan-dipole element requires a distinct design frequency.');
  }

  const elements = input.frequenciesMHz.map((frequencyMHz) => {
    const lengths = commonLengths({
      frequencyMHz,
      lengthCorrectionFactor: input.lengthCorrectionFactor,
      trimAllowancePercent: input.trimAllowancePercent
    }, 0.5);
    return {
      frequencyMHz,
      wavelengthMetres: lengths.wavelengthMetres,
      resonantTotalMetres: lengths.resonantLengthMetres,
      cutTotalMetres: lengths.cutLengthMetres,
      cutLegMetres: lengths.cutLengthMetres / 2
    };
  }).sort((a, b) => a.frequencyMHz - b.frequencyMHz);

  return {
    elements,
    wavelengthMetres: elements[0].wavelengthMetres,
    longestSpanMetres: elements[0].cutTotalMetres,
    shortestSpanMetres: elements[elements.length - 1].cutTotalMetres,
    totalWireMetres: elements.reduce((total, element) => total + element.cutTotalMetres, 0),
    lowestFrequencyMHz: elements[0].frequencyMHz,
    highestFrequencyMHz: elements[elements.length - 1].frequencyMHz
  };
}

export function calculateInvertedV(input: InvertedVInput) {
  if (!Number.isFinite(input.includedAngleDegrees) || input.includedAngleDegrees < 60 || input.includedAngleDegrees > 180) {
    throw new RangeError('Included angle must be between 60 and 180 degrees.');
  }
  const lengths = commonLengths(input, 0.5);
  const legMetres = lengths.cutLengthMetres / 2;
  const halfAngleRadians = (input.includedAngleDegrees / 2) * Math.PI / 180;
  return {
    ...lengths,
    legMetres,
    endpointSpanMetres: 2 * legMetres * Math.sin(halfAngleRadians),
    apexDropMetres: legMetres * Math.cos(halfAngleRadians)
  };
}

export function calculateGroundPlane(input: GroundPlaneInput) {
  if (!Number.isInteger(input.radialCount) || input.radialCount < 3 || input.radialCount > 64) {
    throw new RangeError('Radial count must be a whole number between 3 and 64.');
  }
  if (!Number.isFinite(input.radialSlopeDegrees) || input.radialSlopeDegrees < 0 || input.radialSlopeDegrees > 60) {
    throw new RangeError('Radial slope must be between zero and 60 degrees.');
  }
  const lengths = commonLengths(input, 0.25);
  const slopeRadians = input.radialSlopeDegrees * Math.PI / 180;
  return {
    ...lengths,
    radiatorMetres: lengths.cutLengthMetres,
    radialMetres: lengths.cutLengthMetres,
    totalRadialWireMetres: lengths.cutLengthMetres * input.radialCount,
    footprintDiameterMetres: 2 * lengths.cutLengthMetres * Math.cos(slopeRadians),
    radialDropMetres: lengths.cutLengthMetres * Math.sin(slopeRadians)
  };
}

export function calculateGroundMountedVertical(input: GroundMountedVerticalInput) {
  if (!Number.isInteger(input.radialCount) || input.radialCount < 4 || input.radialCount > 240) {
    throw new RangeError('Radial count must be a whole number between 4 and 240.');
  }
  if (!Number.isFinite(input.radialLengthMultiplier) || input.radialLengthMultiplier < 0.25 || input.radialLengthMultiplier > 2) {
    throw new RangeError('Radial length multiplier must be between 0.25 and 2.');
  }
  const lengths = commonLengths(input, 0.25);
  const radialMetres = lengths.resonantLengthMetres * input.radialLengthMultiplier;
  return {
    ...lengths,
    radialCount: input.radialCount,
    radiatorMetres: lengths.cutLengthMetres,
    radialMetres,
    totalRadialWireMetres: radialMetres * input.radialCount,
    totalConductorMetres: lengths.cutLengthMetres + radialMetres * input.radialCount,
    radialFieldDiameterMetres: radialMetres * 2,
    radialFieldAreaSquareMetres: Math.PI * radialMetres ** 2
  };
}

export function calculateFullWaveLoop(input: FullWaveLoopInput) {
  if (!['square', 'triangle', 'circle'].includes(input.shape)) {
    throw new RangeError('Loop shape is not supported.');
  }
  const lengths = commonLengths(input, 1);
  const primaryDimensionMetres = input.shape === 'square'
    ? lengths.cutLengthMetres / 4
    : input.shape === 'triangle'
      ? lengths.cutLengthMetres / 3
      : lengths.cutLengthMetres / Math.PI;
  return {
    ...lengths,
    perimeterMetres: lengths.cutLengthMetres,
    primaryDimensionMetres
  };
}

export function calculateEfhw(input: EfhwInput) {
  if (!Number.isFinite(input.transformerRatio) || input.transformerRatio < 4 || input.transformerRatio > 100) {
    throw new RangeError('Transformer impedance ratio must be between 4:1 and 100:1.');
  }
  if (!Number.isFinite(input.estimatedEndImpedanceOhms) || input.estimatedEndImpedanceOhms < 200 || input.estimatedEndImpedanceOhms > 20_000) {
    throw new RangeError('Estimated end impedance must be between 200 and 20,000 ohms.');
  }
  const lengths = commonLengths(input, 0.5);
  return {
    ...lengths,
    radiatorMetres: lengths.cutLengthMetres,
    transformedImpedanceOhms: input.estimatedEndImpedanceOhms / input.transformerRatio,
    turnsRatio: Math.sqrt(input.transformerRatio),
    harmonicFrequenciesMHz: [1, 2, 3, 4].map((multiple) => ({
      multiple,
      frequencyMHz: input.frequencyMHz * multiple
    }))
  };
}

export function calculateOcfd(input: OcfdInput) {
  if (!Number.isFinite(input.feedpointPercentFromEnd) || input.feedpointPercentFromEnd < 10 || input.feedpointPercentFromEnd > 50) {
    throw new RangeError('Feedpoint position must be between 10 and 50 percent from one end.');
  }
  if (!Number.isFinite(input.transformerRatio) || input.transformerRatio < 1 || input.transformerRatio > 25) {
    throw new RangeError('Transformer impedance ratio must be between 1:1 and 25:1.');
  }
  if (!Number.isFinite(input.estimatedFeedpointImpedanceOhms) || input.estimatedFeedpointImpedanceOhms < 20 || input.estimatedFeedpointImpedanceOhms > 5000) {
    throw new RangeError('Estimated feedpoint impedance must be between 20 and 5,000 ohms.');
  }
  const lengths = commonLengths(input, 0.5);
  const shortLegMetres = lengths.cutLengthMetres * input.feedpointPercentFromEnd / 100;
  const longLegMetres = lengths.cutLengthMetres - shortLegMetres;
  return {
    ...lengths,
    shortLegMetres,
    longLegMetres,
    legLengthRatio: longLegMetres / shortLegMetres,
    transformedImpedanceOhms: input.estimatedFeedpointImpedanceOhms / input.transformerRatio,
    turnsRatio: Math.sqrt(input.transformerRatio),
    harmonicFrequenciesMHz: [1, 2, 3, 4].map((multiple) => ({ multiple, frequencyMHz: input.frequencyMHz * multiple }))
  };
}

export function calculateJpole(input: JpoleInput) {
  if (!Number.isFinite(input.feedpointPercentOfStub) || input.feedpointPercentOfStub < 1 || input.feedpointPercentOfStub > 25) {
    throw new RangeError('Feedpoint tap must be between one and 25 percent of the matching stub.');
  }
  const stub = commonLengths(input, 0.25);
  return {
    wavelengthMetres: stub.wavelengthMetres,
    longElementMetres: stub.cutLengthMetres * 3,
    matchingStubMetres: stub.cutLengthMetres,
    halfWaveRadiatorMetres: stub.cutLengthMetres * 2,
    feedpointFromShortMetres: stub.cutLengthMetres * input.feedpointPercentOfStub / 100,
    resonantLongElementMetres: stub.resonantLengthMetres * 3,
    resonantStubMetres: stub.resonantLengthMetres
  };
}

export function calculateSlimJim(input: SlimJimInput) {
  if (!Number.isFinite(input.feedpointPercentOfStub) || input.feedpointPercentOfStub < 1 || input.feedpointPercentOfStub > 25) {
    throw new RangeError('Feedpoint tap must be between one and 25 percent of the matching stub.');
  }
  if (!Number.isFinite(input.gapPercentOfStub) || input.gapPercentOfStub < 1 || input.gapPercentOfStub > 15) {
    throw new RangeError('Interruption gap must be between one and 15 percent of the matching stub.');
  }
  const stub = commonLengths(input, 0.25);
  const overallHeightMetres = stub.cutLengthMetres * 3;
  const interruptionGapMetres = stub.cutLengthMetres * input.gapPercentOfStub / 100;
  const upperFoldedSectionMetres = overallHeightMetres - stub.cutLengthMetres - interruptionGapMetres;
  return {
    wavelengthMetres: stub.wavelengthMetres,
    overallHeightMetres,
    matchingStubMetres: stub.cutLengthMetres,
    upperFoldedSectionMetres,
    interruptionGapMetres,
    feedpointFromShortMetres: stub.cutLengthMetres * input.feedpointPercentOfStub / 100,
    totalConductorMetres: overallHeightMetres + stub.cutLengthMetres + upperFoldedSectionMetres
  };
}

export function calculateMoxon(input: MoxonInput) {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0) {
    throw new RangeError('Frequency must be greater than zero.');
  }
  if (!Number.isFinite(input.conductorDiameterMillimetres) || input.conductorDiameterMillimetres <= 0) {
    throw new RangeError('Conductor diameter must be greater than zero.');
  }
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const diameterWavelengths = input.conductorDiameterMillimetres / 1000 / wavelengthMetres;
  if (diameterWavelengths < 1e-5 || diameterWavelengths > 1e-2) {
    throw new RangeError('Conductor diameter must be between 0.00001 and 0.01 wavelengths for this model.');
  }
  const x = Math.log10(diameterWavelengths);
  const aRatio = -0.0008571428571 * x ** 2 - 0.009571428571 * x + 0.3398571429;
  const bRatio = -0.002142857143 * x ** 2 - 0.02035714286 * x + 0.008285714286;
  const cRatio = 0.001809523381 * x ** 2 + 0.01780952381 * x + 0.05164285714;
  const dRatio = 0.001 * x + 0.07178571429;
  const aMetres = aRatio * wavelengthMetres;
  const bMetres = bRatio * wavelengthMetres;
  const cMetres = cRatio * wavelengthMetres;
  const dMetres = dRatio * wavelengthMetres;
  const eMetres = bMetres + cMetres + dMetres;
  return {
    wavelengthMetres,
    diameterWavelengths,
    aMetres,
    bMetres,
    cMetres,
    dMetres,
    eMetres,
    drivenElementMetres: aMetres + 2 * bMetres,
    reflectorMetres: aMetres + 2 * dMetres,
    totalConductorMetres: 2 * aMetres + 2 * bMetres + 2 * dMetres
  };
}

export function calculateBasicYagi(input: BasicYagiInput) {
  if (!Number.isFinite(input.frequencyMHz) || input.frequencyMHz <= 0) {
    throw new RangeError('Frequency must be greater than zero.');
  }
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.frequencyMHz * 1_000_000);
  const reflectorMetres = wavelengthMetres * 0.482;
  const drivenElementMetres = wavelengthMetres * 0.5;
  const directorMetres = wavelengthMetres * 0.424;
  const reflectorSpacingMetres = wavelengthMetres * 0.2;
  const directorSpacingMetres = wavelengthMetres * 0.2;
  return {
    wavelengthMetres,
    reflectorMetres,
    drivenElementMetres,
    directorMetres,
    reflectorSpacingMetres,
    directorSpacingMetres,
    boomLengthMetres: reflectorSpacingMetres + directorSpacingMetres,
    referenceElementDiameterMetres: wavelengthMetres * 0.0085,
    constructionToleranceMetres: wavelengthMetres * 0.003,
    totalElementMaterialMetres: reflectorMetres + drivenElementMetres + directorMetres,
    measuredReferenceGainDbd: 7.1
  };
}
