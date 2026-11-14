/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useRef, useState } from 'react';
import { ANTENNA_DESIGNS, type AntennaType } from '../lib/antennaDesignCatalog';
import type { UnitSystem } from '../lib/units';
import {
  ANTENNA_PLAN_KIND,
  ANTENNA_PLAN_VERSION,
  antennaPlanFilename,
  deleteAntennaPlan,
  loadAntennaPlans,
  parseAntennaPlan,
  saveAntennaPlan,
  serializeAntennaPlan,
  type AntennaPlan,
  type AntennaPlanWorkspace
} from '../projects/antennaPlans';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';

interface Props {
  antennaType: AntennaType;
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  modelId: string;
  modelVersion: string;
  workspace: AntennaPlanWorkspace;
  onOpen: (plan: AntennaPlan) => void;
}

function newId() {
  return globalThis.crypto?.randomUUID?.() ?? `plan-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function localDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

export function AntennaPlanLibrary({ antennaType, jurisdiction, unitSystem, modelId, modelVersion, workspace, onOpen }: Props) {
  const initialPlans = useMemo(() => loadAntennaPlans(window.localStorage), []);
  const [plans, setPlans] = useState(initialPlans);
  const [selectedId, setSelectedId] = useState(initialPlans[0]?.id ?? '');
  const [name, setName] = useState(`${ANTENNA_DESIGNS[antennaType].short} plan`);
  const [message, setMessage] = useState('');
  const importInput = useRef<HTMLInputElement>(null);
  const selected = plans.find((plan) => plan.id === selectedId);

  const storeNew = (planName: string, sourceWorkspace = workspace) => {
    const now = new Date().toISOString();
    const plan: AntennaPlan = {
      kind: ANTENNA_PLAN_KIND,
      schemaVersion: ANTENNA_PLAN_VERSION,
      id: newId(),
      name: planName.trim(),
      createdAt: now,
      updatedAt: now,
      antennaType,
      jurisdiction,
      unitSystem,
      modelId,
      modelVersion,
      workspace: sourceWorkspace
    };
    const next = saveAntennaPlan(plan, window.localStorage);
    setPlans(next);
    setSelectedId(plan.id);
    return plan;
  };

  const saveCurrent = () => {
    if (!name.trim()) {
      setMessage('Enter a plan name before saving.');
      return;
    }
    try {
      storeNew(name);
      setMessage('New plan saved in this browser');
    } catch {
      setMessage('The plan could not be saved. Download or print a copy before leaving this page.');
    }
  };

  const openSelected = () => {
    if (!selected) return;
    onOpen(selected);
    setName(selected.name);
    setMessage(`Opened ${selected.name}`);
  };

  const duplicateSelected = () => {
    if (!selected) return;
    try {
      const now = new Date().toISOString();
      const copy = { ...selected, id: newId(), name: `${selected.name} (copy)`, createdAt: now, updatedAt: now };
      const next = saveAntennaPlan(copy, window.localStorage);
      setPlans(next);
      setSelectedId(copy.id);
      setMessage('Plan duplicated as a separate copy');
    } catch {
      setMessage('The selected plan could not be duplicated.');
    }
  };

  const removeSelected = () => {
    if (!selected || !window.confirm(`Delete “${selected.name}” from this browser?`)) return;
    const next = deleteAntennaPlan(selected.id, window.localStorage);
    setPlans(next);
    setSelectedId(next[0]?.id ?? '');
    setMessage('Saved plan deleted');
  };

  const downloadSelected = () => {
    if (!selected) return;
    const url = URL.createObjectURL(new Blob([serializeAntennaPlan(selected)], { type: 'application/json' }));
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = antennaPlanFilename(selected.name);
    anchor.click();
    URL.revokeObjectURL(url);
    setMessage('Portable JSON plan downloaded');
  };

  const importPlan = async (file?: File) => {
    if (!file) return;
    try {
      const imported = parseAntennaPlan(await file.text(), newId(), new Date().toISOString());
      const next = saveAntennaPlan(imported, window.localStorage);
      setPlans(next);
      setSelectedId(imported.id);
      setMessage('Plan imported as a new copy; existing plans were not changed');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'The selected plan could not be imported.');
    } finally {
      if (importInput.current) importInput.current.value = '';
    }
  };

  const jurisdictionName = selected ? jurisdictionProfiles.find((profile) => profile.code === selected.jurisdiction)?.name : '';

  return <details className="antenna-plan-library">
    <summary><span><strong>Saved antenna plans</strong><small>Keep named designs on this device or move them as versioned JSON files.</small></span><span className="plan-count">{plans.length}</span></summary>
    <div className="antenna-plan-library-body">
      <div className="plan-privacy" role="note"><strong>Plans stay in this browser unless you download them.</strong><span>Browser storage can be cleared or lost. Export important plans and keep the file with your build notes.</span></div>
      <div className="plan-save-row">
        <label><span>New plan name</span><input value={name} maxLength={120} onChange={(event) => setName(event.target.value)} /></label>
        <button type="button" onClick={saveCurrent}>Save new plan</button>
      </div>
      {plans.length ? <>
        <label className="plan-picker"><span>Saved plan</span><select aria-label="Saved antenna plan" value={selectedId} onChange={(event) => setSelectedId(event.target.value)}>{plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name} · {ANTENNA_DESIGNS[plan.antennaType].short}</option>)}</select></label>
        {selected && <div className="plan-summary">
          <strong>{selected.name}</strong>
          <span>{ANTENNA_DESIGNS[selected.antennaType].name}</span>
          <span>{jurisdictionName} · {selected.unitSystem === 'metric' ? 'Metric' : 'Imperial'} · saved {localDate(selected.updatedAt)}</span>
          <code>{selected.modelId} · model {selected.modelVersion} · file schema {selected.schemaVersion}</code>
        </div>}
        <div className="plan-actions"><button type="button" onClick={openSelected}>Open plan</button><button type="button" className="secondary-button" onClick={duplicateSelected}>Duplicate</button><button type="button" className="secondary-button" onClick={downloadSelected}>Download JSON</button><button type="button" className="danger-button" onClick={removeSelected}>Delete</button></div>
      </> : <p className="plan-empty">No plans are saved in this browser yet.</p>}
      <label className="plan-import"><span>Import JSON plan</span><input ref={importInput} type="file" accept=".json,application/json" aria-label="Import antenna plan JSON" onChange={(event) => void importPlan(event.target.files?.[0])} /></label>
      <p className="plan-message" role="status" aria-live="polite">{message}</p>
    </div>
  </details>;
}
