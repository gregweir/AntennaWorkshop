/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { JurisdictionCode } from '../regulations/catalog';

export interface AmateurBand {
  id: string;
  label: string;
  lowerMHz: number;
  upperMHz: number;
  designMHz: number;
  continuous?: boolean;
  rangeLabel?: string;
  note?: string;
  segments?: Array<{ lowerMHz: number; upperMHz: number }>;
}

export interface BandSource {
  title: string;
  url: string;
  reviewedOn: string;
}

const sharedHF: AmateurBand[] = [
  { id: '2200m', label: '2200 m', lowerMHz: 0.1357, upperMHz: 0.1378, designMHz: 0.13675 },
  { id: '630m', label: '630 m', lowerMHz: 0.472, upperMHz: 0.479, designMHz: 0.4755 },
  { id: '160m', label: '160 m', lowerMHz: 1.8, upperMHz: 2, designMHz: 1.9 },
  { id: '80m', label: '80 / 75 m', lowerMHz: 3.5, upperMHz: 4, designMHz: 3.75 },
  {
    id: '60m',
    label: '60 m',
    lowerMHz: 5.332,
    upperMHz: 5.405,
    designMHz: 5.359,
    continuous: false,
    rangeLabel: 'Channelized / special allocation',
    note: 'Only specified channels and segments are available; power and emission conditions apply.'
  },
  { id: '40m', label: '40 m', lowerMHz: 7, upperMHz: 7.3, designMHz: 7.15 },
  { id: '30m', label: '30 m', lowerMHz: 10.1, upperMHz: 10.15, designMHz: 10.125 },
  { id: '20m', label: '20 m', lowerMHz: 14, upperMHz: 14.35, designMHz: 14.175 },
  { id: '17m', label: '17 m', lowerMHz: 18.068, upperMHz: 18.168, designMHz: 18.118 },
  { id: '15m', label: '15 m', lowerMHz: 21, upperMHz: 21.45, designMHz: 21.225 },
  { id: '12m', label: '12 m', lowerMHz: 24.89, upperMHz: 24.99, designMHz: 24.94 },
  { id: '10m', label: '10 m', lowerMHz: 28, upperMHz: 29.7, designMHz: 28.85 },
  { id: '6m', label: '6 m', lowerMHz: 50, upperMHz: 54, designMHz: 52 },
  { id: '2m', label: '2 m', lowerMHz: 144, upperMHz: 148, designMHz: 146 },
  { id: '1.25m', label: '1.25 m', lowerMHz: 222, upperMHz: 225, designMHz: 223.5 }
];

const canadianBands: AmateurBand[] = [
  ...sharedHF,
  { id: '70cm', label: '70 cm', lowerMHz: 430, upperMHz: 450, designMHz: 440 },
  { id: '33cm', label: '33 cm', lowerMHz: 902, upperMHz: 928, designMHz: 915 },
  { id: '23cm', label: '23 cm', lowerMHz: 1240, upperMHz: 1300, designMHz: 1270 }
];

const unitedStatesBands: AmateurBand[] = [
  ...sharedHF,
  { id: '70cm', label: '70 cm', lowerMHz: 420, upperMHz: 450, designMHz: 435 },
  { id: '33cm', label: '33 cm', lowerMHz: 902, upperMHz: 928, designMHz: 915 },
  { id: '23cm', label: '23 cm', lowerMHz: 1240, upperMHz: 1300, designMHz: 1270 }
];

