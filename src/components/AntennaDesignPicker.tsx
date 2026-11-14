/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { ANTENNA_CATEGORIES, ANTENNA_DESIGNS, filterAntennaDesigns, getGuidedDesigns, type AntennaDesignCategory, type AntennaType, type GuidedGoal, type GuidedIntent } from '../lib/antennaDesignCatalog';

type PickerMode = 'workbench' | 'guided';

const guidedGoals: Record<GuidedIntent, Array<{ id: GuidedGoal; label: string; description: string }>> = {
  transmit: [
    { id: 'simple-wire', label: 'Straightforward wire', description: 'Start with familiar wire geometry and ordinary supports.' },
    { id: 'multiband', label: 'Several bands', description: 'Compare designs intended to serve more than one band.' },
    { id: 'limited-space', label: 'Limited space', description: 'Consider shortened or physically compact starting points.' },
    { id: 'vertical-footprint', label: 'Vertical footprint', description: 'Use height instead of a long horizontal span.' },
    { id: 'directional', label: 'Directional coverage', description: 'Explore arrays and beams with an intended forward direction.' },
    { id: 'broadband', label: 'Broad frequency range', description: 'Explore geometry intended for a continuous or wide range.' },
    { id: 'all', label: 'Show every transmit design', description: 'Browse all transmit-capable construction planners.' }
  ],
  receive: [
    { id: 'compact-receive', label: 'Compact receiving site', description: 'Compare elevated terminated loops and a small active loop.' },
    { id: 'long-route', label: 'Long low route available', description: 'Plan a Beverage route where the site permits it.' },
    { id: 'surface-installation', label: 'No vertical support', description: 'Consider a protected Loop-on-Ground installation.' },
    { id: 'direction-control', label: 'Control noise direction', description: 'Compare fixed, switched, and rotatable direction contexts.' },
    { id: 'all', label: 'Show every receive design', description: 'Browse all receive-only construction planners.' }
  ]
};

interface Props {
  activeType: AntennaType;
  onSelect: (type: AntennaType) => void;
}

function DesignButtons({ types, activeType, onSelect }: { types: AntennaType[]; activeType: AntennaType; onSelect: (type: AntennaType) => void }) {
  return <div className="design-picker" aria-label="Antenna design">{types.map((type) => <button key={type} type="button" aria-pressed={activeType === type} onClick={() => onSelect(type)}>
    <span>{ANTENNA_DESIGNS[type].short}</span><small>{ANTENNA_DESIGNS[type].description}</small>
  </button>)}</div>;
}

