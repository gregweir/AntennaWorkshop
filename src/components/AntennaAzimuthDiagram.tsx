/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ExposureProjectSourceInput } from '../calculators/exposureProject';
import { AZIMUTH_PATTERN_LABELS, azimuthPatternSectors, pointOnBearing } from '../lib/azimuthPattern';

interface GlyphProps {
  source: ExposureProjectSourceInput;
  radius?: number;
}

export function AzimuthPatternGlyph({ source, radius = 34 }: GlyphProps) {
  const sectors = azimuthPatternSectors(source, radius);
  const direction = pointOnBearing(source.bearingDegrees, radius);
  return <g className={`azimuth-pattern azimuth-pattern-${source.patternType}`} aria-hidden="true">
    {source.patternType === 'unknown' && <circle className="azimuth-pattern-ring" r={radius} />}
    {source.patternType === 'omnidirectional' && <><circle className="azimuth-pattern-fill" r={radius} /><circle className="azimuth-pattern-ring" r={radius} /></>}
    {sectors.map((path, index) => <path className="azimuth-pattern-fill" d={path} key={index} />)}
    {(source.patternType === 'directional' || source.patternType === 'bidirectional') && <line className="azimuth-bearing-line" x1="0" y1="0" x2={direction.x} y2={direction.y} />}
    {source.patternType === 'unknown' && <text className="azimuth-pattern-question" x="0" y="5" textAnchor="middle">?</text>}
  </g>;
}

export function AntennaAzimuthDiagram({ source }: { source: ExposureProjectSourceInput }) {
  const description = source.patternType === 'unknown'
    ? 'No azimuth pattern has been entered.'
    : source.patternType === 'omnidirectional'
      ? 'An illustrative equal azimuth envelope.'
      : `An illustrative ${source.beamwidthDegrees.toFixed(0)} degree ${source.patternType} envelope with its primary maximum at ${source.bearingDegrees.toFixed(0)} degrees true.`;
  return <figure className="azimuth-preview">
    <svg viewBox="0 0 220 220" role="img" aria-labelledby={`azimuth-title-${source.id} azimuth-desc-${source.id}`}>
      <title id={`azimuth-title-${source.id}`}>{source.label} azimuth orientation</title>
      <desc id={`azimuth-desc-${source.id}`}>{description} This visualization does not reduce the exposure calculation.</desc>
      <circle className="azimuth-compass" cx="110" cy="110" r="82" />
      <line className="azimuth-axis" x1="110" y1="20" x2="110" y2="200" /><line className="azimuth-axis" x1="20" y1="110" x2="200" y2="110" />
      <text className="azimuth-cardinal" x="110" y="15" textAnchor="middle">N</text><text className="azimuth-cardinal" x="207" y="115" textAnchor="middle">E</text><text className="azimuth-cardinal" x="110" y="216" textAnchor="middle">S</text><text className="azimuth-cardinal" x="12" y="115" textAnchor="middle">W</text>
      <g transform="translate(110 110)"><AzimuthPatternGlyph source={source} radius={72} /><circle className="azimuth-centre" r="5" /></g>
    </svg>
    <figcaption><strong>{AZIMUTH_PATTERN_LABELS[source.patternType]}</strong><span>{description}</span><small>Orientation aid only. The RF screen still applies maximum entered gain toward every point.</small></figcaption>
  </figure>;
}