const unitedKingdomBands: AmateurBand[] = [
  { id: '2200m', label: '2200 m', lowerMHz: 0.1357, upperMHz: 0.1378, designMHz: 0.13675 },
  { id: '630m', label: '630 m', lowerMHz: 0.472, upperMHz: 0.479, designMHz: 0.4755 },
  { id: '160m', label: '160 m', lowerMHz: 1.81, upperMHz: 2, designMHz: 1.9 },
  { id: '80m', label: '80 m', lowerMHz: 3.5, upperMHz: 3.8, designMHz: 3.65 },
  { id: '60m', label: '60 m', lowerMHz: 5.2585, upperMHz: 5.4065, designMHz: 5.359, continuous: false, rangeLabel: 'Eleven Full-licence segments', note: 'Only the specified segments are available and additional conditions apply.' },
  { id: '40m', label: '40 m', lowerMHz: 7, upperMHz: 7.2, designMHz: 7.1 },
  { id: '30m', label: '30 m', lowerMHz: 10.1, upperMHz: 10.15, designMHz: 10.125 },
  { id: '20m', label: '20 m', lowerMHz: 14, upperMHz: 14.35, designMHz: 14.175 },
  { id: '17m', label: '17 m', lowerMHz: 18.068, upperMHz: 18.168, designMHz: 18.118 },
  { id: '15m', label: '15 m', lowerMHz: 21, upperMHz: 21.45, designMHz: 21.225 },
  { id: '12m', label: '12 m', lowerMHz: 24.89, upperMHz: 24.99, designMHz: 24.94 },
  { id: '10m', label: '10 m', lowerMHz: 28, upperMHz: 29.7, designMHz: 28.85 },
  { id: '6m', label: '6 m', lowerMHz: 50, upperMHz: 52, designMHz: 51 },
  { id: '4m', label: '4 m', lowerMHz: 70, upperMHz: 70.5, designMHz: 70.25 },
  { id: '2m', label: '2 m', lowerMHz: 144, upperMHz: 146, designMHz: 145 },
  { id: '70cm', label: '70 cm', lowerMHz: 430, upperMHz: 440, designMHz: 435 },
  { id: '23cm', label: '23 cm', lowerMHz: 1240, upperMHz: 1325, designMHz: 1296 }
];

const australianBands: AmateurBand[] = [
  { id: '2200m', label: '2200 m', lowerMHz: 0.1357, upperMHz: 0.1378, designMHz: 0.13675 },
  { id: '630m', label: '630 m', lowerMHz: 0.472, upperMHz: 0.479, designMHz: 0.4755 },
  { id: '160m', label: '160 m', lowerMHz: 1.8, upperMHz: 1.875, designMHz: 1.8375 },
  { id: '80m', label: '80 m', lowerMHz: 3.5, upperMHz: 3.8, designMHz: 3.6, continuous: false, rangeLabel: '3.500–3.700 and 3.776–3.800 MHz', note: 'The Advanced allocation has two separate segments.', segments: [{ lowerMHz: 3.5, upperMHz: 3.7 }, { lowerMHz: 3.776, upperMHz: 3.8 }] },
  { id: '40m', label: '40 m', lowerMHz: 7, upperMHz: 7.3, designMHz: 7.15 },
  { id: '30m', label: '30 m', lowerMHz: 10.1, upperMHz: 10.15, designMHz: 10.125 },
  { id: '20m', label: '20 m', lowerMHz: 14, upperMHz: 14.35, designMHz: 14.175 },
  { id: '17m', label: '17 m', lowerMHz: 18.068, upperMHz: 18.168, designMHz: 18.118 },
  { id: '15m', label: '15 m', lowerMHz: 21, upperMHz: 21.45, designMHz: 21.225 },
  { id: '12m', label: '12 m', lowerMHz: 24.89, upperMHz: 24.99, designMHz: 24.94 },
  { id: '10m', label: '10 m', lowerMHz: 28, upperMHz: 29.7, designMHz: 28.85 },
  { id: '6m', label: '6 m', lowerMHz: 50, upperMHz: 54, designMHz: 52 },
  { id: '2m', label: '2 m', lowerMHz: 144, upperMHz: 148, designMHz: 146 },
  { id: '70cm', label: '70 cm', lowerMHz: 430, upperMHz: 450, designMHz: 440 },
  { id: '23cm', label: '23 cm', lowerMHz: 1240, upperMHz: 1300, designMHz: 1270 },
  { id: '13cm-narrow', label: '13 cm · narrow', lowerMHz: 2300, upperMHz: 2302, designMHz: 2301 },
  { id: '13cm', label: '13 cm', lowerMHz: 2400, upperMHz: 2450, designMHz: 2425 },
  { id: '9cm-lower', label: '9 cm · lower', lowerMHz: 3300, upperMHz: 3400, designMHz: 3350 },
  { id: '9cm-upper', label: '9 cm · restricted areas', lowerMHz: 3400, upperMHz: 3600, designMHz: 3500, note: 'Geographic exclusions and spectrum-licence restrictions apply.' },
  { id: '5cm', label: '5 cm', lowerMHz: 5650, upperMHz: 5850, designMHz: 5750 },
  { id: '3cm', label: '3 cm', lowerMHz: 10_000, upperMHz: 10_500, designMHz: 10_250 },
  { id: '1.25cm', label: '1.25 cm', lowerMHz: 24_000, upperMHz: 24_250, designMHz: 24_125 },
  { id: '6mm', label: '6 mm', lowerMHz: 47_000, upperMHz: 47_200, designMHz: 47_100 },
  { id: '4mm', label: '4 mm', lowerMHz: 76_000, upperMHz: 81_000, designMHz: 78_500 },
  { id: '2.5mm', label: '2.5 mm', lowerMHz: 122_250, upperMHz: 123_000, designMHz: 122_625 },
  { id: '2mm', label: '2 mm', lowerMHz: 134_000, upperMHz: 141_000, designMHz: 137_500 },
  { id: '1.2mm', label: '1.2 mm', lowerMHz: 241_000, upperMHz: 250_000, designMHz: 245_500 }
];

