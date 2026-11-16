/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export const ANTENNA_TYPES = [
  'dipole', 'folded-dipole', 't2fd', 'fan-dipole', 'linked-dipole', 'doublet', 'g5rv', 'phased-collinear', 'turnstile',
  'halo', 'skywire', 'hex-beam', 'v-beam', 'rhombic', 'vertical-half-rhombic', 'loaded-dipole',
  'trap-dipole', 'small-loop', 'inverted-v', 'efhw', 'tuner-fed-wire', 'ocfd', 'jpole', 'slim-jim', 'sleeve-dipole', 'moxon',
  'cubical-quad', 'axial-helix', 'discone', 'log-periodic', 'beverage', 'compact-receive', 'k9ay',
  'loop-on-ground', 'active-receive-loop', 'coaxial-collinear', 'yagi', 'loaded-vertical', 'ground-mounted-vertical',
  'ground-plane', 'full-wave-loop'
] as const;

export type AntennaType = typeof ANTENNA_TYPES[number];
