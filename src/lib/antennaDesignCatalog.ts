/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export type AntennaType = 'dipole' | 'fan-dipole' | 'doublet' | 'g5rv' | 'phased-collinear' | 'loaded-dipole' | 'trap-dipole' | 'small-loop' | 'inverted-v' | 'efhw' | 'ocfd' | 'jpole' | 'slim-jim' | 'moxon' | 'cubical-quad' | 'axial-helix' | 'discone' | 'log-periodic' | 'beverage' | 'compact-receive' | 'k9ay' | 'loop-on-ground' | 'active-receive-loop' | 'yagi' | 'loaded-vertical' | 'ground-mounted-vertical' | 'ground-plane' | 'full-wave-loop';
export type AntennaDesignCategory = 'wire' | 'vertical' | 'directional' | 'loop' | 'broadband' | 'receive';
export type GuidedIntent = 'transmit' | 'receive';
export type GuidedGoal = 'simple-wire' | 'multiband' | 'limited-space' | 'vertical-footprint' | 'directional' | 'broadband' | 'compact-receive' | 'long-route' | 'surface-installation' | 'direction-control' | 'all';

export interface AntennaDesignDefinition {
  name: string;
  short: string;
  description: string;
  category: AntennaDesignCategory;
  receiveOnly: boolean;
  tags: string[];
  guidedGoals: GuidedGoal[];
}

export const ANTENNA_DESIGNS: Record<AntennaType, AntennaDesignDefinition> = {
  dipole: { name: 'Centre-fed half-wave dipole', short: 'Dipole', description: 'Two straight legs', category: 'wire', receiveOnly: false, tags: ['simple', 'single band', 'balanced'], guidedGoals: ['simple-wire'] },
  'fan-dipole': { name: 'Multiband fan dipole', short: 'Fan dipole', description: 'Parallel resonant wire pairs', category: 'wire', receiveOnly: false, tags: ['multiband', 'balanced'], guidedGoals: ['multiband'] },
  doublet: { name: 'Balanced-line multiband doublet', short: 'Doublet', description: 'Equal legs · balanced line · tuner', category: 'wire', receiveOnly: false, tags: ['multiband', 'tuner', 'balanced line'], guidedGoals: ['multiband', 'broadband'] },
  g5rv: { name: 'G5RV family antenna system', short: 'G5RV family', description: 'G5RV · half-size · ZS6BKW', category: 'wire', receiveOnly: false, tags: ['multiband', 'tuner', 'balanced line', 'matching section', 'zs6bkw', 'g0gsf', 'louis varney'], guidedGoals: ['multiband'] },
  'phased-collinear': { name: 'Phased wire collinear array', short: 'Collinear', description: 'Equal half waves · phasing stubs', category: 'directional', receiveOnly: false, tags: ['array', 'wire', 'phasing'], guidedGoals: ['directional'] },
  'loaded-dipole': { name: 'Inductively loaded dipole', short: 'Loaded dipole', description: 'Shortened span · two series coils', category: 'wire', receiveOnly: false, tags: ['shortened', 'limited space', 'coil'], guidedGoals: ['limited-space'] },
  'trap-dipole': { name: 'Two-band parallel-LC trap dipole', short: 'Trap dipole', description: 'Two bands · matched parallel traps', category: 'wire', receiveOnly: false, tags: ['two band', 'multiband', 'trap'], guidedGoals: ['multiband'] },
  'small-loop': { name: 'Small transmitting loop', short: 'Small loop', description: 'Circular loop · measured-L tuning', category: 'loop', receiveOnly: false, tags: ['compact', 'tuned', 'limited space'], guidedGoals: ['limited-space'] },
  'inverted-v': { name: 'Inverted-V dipole', short: 'Inverted-V', description: 'Single high support', category: 'wire', receiveOnly: false, tags: ['simple', 'single support', 'dipole'], guidedGoals: ['simple-wire'] },
  efhw: { name: 'End-fed half-wave (EFHW)', short: 'EFHW', description: 'End transformer · multiband potential', category: 'wire', receiveOnly: false, tags: ['end fed', 'multiband', 'wire'], guidedGoals: ['simple-wire', 'multiband'] },
  ocfd: { name: 'Off-centre-fed dipole (OCFD)', short: 'OCFD', description: 'Unequal legs · multiband potential', category: 'wire', receiveOnly: false, tags: ['multiband', 'off centre', 'wire'], guidedGoals: ['simple-wire', 'multiband'] },
  jpole: { name: 'J-pole vertical', short: 'J-pole', description: 'Vertical radiator · matching stub', category: 'vertical', receiveOnly: false, tags: ['vertical', 'single support', 'vhf'], guidedGoals: ['vertical-footprint'] },
  'slim-jim': { name: 'Slim Jim vertical', short: 'Slim Jim', description: 'Folded radiator · interrupted side', category: 'vertical', receiveOnly: false, tags: ['vertical', 'folded', 'vhf'], guidedGoals: ['vertical-footprint'] },
  moxon: { name: 'Moxon rectangle', short: 'Moxon', description: 'Two-element directional rectangle', category: 'directional', receiveOnly: false, tags: ['beam', 'two element', 'compact'], guidedGoals: ['directional'] },
  'cubical-quad': { name: 'Two-element cubical quad', short: 'Cubical quad', description: 'Driven loop · reflector loop', category: 'directional', receiveOnly: false, tags: ['beam', 'loop', 'two element'], guidedGoals: ['directional'] },
  'axial-helix': { name: 'Axial-mode helical antenna', short: 'Axial helix', description: 'Circular polarization · endfire beam', category: 'directional', receiveOnly: false, tags: ['satellite', 'circular polarization', 'beam'], guidedGoals: ['directional'] },
  discone: { name: 'Broadband discone antenna', short: 'Discone', description: 'Disc · cone · wideband vertical', category: 'broadband', receiveOnly: false, tags: ['wideband', 'vertical', 'scanner'], guidedGoals: ['broadband', 'vertical-footprint'] },
  'log-periodic': { name: 'Log-periodic dipole array', short: 'Log-periodic', description: 'Scaled dipoles · directional wideband', category: 'directional', receiveOnly: false, tags: ['wideband', 'beam', 'multiband'], guidedGoals: ['directional', 'broadband', 'multiband'] },
  beverage: { name: 'Beverage receiving antenna', short: 'Beverage', description: 'Low long wire · directional receive', category: 'receive', receiveOnly: true, tags: ['long route', 'low band', 'ground return'], guidedGoals: ['long-route', 'direction-control'] },
  'compact-receive': { name: 'Compact terminated receiving antenna', short: 'Flag · Pennant · EWE', description: 'Compact low-band · directional receive', category: 'receive', receiveOnly: true, tags: ['compact', 'low band', 'terminated'], guidedGoals: ['compact-receive', 'direction-control'] },
  k9ay: { name: 'K9AY four-direction receiving loops', short: 'K9AY loops', description: 'Crossed loops · four switched directions', category: 'receive', receiveOnly: true, tags: ['four directions', 'switched', 'low band'], guidedGoals: ['compact-receive', 'direction-control'] },
  'loop-on-ground': { name: 'Loop-on-Ground receiving antenna', short: 'Loop on Ground', description: 'Surface loop · low-profile receive', category: 'receive', receiveOnly: true, tags: ['surface', 'no support', 'low profile'], guidedGoals: ['surface-installation'] },
  'active-receive-loop': { name: 'Untuned active receiving loop', short: 'Active receive loop', description: 'Broadband loop · rotatable nulls', category: 'receive', receiveOnly: true, tags: ['compact', 'active', 'rotatable'], guidedGoals: ['compact-receive', 'direction-control'] },
  yagi: { name: 'Three-element Yagi', short: 'Basic Yagi', description: 'Reflector · driven · director', category: 'directional', receiveOnly: false, tags: ['beam', 'three element', 'directional'], guidedGoals: ['directional'] },
  'loaded-vertical': { name: 'Inductively loaded vertical', short: 'Loaded vertical', description: 'Shortened radiator · movable coil', category: 'vertical', receiveOnly: false, tags: ['shortened', 'coil', 'limited space'], guidedGoals: ['limited-space', 'vertical-footprint'] },
  'ground-mounted-vertical': { name: 'Ground-mounted quarter-wave vertical', short: 'Ground vertical', description: 'Ground-level base · radial field', category: 'vertical', receiveOnly: false, tags: ['radials', 'ground mounted', 'vertical'], guidedGoals: ['vertical-footprint'] },
  'ground-plane': { name: 'Quarter-wave ground plane', short: 'Ground plane', description: 'Elevated vertical · sloping radials', category: 'vertical', receiveOnly: false, tags: ['elevated', 'radials', 'vertical'], guidedGoals: ['vertical-footprint'] },
  'full-wave-loop': { name: 'Full-wave wire loop', short: 'Full-wave loop', description: 'Square, triangle, or circle', category: 'loop', receiveOnly: false, tags: ['wire', 'loop', 'full wave'], guidedGoals: ['simple-wire'] }
};

