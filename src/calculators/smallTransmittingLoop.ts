/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export interface SmallTransmittingLoopInput {
  lowerFrequencyMHz: number;
  upperFrequencyMHz: number;
  circumferenceMetres: number;
  measuredInductanceMicrohenries: number;
  strayCapacitancePicofarads: number;
  capacitorMinimumPicofarads: number;
  capacitorMaximumPicofarads: number;
  conductorMaterial: SmallLoopConductorMaterial;
  conductorOutsideDiameterMillimetres: number;
  additionalSeriesLossMilliohms: number;
  acceptedPowerWatts: number;
}

export type SmallLoopConductorMaterial = 'copper' | 'aluminium';

const VACUUM_PERMEABILITY_HENRIES_PER_METRE = 4 * Math.PI * 1e-7;
const CONDUCTOR_CONDUCTIVITY_SIEMENS_PER_METRE: Record<SmallLoopConductorMaterial, number> = {
  copper: 5.8e7,
  aluminium: 3.72e7
};

export const SMALL_TRANSMITTING_LOOP_MODEL = {
  id: 'small-transmitting-loop-measured-inductance',
  version: '2.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL — HF Loop Antennas',
      url: 'https://www.arrl.org/hf-loop-antennas'
    },
    {
      title: 'National Bureau of Standards Circular 74 — Radio Instruments and Measurements',
      url: 'https://www.govinfo.gov/content/pkg/GOVPUB-C13-87343a166130cebe2f398530347d772d/pdf/GOVPUB-C13-87343a166130cebe2f398530347d772d.pdf'
    },
    {
      title: 'NIST Technical Note 1512 — Dielectric and magnetic properties of printed wiring boards and other substrate materials',
      url: 'https://nvlpubs.nist.gov/nistpubs/Legacy/TN/nbstechnicalnote1512.pdf'
    },
    {
      title: 'NIST — Electromagnetic theory of reverberation chambers, Appendix C',
      url: 'https://www.govinfo.gov/content/pkg/GOVPUB-C13-dadf3fb0feaf3edd8edf9ff8bfd4932d/pdf/GOVPUB-C13-dadf3fb0feaf3edd8edf9ff8bfd4932d.pdf'
    }
  ]
} as const;

function inRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

function resonantCapacitancePicofarads(frequencyMHz: number, inductanceMicrohenries: number) {
  const frequencyHz = frequencyMHz * 1_000_000;
  const inductanceHenries = inductanceMicrohenries * 1e-6;
  return 1e12 / (4 * Math.PI ** 2 * frequencyHz ** 2 * inductanceHenries);
}

