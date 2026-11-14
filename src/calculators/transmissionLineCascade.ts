/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateTransmissionLineTransform } from './transmissionLineTransform';

export interface TransmissionLineSectionInput {
  characteristicImpedanceOhms: number;
  physicalLengthMetres: number;
  velocityFactor: number;
  matchedLossDbPer100Metres: number;
}

export interface TransmissionLineCascadeInput {
  frequencyMHz: number;
  loadResistanceOhms: number;
  loadReactanceOhms: number;
  sections: TransmissionLineSectionInput[];
}

export const TRANSMISSION_LINE_CASCADE_MODEL = {
  id: 'uniform-lossy-transmission-line-cascade',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'NIST — Analytical model for transmission lines using cascade matrices',
      url: 'https://tsapps.nist.gov/publication/get_pdf.cfm?pub_id=924664'
    },
    {
      title: 'Rohde & Schwarz — Understanding S-parameters',
      url: 'https://www.rohde-schwarz.com/sg/products/test-and-measurement/essentials-test-equipment/spectrum-analyzers/understanding-s-parameters_257831.html'
    }
  ]
} as const;

export function calculateTransmissionLineCascade(input: TransmissionLineCascadeInput) {
  if (input.sections.length < 1 || input.sections.length > 4) throw new RangeError('A cascade must contain between 1 and 4 uniform sections.');

  let terminatingResistanceOhms = input.loadResistanceOhms;
  let terminatingReactanceOhms = input.loadReactanceOhms;

  const sections = input.sections.map((section, index) => {
    const transform = calculateTransmissionLineTransform({
      frequencyMHz: input.frequencyMHz,
      ...section,
      loadResistanceOhms: terminatingResistanceOhms,
      loadReactanceOhms: terminatingReactanceOhms
    });
    const result = {
      sectionNumberFromLoad: index + 1,
      terminatingResistanceOhms,
      terminatingReactanceOhms,
      ...section,
      transform
    };
    terminatingResistanceOhms = transform.inputResistanceOhms;
    terminatingReactanceOhms = transform.inputReactanceOhms;
    return result;
  });

  const loadSideSection = sections[0];
  const nearEndSection = sections.at(-1)!;

  return {
    ...input,
    sections,
    loadSideSection,
    nearEndSection,
    inputResistanceOhms: nearEndSection.transform.inputResistanceOhms,
    inputReactanceOhms: nearEndSection.transform.inputReactanceOhms,
    nearEndPoint: nearEndSection.transform.inputPoint,
    loadPoint: loadSideSection.transform.loadPoint,
    totalPhysicalLengthMetres: sections.reduce((sum, section) => sum + section.physicalLengthMetres, 0),
    totalOneWayDelayNanoseconds: sections.reduce((sum, section) => sum + section.transform.oneWayDelayNanoseconds, 0),
    totalOneWayMatchedLossDb: sections.reduce((sum, section) => sum + section.transform.oneWayMatchedLossDb, 0),
    totalRoundTripMatchedAttenuationDb: sections.reduce((sum, section) => sum + section.transform.roundTripReflectionAttenuationDb, 0)
  };
}
