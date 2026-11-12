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

const bandsByJurisdiction: Partial<Record<JurisdictionCode, AmateurBand[]>> = {
  CA: canadianBands,
  US: unitedStatesBands
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
  return getBandsForJurisdiction(jurisdiction).find(
    (band) => frequencyMHz >= band.lowerMHz && frequencyMHz <= band.upperMHz
  );
}

export function formatFrequencyRange(band: AmateurBand): string {
  if (band.rangeLabel) {
    return band.rangeLabel;
  }

  const decimals = band.upperMHz < 1 ? 4 : band.upperMHz < 30 ? 3 : band.upperMHz < 1000 ? 1 : 0;
  return `${band.lowerMHz.toFixed(decimals)}–${band.upperMHz.toFixed(decimals)} MHz`;
}