export function calculateSmallTransmittingLoop(input: SmallTransmittingLoopInput) {
  inRange(input.lowerFrequencyMHz, 0.001, 300_000, 'Lower frequency');
  inRange(input.upperFrequencyMHz, 0.001, 300_000, 'Upper frequency');
  if (input.upperFrequencyMHz < input.lowerFrequencyMHz) throw new RangeError('Upper frequency must be at or above the lower frequency.');
  inRange(input.circumferenceMetres, 0.001, 100_000, 'Loop circumference');
  inRange(input.measuredInductanceMicrohenries, 0.000_001, 1_000_000, 'Measured loop inductance');
  inRange(input.strayCapacitancePicofarads, 0, 1_000_000_000, 'Stray capacitance');
  inRange(input.capacitorMinimumPicofarads, 0, 1_000_000_000, 'Capacitor minimum');
  inRange(input.capacitorMaximumPicofarads, 0.001, 1_000_000_000, 'Capacitor maximum');
  if (input.capacitorMaximumPicofarads < input.capacitorMinimumPicofarads) throw new RangeError('Capacitor maximum must be at or above the capacitor minimum.');
  if (!(input.conductorMaterial in CONDUCTOR_CONDUCTIVITY_SIEMENS_PER_METRE)) throw new RangeError('Conductor material must be copper or aluminium.');
  inRange(input.conductorOutsideDiameterMillimetres, 0.01, 10_000, 'Conductor outside diameter');
  inRange(input.additionalSeriesLossMilliohms, 0, 1_000_000, 'Additional series loss');
  inRange(input.acceptedPowerWatts, 0.001, 10_000_000, 'Accepted power');

  const diameterMetres = input.circumferenceMetres / Math.PI;
  const areaSquareMetres = Math.PI * (diameterMetres / 2) ** 2;
  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.lowerFrequencyMHz * 1_000_000);
  const upperWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.upperFrequencyMHz * 1_000_000);
  const maximumSmallLoopDiameterMetres = upperWavelengthMetres / 16;
  const lowerTotalCapacitancePicofarads = resonantCapacitancePicofarads(input.lowerFrequencyMHz, input.measuredInductanceMicrohenries);
  const upperTotalCapacitancePicofarads = resonantCapacitancePicofarads(input.upperFrequencyMHz, input.measuredInductanceMicrohenries);
  const centreFrequencyMHz = Math.sqrt(input.lowerFrequencyMHz * input.upperFrequencyMHz);
  const centreFrequencyHz = centreFrequencyMHz * 1_000_000;
  const centreWavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / centreFrequencyHz;
  const centreTotalCapacitancePicofarads = resonantCapacitancePicofarads(centreFrequencyMHz, input.measuredInductanceMicrohenries);
  const minimumRequiredVariableCapacitancePicofarads = upperTotalCapacitancePicofarads - input.strayCapacitancePicofarads;
  const maximumRequiredVariableCapacitancePicofarads = lowerTotalCapacitancePicofarads - input.strayCapacitancePicofarads;
  const centreRequiredVariableCapacitancePicofarads = centreTotalCapacitancePicofarads - input.strayCapacitancePicofarads;
  const positiveTuningCapacitance = minimumRequiredVariableCapacitancePicofarads > 0;
  const capacitorCoversRange = positiveTuningCapacitance
    && input.capacitorMinimumPicofarads <= minimumRequiredVariableCapacitancePicofarads
    && input.capacitorMaximumPicofarads >= maximumRequiredVariableCapacitancePicofarads;
  const circumferenceWavelengthRatioAtCentre = input.circumferenceMetres / centreWavelengthMetres;
  const radiationResistanceOhms = 320 * Math.PI ** 4 * (areaSquareMetres / centreWavelengthMetres ** 2) ** 2;
  const conductivitySiemensPerMetre = CONDUCTOR_CONDUCTIVITY_SIEMENS_PER_METRE[input.conductorMaterial];
  const surfaceResistanceOhmsPerSquare = Math.sqrt(Math.PI * centreFrequencyHz * VACUUM_PERMEABILITY_HENRIES_PER_METRE / conductivitySiemensPerMetre);
  const skinDepthMetres = 1 / Math.sqrt(Math.PI * centreFrequencyHz * VACUUM_PERMEABILITY_HENRIES_PER_METRE * conductivitySiemensPerMetre);
  const conductorOutsideDiameterMetres = input.conductorOutsideDiameterMillimetres / 1_000;
  const idealConductorLossOhms = surfaceResistanceOhmsPerSquare * input.circumferenceMetres / (Math.PI * conductorOutsideDiameterMetres);
  const additionalSeriesLossOhms = input.additionalSeriesLossMilliohms / 1_000;
  const totalLossResistanceOhms = idealConductorLossOhms + additionalSeriesLossOhms;
  const totalSeriesResistanceOhms = radiationResistanceOhms + totalLossResistanceOhms;
  const estimatedRadiationEfficiencyPercent = radiationResistanceOhms / totalSeriesResistanceOhms * 100;
  const inductiveReactanceOhms = 2 * Math.PI * centreFrequencyHz * input.measuredInductanceMicrohenries * 1e-6;
  const estimatedUnloadedQ = inductiveReactanceOhms / totalSeriesResistanceOhms;
  const estimatedThreeDbBandwidthKilohertz = centreFrequencyMHz * 1_000 / estimatedUnloadedQ;
  const estimatedLoopCurrentRmsAmperes = Math.sqrt(input.acceptedPowerWatts / totalSeriesResistanceOhms);
  const estimatedCapacitorVoltageRmsVolts = estimatedLoopCurrentRmsAmperes * inductiveReactanceOhms;
  const estimatedCapacitorVoltagePeakVolts = estimatedCapacitorVoltageRmsVolts * Math.SQRT2;
  const estimatedRadiatedPowerWatts = estimatedLoopCurrentRmsAmperes ** 2 * radiationResistanceOhms;
  const estimatedLossPowerWatts = estimatedLoopCurrentRmsAmperes ** 2 * totalLossResistanceOhms;
  const isWithinUniformCurrentPreference = circumferenceWavelengthRatioAtCentre < 0.1;
  const warnings: string[] = [];
  if (diameterMetres >= maximumSmallLoopDiameterMetres) warnings.push('The loop is not under the ARRL one-sixteenth-wavelength diameter boundary at the upper frequency.');
  if (!positiveTuningCapacitance) warnings.push('Entered parallel fixed or stray capacitance equals or exceeds the total capacitance required at the upper frequency.');
  if (!capacitorCoversRange) warnings.push('The entered variable-capacitor range does not cover the complete requested tuning range.');
  if (!isWithinUniformCurrentPreference) warnings.push('The loop circumference is at least 0.10 wavelength at the analysis frequency; the classical uniform-current performance estimates become less dependable as electrical size increases.');
  if (input.additionalSeriesLossMilliohms === 0) warnings.push('Additional series loss is zero, so the performance estimate omits capacitor, joint, connection, surface, support, and proximity losses.');

  return {
    ...input,
    wavelengthMetres,
    upperWavelengthMetres,
    centreFrequencyMHz,
    centreWavelengthMetres,
    diameterMetres,
    areaSquareMetres,
    maximumSmallLoopDiameterMetres,
    diameterWavelengthRatioAtLowerFrequency: diameterMetres / wavelengthMetres,
    diameterWavelengthRatioAtUpperFrequency: diameterMetres / upperWavelengthMetres,
    isUnderArrlSmallLoopBoundary: diameterMetres < maximumSmallLoopDiameterMetres,
    lowerTotalCapacitancePicofarads,
    upperTotalCapacitancePicofarads,
    centreTotalCapacitancePicofarads,
    minimumRequiredVariableCapacitancePicofarads,
    maximumRequiredVariableCapacitancePicofarads,
    centreRequiredVariableCapacitancePicofarads,
    tuningCapacitancePositive: positiveTuningCapacitance,
    capacitorCoversRange,
    idealCentreSensitivityKilohertzPerPicofarad: centreFrequencyMHz * 1_000 / (2 * centreTotalCapacitancePicofarads),
    circumferenceWavelengthRatioAtCentre,
    isWithinUniformCurrentPreference,
    conductivitySiemensPerMetre,
    skinDepthMetres,
    surfaceResistanceOhmsPerSquare,
    radiationResistanceOhms,
    idealConductorLossOhms,
    additionalSeriesLossOhms,
    totalLossResistanceOhms,
    totalSeriesResistanceOhms,
    inductiveReactanceOhms,
    estimatedRadiationEfficiencyPercent,
    estimatedUnloadedQ,
    estimatedThreeDbBandwidthKilohertz,
    estimatedLoopCurrentRmsAmperes,
    estimatedCapacitorVoltageRmsVolts,
    estimatedCapacitorVoltagePeakVolts,
    estimatedRadiatedPowerWatts,
    estimatedLossPowerWatts,
    warnings
  };
}
