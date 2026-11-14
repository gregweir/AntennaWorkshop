/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import type { calculateAxialModeHelix } from '../calculators/axialModeHelix';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';

type HelixResult = ReturnType<typeof calculateAxialModeHelix>;

interface Props {
  result: HelixResult;
  unitSystem: UnitSystem;
}

interface ControlsProps {
  conductorWidthMillimetres: number;
  setConductorWidthMillimetres: (value: number) => void;
  diameterToleranceMillimetres: number;
  setDiameterToleranceMillimetres: (value: number) => void;
  turnSpacingToleranceMillimetres: number;
  setTurnSpacingToleranceMillimetres: (value: number) => void;
  feedlineImpedanceOhms: number;
  setFeedlineImpedanceOhms: (value: number) => void;
}

function HelixNumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field"><span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></div>;
}

export function HelixConstructionControls(props: ControlsProps) {
  return <>
    <HelixNumberField label="Conductor diameter or tape width" tooltip="Record the largest conductor cross-section dimension used in the electromagnetic model and finished build. Round wire diameter and flat tape width are not electrically interchangeable, so preserve the actual shape in full-wave modelling." value={props.conductorWidthMillimetres} min={0.01} max={1000} step={0.01} unit="mm" help="NASA's cited prototype used copper tape; its free-standing comparison used round wire. This field documents rather than equates them." onChange={props.setConductorWidthMillimetres} />
    <HelixNumberField label="Maximum diameter error" tooltip="Enter the largest expected difference between the finished helix diameter and its target. The worksheet converts it into a percentage and the corresponding circumference change." value={props.diameterToleranceMillimetres} min={0} max={1000} step={0.1} unit="mm" help="Use a realistic fabrication or inspection tolerance, not conductor diameter." onChange={props.setDiameterToleranceMillimetres} />
    <HelixNumberField label="Maximum turn-spacing error" tooltip="Enter the largest expected centre-to-centre error for one turn. The worksheet also shows the conservative axial stack if every turn misses in the same direction." value={props.turnSpacingToleranceMillimetres} min={0} max={1000} step={0.1} unit="mm" help="Measure each full-turn boundary from the feed plane rather than only checking the final length." onChange={props.setTurnSpacingToleranceMillimetres} />
    <HelixNumberField label="Feedline reference impedance" tooltip="Used only to compare the classical real terminal-resistance estimate with the intended feedline. The displayed resistive-only SWR ignores reactance and is not a prediction of the finished antenna." value={props.feedlineImpedanceOhms} min={1} max={2000} step={1} unit="Ω" help="Normally 50 Ω. Measure complex impedance with the final ground plane, support, connector, and matching transition installed." onChange={props.setFeedlineImpedanceOhms} />
  </>;
}

export function HelixConstructionPanel({ result, unitSystem }: Props) {
  return <section className="helix-construction-panel" aria-labelledby="helix-construction-heading">
    <div className="helix-construction-heading">
      <div><p className="eyebrow">Fabrication worksheet</p><h3 id="helix-construction-heading">Control the winding before developing the match</h3><p>Mark every full-turn boundary on the former or support jig. Measure diameter and centre-to-centre spacing independently rather than stretching the finished winding to length.</p></div>
      <dl>
        <div><dt>Conductor record</dt><dd>{formatLength(result.conductorWidthMetres, unitSystem)}</dd></div>
        <div><dt>Diameter tolerance</dt><dd>±{formatLength(result.diameterToleranceMetres, unitSystem)} · {result.diameterTolerancePercent.toFixed(2)}%</dd></div>
        <div><dt>Spacing tolerance</dt><dd>±{formatLength(result.turnSpacingToleranceMetres, unitSystem)} · {result.turnSpacingTolerancePercent.toFixed(2)}%</dd></div>
        <div><dt>Worst-case axial stack</dt><dd>±{formatLength(result.worstCaseAxialStackErrorMetres, unitSystem)}</dd></div>
      </dl>
    </div>

    <div className="helix-construction-grid">
      <div className="helix-turn-schedule">
        <h4>Full-turn checkpoints</h4>
        <div className="table-scroll"><table><thead><tr><th>Turn</th><th>Axial start</th><th>Axial end</th><th>Conductor at end</th></tr></thead><tbody>{result.turnSchedule.map((turn) => <tr key={turn.turnNumber}><th scope="row">{turn.turnNumber}</th><td>{formatLength(turn.startAxialMetres, unitSystem)}</td><td>{formatLength(turn.endAxialMetres, unitSystem)}</td><td>{formatLength(turn.endConductorMetres, unitSystem)}</td></tr>)}</tbody></table></div>
        <p>The stack value is a conservative arithmetic sum if every spacing error falls in the same direction. It is not a statistical prediction or an RF-performance limit.</p>
      </div>

      <article className="helix-feed-workflow">
        <div><p className="eyebrow">Feed transition</p><h4>Build it adjustable, then measure it</h4></div>
        <svg viewBox="0 0 520 245" role="img" aria-labelledby="helix-feed-title helix-feed-desc">
          <title id="helix-feed-title">Axial-mode helix feed transition concept</title>
          <desc id="helix-feed-desc">A coax connector passes through and bonds to the ground plane. Its centre conductor reaches the helix start beside an empirically adjusted triangular matching vane.</desc>
          <line className="helix-feed-ground" x1="45" y1="155" x2="475" y2="155" />
          <rect className="helix-feed-connector" x="92" y="155" width="58" height="62" rx="7" />
          <line className="helix-feed-centre" x1="121" y1="198" x2="121" y2="112" />
          <path className="helix-feed-vane" d="M121 150 L234 150 L121 112 Z" />
          <path className="helix-feed-turn" d="M121 112 C175 52 265 52 324 112 S430 172 465 105" />
          <text x="68" y="235">Coax connector</text><text x="282" y="189">Ground plane / shield bond</text><text x="217" y="92">Helix start</text><text x="238" y="137">Adjustable matching vane</text>
        </svg>
        <dl>
          <div><dt>Classical terminal estimate</dt><dd>{result.estimatedTerminalResistanceOhms.toFixed(0)} Ω</dd></div>
          <div><dt>Entered feedline</dt><dd>{result.feedlineImpedanceOhms.toFixed(0)} Ω</dd></div>
          <div><dt>Resistance ratio</dt><dd>{result.estimatedTerminalToFeedlineRatio.toFixed(2)} : 1</dd></div>
          <div><dt>Resistive-only SWR reference</dt><dd>{result.estimatedResistiveOnlySwr.toFixed(2)} : 1</dd></div>
        </dl>
        <ol><li>Bond the connector body or coax shield continuously to the ground plane.</li><li>Connect the centre conductor to the helix start with the shortest practical path.</li><li>Provide an adjustable vane or transition and sweep complex impedance with the finished support and reflector installed.</li><li>Adjust the transition for the intended band; do not treat helix stretching as a substitute for feed development.</li></ol>
        <p className="helix-feed-limit"><strong>No vane dimensions are inferred.</strong> NASA’s cited copper-triangle example was empirically shaped and positioned. The SWR shown assumes a purely real classical terminal estimate and excludes reactance, loss, connector geometry, conductor size, supports, and the actual ground plane.</p>
      </article>
    </div>
  </section>;
}
