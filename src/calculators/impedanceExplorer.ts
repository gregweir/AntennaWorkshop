/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface ImpedanceExplorerInput {
  frequencyMHz: number;
  referenceResistanceOhms: number;
  loadResistanceOhms: number;
  loadReactanceOhms: number;
}

export const IMPEDANCE_EXPLORER_MODEL = {
  id: 'complex-impedance-reflection-explorer',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'Rohde & Schwarz — Understanding the Smith chart',
      url: 'https://www.rohde-schwarz.com/ca/products/test-and-measurement/essentials-test-equipment/spectrum-analyzers/understanding-the-smith-chart_257989.html'
    },
    {
      title: 'Keysight — PathWave Device Modeling Handbook, Understanding S-Parameter Plots',
      url: 'https://edadownload.software.keysight.com/eedl/iccapmhb/pdf/iccapmhb.pdf'
    },
    {
      title: 'ARRL — Smith Chart Supplement',
      url: 'https://www.arrl.org/files/file/Antenna%20Book%20Supplemental%20Files/22nd%20Edition/Smith%20Chart%20Supplement%20-%20Corrected%20Jan%202012.pdf'
    }
  ]
} as const;

function finiteRange(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
}

export function calculateImpedanceExplorer(input: ImpedanceExplorerInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.referenceResistanceOhms, 0.01, 1_000_000, 'Reference resistance');
  finiteRange(input.loadResistanceOhms, 0.01, 1_000_000, 'Load resistance');
  finiteRange(input.loadReactanceOhms, -1_000_000, 1_000_000, 'Load reactance');

  const denominator = (input.loadResistanceOhms + input.referenceResistanceOhms) ** 2 + input.loadReactanceOhms ** 2;
  const reflectionReal = (input.loadResistanceOhms ** 2 + input.loadReactanceOhms ** 2 - input.referenceResistanceOhms ** 2) / denominator;
  const reflectionImaginary = 2 * input.referenceResistanceOhms * input.loadReactanceOhms / denominator;
  const reflectionMagnitude = Math.hypot(reflectionReal, reflectionImaginary);
  const reflectionPhaseDegrees = Math.atan2(reflectionImaginary, reflectionReal) * 180 / Math.PI;
  const swr = (1 + reflectionMagnitude) / (1 - reflectionMagnitude);
  const returnLossDb = reflectionMagnitude === 0 ? Number.POSITIVE_INFINITY : -20 * Math.log10(reflectionMagnitude);
  const mismatchLossDb = reflectionMagnitude === 0 ? 0 : -10 * Math.log10(1 - reflectionMagnitude ** 2);
  const impedanceMagnitudeOhms = Math.hypot(input.loadResistanceOhms, input.loadReactanceOhms);
  const impedancePhaseDegrees = Math.atan2(input.loadReactanceOhms, input.loadResistanceOhms) * 180 / Math.PI;
  const admittanceDenominator = input.loadResistanceOhms ** 2 + input.loadReactanceOhms ** 2;
  const conductanceSiemens = input.loadResistanceOhms / admittanceDenominator;
  const susceptanceSiemens = -input.loadReactanceOhms / admittanceDenominator;
  const angularFrequency = 2 * Math.PI * input.frequencyMHz * 1_000_000;

  return {
    ...input,
    normalizedResistance: input.loadResistanceOhms / input.referenceResistanceOhms,
    normalizedReactance: input.loadReactanceOhms / input.referenceResistanceOhms,
    impedanceMagnitudeOhms,
    impedancePhaseDegrees,
    conductanceSiemens,
    susceptanceSiemens,
    reflectionReal,
    reflectionImaginary,
    reflectionMagnitude,
    reflectionPhaseDegrees,
    swr,
    returnLossDb,
    mismatchLossDb,
    reflectedPowerPercent: reflectionMagnitude ** 2 * 100,
    loadQualityFactor: Math.abs(input.loadReactanceOhms) / input.loadResistanceOhms,
    equivalentSeriesInductanceHenries: input.loadReactanceOhms > 0 ? input.loadReactanceOhms / angularFrequency : null,
    equivalentSeriesCapacitanceFarads: input.loadReactanceOhms < 0 ? -1 / (angularFrequency * input.loadReactanceOhms) : null
  };
}
