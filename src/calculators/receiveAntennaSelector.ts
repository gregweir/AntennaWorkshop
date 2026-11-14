/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { SPEED_OF_LIGHT_METRES_PER_SECOND } from './dipole';

export type GroundReturnAllowance = 0 | 1 | 2;
export type ReceiveDirectionPreference = 'fixed-axis' | 'four-directions' | 'rotatable-nulls';
export type ReceiveCandidateId = 'beverage' | 'flag-pennant' | 'ewe' | 'k9ay' | 'loop-on-ground' | 'active-receive-loop';

export interface ReceiveAntennaSelectorInput {
  referenceFrequencyMHz: number;
  maximumHorizontalSpanMetres: number;
  maximumSupportHeightMetres: number;
  surfaceWireAllowed: boolean;
  groundReturnsAllowed: GroundReturnAllowance;
  activeElectronicsAllowed: boolean;
  switchingAllowed: boolean;
  directionPreference: ReceiveDirectionPreference;
}

export interface ReceiveAntennaCandidate {
  id: ReceiveCandidateId;
  name: string;
  plannerType: 'beverage' | 'compact-receive' | 'k9ay' | 'loop-on-ground' | 'active-receive-loop';
  compactGeometry?: 'flag' | 'ewe';
  minimumSpanMetres: number;
  minimumSupportHeightMetres: number;
  groundReturnsRequired: GroundReturnAllowance;
  requiresSurfaceWire: boolean;
  requiresActiveElectronics: boolean;
  requiresSwitching: boolean;
  directionCapability: string;
  status: 'fits' | 'tradeoffs' | 'blocked';
  blockers: string[];
  tradeoffs: string[];
  strengths: string[];
}

const FIXED_GEOMETRY = {
  flagPennant: { spanMetres: 8.84, supportHeightMetres: 6.1 },
  ewe: { spanMetres: 7.62, supportHeightMetres: 3.05 },
  k9ay: { spanMetres: 9.144, supportHeightMetres: 7.62 },
  loopOnGround: { spanMetres: 4.572 * Math.SQRT2, supportHeightMetres: 0 },
  activeLoop: { spanMetres: 0.762, supportHeightMetres: 2.286 }
} as const;

function finiteRange(value: number, minimum: number, maximum: number, label: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) {
    throw new RangeError(`${label} must be between ${minimum} and ${maximum}.`);
  }
}

