/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { LoopShape } from './designs';

export type AntennaEnvelopeInput =
  | { shape: 'linear'; lengthMetres: number }
  | { shape: 'inverted-v'; endpointSpanMetres: number; legMetres: number }
  | { shape: 'rectangle'; widthMetres: number; depthMetres: number }
  | { shape: 'parallel-elements'; boomMetres: number; firstElementMetres: number; lastElementMetres: number }
  | { shape: 'ground-mounted-vertical'; radiatorMetres: number; radialMetres: number; radialFieldDiameterMetres: number }
  | { shape: 'ground-plane'; radiatorMetres: number; radialDropMetres: number; footprintDiameterMetres: number }
  | { shape: 'loop'; loopShape: LoopShape; primaryDimensionMetres: number };

function positive(value: number, label: string) {
  if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${label} must be greater than zero.`);
}

function nonNegative(value: number, label: string) {
  if (!Number.isFinite(value) || value < 0) throw new RangeError(`${label} must not be negative.`);
}

export function calculateLargestAntennaDimension(input: AntennaEnvelopeInput): number {
  for (const [label, value] of Object.entries(input)) {
    if (label === 'radialDropMetres') nonNegative(value as number, label);
    else if (label !== 'shape' && label !== 'loopShape') positive(value as number, label);
  }
  if (input.shape === 'linear') return input.lengthMetres;
  if (input.shape === 'inverted-v') return Math.max(input.endpointSpanMetres, input.legMetres);
  if (input.shape === 'rectangle') return Math.hypot(input.widthMetres, input.depthMetres);
  if (input.shape === 'parallel-elements') {
    return Math.hypot(input.boomMetres, (input.firstElementMetres + input.lastElementMetres) / 2);
  }
  if (input.shape === 'ground-mounted-vertical') {
    return Math.max(input.radialFieldDiameterMetres, Math.hypot(input.radiatorMetres, input.radialMetres));
  }
  if (input.shape === 'ground-plane') {
    return Math.max(
      input.footprintDiameterMetres,
      Math.hypot(input.footprintDiameterMetres / 2, input.radiatorMetres + input.radialDropMetres)
    );
  }
  return input.loopShape === 'square' ? input.primaryDimensionMetres * Math.SQRT2 : input.primaryDimensionMetres;
}
