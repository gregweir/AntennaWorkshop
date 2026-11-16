/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { generateNec2Dipole, NEC2_DIPOLE_EXPORT_MODEL, type Nec2DipoleGround } from '../calculators/nec2Dipole';
import { downloadBlob } from '../lib/download';

interface Props { frequencyMHz: number; finishedSpanMetres: number; wavelengthMetres: number }

export function DipoleNecExport({ frequencyMHz, finishedSpanMetres, wavelengthMetres }: Props) {
  const [spanMetres, setSpanMetres] = useState(finishedSpanMetres);
  const [heightMetres, setHeightMetres] = useState(wavelengthMetres * 0.25);
  const [diameterMillimetres, setDiameterMillimetres] = useState(1.6);
  const [segmentCount, setSegmentCount] = useState(21);
  const [ground, setGround] = useState<Nec2DipoleGround>('free-space');
  const result = useMemo(() => {
    try {
      return { model: generateNec2Dipole({ frequencyMHz, spanMetres, heightMetres, conductorDiameterMillimetres: diameterMillimetres, segmentCount, ground }), error: null };
    } catch (error) {
      return { model: null, error: error instanceof Error ? error.message : 'Unable to generate this NEC-2 model.' };
    }
  }, [frequencyMHz, spanMetres, heightMetres, diameterMillimetres, segmentCount, ground]);
  const download = () => {
    if (!result.model) return;
    downloadBlob(new Blob([result.model.deck], { type: 'text/plain;charset=utf-8' }), `dipole-${frequencyMHz.toFixed(3).replace('.', '-')}-mhz.nec`);
  };
  return <details className="dipole-nec-export">
    <summary><span><strong>Export a bounded NEC-2 dipole model</strong><small>One straight wire · one centre source · one frequency</small></span></summary>
    <div className="dipole-nec-body">
      <div className="dipole-nec-fields">
        <label>Modelled conductor span <span><input aria-label="NEC model conductor span" type="number" min="0.001" max="100000" step="0.001" value={spanMetres} onChange={(event) => setSpanMetres(Number(event.target.value))} /> m</span><small>Initialized from the finished resonant target, not the extra cut-and-trim length.</small></label>
        <label>Conductor outside diameter <span><input aria-label="NEC conductor outside diameter" type="number" min="0.01" max="10000" step="0.1" value={diameterMillimetres} onChange={(event) => setDiameterMillimetres(Number(event.target.value))} /> mm</span><small>One uniform, bare, round-conductor diameter.</small></label>
        <label>Odd segment count <span><input aria-label="NEC segment count" type="number" min="3" max="999" step="2" value={segmentCount} onChange={(event) => setSegmentCount(Number(event.target.value))} /> segments</span><small>The voltage source occupies the exact centre segment.</small></label>
        <fieldset><legend>Ground model</legend><button type="button" aria-pressed={ground === 'free-space'} onClick={() => setGround('free-space')}>Free space</button><button type="button" aria-pressed={ground === 'perfect-ground'} onClick={() => setGround('perfect-ground')}>Perfect ground</button></fieldset>
        {ground === 'perfect-ground' && <label>Wire-axis height <span><input aria-label="NEC wire-axis height" type="number" min="0.001" max="100000" step="0.01" value={heightMetres} onChange={(event) => setHeightMetres(Number(event.target.value))} /> m</span><small>Height above the infinite perfect-ground plane.</small></label>}
      </div>
      <article className={result.error ? 'dipole-nec-status nec-invalid' : 'dipole-nec-status'} aria-live="polite"><p className="eyebrow">{result.error ? 'Export blocked' : 'Model boundary satisfied'}</p><h4>{result.error ?? `${result.model!.segmentLengthWavelengths.toFixed(4)} λ per segment · Δ/a ${result.model!.segmentLengthToRadius.toFixed(1)}`}</h4><p>{result.error ? 'Revise the highlighted model assumptions before downloading.' : `Source: wire tag 1, segment ${result.model!.centreSegment}. Geometry is written in metres for ${frequencyMHz.toFixed(6)} MHz.`}</p></article>
      {result.model && <div className="dipole-nec-preview"><div><h4>Generated NEC-2 deck</h4><button type="button" onClick={download}>Download .nec file</button></div><pre aria-label="Generated NEC-2 deck">{result.model.deck}</pre></div>}
      <div className="dipole-nec-assumptions"><h4>Bounded assumptions</h4><ul><li>Lossless, straight, horizontal, uniform round wire with no insulation.</li><li>Applied-E-field 1 V source on one centre segment; no physical feed gap or feedline.</li><li>{ground === 'perfect-ground' ? 'Infinite perfectly conducting ground only; real soil is not approximated.' : 'Free space; installation height and ground are absent.'}</li><li>No supports, mast, feedline, choke, nearby objects, loading, pattern request, sweep, structural check, exposure result, or safe-power result.</li></ul><p>Run the deck in a compatible NEC implementation, review warnings and convergence, vary segmentation, and compare with installed measurements. An exported deck is not a validated performance prediction.</p><small>Model {NEC2_DIPOLE_EXPORT_MODEL.version} · <a href={NEC2_DIPOLE_EXPORT_MODEL.source.url} target="_blank" rel="noreferrer">{NEC2_DIPOLE_EXPORT_MODEL.source.title}</a> · reviewed {NEC2_DIPOLE_EXPORT_MODEL.reviewedOn}</small></div>
    </div>
  </details>;
}
