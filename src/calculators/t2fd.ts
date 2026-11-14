/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface T2fdInput {
  lowestFrequencyMHz: number;
  tiltDegrees: number;
  lowAttachmentHeightMetres: number;
  terminationResistanceOhms: number;
  feedSystemImpedanceOhms: number;
  transmitterPowerWatts: number;
  wireAllowancePercent: number;
}

export const T2FD_MODEL = {
  id: 'countryman-1949-t2fd-starting-geometry',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'G. L. Countryman, W3HH — An Experimental All-Band Nondirectional Transmitting Antenna, QST June 1949',
      url: 'https://www.worldradiohistory.com/INTERNATIONAL/QST/QST-1949-06.pdf'
    },
    {
      title: 'ARRL Antenna Book 24th edition supplemental article index — Countryman T2FD article',
      url: 'https://www.arrl.org/arrl-antenna-book-reference'
    }
  ]
} as const;

function finite(value: number, label: string) {
  if (!Number.isFinite(value)) throw new RangeError(`${label} must be finite.`);
}

export function calculateT2fd(input: T2fdInput) {
  finite(input.lowestFrequencyMHz, 'Lowest frequency');
  finite(input.tiltDegrees, 'Tilt');
  finite(input.lowAttachmentHeightMetres, 'Low attachment height');
  finite(input.terminationResistanceOhms, 'Termination resistance');
  finite(input.feedSystemImpedanceOhms, 'Feed-system impedance');
  finite(input.transmitterPowerWatts, 'Transmitter power');
  finite(input.wireAllowancePercent, 'Wire allowance');
  if (input.lowestFrequencyMHz < 1 || input.lowestFrequencyMHz > 30) throw new RangeError('Lowest frequency must be from 1 through 30 MHz.');
  if (input.tiltDegrees < 0 || input.tiltDegrees > 45) throw new RangeError('Tilt must be from 0 through 45 degrees.');
  if (input.lowAttachmentHeightMetres < 0.5 || input.lowAttachmentHeightMetres > 100) throw new RangeError('Low attachment height must be from 0.5 through 100 metres.');
  if (input.terminationResistanceOhms < 1 || input.terminationResistanceOhms > 10_000) throw new RangeError('Termination resistance must be from 1 through 10,000 ohms.');
  if (input.feedSystemImpedanceOhms < 1 || input.feedSystemImpedanceOhms > 10_000) throw new RangeError('Feed-system impedance must be from 1 through 10,000 ohms.');
  if (input.transmitterPowerWatts < 0.1 || input.transmitterPowerWatts > 100_000) throw new RangeError('Transmitter power must be from 0.1 through 100,000 watts.');
  if (input.wireAllowancePercent < 0 || input.wireAllowancePercent > 25) throw new RangeError('Wire allowance must be from 0 through 25 percent.');

  const wavelengthMetres = 299_792_458 / (input.lowestFrequencyMHz * 1_000_000);
  const eachHalfSpanMetres = 50 / input.lowestFrequencyMHz;
  const designSpanMetres = eachHalfSpanMetres * 2;
  const conductorSpacingMetres = 3 / input.lowestFrequencyMHz;
  const tiltRadians = input.tiltDegrees * Math.PI / 180;
  const horizontalProjectionMetres = designSpanMetres * Math.cos(tiltRadians);
  const attachmentHeightDifferenceMetres = designSpanMetres * Math.sin(tiltRadians);
  const highAttachmentHeightMetres = input.lowAttachmentHeightMetres + attachmentHeightDifferenceMetres;
  const allowanceFactor = 1 + input.wireAllowancePercent / 100;
  const eachLongConductorCutMetres = designSpanMetres * allowanceFactor;
  const eachEndBridgeCutMetres = conductorSpacingMetres * allowanceFactor;
  const totalConductorPurchaseMetres = 2 * eachLongConductorCutMetres + 2 * eachEndBridgeCutMetres;
  const impedanceRatio = input.terminationResistanceOhms / input.feedSystemImpedanceOhms;
  const idealVoltageTurnsRatio = Math.sqrt(impedanceRatio);
  const historicalMinimumResistorRatingWatts = input.transmitterPowerWatts * 0.35;
  const historicalUpperFrequencyMHz = input.lowestFrequencyMHz * 5;
  const warnings: string[] = [];
  if (input.terminationResistanceOhms !== 600) warnings.push('Countryman’s published system used a 600 Ω non-inductive termination and 600 Ω feed line. The entered termination is a separate modern planning assumption.');
  if (input.feedSystemImpedanceOhms !== 600) warnings.push('The calculated ideal transformer ratio is only an impedance-ratio starting point. It is not a transformer design and does not predict the installed antenna impedance.');
  if (input.tiltDegrees !== 30) warnings.push('The original article used about 30° tilt for its practical nondirectional-pattern context. The entered angle changes only the support geometry here; pattern is not predicted.');

  return {
    ...input,
    wavelengthMetres,
    eachHalfSpanMetres,
    designSpanMetres,
    conductorSpacingMetres,
    horizontalProjectionMetres,
    attachmentHeightDifferenceMetres,
    highAttachmentHeightMetres,
    eachLongConductorCutMetres,
    eachEndBridgeCutMetres,
    totalConductorPurchaseMetres,
    historicalUpperFrequencyMHz,
    historicalFrequencyRatio: 5,
    impedanceRatio,
    idealVoltageTurnsRatio,
    historicalMinimumResistorRatingWatts,
    warnings
  };
}
