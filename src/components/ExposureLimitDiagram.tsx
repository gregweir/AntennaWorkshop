/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureEnvironment, ExposureReferenceLevel } from '../regulations/exposureLimits';

interface Props {
  levels: Record<ExposureEnvironment, ExposureReferenceLevel>;
  selected: ExposureEnvironment;
}

export function ExposureLimitDiagram({ levels, selected }: Props) {
  const maximum = Math.max(levels.controlled.powerDensityWattsPerSquareMetre, levels.uncontrolled.powerDensityWattsPerSquareMetre);
  const width = (value: number) => Math.max(4, value / maximum * 500);
  return <figure className="antenna-figure exposure-limit-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="limit-title limit-desc">
      <title id="limit-title">RF exposure power-density reference levels</title>
      <desc id="limit-desc">Comparison of uncontrolled and controlled power-density reference levels at {levels.controlled.frequencyMHz} megahertz. The selected environment is {selected}.</desc>
      <g className="diagram-grid" aria-hidden="true">
        {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="300" />)}
        {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
      </g>
      <text className="limit-frequency" x="380" y="52" textAnchor="middle">{levels.controlled.frequencyMHz.toFixed(3)} MHz · official reference levels</text>
      {(['uncontrolled', 'controlled'] as ExposureEnvironment[]).map((environment, index) => {
        const level = levels[environment];
        const y = 105 + index * 100;
        return <g key={environment} className={`limit-bar ${selected === environment ? 'limit-bar-selected' : ''}`}>
          <text x="170" y={y + 28} textAnchor="end">{environment}</text>
          <rect x="190" y={y} width={width(level.powerDensityWattsPerSquareMetre)} height="42" rx="8" />
          <text x="205" y={y + 28}>{level.powerDensityWattsPerSquareMetre.toFixed(3)} W/m²</text>
          <text x="705" y={y + 28} textAnchor="end">{formatMinutes(level.averagingMinutes)}</text>
        </g>;
      })}
      <text className="limit-caption" x="380" y="285" textAnchor="middle">Bar lengths compare the two limits at this frequency; they do not show predicted exposure.</text>
    </svg>
    <figcaption>Regulatory reference comparison · No station fields, distances, or compliance status are calculated.</figcaption>
  </figure>;
}

function formatMinutes(minutes: number) {
  return minutes >= 1 ? `${minutes.toFixed(minutes < 10 ? 2 : 0)} min averaging` : `${(minutes * 60).toFixed(1)} s averaging`;
}
