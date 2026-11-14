/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useState } from 'react';
import { ANTENNA_COMPARISON, type AntennaComparisonProfile } from '../lib/antennaDesignComparison';
import { ANTENNA_DESIGNS, type AntennaType } from '../lib/antennaDesignCatalog';

const allTypes = Object.keys(ANTENNA_DESIGNS) as AntennaType[];
const preferredCompanions: AntennaType[] = ['fan-dipole', 'g5rv', 'dipole', 'doublet'];
const comparisonRows: Array<{ key: keyof AntennaComparisonProfile; label: string }> = [
  { key: 'site', label: 'Space and supports' },
  { key: 'bandIntent', label: 'Band intent' },
  { key: 'feedSystem', label: 'Feed and tuning system' },
  { key: 'direction', label: 'Direction context' },
  { key: 'complexity', label: 'Build complexity' },
  { key: 'verify', label: 'Must verify after installation' }
];

function comparisonSet(activeType: AntennaType, current: AntennaType[] = []) {
  const ordered = [activeType, ...current, ...preferredCompanions, ...allTypes];
  return ordered.filter((type, index) => ordered.indexOf(type) === index).slice(0, 3);
}

interface Props {
  activeType: AntennaType;
  onOpenPlanner: (type: AntennaType) => void;
}

export function AntennaDesignComparison({ activeType, onOpenPlanner }: Props) {
  const [types, setTypes] = useState<AntennaType[]>(() => comparisonSet(activeType));
  useEffect(() => setTypes((current) => comparisonSet(activeType, current)), [activeType]);
  const selections = useMemo(() => types.map((type) => ({ type, design: ANTENNA_DESIGNS[type], profile: ANTENNA_COMPARISON[type] })), [types]);
  const replaceType = (index: number, type: AntennaType) => setTypes((current) => {
    const next = [...current];
    const duplicateIndex = next.indexOf(type);
    if (duplicateIndex >= 0 && duplicateIndex !== index) [next[index], next[duplicateIndex]] = [next[duplicateIndex], next[index]];
    else next[index] = type;
    return next;
  });

  return <details className="antenna-comparison">
    <summary><span><strong>Compare antenna designs</strong><small>Space, bands, feed system, direction, complexity, and field verification</small></span></summary>
    <div className="antenna-comparison-body">
      <div className="comparison-intro"><div><p className="eyebrow">Decision aid</p><h3>Compare construction systems—not advertised performance</h3></div><p>Choose three planners. These distinctions help identify practical fit; they do not rank gain, efficiency, signal strength, or suitability at your site.</p></div>
      <div className="comparison-selectors">
        {selections.map(({ type }, index) => <label key={index}><span>Design {index + 1}</span><select aria-label={`Comparison design ${index + 1}`} value={type} onChange={(event) => replaceType(index, event.target.value as AntennaType)}>{allTypes.map((candidate) => <option key={candidate} value={candidate}>{ANTENNA_DESIGNS[candidate].name}</option>)}</select></label>)}
      </div>
      <div className="comparison-card-grid">
        {selections.map(({ type, design, profile }) => <article className={type === activeType ? 'comparison-card comparison-card-current' : 'comparison-card'} key={type}>
          <header><div><span>{design.category}{design.receiveOnly ? ' · receive only' : ''}</span><h4>{design.short}</h4><p>{design.description}</p></div>{type === activeType && <em>Current planner</em>}</header>
          <dl>{comparisonRows.map(({ key, label }) => <div key={key}><dt>{label}</dt><dd>{profile[key]}</dd></div>)}</dl>
          <button type="button" disabled={type === activeType} onClick={() => onOpenPlanner(type)}>{type === activeType ? 'Planner open' : `Open ${design.short} planner`}</button>
        </article>)}
      </div>
      <p className="comparison-limit">Antenna height, ground, conductor details, nearby objects, feedline routing, matching components, construction tolerances, and local noise can change the finished result. Use the selected planner’s sources, limitations, and measurement steps before building.</p>
    </div>
  </details>;
}
