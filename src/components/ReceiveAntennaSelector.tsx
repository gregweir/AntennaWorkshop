/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { evaluateReceiveAntennaCandidates, type GroundReturnAllowance, type ReceiveAntennaCandidate, type ReceiveDirectionPreference } from '../calculators/receiveAntennaSelector';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { HelpTip } from './ContextHelp';

interface Props {
  referenceFrequencyMHz: number;
  unitSystem: UnitSystem;
  onOpenPlanner: (candidate: ReceiveAntennaCandidate) => void;
}

export function ReceiveAntennaSelector({ referenceFrequencyMHz, unitSystem, onOpenPlanner }: Props) {
  const [maximumHorizontalSpanMetres, setMaximumHorizontalSpanMetres] = useState(10);
  const [maximumSupportHeightMetres, setMaximumSupportHeightMetres] = useState(8);
  const [surfaceWireAllowed, setSurfaceWireAllowed] = useState(false);
  const [groundReturnsAllowed, setGroundReturnsAllowed] = useState<GroundReturnAllowance>(0);
  const [activeElectronicsAllowed, setActiveElectronicsAllowed] = useState(true);
  const [switchingAllowed, setSwitchingAllowed] = useState(true);
  const [directionPreference, setDirectionPreference] = useState<ReceiveDirectionPreference>('fixed-axis');
  const shownSpan = unitSystem === 'metric' ? maximumHorizontalSpanMetres : metresToFeet(maximumHorizontalSpanMetres);
  const shownHeight = unitSystem === 'metric' ? maximumSupportHeightMetres : metresToFeet(maximumSupportHeightMetres);
  const result = useMemo(() => {
    try {
      return evaluateReceiveAntennaCandidates({
        referenceFrequencyMHz,
        maximumHorizontalSpanMetres,
        maximumSupportHeightMetres,
        surfaceWireAllowed,
        groundReturnsAllowed,
        activeElectronicsAllowed,
        switchingAllowed,
        directionPreference
      });
    } catch {
      return null;
    }
  }, [activeElectronicsAllowed, directionPreference, groundReturnsAllowed, maximumHorizontalSpanMetres, maximumSupportHeightMetres, referenceFrequencyMHz, surfaceWireAllowed, switchingAllowed]);

  return <details className="receive-selector">
    <summary><span>Help me choose a receiving antenna</span><small>Match the site and operating method before opening a planner</small></summary>
    <div className="receive-selector-body">
      <div className="receive-selector-intro">
        <div><p className="eyebrow">Receive-antenna selection wizard</p><h3>Start with constraints, not claimed performance</h3></div>
        <p>The matcher checks published starting geometry and required system features. It does not predict which antenna will hear better at your location.</p>
      </div>
      <div className="receive-selector-fields">
        <label className="field"><span className="field-label-with-help"><span>Maximum horizontal clearance</span><HelpTip label="Receive selector horizontal clearance">Enter the largest clear straight span or footprint diameter available after allowing safe access, utilities, supports, property boundaries, and nearby conductors.</HelpTip></span><span className="input-with-unit"><input aria-label="Maximum receive-antenna horizontal clearance" type="number" min={unitSystem === 'metric' ? 0.1 : 0.328} step={unitSystem === 'metric' ? 0.1 : 0.5} value={Number(shownSpan.toFixed(2))} onChange={(event) => setMaximumHorizontalSpanMetres(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span><small>Compared with sourced starting footprints at {referenceFrequencyMHz.toFixed(3)} MHz.</small></label>
        <label className="field"><span className="field-label-with-help"><span>Maximum support height</span><HelpTip label="Receive selector support height">Use the maximum safe wire or loop height your support plan can provide. This is not mast structural engineering or a recommendation to build at that height.</HelpTip></span><span className="input-with-unit"><input aria-label="Maximum receive-antenna support height" type="number" min="0" step={unitSystem === 'metric' ? 0.1 : 0.5} value={Number(shownHeight.toFixed(2))} onChange={(event) => setMaximumSupportHeightMetres(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span><small>Enter 0 when no elevated wire or loop support is available.</small></label>
        <label className="field"><span>Direction-control need</span><select aria-label="Receive-antenna direction-control need" value={directionPreference} onChange={(event) => setDirectionPreference(event.target.value as ReceiveDirectionPreference)}><option value="fixed-axis">One fixed installed axis is acceptable</option><option value="four-directions">Four selectable fixed directions</option><option value="rotatable-nulls">Continuously rotatable null axis</option></select><small>This describes direction control, not gain, beamwidth, or rejection.</small></label>
        <label className="field"><span>Ground returns permitted</span><select aria-label="Receive-antenna ground-return allowance" value={groundReturnsAllowed} onChange={(event) => setGroundReturnsAllowed(Number(event.target.value) as GroundReturnAllowance)}><option value="0">No antenna ground return</option><option value="1">One shared ground return</option><option value="2">Two separate ground returns</option></select><small>Building-entry bonding remains separate from antenna-circuit ground returns.</small></label>
      </div>
      <fieldset className="receive-selector-permissions"><legend>Site and system permissions</legend>
        <label><input type="checkbox" checked={surfaceWireAllowed} onChange={(event) => setSurfaceWireAllowed(event.target.checked)} />Surface wire can be protected from traffic and maintenance</label>
        <label><input type="checkbox" checked={activeElectronicsAllowed} onChange={(event) => setActiveElectronicsAllowed(event.target.checked)} />Powered feedpoint electronics and transmit protection are acceptable</label>
        <label><input type="checkbox" checked={switchingAllowed} onChange={(event) => setSwitchingAllowed(event.target.checked)} />Weatherproof direction switching and control wiring are acceptable</label>
      </fieldset>
      {result ? <>
        <div className="receive-selector-summary" aria-live="polite"><strong>{result.fitCount} fit without identified conflicts</strong><span>{result.tradeoffCount} with a direction-control tradeoff</span><span>{result.blockedCount} blocked by an entered constraint</span></div>
        <div className="receive-candidate-grid">{result.candidates.map((candidate) => <article className={`receive-candidate receive-candidate-${candidate.status}`} key={candidate.id}>
          <div className="receive-candidate-heading"><span>{candidate.status === 'fits' ? 'Fits entered constraints' : candidate.status === 'tradeoffs' ? 'Fits with tradeoff' : 'Constraint conflict'}</span><h4>{candidate.name}</h4></div>
          <dl><div><dt>Starting clearance</dt><dd>{formatLength(candidate.minimumSpanMetres, unitSystem)} span · {formatLength(candidate.minimumSupportHeightMetres, unitSystem)} support</dd></div><div><dt>Direction context</dt><dd>{candidate.directionCapability}</dd></div><div><dt>Antenna ground returns</dt><dd>{candidate.groundReturnsRequired}</dd></div></dl>
          <ul className="receive-candidate-strengths">{candidate.strengths.map((strength) => <li key={strength}>{strength}</li>)}</ul>
          {candidate.tradeoffs.length > 0 && <ul className="receive-candidate-tradeoff-list">{candidate.tradeoffs.map((tradeoff) => <li key={tradeoff}>{tradeoff}</li>)}</ul>}
          {candidate.blockers.length > 0 && <ul className="receive-candidate-blocker-list">{candidate.blockers.map((blocker) => <li key={blocker}>{blocker}</li>)}</ul>}
          <button type="button" onClick={() => onOpenPlanner(candidate)}>{candidate.status === 'blocked' ? 'Review planner anyway' : 'Open this planner'}</button>
        </article>)}</div>
        <p className="receive-selector-limit">Results compare topology, sourced starting dimensions, and required subsystems only. They do not rank gain, signal-to-noise ratio, pattern, null depth, bandwidth, soil loss, amplifier performance, or installed reception.</p>
      </> : <p className="validation-message" role="alert">Enter valid positive site dimensions to compare receive antennas.</p>}
    </div>
  </details>;
}