const bandsByJurisdiction: Partial<Record<JurisdictionCode, AmateurBand[]>> = {
  CA: canadianBands,
  US: unitedStatesBands,
  GB: unitedKingdomBands,
  AU: australianBands
};

const bandSources: Partial<Record<JurisdictionCode, BandSource>> = {
  CA: {
    title: 'ISED RBR-4, Schedule I',
    url: 'https://ised-isde.canada.ca/site/spectrum-management-telecommunications/en/licences-and-certificates/regulations-reference/rbr/rbr-4-standards-operation-radio-stations-amateur-radio-service',
    reviewedOn: '2026-11-11'
  },
  US: {
    title: '47 CFR § 97.301',
    url: 'https://www.ecfr.gov/current/title-47/chapter-I/subchapter-D/part-97/subpart-D/section-97.301',
    reviewedOn: '2026-11-11'
  },
  GB: {
    title: 'Ofcom Amateur Radio Licence Schedule 1, Table C',
    url: 'https://www.ofcom.org.uk/siteassets/resources/documents/spectrum/emf/emf-amateur-licence-terms-and-conditions.pdf',
    reviewedOn: '2026-11-13'
  },
  AU: {
    title: 'Radiocommunications (Amateur Stations) Class Licence 2023, Schedule 2, Table C',
    url: 'https://www.legislation.gov.au/F2023L01648/latest/text',
    reviewedOn: '2026-11-13'
  }
};

export function getBandsForJurisdiction(jurisdiction: JurisdictionCode): AmateurBand[] {
  return bandsByJurisdiction[jurisdiction] ?? [];
}

export function getBandSource(jurisdiction: JurisdictionCode): BandSource | undefined {
  return bandSources[jurisdiction];
}

export function findBandForFrequency(
  frequencyMHz: number,
  jurisdiction: JurisdictionCode
): AmateurBand | undefined {
  return getBandsForJurisdiction(jurisdiction).find((band) => band.segments
    ? band.segments.some((segment) => frequencyMHz >= segment.lowerMHz && frequencyMHz <= segment.upperMHz)
    : frequencyMHz >= band.lowerMHz && frequencyMHz <= band.upperMHz);
}

export function formatFrequencyRange(band: AmateurBand): string {
  if (band.rangeLabel) {
    return band.rangeLabel;
  }

  const decimals = band.upperMHz < 1 ? 4 : band.upperMHz < 30 ? 3 : band.upperMHz < 1000 ? 1 : 0;
  return `${band.lowerMHz.toFixed(decimals)}–${band.upperMHz.toFixed(decimals)} MHz`;
}