export function AntennaDesignPicker({ activeType, onSelect }: Props) {
  const pickerHeadingRef = useRef<HTMLHeadingElement>(null);
  const previousActiveType = useRef(activeType);
  const [expanded, setExpanded] = useState(true);
  const [mode, setMode] = useState<PickerMode>('workbench');
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState<'all' | AntennaDesignCategory>('all');
  const [guidedStep, setGuidedStep] = useState<1 | 2 | 3>(1);
  const [guidedIntent, setGuidedIntent] = useState<GuidedIntent>('transmit');
  const [guidedGoal, setGuidedGoal] = useState<GuidedGoal>('simple-wire');
  useEffect(() => {
    if (previousActiveType.current !== activeType) setExpanded(false);
    previousActiveType.current = activeType;
  }, [activeType]);
  const workbenchTypes = useMemo(() => filterAntennaDesigns(searchText, category), [category, searchText]);
  const guidedTypes = useMemo(() => getGuidedDesigns(guidedIntent, guidedGoal), [guidedGoal, guidedIntent]);
  const beginIntent = (intent: GuidedIntent) => {
    setGuidedIntent(intent);
    setGuidedGoal(intent === 'receive' ? 'compact-receive' : 'simple-wire');
    setGuidedStep(2);
  };
  const chooseDesign = (type: AntennaType) => {
    onSelect(type);
    setExpanded(false);
  };

  if (!expanded) {
    const activeDesign = ANTENNA_DESIGNS[activeType];
    return <section className="antenna-picker-shell antenna-picker-collapsed" aria-labelledby="selected-antenna-heading">
      <div><p className="eyebrow">Selected design</p><h3 id="selected-antenna-heading">Current: {activeDesign.short}</h3><p>{activeDesign.description}</p></div>
      <button type="button" onClick={() => {
        setExpanded(true);
        globalThis.requestAnimationFrame?.(() => pickerHeadingRef.current?.focus());
      }}>Change design</button>
    </section>;
  }

  return <section className="antenna-picker-shell" aria-labelledby="antenna-picker-heading">
    <div className="antenna-picker-toolbar">
      <div><p className="eyebrow">Choose a design</p><h3 id="antenna-picker-heading" ref={pickerHeadingRef} tabIndex={-1}>Guided choice or direct workbench access</h3></div>
      <div className="picker-mode-tabs" role="tablist" aria-label="Antenna picker mode">
        <button type="button" role="tab" aria-selected={mode === 'guided'} onClick={() => setMode('guided')}><span>Guided</span><small>Help me narrow it down</small></button>
        <button type="button" role="tab" aria-selected={mode === 'workbench'} onClick={() => setMode('workbench')}><span>Workbench</span><small>Search every design</small></button>
      </div>
    </div>

    {mode === 'workbench' ? <div role="tabpanel" className="picker-workbench-panel">
      <div className="design-search-row"><label><span>Search designs</span><input type="search" value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Try multiband, shortened, loop…" /></label><span aria-live="polite">{workbenchTypes.length} of {Object.keys(ANTENNA_DESIGNS).length} designs</span></div>
      <div className="design-category-filter" aria-label="Design category">{ANTENNA_CATEGORIES.map((candidate) => <button key={candidate.id} type="button" aria-pressed={category === candidate.id} onClick={() => setCategory(candidate.id)}>{candidate.label}</button>)}</div>
      {workbenchTypes.length > 0 ? <DesignButtons types={workbenchTypes} activeType={activeType} onSelect={chooseDesign} /> : <div className="design-empty-state"><strong>No matching designs</strong><p>Clear the search or choose another category. Searching changes only the picker, not the current calculation.</p><button type="button" onClick={() => { setSearchText(''); setCategory('all'); }}>Show all designs</button></div>}
    </div> : <div role="tabpanel" className="picker-guided-panel">
      <div className="guided-progress" aria-label={`Guided antenna choice step ${guidedStep} of 3`}><span className={guidedStep >= 1 ? 'is-complete' : ''}>1 · Purpose</span><span className={guidedStep >= 2 ? 'is-complete' : ''}>2 · Site or goal</span><span className={guidedStep >= 3 ? 'is-complete' : ''}>3 · Designs</span></div>
      {guidedStep === 1 && <div className="guided-question"><div><p className="eyebrow">Step 1 of 3</p><h4>What will this antenna be used for?</h4><p>Receive-only antennas have different priorities and must never be connected to a transmitter.</p></div><div className="guided-choice-grid guided-intent-grid"><button type="button" onClick={() => beginIntent('transmit')}><strong>Transmitting and receiving</strong><span>Resonant, multiband, broadband, vertical, loop, and directional construction choices.</span></button><button type="button" onClick={() => beginIntent('receive')}><strong>Dedicated receiving</strong><span>Low-noise-site, direction-control, compact, long-route, and surface-loop choices.</span></button></div></div>}
      {guidedStep === 2 && <div className="guided-question"><div><p className="eyebrow">Step 2 of 3</p><h4>Which site or operating goal matters most?</h4><p>This narrows the catalog without claiming that one antenna will outperform another at your location.</p></div><div className="guided-choice-grid">{guidedGoals[guidedIntent].map((goal) => <button key={goal.id} type="button" onClick={() => { setGuidedGoal(goal.id); setGuidedStep(3); }}><strong>{goal.label}</strong><span>{goal.description}</span></button>)}</div><button className="picker-back-button" type="button" onClick={() => setGuidedStep(1)}>Back to purpose</button></div>}
      {guidedStep === 3 && <div className="guided-question guided-results"><div><p className="eyebrow">Step 3 of 3</p><h4>{guidedTypes.length} construction {guidedTypes.length === 1 ? 'planner' : 'planners'} to review</h4><p>Choose a planner to inspect its dimensions, assumptions, diagram, help, and limitations. These are relevant options, not performance rankings.</p></div><DesignButtons types={guidedTypes} activeType={activeType} onSelect={chooseDesign} /><div className="guided-result-actions"><button className="picker-back-button" type="button" onClick={() => setGuidedStep(2)}>Back to site or goal</button><button type="button" onClick={() => { setMode('workbench'); setSearchText(''); setCategory('all'); }}>Open full workbench</button></div></div>}
    </div>}
  </section>;
}
