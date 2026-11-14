/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateSmallTransmittingLoop } from '../calculators/smallTransmittingLoop';

type Result = ReturnType<typeof calculateSmallTransmittingLoop>;

function resistance(value: number) {
  return value < 1 ? `${(value * 1_000).toFixed(1)} mΩ` : `${value.toFixed(2)} Ω`;
}

function voltage(value: number) {
  return value >= 1_000 ? `${(value / 1_000).toFixed(2)} kV` : `${value.toFixed(0)} V`;
}

export function SmallLoopAnalysisPanel({ result }: { result: Result }) {
  const radiationShare = Math.max(0, Math.min(100, result.estimatedRadiationEfficiencyPercent));
  const materialName = result.conductorMaterial === 'copper' ? 'Copper' : 'Aluminium';
  const applicability = result.isWithinUniformCurrentPreference ? 'Stronger small-loop fit' : 'Use extra caution';

  return <section className="small-loop-analysis" aria-labelledby="small-loop-analysis-title">
    <div className="small-loop-analysis-heading">
      <div>
        <p className="eyebrow">Idealized centre-frequency analysis</p>
        <h3 id="small-loop-analysis-title">Where accepted power may go</h3>
      </div>
      <span className={result.isWithinUniformCurrentPreference ? 'analysis-fit analysis-fit-good' : 'analysis-fit analysis-fit-caution'}>{applicability}</span>
    </div>

    <div className="small-loop-loss-graphic" role="img" aria-label={`Estimated power split: ${radiationShare.toFixed(1)} percent radiated and ${(100 - radiationShare).toFixed(1)} percent lost at ${result.centreFrequencyMHz.toFixed(3)} megahertz.`}>
      <div className="small-loop-loss-bar">
        <span className="small-loop-radiated" style={{ width: `${radiationShare}%` }} />
        <span className="small-loop-dissipated" style={{ width: `${100 - radiationShare}%` }} />
      </div>
      <div className="small-loop-loss-legend">
        <span><i className="small-loop-radiated" />Radiated estimate · {radiationShare.toFixed(1)}%</span>
        <span><i className="small-loop-dissipated" />Loss estimate · {(100 - radiationShare).toFixed(1)}%</span>
      </div>
    </div>

    <dl className="small-loop-analysis-metrics">
      <div><dt>Radiation resistance</dt><dd>{resistance(result.radiationResistanceOhms)}</dd></div>
      <div><dt>Ideal {materialName.toLowerCase()} loss</dt><dd>{resistance(result.idealConductorLossOhms)}</dd></div>
      <div><dt>Entered extra loss</dt><dd>{resistance(result.additionalSeriesLossOhms)}</dd></div>
      <div><dt>Unloaded Q estimate</dt><dd>{result.estimatedUnloadedQ.toFixed(0)}</dd></div>
      <div><dt>3 dB resonator bandwidth</dt><dd>{result.estimatedThreeDbBandwidthKilohertz.toFixed(1)} kHz</dd></div>
      <div><dt>Loop current</dt><dd>{result.estimatedLoopCurrentRmsAmperes.toFixed(1)} A RMS</dd></div>
      <div><dt>Capacitor voltage</dt><dd>{voltage(result.estimatedCapacitorVoltageRmsVolts)} RMS</dd></div>
      <div><dt>Capacitor voltage peak</dt><dd>{voltage(result.estimatedCapacitorVoltagePeakVolts)}</dd></div>
    </dl>

    <div className="small-loop-analysis-notes">
      <p><strong>Analysis point:</strong> {result.centreFrequencyMHz.toFixed(3)} MHz · circumference {result.circumferenceWavelengthRatioAtCentre.toFixed(3)} λ · {materialName.toLowerCase()} skin depth {(result.skinDepthMetres * 1e6).toFixed(1)} µm.</p>
      <p>The conductor figure assumes a smooth round surface with wall thickness well beyond the skin depth. The entered extra loss is the only allowance for the capacitor, joints, connections, surface condition, proximity effects, and supports. Q and 3 dB bandwidth describe the idealized unloaded series resonator, not measured SWR bandwidth.</p>
      <p><strong>Power reference:</strong> {result.acceptedPowerWatts.toFixed(1)} W delivered to the resonant loop after matching. The current and voltage values are stress estimates, not component ratings or a safe-power declaration.</p>
    </div>
  </section>;
}
