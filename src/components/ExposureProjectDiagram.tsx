/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectResult } from '../calculators/exposureProject';
import { formatCoordinate, formatLength, type UnitSystem } from '../lib/units';

interface Props {
  result: ExposureProjectResult;
  unitSystem: UnitSystem;
}

export function ExposureProjectDiagram({ result, unitSystem }: Props) {
  const worst = result.pointResults.find((point) => point.point.id === result.worstPointId) ?? result.pointResults[0];
  const sources = result.pointResults[0].sourceResults.map(({ source }) => source);
  const eastValues = [...sources.map((source) => source.eastOffsetMetres), ...result.pointResults.map(({ point }) => point.eastOffsetMetres)];
  const northValues = [...sources.map((source) => source.northOffsetMetres), ...result.pointResults.map(({ point }) => point.northOffsetMetres)];
  const minimumEast = Math.min(...eastValues);
  const maximumEast = Math.max(...eastValues);
  const minimumNorth = Math.min(...northValues);
  const maximumNorth = Math.max(...northValues);
  const eastSpan = Math.max(maximumEast - minimumEast, 1);
  const northSpan = Math.max(maximumNorth - minimumNorth, 1);
  const planScale = Math.min(390 / eastSpan, 235 / northSpan);
  const middleEast = (minimumEast + maximumEast) / 2;
  const middleNorth = (minimumNorth + maximumNorth) / 2;
  const planX = (east: number) => 250 + (east - middleEast) * planScale;
  const planY = (north: number) => 182.5 - (north - middleNorth) * planScale;

  const maximumHeight = Math.max(...sources.map((source) => source.antennaCentreHeightMetres), worst.point.heightMetres, 2);
  const maximumHorizontalSeparation = Math.max(...worst.sourceResults.map((source) => source.horizontalSeparationMetres), 1);
  const elevationY = (metres: number) => 285 - metres / maximumHeight * 210;
  const elevationX = (metres: number) => 430 - metres / maximumHorizontalSeparation * 340;

  return <figure className="antenna-figure project-diagram">
    <div className="project-diagram-views">
      <svg className="project-plan-diagram" viewBox="0 0 500 360" role="img" aria-labelledby="project-plan-title project-plan-desc">
        <title id="project-plan-title">Station site plan</title>
        <desc id="project-plan-desc">Plan view of {sources.length} independently positioned transmitting antennas and {result.pointResults.length} evaluation points. Dashed paths lead to {worst.point.label}, the location with the greatest normalized total.</desc>
        <g className="diagram-grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <line key={`v-${index}`} x1={50 + index * 50} y1="45" x2={50 + index * 50} y2="310" />)}
          {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="35" y1={55 + index * 50} x2="465" y2={55 + index * 50} />)}
        </g>
        <text className="project-view-title" x="35" y="28">PLAN · EAST / NORTH</text>
        <g className="project-north-arrow"><line x1="475" y1="75" x2="475" y2="42" /><path d="M468 51 L475 39 L482 51" /><text x="475" y="30" textAnchor="middle">N</text></g>
        {worst.sourceResults.map(({ source }, index) => <line key={`plan-path-${source.id}`} className={`project-path project-path-${index % 6}`} x1={planX(source.eastOffsetMetres)} y1={planY(source.northOffsetMetres)} x2={planX(worst.point.eastOffsetMetres)} y2={planY(worst.point.northOffsetMetres)} />)}
        {sources.map((source, index) => <g className={`project-source project-source-${index % 6}`} key={source.id} transform={`translate(${planX(source.eastOffsetMetres)} ${planY(source.northOffsetMetres)})`}>
          <line x1="-9" y1="0" x2="9" y2="0" /><line x1="0" y1="-9" x2="0" y2="9" /><circle cx="0" cy="0" r="5" />
          <text x="10" y="-10">{source.label}</text><text x="10" y="3">E {formatCoordinate(source.eastOffsetMetres, unitSystem)} · N {formatCoordinate(source.northOffsetMetres, unitSystem)}</text>
        </g>)}
        {result.pointResults.map(({ point, aggregate }) => <g className={`project-point${point.id === result.worstPointId ? ' project-point-worst' : ''}`} key={point.id} transform={`translate(${planX(point.eastOffsetMetres)} ${planY(point.northOffsetMetres)})`}>
          <circle className="project-evaluation-marker" cx="0" cy="0" r="7" /><circle cx="0" cy="0" r="12" />
          <text x="0" y="24" textAnchor="middle">{point.label}</text><text x="0" y="37" textAnchor="middle">{(aggregate.totalFractionOfReferenceLevel * 100).toFixed(2)}%</text>
        </g>)}
      </svg>

      <svg className="project-elevation-diagram" viewBox="0 0 500 360" role="img" aria-labelledby="project-elevation-title project-elevation-desc">
        <title id="project-elevation-title">Elevation section toward the greatest modelled location</title>
        <desc id="project-elevation-desc">A collapsed radial elevation section showing every antenna height and its horizontal plan separation from {worst.point.label}.</desc>
        <g className="diagram-grid" aria-hidden="true">
          {Array.from({ length: 9 }, (_, index) => <line key={`v-${index}`} x1={50 + index * 50} y1="45" x2={50 + index * 50} y2="310" />)}
          {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="35" y1={55 + index * 50} x2="465" y2={55 + index * 50} />)}
        </g>
        <text className="project-view-title" x="35" y="28">ELEVATION · TOWARD GREATEST TOTAL</text>
        <line className="project-ground" x1="45" y1="285" x2="460" y2="285" />
        {worst.sourceResults.map(({ source, horizontalSeparationMetres }, index) => <g className={`project-source project-source-${index % 6}`} key={source.id}>
          <line className="project-mast-line" x1={elevationX(horizontalSeparationMetres)} y1={elevationY(source.antennaCentreHeightMetres)} x2={elevationX(horizontalSeparationMetres)} y2="285" />
          <line x1={elevationX(horizontalSeparationMetres) - 12} y1={elevationY(source.antennaCentreHeightMetres)} x2={elevationX(horizontalSeparationMetres) + 12} y2={elevationY(source.antennaCentreHeightMetres)} />
          <circle cx={elevationX(horizontalSeparationMetres)} cy={elevationY(source.antennaCentreHeightMetres)} r="5" />
          <line className={`project-path project-path-${index % 6}`} x1={elevationX(horizontalSeparationMetres)} y1={elevationY(source.antennaCentreHeightMetres)} x2="430" y2={elevationY(worst.point.heightMetres)} />
          <text x={elevationX(horizontalSeparationMetres)} y={elevationY(source.antennaCentreHeightMetres) - 12} textAnchor="middle">{source.label}</text>
          <text x={elevationX(horizontalSeparationMetres)} y="315" textAnchor="middle">{formatLength(horizontalSeparationMetres, unitSystem)} plan</text>
        </g>)}
        <g className="project-point project-point-worst" transform="translate(430 0)">
          <circle cx="0" cy="225" r="11" /><line x1="0" y1="236" x2="0" y2="264" /><line x1="0" y1="245" x2="-15" y2="256" /><line x1="0" y1="245" x2="15" y2="256" /><line x1="0" y1="264" x2="-12" y2="285" /><line x1="0" y1="264" x2="12" y2="285" />
          <circle className="project-evaluation-marker" cx="0" cy={elevationY(worst.point.heightMetres)} r="5" />
          <text x="0" y="307" textAnchor="middle">{worst.point.label}</text><text x="0" y="321" textAnchor="middle">{formatLength(worst.point.heightMetres, unitSystem)} high</text>
        </g>
      </svg>
    </div>
    <figcaption>Site geometry · Plan view preserves entered east/north coordinates. The elevation view collapses each source onto its horizontal path toward the location with the greatest normalized total; dashed lines are calculated source-to-point paths.</figcaption>
  </figure>;
}
