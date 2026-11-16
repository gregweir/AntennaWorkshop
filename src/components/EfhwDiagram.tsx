/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { calculateEfhw } from '../calculators/designs';
import { formatLength, type UnitSystem } from '../lib/units';
import { DiagramDefinitions, DiagramGrid, SvgDimension } from './diagram/DiagramPrimitives';

interface Props {
  result: ReturnType<typeof calculateEfhw>;
  transformerRatio: number;
  unitSystem: UnitSystem;
}

export function EfhwDiagram({ result, transformerRatio, unitSystem }: Props) {
  const cutLengthLabel = formatLength(result.radiatorMetres, unitSystem);
  const designLengthLabel = formatLength(result.designRadiatorMetres, unitSystem);
  const horizontalLabel = formatLength(result.horizontalSectionMetres, unitSystem);
  const verticalLabel = formatLength(result.verticalSectionMetres, unitSystem);
  const feed = result.deployment === 'horizontal'
    ? { x: 145, y: 135 }
    : result.deployment === 'inverted-l'
      ? { x: 145, y: 255 }
      : result.sloperFeedPosition === 'lower'
        ? { x: 145, y: 235 }
        : { x: 145, y: 75 };
  const far = result.deployment === 'horizontal'
    ? { x: 685, y: 135 }
    : result.deployment === 'inverted-l'
      ? { x: 685, y: 75 }
      : result.sloperFeedPosition === 'lower'
        ? { x: 685, y: 75 }
        : { x: 685, y: 235 };
  const bend = { x: 145, y: 75 };
  return <figure className="antenna-figure">
    <svg className="dipole-diagram" viewBox="0 0 760 330" role="img" aria-labelledby="efhw-title efhw-desc">
      <title id="efhw-title">Dimensioned end-fed half-wave {result.deploymentLabel.toLowerCase()} deployment</title>
      <desc id="efhw-desc">A {designLengthLabel} finished half-wave target is arranged as a {result.deploymentLabel.toLowerCase()} from a {transformerRatio}:1 impedance transformer. Cut {cutLengthLabel} including adjustment reserve. A separate RF return strategy and common-mode control are required.</desc>
      <DiagramDefinitions prefix="efhw" />
      <DiagramGrid />
      <line className="support-line" x1="35" y1="285" x2="725" y2="285" />
      <text x="45" y="307">local surface datum</text>
      <g className="support-line">
        <line x1={feed.x} y1={feed.y + 12} x2={feed.x} y2="285" />
        <line x1={far.x} y1={far.y + 12} x2={far.x} y2="285" />
      </g>
      <g className="antenna-wire">
        {result.deployment === 'inverted-l' ? <path d={`M${feed.x} ${feed.y} V${bend.y} H${far.x}`} fill="none" /> : <line x1={feed.x} y1={feed.y} x2={far.x} y2={far.y} />}
        <circle cx={far.x} cy={far.y} r="6" />
      </g>
      <g className="transformer-box">
        <rect x={feed.x - 74} y={feed.y - 34} width="74" height="68" rx="10" />
        <path d={`M${feed.x - 55} ${feed.y - 14} C${feed.x - 39} ${feed.y - 14} ${feed.x - 39} ${feed.y + 14} ${feed.x - 23} ${feed.y + 14} M${feed.x - 55} ${feed.y + 14} C${feed.x - 39} ${feed.y + 14} ${feed.x - 39} ${feed.y - 14} ${feed.x - 23} ${feed.y - 14}`} />
        <text x={feed.x - 37} y={feed.y + 23} textAnchor="middle">{transformerRatio}:1</text>
      </g>
      <g className="coax-path">
        <path d={`M${feed.x - 74} ${feed.y} H35`} />
        <text x="52" y={feed.y - 12}>coax</text>
      </g>
      {result.deployment === 'horizontal' && <SvgDimension prefix="efhw-horizontal" x1={feed.x} y1={75} x2={far.x} y2={75} label={`Finished target · ${designLengthLabel}`} labelX={415} labelY={55} />}
      {result.deployment === 'sloper' && <><text x="415" y="43" textAnchor="middle">Finished wire · {designLengthLabel} · {result.sloperAngleDegrees}°</text><SvgDimension prefix="efhw-span" x1={feed.x} y1={275} x2={far.x} y2={275} label={`Horizontal span · ${formatLength(result.horizontalSpanMetres, unitSystem)}`} labelX={415} labelY={265} /></>}
      {result.deployment === 'inverted-l' && <><SvgDimension prefix="efhw-vertical" x1={200} y1={feed.y} x2={200} y2={bend.y} label={`Vertical · ${verticalLabel}`} labelX={248} labelY={174} /><SvgDimension prefix="efhw-horizontal" x1={bend.x} y1={40} x2={far.x} y2={40} label={`Horizontal · ${horizontalLabel}`} labelX={415} labelY={25} /></>}
      <g className="hazard-labels">
        <text x={far.x} y={far.y + (far.y < 120 ? 28 : -18)} textAnchor="middle">HIGH RF VOLTAGE END</text>
        <text x="380" y="315" textAnchor="middle">Cut {cutLengthLabel} · install to {designLengthLabel} target · measure before trimming</text>
      </g>
    </svg>
    <figcaption>{result.deploymentLabel} support plan · Heights are relative to the entered local datum. Transformer design, RF return, choking, sag, structure, clearances, match, and pattern require separate verification.</figcaption>
  </figure>;
}