export function evaluateReceiveAntennaCandidates(input: ReceiveAntennaSelectorInput) {
  finiteRange(input.referenceFrequencyMHz, 0.001, 300_000, 'Reference frequency');
  finiteRange(input.maximumHorizontalSpanMetres, 0.1, 100_000, 'Maximum horizontal span');
  finiteRange(input.maximumSupportHeightMetres, 0, 1_000, 'Maximum support height');
  if (![0, 1, 2].includes(input.groundReturnsAllowed)) throw new RangeError('Ground-return allowance must be 0, 1, or 2.');
  if (!['fixed-axis', 'four-directions', 'rotatable-nulls'].includes(input.directionPreference)) throw new RangeError('Direction preference is invalid.');

  const wavelengthMetres = SPEED_OF_LIGHT_METRES_PER_SECOND / (input.referenceFrequencyMHz * 1_000_000);
  const definitions: Array<Omit<ReceiveAntennaCandidate, 'status' | 'blockers' | 'tradeoffs'>> = [
    {
      id: 'beverage', name: 'Terminated Beverage', plannerType: 'beverage',
      minimumSpanMetres: wavelengthMetres / 2, minimumSupportHeightMetres: 2,
      groundReturnsRequired: 2, requiresSurfaceWire: false, requiresActiveElectronics: false, requiresSwitching: false,
      directionCapability: 'One fixed feed-to-termination axis',
      strengths: ['Long low route', 'One-way end convention', 'Passive receive system']
    },
    {
      id: 'flag-pennant', name: 'Flag or point-fed Pennant', plannerType: 'compact-receive', compactGeometry: 'flag',
      minimumSpanMetres: FIXED_GEOMETRY.flagPennant.spanMetres, minimumSupportHeightMetres: FIXED_GEOMETRY.flagPennant.supportHeightMetres,
      groundReturnsRequired: 0, requiresSurfaceWire: false, requiresActiveElectronics: false, requiresSwitching: false,
      directionCapability: 'One fixed feed-end axis',
      strengths: ['Closed elevated loop', 'No antenna ground return', 'Passive receive system']
    },
    {
      id: 'ewe', name: 'EWE', plannerType: 'compact-receive', compactGeometry: 'ewe',
      minimumSpanMetres: FIXED_GEOMETRY.ewe.spanMetres, minimumSupportHeightMetres: FIXED_GEOMETRY.ewe.supportHeightMetres,
      groundReturnsRequired: 2, requiresSurfaceWire: false, requiresActiveElectronics: false, requiresSwitching: false,
      directionCapability: 'One fixed feed-end axis',
      strengths: ['Compact vertical wire', 'Lower support than Flag/Pennant', 'Passive receive system']
    },
    {
      id: 'k9ay', name: 'K9AY crossed loops', plannerType: 'k9ay',
      minimumSpanMetres: FIXED_GEOMETRY.k9ay.spanMetres, minimumSupportHeightMetres: FIXED_GEOMETRY.k9ay.supportHeightMetres,
      groundReturnsRequired: 1, requiresSurfaceWire: false, requiresActiveElectronics: false, requiresSwitching: true,
      directionCapability: 'Four electrically selected feed-end directions',
      strengths: ['Four fixed headings', 'One central support', 'Passive antenna and feed circuit']
    },
    {
      id: 'loop-on-ground', name: 'Loop on Ground', plannerType: 'loop-on-ground',
      minimumSpanMetres: FIXED_GEOMETRY.loopOnGround.spanMetres, minimumSupportHeightMetres: FIXED_GEOMETRY.loopOnGround.supportHeightMetres,
      groundReturnsRequired: 0, requiresSurfaceWire: true, requiresActiveElectronics: false, requiresSwitching: false,
      directionCapability: 'One broad fixed bidirectional low-angle axis',
      strengths: ['No vertical support', 'No antenna earth connection', 'Passive receive system']
    },
    {
      id: 'active-receive-loop', name: 'Untuned active receiving loop', plannerType: 'active-receive-loop',
      minimumSpanMetres: FIXED_GEOMETRY.activeLoop.spanMetres, minimumSupportHeightMetres: FIXED_GEOMETRY.activeLoop.supportHeightMetres,
      groundReturnsRequired: 0, requiresSurfaceWire: false, requiresActiveElectronics: true, requiresSwitching: false,
      directionCapability: 'Continuously rotatable bidirectional null axis',
      strengths: ['Smallest footprint', 'Manual null steering', 'No antenna ground return']
    }
  ];

  const candidates = definitions.map((definition): ReceiveAntennaCandidate => {
    const blockers: string[] = [];
    const tradeoffs: string[] = [];
    if (definition.minimumSpanMetres > input.maximumHorizontalSpanMetres) blockers.push(`Needs about ${definition.minimumSpanMetres.toFixed(1)} m horizontal clearance for this starting geometry.`);
    if (definition.minimumSupportHeightMetres > input.maximumSupportHeightMetres) blockers.push(`Needs about ${definition.minimumSupportHeightMetres.toFixed(1)} m support height for this starting geometry.`);
    if (definition.requiresSurfaceWire && !input.surfaceWireAllowed) blockers.push('Requires a controlled area where insulated wire may lie on the surface.');
    if (definition.groundReturnsRequired > input.groundReturnsAllowed) blockers.push(`Requires ${definition.groundReturnsRequired === 1 ? 'one ground return' : 'two separate ground returns'} in the antenna circuit.`);
    if (definition.requiresActiveElectronics && !input.activeElectronicsAllowed) blockers.push('Requires a powered feedpoint amplifier and its protection system.');
    if (definition.requiresSwitching && !input.switchingAllowed) blockers.push('Requires weatherproof loop-selection and reversal switching.');

    if (input.directionPreference === 'four-directions') {
      if (definition.id === 'active-receive-loop') tradeoffs.push('Can be rotated manually, but does not provide four electrically selected preset directions.');
      else if (definition.id !== 'k9ay') blockers.push('Does not provide built-in selection among four receive directions.');
    }
    if (input.directionPreference === 'rotatable-nulls') {
      if (definition.id === 'k9ay') tradeoffs.push('Provides four switched headings rather than continuous manual null rotation.');
      else if (definition.id !== 'active-receive-loop') blockers.push('Has a fixed installed axis unless duplicated or physically rebuilt.');
    }

    return {
      ...definition,
      blockers,
      tradeoffs,
      status: blockers.length > 0 ? 'blocked' : tradeoffs.length > 0 ? 'tradeoffs' : 'fits'
    };
  });

  return {
    ...input,
    wavelengthMetres,
    candidates,
    fitCount: candidates.filter((candidate) => candidate.status === 'fits').length,
    tradeoffCount: candidates.filter((candidate) => candidate.status === 'tradeoffs').length,
    blockedCount: candidates.filter((candidate) => candidate.status === 'blocked').length
  };
}
