/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type HexBeamBand = '20m' | '17m' | '15m' | '12m' | '10m' | '6m';
export type HexBeamWireGauge = '12' | '14-16' | '18';

export interface HexBeamInput {
  bands: HexBeamBand[];
  wireGauge: HexBeamWireGauge;
}

const INCHES_TO_METRES = 0.0254;
const FEET_TO_METRES = 0.3048;

const PUBLISHED_SCHEDULE = {
  '20m': { halfDriverInches: 214, reflectorInches: 404, tipSpacerInches: 24 },
  '17m': { halfDriverInches: 166, reflectorInches: 314.5, tipSpacerInches: 18.5 },
  '15m': { halfDriverInches: 142.9, reflectorInches: 271.8, tipSpacerInches: 16 },
  '12m': { halfDriverInches: 119.25, reflectorInches: 227.25, tipSpacerInches: 13.5 },
  '10m': { halfDriverInches: 104.5, reflectorInches: 200.25, tipSpacerInches: 12 },
  '6m': { halfDriverInches: 59, reflectorInches: 113.4, tipSpacerInches: 6.5 }
} as const;

const BAND_ORDER = Object.keys(PUBLISHED_SCHEDULE) as HexBeamBand[];
const BAND_REFERENCE_MHZ: Record<HexBeamBand, number> = { '20m': 14.2, '17m': 18.1, '15m': 21.2, '12m': 24.94, '10m': 28.4, '6m': 50.1 };
const GAUGE_FACTORS: Record<HexBeamWireGauge, number> = { '12': 1.004, '14-16': 1, '18': 0.998 };

export const HEX_BEAM_MODEL = {
  id: 'k4kio-g3txq-broadband-hex-beam',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'KIO Technology — Assembly Instructions 12, wire and tip-spacer schedule',
      url: 'https://www.k4kio.com/wp-content/uploads/2024/05/Assembly-Instructions-12.pdf'
    },
    {
      title: 'K4KIO — G3TXQ broadband hex-beam construction description',
      url: 'https://www.hex-beam.com/overall/'
    },
    {
      title: 'ARRL QST — BuddiHEX product review and six-spreader topology',
      url: 'https://www.arrl.org/files/file/ProductReviewsForDeb/2023/pr122022.pdf'
    }
  ]
} as const;

export function calculateHexBeam(input: HexBeamInput) {
  if (!Array.isArray(input.bands) || input.bands.length < 1 || input.bands.length > BAND_ORDER.length) throw new RangeError('Select between one and six bands.');
  if (!GAUGE_FACTORS[input.wireGauge]) throw new RangeError('Wire gauge is not supported.');
  const uniqueBands = [...new Set(input.bands)];
  if (uniqueBands.length !== input.bands.length || uniqueBands.some((band) => !BAND_ORDER.includes(band))) throw new RangeError('Band selection contains an unsupported or duplicate band.');

  const wireLengthFactor = GAUGE_FACTORS[input.wireGauge];
  const elements = BAND_ORDER.filter((band) => uniqueBands.includes(band)).map((band, layerIndex) => {
    const published = PUBLISHED_SCHEDULE[band];
    const halfDriverMetres = published.halfDriverInches * wireLengthFactor * INCHES_TO_METRES;
    const reflectorMetres = published.reflectorInches * wireLengthFactor * INCHES_TO_METRES;
    const tipSpacerMetres = published.tipSpacerInches * INCHES_TO_METRES;
    return {
      band,
      layerIndex,
      halfDriverMetres,
      totalDrivenMetres: halfDriverMetres * 2,
      reflectorMetres,
      tipSpacerMetres,
      radiatingWireMetres: halfDriverMetres * 2 + reflectorMetres,
      nonConductiveTipSpacerMetres: tipSpacerMetres * 2
    };
  });
  const totalRadiatingWireMetres = elements.reduce((sum, element) => sum + element.radiatingWireMetres, 0);
  const totalTipSpacerMetres = elements.reduce((sum, element) => sum + element.nonConductiveTipSpacerMetres, 0);

  return {
    ...input,
    wireLengthFactor,
    referenceFrequencyMHz: BAND_REFERENCE_MHZ[elements[0].band],
    elements,
    totalRadiatingWireMetres,
    totalTipSpacerMetres,
    spreaderCount: 6,
    publishedTurningRadiusMetres: 10.8 * FEET_TO_METRES,
    publishedDiameterMetres: 21.6 * FEET_TO_METRES,
    publishedFrameworkHeightMetres: 39 * INCHES_TO_METRES,
    feedArrangement: 'Top feed at the lowest-frequency selected band; preserve conductor side through short 50 Ω coax interconnects',
    directionReference: 'Forward through the open V side, away from the rear U-shaped reflector',
    warnings: input.wireGauge === '14-16' ? [] : [`The ${input.wireGauge} AWG factor is the published K4KIO adjustment for conductor length only; insulation type, construction, and inter-band interaction still require the documented build and measurement.`]
  };
}
