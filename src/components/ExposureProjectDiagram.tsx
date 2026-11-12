/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectResult } from '../calculators/exposureProject';
import { formatLength, type UnitSystem } from '../lib/units';

interface Props {
  result: ExposureProjectResult;
  unitSystem: UnitSystem;
}

export function ExposureProjectDiagram({ result, unitSystem }: Props) {
  const worst = result.pointResults.find((point) => point.point.id === result.worstPointId) ?? result.pointResults[0];
  const sources = worst.sourceResults;
  const maximumHeight = Math.max(...sources.map(({ source }) => source.antennaCentreHeightMetres), ...result.pointResults.map(({ point }) => point.heightMetres), 2);
  const maximumDistance = Math.max(...result.pointResults.map(({ point }) => point.horizontalDistanceMetres), 1);
  const y = (metres: number) => 285 - metres / maximumHeight * 205;
  const x = (metres: number) => 105 + metres / maximumDistance * 565;

  return <figure className="antenna-figure project-diagram">
    <svg className="dipole-diagram" viewBox="0 0 760 360" role="img" aria-labelledby="project-diagram-title project-diagram-desc">
      <title id="project-diagram-title">Station exposure evaluation geometry</title>
      <desc id="project-diagram-desc">A common antenna support carries {sources.length} RF sources. {result.pointResults.length} accessible evaluation points are shown by horizontal distance and height. The greatest normalized total occurs at {worst.point.label}.</desc>
      <g className="diagram-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="315" />)}
        {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
      </g>
      <line className="project-ground" x1="55" y1="285" x2="705" y2="285" />
      <g className="project-mast"><line x1="105" y1="55" x2="105" y2="285" /><path d="M75 285 L105 245 L135 285" /></g>
      {sources.map(({ source }, index) => <g className={`project-source project-source-${index % 6}`} key={source.id}>
        <line x1="78" y1={y(source.antennaCentreHeightMetres)} x2="132" y2={y(source.antennaCentreHeightMetres)} />
        <circle cx="105" cy={y(source.antennaCentreHeightMetres)} r="7" />
        <text x="145" y={y(source.antennaCentreHeightMetres) + 4}>{source.label} · {formatLength(source.antennaCentreHeightMetres, unitSystem)}</text>
      </g>)}
      {sources.map(({ source }, index) => <line key={`path-${source.id}`} className={`project-path project-path-${index % 6}`} x1="105" y1={y(source.antennaCentreHeightMetres)} x2={x(worst.point.horizontalDistanceMetres)} y2={y(worst.point.heightMetres)} />)}
      {result.pointResults.map(({ point, aggregate }) => <g className={`project-point${point.id === result.worstPointId ? ' project-point-worst' : ''}`} key={point.id} transform={`translate(${x(point.horizontalDistanceMetres)} 0)`}>
        <circle cx="0" cy="225" r="11" /><line x1="0" y1="236" x2="0" y2="264" /><line x1="0" y1="245" x2="-15" y2="256" /><line x1="0" y1="245" x2="15" y2="256" /><line x1="0" y1="264" x2="-12" y2="285" /><line x1="0" y1="264" x2="12" y2="285" />
        <circle className="project-evaluation-marker" cx="0" cy={y(point.heightMetres)} r="5" />
        <text x="0" y="314" textAnchor="middle">{point.label}</text><text x="0" y="331" textAnchor="middle">{(aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}%</text>
      </g>)}
      <text className="project-axis-label" x="105" y="325" textAnchor="middle">COMMON SUPPORT</text>
    </svg>
    <figcaption>Site profile · Dashed paths show each calculated source contribution to the location with the greatest normalized total. Heights and horizontal distances are user inputs.</figcaption>
  </figure>;
}
