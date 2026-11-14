/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, type ReactNode } from 'react';
import type { calculateDiscone } from '../calculators/discone';
import { formatLength, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';

type DisconeResult = ReturnType<typeof calculateDiscone>;

interface Props {
  result: DisconeResult;
  unitSystem: UnitSystem;
}

interface ControlsProps {
  radialConductorDiameterMillimetres: number;
  setRadialConductorDiameterMillimetres: (value: number) => void;
  feedGapMillimetres: number;
  setFeedGapMillimetres: (value: number) => void;
  radialLengthToleranceMillimetres: number;
  setRadialLengthToleranceMillimetres: (value: number) => void;
}

function DisconeNumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field"><span className="field-label-with-help"><label htmlFor={inputId}>{label}</label><HelpTip label={label}>{tooltip}</HelpTip></span><span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span><small>{help}</small></div>;
}

export function DisconeConstructionControls(props: ControlsProps) {
  return <>
    <DisconeNumberField label="Radial conductor diameter" tooltip="Record the outside diameter of the wire, rod, or tube used for both radial sets. If the sets differ, enter the larger value here and preserve both exact diameters in the electromagnetic model." value={props.radialConductorDiameterMillimetres} min={0.01} max={1000} step={0.01} unit="mm" help="Documentation and spacing check only; it does not alter the sourced element lengths." onChange={props.setRadialConductorDiameterMillimetres} />
    <DisconeNumberField label="Planned feed gap" tooltip="Record the finished face-to-face disc-to-cone separation. The cited NTIA design says this separation should be as short as possible for maximum frequency range, but it does not provide one universal dimension." value={props.feedGapMillimetres} min={0.01} max={1000} step={0.1} unit="mm" help="A build record, not an optimized or guaranteed gap. Include the real connector and insulator in the model." onChange={props.setFeedGapMillimetres} />
    <DisconeNumberField label="Maximum radial length error" tooltip="Enter the largest expected absolute difference between any finished radial and its target length. The worksheet reports that tolerance separately for cone and disc radials." value={props.radialLengthToleranceMillimetres} min={0} max={1000} step={0.1} unit="mm" help="Use an inspection tolerance; connection allowance remains extra cut material, not acceptable finished error." onChange={props.setRadialLengthToleranceMillimetres} />
  </>;
}

export function DisconeConstructionPanel({ result, unitSystem }: Props) {
  return <section className="discone-construction-panel" aria-labelledby="discone-construction-heading">
    <div className="discone-construction-heading">
      <div><p className="eyebrow">Fabrication worksheet</p><h3 id="discone-construction-heading">Cut equal radial sets and prove the feed geometry</h3><p>Mark one master radial for each set, inspect every finished element against it, and use angular marks on the hubs or support rings to keep the structure concentric.</p></div>
      <dl>
        <div><dt>Conductor record</dt><dd>{formatLength(result.radialConductorDiameterMetres, unitSystem)} · {result.radialConductorDiameterWavelengths.toFixed(4)} λ</dd></div>
        <div><dt>Planned feed gap</dt><dd>{formatLength(result.feedGapMetres, unitSystem)} · {result.feedGapWavelengths.toFixed(4)} λ</dd></div>
        <div><dt>Cone tolerance</dt><dd>±{formatLength(result.radialLengthToleranceMetres, unitSystem)} · {result.coneRadialLengthTolerancePercent.toFixed(2)}%</dd></div>
        <div><dt>Disc tolerance</dt><dd>±{formatLength(result.radialLengthToleranceMetres, unitSystem)} · {result.discRadialLengthTolerancePercent.toFixed(2)}%</dd></div>
      </dl>
    </div>

    <div className="discone-construction-grid">
      <article className="discone-radial-schedule">
        <h4>Radial cutting and spacing schedule</h4>
        <div className="table-scroll"><table><thead><tr><th>Set</th><th>Count</th><th>Finished length</th><th>Cut length</th><th>Angle</th><th>Rim arc</th></tr></thead><tbody>
          <tr><th scope="row">Disc</th><td>{result.discRadialCount}</td><td>{formatLength(result.discRadiusMetres, unitSystem)}</td><td>{formatLength(result.cutDiscRadialMetres, unitSystem)}</td><td>{result.discRadialAngularSpacingDegrees.toFixed(1)}°</td><td>{formatLength(result.discRimArcSpacingMetres, unitSystem)}</td></tr>
          <tr><th scope="row">Cone</th><td>{result.coneRadialCount}</td><td>{formatLength(result.coneSlantLengthMetres, unitSystem)}</td><td>{formatLength(result.cutConeRadialMetres, unitSystem)}</td><td>{result.coneRadialAngularSpacingDegrees.toFixed(1)}°</td><td>{formatLength(result.coneBaseArcSpacingMetres, unitSystem)}</td></tr>
        </tbody></table></div>
        <ul><li>Measure finished lengths from the common electrical centre, not from the outer edge of a hub.</li><li>Space each set by angle at the centre. Rim arc spacing is a fabrication check, not a substitute for angular layout.</li><li>Keep support rings, fasteners, mast, and feedline geometry in the full model; conductive rim hardware changes the radial approximation.</li></ul>
      </article>

      <article className="discone-feed-workflow">
        <div><p className="eyebrow">Conventional disc-over-cone feed</p><h4>Centre conductor to disc; outer conductor to cone</h4></div>
        <svg viewBox="0 0 520 270" role="img" aria-labelledby="discone-feed-title discone-feed-desc">
          <title id="discone-feed-title">Conventional discone feed-region connection</title>
          <desc id="discone-feed-desc">The coax rises through the cone. Its outer conductor bonds to the cone apex while its insulated centre conductor crosses a short gap and bonds to the centre of the disc.</desc>
          <path className="discone-feed-cone" d="M65 235 L225 86 L295 86 L455 235" />
          <line className="discone-feed-disc" x1="90" y1="50" x2="430" y2="50" />
          <rect className="discone-feed-coax" x="226" y="86" width="68" height="158" rx="8" />
          <line className="discone-feed-core" x1="260" y1="225" x2="260" y2="50" />
          <line className="discone-feed-gap" x1="318" y1="53" x2="318" y2="83" />
          <text x="330" y="72">Entered gap</text><text x="310" y="40">Disc / centre conductor</text><text x="60" y="256">Cone / outer-conductor bond</text><text x="302" y="196">Coax through cone</text>
        </svg>
        <ol><li>Bond the connector body or coax outer conductor continuously to the cone apex.</li><li>Carry the insulated centre conductor across the shortest practical gap and bond it at the disc centre.</li><li>Keep the disc and cone electrically isolated; record the actual gap, insulator, hub, and connector geometry.</li><li>Sweep complex impedance across every intended band with the antenna, support, mast, and feedline control installed.</li></ol>
        <p className="discone-feed-limit"><strong>Do not mix feed topologies.</strong> This worksheet follows the conventional disc-over-cone arrangement documented in the portable-discone patent. NASA’s cited study used an inverted discone with the cone on the coax centre conductor and the disc as the ground plane; that report supports the radial-surface approximation, not this connection order.</p>
      </article>
    </div>
  </section>;
}
