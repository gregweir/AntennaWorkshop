/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectSourceResult } from '../calculators/exposureProject';

function relationLabel(result: ExposureProjectSourceResult): string {
  const { azimuth, source } = result;
  if (azimuth.envelopeRelation === 'same-plan-position') return 'Same plan position; horizontal bearing is undefined';
  if (azimuth.envelopeRelation === 'unknown') return 'Pattern unknown; no lobe comparison';
  if (azimuth.envelopeRelation === 'all-azimuths') return 'Omnidirectional entry; all azimuths shown equally';
  const relation = azimuth.envelopeRelation === 'inside-entered-envelope' ? 'Inside' : 'Outside';
  return `${relation} entered ${source.beamwidthDegrees.toFixed(0)}° envelope`;
}

function routeLabel(result: ExposureProjectSourceResult): string {
  const { azimuth } = result;
  if (azimuth.targetBearingDegrees === null) return 'Bearing unavailable';
  const bearing = `${azimuth.targetBearingDegrees.toFixed(1)}° true`;
  if (azimuth.offAxisDegrees === null || azimuth.closestLobeBearingDegrees === null) return bearing;
  return `${bearing} · ${azimuth.offAxisDegrees.toFixed(1)}° off ${azimuth.closestLobeBearingDegrees.toFixed(0)}° lobe`;
}

export function AzimuthRouteSummary({ result }: { result: ExposureProjectSourceResult }) {
  return <span className={`azimuth-route azimuth-route-${result.azimuth.envelopeRelation}`}>
    <span>{routeLabel(result)}</span><small>{relationLabel(result)} · descriptive only</small>
  </span>;
}

export function AzimuthRouteOverview({ pointLabel, sourceResults }: { pointLabel: string; sourceResults: ExposureProjectSourceResult[] }) {
  return <section className="azimuth-route-overview" aria-labelledby="azimuth-route-heading">
    <div><p className="eyebrow">Source-to-point bearings</p><h5 id="azimuth-route-heading">Orientation toward {pointLabel}</h5><p>Plan-coordinate bearings are clockwise from true north. Envelope comparisons are descriptive and do not change the conservative exposure values.</p></div>
    <div className="azimuth-route-grid">{sourceResults.map((result) => <article className={`azimuth-route-card azimuth-route-${result.azimuth.envelopeRelation}`} key={result.source.id}>
      <small>{result.source.label}</small><strong>{routeLabel(result)}</strong><span>{relationLabel(result)}</span>
    </article>)}</div>
  </section>;
}
