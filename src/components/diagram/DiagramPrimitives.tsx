/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { ReactNode } from 'react';

export function DiagramDefinitions({ prefix }: { prefix: string }) {
  return (
    <defs>
      <marker id={`${prefix}-arrow-start`} markerWidth="8" markerHeight="8" refX="2" refY="4" orient="auto">
        <path d="M8,0 L0,4 L8,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </marker>
      <marker id={`${prefix}-arrow-end`} markerWidth="8" markerHeight="8" refX="6" refY="4" orient="auto">
        <path d="M0,0 L8,4 L0,8" fill="none" stroke="currentColor" strokeWidth="1.5" />
      </marker>
    </defs>
  );
}

export function DiagramGrid() {
  return (
    <g className="diagram-grid" aria-hidden="true">
      {Array.from({ length: 15 }, (_, index) => <line key={`v-${index}`} x1={30 + index * 50} y1="30" x2={30 + index * 50} y2="300" />)}
      {Array.from({ length: 6 }, (_, index) => <line key={`h-${index}`} x1="30" y1={50 + index * 50} x2="730" y2={50 + index * 50} />)}
    </g>
  );
}

interface DimensionProps {
  prefix: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label: ReactNode;
  labelX: number;
  labelY: number;
}

export function SvgDimension({ prefix, x1, y1, x2, y2, label, labelX, labelY }: DimensionProps) {
  return (
    <g className="dimension-lines">
      <line x1={x1} y1={y1} x2={x2} y2={y2} markerStart={`url(#${prefix}-arrow-start)`} markerEnd={`url(#${prefix}-arrow-end)`} />
      <text x={labelX} y={labelY} textAnchor="middle">{label}</text>
    </g>
  );
}

export function Feedpoint({ x, y, label = 'feedpoint', labelY = y + 72 }: { x: number; y: number; label?: string; labelY?: number }) {
  return (
    <g className="feedpoint">
      <rect x={x - 21} y={y - 23} width="42" height="46" rx="8" />
      <circle cx={x - 10} cy={y} r="3" />
      <circle cx={x + 10} cy={y} r="3" />
      <path d={`M${x} ${y + 23} L${x} ${y + 53}`} />
      <text x={x} y={labelY} textAnchor="middle">{label}</text>
    </g>
  );
}
