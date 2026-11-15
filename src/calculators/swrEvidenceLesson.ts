/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { calculateLNetwork } from './lNetwork';
import { calculateTransmissionLineTransform } from './transmissionLineTransform';

export type SwrLessonLoss = '0' | '1' | '3';
export type SwrLessonSourceNetwork = 'bypass' | 'ideal-match';

export function evaluateSwrEvidenceLesson(frequencyMHz: number, oneWayMatchedLossDb: SwrLessonLoss, sourceNetwork: SwrLessonSourceNetwork) {
  if (!['0', '1', '3'].includes(oneWayMatchedLossDb) || !['bypass', 'ideal-match'].includes(sourceNetwork)) throw new TypeError('Unsupported SWR evidence lesson selection.');
  const lossDb = Number(oneWayMatchedLossDb);
  const line = calculateTransmissionLineTransform({
    frequencyMHz,
    characteristicImpedanceOhms: 50,
    physicalLengthMetres: 1,
    velocityFactor: 0.8,
    matchedLossDbPer100Metres: lossDb * 100,
    loadResistanceOhms: 100,
    loadReactanceOhms: 0
  });
  const synthesis = calculateLNetwork({
    frequencyMHz,
    systemResistanceOhms: 50,
    loadResistanceOhms: line.inputResistanceOhms,
    loadReactanceOhms: line.inputReactanceOhms
  });
  if (synthesis.solutions.length === 0) throw new RangeError('No ideal source-network solution is available for this lesson state.');
  const sourceSwr = sourceNetwork === 'ideal-match' ? 1 : line.inputPoint.swr;
  return {
    frequencyMHz,
    oneWayMatchedLossDb: lossDb,
    sourceNetwork,
    antennaSwr: line.loadPoint.swr,
    lineInputSwr: line.inputPoint.swr,
    sourceSwr,
    matchedOneWayPowerRemainingPercent: line.matchedOneWayPowerRemainingPercent,
    roundTripReflectionAttenuationDb: line.roundTripReflectionAttenuationDb,
    headline: sourceNetwork === 'ideal-match'
      ? 'The source sees 1:1 while the antenna remains 2:1'
      : lossDb > 0
        ? 'The lower source-end SWR includes attenuation—not a better antenna load'
        : 'A lossless line moves impedance but preserves SWR magnitude'
  };
}
