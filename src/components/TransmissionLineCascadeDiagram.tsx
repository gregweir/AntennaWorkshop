/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateTransmissionLineCascade } from '../calculators/transmissionLineCascade';
import { formatLength, type UnitSystem } from '../lib/units';

function formatImpedance(resistanceOhms: number, reactanceOhms: number) {
  return `${resistanceOhms.toFixed(2)} ${reactanceOhms < 0 ? '−' : '+'} j${Math.abs(reactanceOhms).toFixed(2)} Ω`;
}

export function TransmissionLineCascadeDiagram({ result, unitSystem }: { result: ReturnType<typeof calculateTransmissionLineCascade>; unitSystem: UnitSystem }) {
  const visualSections = [...result.sections].reverse();
  const sectionWidth = 350 / visualSections.length;
  return <figure className="antenna-figure line-cascade-figure">
    <svg viewBox="0 0 760 430" role="img" aria-labelledby="line-cascade-title line-cascade-desc">
      <title id="line-cascade-title">Cascaded transmission-line section transformation</title>
      <desc id="line-cascade-desc">Two uniform line sections transform the entered load to {formatImpedance(result.inputResistanceOhms, result.inputReactanceOhms)} at the source-side input.</desc>
      <g className="line-transform-terminal input"><rect x="25" y="75" width="175" height="110" rx="16" /><text x="112" y="106" textAnchor="middle">LINE INPUT</text><text x="112" y="137" textAnchor="middle">{formatImpedance(result.inputResistanceOhms, result.inputReactanceOhms)}</text><text x="112" y="162" textAnchor="middle">SWR {result.nearEndPoint.swr.toFixed(3)} : 1</text></g>
      {visualSections.map((section, visualIndex) => {
        const x = 205 + visualIndex * sectionWidth;
        const sectionLabel = `SECTION ${section.sectionNumberFromLoad} · ${section.sectionNumberFromLoad === 1 ? 'LOAD SIDE' : 'NEAR END'}`;
        return <g className="line-cascade-section" key={section.sectionNumberFromLoad}>
          <rect x={x} y="65" width={sectionWidth - 8} height="130" rx="12" />
          <text x={x + (sectionWidth - 8) / 2} y="92" textAnchor="middle">{sectionLabel}</text>
          <text x={x + (sectionWidth - 8) / 2} y="119" textAnchor="middle">Z₀ {section.characteristicImpedanceOhms.toFixed(1)} Ω · VF {section.velocityFactor.toFixed(2)}</text>
          <text x={x + (sectionWidth - 8) / 2} y="145" textAnchor="middle">{formatLength(section.physicalLengthMetres, unitSystem)}</text>
          <text x={x + (sectionWidth - 8) / 2} y="171" textAnchor="middle">{section.transform.oneWayMatchedLossDb.toFixed(3)} dB one way</text>
        </g>;
      })}
      <g className="line-transform-terminal load"><rect x="560" y="75" width="175" height="110" rx="16" /><text x="647" y="106" textAnchor="middle">LOAD</text><text x="647" y="137" textAnchor="middle">{formatImpedance(result.loadResistanceOhms, result.loadReactanceOhms)}</text><text x="647" y="162" textAnchor="middle">SWR {result.loadPoint.swr.toFixed(3)} : 1</text></g>
      <path className="line-cascade-path" d="M200 130 H205 M555 130 H560" />
      <g className="line-cascade-summary"><rect x="75" y="235" width="610" height="145" rx="18" /><text x="380" y="266" textAnchor="middle">LOAD-TO-SOURCE CASCADE</text><text x="110" y="300">Junction impedance</text><text x="650" y="300" textAnchor="end">{formatImpedance(result.sections[0].transform.inputResistanceOhms, result.sections[0].transform.inputReactanceOhms)}</text><text x="110" y="329">Total physical path</text><text x="650" y="329" textAnchor="end">{formatLength(result.totalPhysicalLengthMetres, unitSystem)}</text><text x="110" y="358">Entered matched loss</text><text x="650" y="358" textAnchor="end">{result.totalOneWayMatchedLossDb.toFixed(3)} dB one way · {result.totalRoundTripMatchedAttenuationDb.toFixed(3)} dB round trip</text></g>
      <text className="line-cascade-direction" x="380" y="410" textAnchor="middle">transform each section from load → source</text>
    </svg>
    <div className="line-cascade-mobile-flow" aria-label="Cascaded line sections from load to source">
      <article><small>Final near end</small><strong>{formatImpedance(result.inputResistanceOhms, result.inputReactanceOhms)}</strong><span>SWR {result.nearEndPoint.swr.toFixed(3)} : 1</span></article>
      {visualSections.map((section) => <article key={section.sectionNumberFromLoad}><small>Section {section.sectionNumberFromLoad} · {section.sectionNumberFromLoad === 1 ? 'load side' : 'near end'}</small><strong>Z₀ {section.characteristicImpedanceOhms.toFixed(1)} Ω · VF {section.velocityFactor.toFixed(2)}</strong><span>{formatLength(section.physicalLengthMetres, unitSystem)} · {section.transform.oneWayMatchedLossDb.toFixed(3)} dB</span></article>)}
      <article><small>Entered load</small><strong>{formatImpedance(result.loadResistanceOhms, result.loadReactanceOhms)}</strong><span>SWR {result.loadPoint.swr.toFixed(3)} : 1</span></article>
      <p><strong>Junction:</strong> {formatImpedance(result.sections[0].transform.inputResistanceOhms, result.sections[0].transform.inputReactanceOhms)}<br /><strong>Total:</strong> {formatLength(result.totalPhysicalLengthMetres, unitSystem)} · {result.totalOneWayMatchedLossDb.toFixed(3)} dB one way</p>
    </div>
    <figcaption>Each uniform section transforms the impedance presented by the section to its right. The junction impedance becomes the termination for the near-end section; entered matched losses are applied section by section.</figcaption>
  </figure>;
}
