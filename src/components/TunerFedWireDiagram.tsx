/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { TunerFedWireFeedMode } from '../calculators/tunerFedWire';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  radiatorMetres: number;
  counterpoiseMetres: number;
  feedlineMetres: number;
  feedMode: TunerFedWireFeedMode;
  unitSystem: UnitSystem;
}

export function TunerFedWireDiagram({ radiatorMetres, counterpoiseMetres, feedlineMetres, feedMode, unitSystem }: Props) {
  const remote = feedMode === 'remote-matching-point';
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 380" role="img" aria-labelledby="tuner-wire-title tuner-wire-desc">
      <title id="tuner-wire-title">Tuner-fed end-fed wire system</title>
      <desc id="tuner-wire-desc">An end-fed radiator measuring {formatLength(radiatorMetres, unitSystem)} is fed at a {remote ? 'remote matching unit connected by coax' : 'tuner at the operating position'} against a {formatLength(counterpoiseMetres, unitSystem)} counterpoise.</desc>
      <DiagramDefinitions prefix="tuner-wire" />
      <DiagramGrid />
      <g className="antenna-wire"><path d="M270 125 H690" /><circle cx="690" cy="125" r="6" /></g>
      <g className="transformer-box"><rect x="150" y="92" width="120" height="66" rx="10" /><text x="210" y="120" textAnchor="middle">{remote ? 'remote matching' : 'antenna tuner'}</text><text x="210" y="139" textAnchor="middle">point</text></g>
      <g className="return-path"><path d="M210 158 V250 H52" /><circle cx="52" cy="250" r="5" /><text x="118" y="278" textAnchor="middle">RF return · {formatLength(counterpoiseMetres, unitSystem)}</text></g>
      {remote ? <g className="coax-path"><path d="M150 125 H48 V318 H220" /><rect x="220" y="292" width="120" height="52" rx="8" /><text x="280" y="314" textAnchor="middle">station /</text><text x="280" y="332" textAnchor="middle">tuner controller</text><text x="112" y="336" textAnchor="middle">coax · {formatLength(feedlineMetres, unitSystem)}</text></g> : <g className="coax-path"><rect x="20" y="99" width="110" height="52" rx="8" /><path d="M130 125 H150" /><text x="75" y="130" textAnchor="middle">station</text></g>}
      <SvgDimension prefix="tuner-wire" x1={270} y1={70} x2={690} y2={70} label={`Radiator · ${formatLength(radiatorMetres, unitSystem)}`} labelX={480} labelY={50} />
      <g className="hazard-labels"><text x="690" y="165" textAnchor="end">HIGH RF VOLTAGE POSSIBLE</text><text x="380" y="205" textAnchor="middle">installed route and electrical length control the pattern</text></g>
    </svg>
    <figcaption>System concept · The tuner, return path, feedline, choking, clearances, and installed wire route must be commissioned together.</figcaption>
  </figure>;
}