export const ANTENNA_CATEGORIES: Array<{ id: 'all' | AntennaDesignCategory; label: string }> = [
  { id: 'all', label: 'All designs' }, { id: 'wire', label: 'Wire' }, { id: 'vertical', label: 'Verticals' },
  { id: 'directional', label: 'Directional' }, { id: 'loop', label: 'Loops' }, { id: 'broadband', label: 'Broadband' }, { id: 'receive', label: 'Receive only' }
];

export function filterAntennaDesigns(searchText: string, category: 'all' | AntennaDesignCategory) {
  const terms = searchText.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  return (Object.entries(ANTENNA_DESIGNS) as Array<[AntennaType, AntennaDesignDefinition]>).filter(([, design]) => {
    if (category !== 'all' && design.category !== category) return false;
    const searchable = [design.name, design.short, design.description, design.category, ...design.tags].join(' ').toLocaleLowerCase();
    return terms.every((term) => searchable.includes(term));
  }).map(([type]) => type);
}

export function getGuidedDesigns(intent: GuidedIntent, goal: GuidedGoal) {
  return (Object.entries(ANTENNA_DESIGNS) as Array<[AntennaType, AntennaDesignDefinition]>).filter(([, design]) => {
    if (intent === 'receive' ? !design.receiveOnly : design.receiveOnly) return false;
    return goal === 'all' || design.guidedGoals.includes(goal);
  }).map(([type]) => type);
}
