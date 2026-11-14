/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculatePhasedWireCollinear } from '../calculators/phasedWireCollinear';
import { formatLength, type UnitSystem } from '../lib/units';

type Result = ReturnType<typeof calculatePhasedWireCollinear>;

export function PhasedWireCollinearPanel({ result, unitSystem }: { result: Result; unitSystem: UnitSystem }) {
  const budgetUsePercent = Math.min(100, result.junctionPhaseReversalErrorDegrees / result.maximumJunctionPhaseErrorDegrees * 100);
  const status = result.toleranceWithinPhaseBudget ? 'Within selected phase budget' : 'Revise the stub tolerance';

  return <section className="collinear-commissioning" aria-labelledby="collinear-commissioning-title">
    <div className="collinear-commissioning-heading">
      <div><p className="eyebrow">Finished-stub tolerance</p><h3 id="collinear-commissioning-title">Stub phase commissioning</h3></div>
      <span className={result.toleranceWithinPhaseBudget ? 'analysis-fit analysis-fit-good' : 'analysis-fit analysis-fit-caution'}>{status}</span>
    </div>

    <div className="collinear-phase-graphic" role="img" aria-label={`Possible phase reversal error is ${result.junctionPhaseReversalErrorDegrees.toFixed(2)} degrees per junction against a selected budget of ${result.maximumJunctionPhaseErrorDegrees.toFixed(1)} degrees.`}>
      <div className="collinear-phase-scale"><span style={{ width: `${budgetUsePercent}%` }} /></div>
      <div className="collinear-phase-labels"><span>0°</span><strong>{result.junctionPhaseReversalErrorDegrees.toFixed(2)}° possible</strong><span>{result.maximumJunctionPhaseErrorDegrees.toFixed(1)}° budget</span></div>
    </div>

    <dl className="collinear-phase-metrics">
      <div><dt>Entered finished-length tolerance</dt><dd>±{result.phasingStubLengthToleranceMillimetres.toFixed(1)} mm</dd></div>
      <div><dt>Maximum length error for budget</dt><dd>±{(result.maximumStubLengthErrorMetres * 1_000).toFixed(1)} mm</dd></div>
      <div><dt>Possible error per junction</dt><dd>±{result.junctionPhaseReversalErrorDegrees.toFixed(2)}°</dd></div>
      <div><dt>Systematic end-to-end case</dt><dd>±{result.systematicEndToEndPhaseErrorDegrees.toFixed(2)}°</dd></div>
    </dl>

    <div className="collinear-schedule-grid">
      <div className="collinear-schedule-card">
        <h4>Radiator section schedule</h4>
        <div className="table-scroll"><table><thead><tr><th>Section</th><th>Start</th><th>End</th><th>Cut</th><th>Finished target</th></tr></thead><tbody>{result.radiatorSchedule.map((row) => <tr key={row.section}><th scope="row">R{row.section}</th><td>{formatLength(row.startMetres, unitSystem)}</td><td>{formatLength(row.endMetres, unitSystem)}</td><td>{formatLength(row.cutLengthMetres, unitSystem)}</td><td>{formatLength(row.finishedTargetMetres, unitSystem)}</td></tr>)}</tbody></table></div>
      </div>
      <div className="collinear-schedule-card">
        <h4>Phase-reversing stub schedule</h4>
        <div className="table-scroll"><table><thead><tr><th>Stub</th><th>After</th><th>Position</th><th>One-way cut</th><th>Finished target</th></tr></thead><tbody>{result.stubSchedule.map((row) => <tr key={row.stub}><th scope="row">S{row.stub}</th><td>R{row.junctionAfterSection}</td><td>{formatLength(row.positionMetres, unitSystem)}</td><td>{formatLength(row.cutOneWayLengthMetres, unitSystem)}</td><td>{formatLength(row.finishedOneWayTargetMetres, unitSystem)}</td></tr>)}</tbody></table></div>
      </div>
    </div>

    <p className="collinear-commissioning-note">The phase figures use transmission-line electrical length and assume every finished stub has the entered magnitude of length error. The end-to-end value is a same-direction systematic case, not a predicted antenna-current phase. Measure representative stubs with the actual line, spacing, bends, supports, and environment; then verify the complete array.</p>
  </section>;
}
