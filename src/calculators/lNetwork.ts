/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

export interface LNetworkInput {
  frequencyMHz: number;
  systemResistanceOhms: number;
  loadResistanceOhms: number;
  loadReactanceOhms: number;
}

export type LNetworkTopology = 'series-first' | 'shunt-first';
export type ReactiveElementKind = 'inductor' | 'capacitor' | 'none';

export interface ReactiveElement {
  kind: ReactiveElementKind;
  reactanceOhms: number;
  susceptanceSiemens: number;
  inductanceHenries: number | null;
  capacitanceFarads: number | null;
}

export interface LNetworkSolution {
  topology: LNetworkTopology;
  series: ReactiveElement;
  shunt: ReactiveElement;
  inputResistanceOhms: number;
  inputReactanceOhms: number;
  residualMagnitudeOhms: number;
}

export const L_NETWORK_MODEL = {
  id: 'lossless-two-element-l-network',
  version: '1.0.0',
  reviewedOn: '2026-11-14',
  sources: [
    {
      title: 'ARRL Hands-On Radio Experiment 21 — The L-Network',
      url: 'https://www.arrl.org/files/file/Technology/HandsOnRadio/Experiments21to30.pdf'
    },
    {
      title: 'Analog Devices — RF Impedance Matching Calculator',
      url: 'https://www.analog.com/en/resources/interactive-design-tools/rf-impedance-matching-calculator.html'
    },
    {
      title: 'North Carolina State University — The L Matching Network',
      url: 'https://eng.libretexts.org/Bookshelves/Electrical_Engineering/Electronics/Fundamentals_of_Microwave_and_RF_Design_(Steer)/10%3A_Impedance_Matching/10.04%3A_The_L_Matching_Network'
    }
  ]
} as const;

const EPSILON = 1e-10;

function finiteRange(value: number, minimum: number, maximum: number, name: string) {
  if (!Number.isFinite(value) || value < minimum || value > maximum) throw new RangeError(`${name} must be between ${minimum} and ${maximum}.`);
}

function seriesElement(reactanceOhms: number, angularFrequency: number): ReactiveElement {
  if (Math.abs(reactanceOhms) < EPSILON) return { kind: 'none', reactanceOhms: 0, susceptanceSiemens: 0, inductanceHenries: null, capacitanceFarads: null };
  return reactanceOhms > 0
    ? { kind: 'inductor', reactanceOhms, susceptanceSiemens: 0, inductanceHenries: reactanceOhms / angularFrequency, capacitanceFarads: null }
    : { kind: 'capacitor', reactanceOhms, susceptanceSiemens: 0, inductanceHenries: null, capacitanceFarads: -1 / (angularFrequency * reactanceOhms) };
}

function shuntElement(susceptanceSiemens: number, angularFrequency: number): ReactiveElement {
  if (Math.abs(susceptanceSiemens) < EPSILON) return { kind: 'none', reactanceOhms: 0, susceptanceSiemens: 0, inductanceHenries: null, capacitanceFarads: null };
  return susceptanceSiemens > 0
    ? { kind: 'capacitor', reactanceOhms: -1 / susceptanceSiemens, susceptanceSiemens, inductanceHenries: null, capacitanceFarads: susceptanceSiemens / angularFrequency }
    : { kind: 'inductor', reactanceOhms: -1 / susceptanceSiemens, susceptanceSiemens, inductanceHenries: -1 / (angularFrequency * susceptanceSiemens), capacitanceFarads: null };
}

function reciprocal(real: number, imaginary: number) {
  const denominator = real ** 2 + imaginary ** 2;
  return { real: real / denominator, imaginary: -imaginary / denominator };
}

function verifySolution(input: LNetworkInput, topology: LNetworkTopology, seriesReactanceOhms: number, shuntSusceptanceSiemens: number) {
  if (topology === 'series-first') {
    const loadAdmittance = reciprocal(input.loadResistanceOhms, input.loadReactanceOhms);
    const parallelImpedance = reciprocal(loadAdmittance.real, loadAdmittance.imaginary + shuntSusceptanceSiemens);
    return { real: parallelImpedance.real, imaginary: parallelImpedance.imaginary + seriesReactanceOhms };
  }
  const branchAdmittance = reciprocal(input.loadResistanceOhms, input.loadReactanceOhms + seriesReactanceOhms);
  return reciprocal(branchAdmittance.real, branchAdmittance.imaginary + shuntSusceptanceSiemens);
}

export function calculateLNetwork(input: LNetworkInput) {
  finiteRange(input.frequencyMHz, 0.001, 300_000, 'Frequency');
  finiteRange(input.systemResistanceOhms, 0.01, 1_000_000, 'System resistance');
  finiteRange(input.loadResistanceOhms, 0.01, 1_000_000, 'Load resistance');
  finiteRange(input.loadReactanceOhms, -1_000_000, 1_000_000, 'Load reactance');
  const angularFrequency = 2 * Math.PI * input.frequencyMHz * 1_000_000;
  const solutions: LNetworkSolution[] = [];
  const addSolution = (topology: LNetworkTopology, seriesReactanceOhms: number, shuntSusceptanceSiemens: number) => {
    if (solutions.some((candidate) => candidate.topology === topology && Math.abs(candidate.series.reactanceOhms - seriesReactanceOhms) < EPSILON && Math.abs(candidate.shunt.susceptanceSiemens - shuntSusceptanceSiemens) < EPSILON)) return;
    const verified = verifySolution(input, topology, seriesReactanceOhms, shuntSusceptanceSiemens);
    solutions.push({
      topology,
      series: seriesElement(seriesReactanceOhms, angularFrequency),
      shunt: shuntElement(shuntSusceptanceSiemens, angularFrequency),
      inputResistanceOhms: verified.real,
      inputReactanceOhms: verified.imaginary,
      residualMagnitudeOhms: Math.hypot(verified.real - input.systemResistanceOhms, verified.imaginary)
    });
  };

  const loadAdmittance = reciprocal(input.loadResistanceOhms, input.loadReactanceOhms);
  const seriesFirstRoot = loadAdmittance.real / input.systemResistanceOhms - loadAdmittance.real ** 2;
  if (seriesFirstRoot >= -EPSILON) {
    const magnitude = Math.sqrt(Math.max(0, seriesFirstRoot));
    for (const totalSusceptance of magnitude < EPSILON ? [0] : [magnitude, -magnitude]) {
      const denominator = loadAdmittance.real ** 2 + totalSusceptance ** 2;
      addSolution('series-first', totalSusceptance / denominator, totalSusceptance - loadAdmittance.imaginary);
    }
  }

  const shuntFirstRoot = input.loadResistanceOhms * input.systemResistanceOhms - input.loadResistanceOhms ** 2;
  if (shuntFirstRoot >= -EPSILON) {
    const magnitude = Math.sqrt(Math.max(0, shuntFirstRoot));
    for (const totalReactance of magnitude < EPSILON ? [0] : [magnitude, -magnitude]) {
      const denominator = input.loadResistanceOhms ** 2 + totalReactance ** 2;
      addSolution('shunt-first', totalReactance - input.loadReactanceOhms, totalReactance / denominator);
    }
  }

  return { ...input, angularFrequency, solutions };
}
