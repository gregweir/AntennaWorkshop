/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useEffect, useMemo, useState } from 'react';
import { AntennaWorkbench } from './components/AntennaWorkbench';
import { FeedlineWorkbench } from './components/FeedlineWorkbench';
import { ExposureReferenceWorkbench } from './components/ExposureReferenceWorkbench';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import type { UnitSystem } from './lib/units';
import { loadPreferences, savePreferences } from './preferences';
import { jurisdictionProfiles, type JurisdictionCode } from './regulations/catalog';

const initialJurisdictions = jurisdictionProfiles.filter((profile) => profile.releaseStatus === 'initial');

export function App() {
  const savedPreferences = useMemo(() => loadPreferences(window.localStorage), []);
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>(savedPreferences.jurisdiction);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(savedPreferences.unitSystem);
  const [advancedOpen, setAdvancedOpen] = useState(savedPreferences.advancedOpen);
  const [workshopTool, setWorkshopTool] = useState<'antennas' | 'feedline' | 'exposure'>('antennas');

  useEffect(() => {
    savePreferences({ jurisdiction, unitSystem, advancedOpen }, window.localStorage);
  }, [jurisdiction, unitSystem, advancedOpen]);

  const jurisdictionName = jurisdictionProfiles.find((profile) => profile.code === jurisdiction)?.name ?? 'Unknown';

  return <>
    <a className="skip-link" href="#calculator">Skip to calculator</a>
    <PwaUpdateBanner />
    <header className="site-header">
      <div className="shell header-inner">
        <div className="brand-cluster">
          <a className="tartanleaf-mark" href="https://www.tartanleaf.com/" aria-label="Tartanleaf.com Inc.">
            <img src="/antennas/TartanleafLogo.jpg" alt="Tartanleaf tartan maple-leaf logo" width="52" height="52" />
          </a>
          <a className="brand" href="https://www.radiobook.ca/" aria-label="RadioBook home">
            <span><strong>RadioBook</strong><small>Antenna Workshop</small></span>
          </a>
        </div>
        <div className="global-controls" aria-label="Application preferences">
          <label>
            <span>Station jurisdiction</span>
            <select value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as JurisdictionCode)}>
              {initialJurisdictions.map((profile) => <option key={profile.code} value={profile.code}>{profile.name}</option>)}
            </select>
          </label>
          <fieldset className="segmented-control">
            <legend>Units</legend>
            <button type="button" aria-pressed={unitSystem === 'metric'} onClick={() => setUnitSystem('metric')}>Metric</button>
            <button type="button" aria-pressed={unitSystem === 'imperial'} onClick={() => setUnitSystem('imperial')}>Imperial</button>
          </fieldset>
        </div>
      </div>
    </header>

    <main>
      <section className="hero shell">
        <p className="eyebrow">Design · understand · build · tune</p>
        <h1>Build antennas with the measurements—and the reasoning—to get them right.</h1>
        <p>Choose a proven starting design, inspect every assumption, and take a dimensioned construction drawing to the workbench. RF exposure tools will use the rules for the station location you select.</p>
        <div className="status-row" aria-label="Current application settings">
          <span className="status-chip">Jurisdiction: {jurisdictionName}</span>
          <span className="status-chip">Units: {unitSystem === 'metric' ? 'Metric' : 'Imperial'}</span>
          <span className="status-chip status-chip-muted">Works offline after installation</span>
        </div>
      </section>

      <nav className="tool-nav shell" aria-label="Workshop tools">
        <button type="button" aria-pressed={workshopTool === 'antennas'} onClick={() => setWorkshopTool('antennas')}>
          <span>01</span><strong>Antenna designs</strong><small>Dimensions, geometry, and cut plans</small>
        </button>
        <button type="button" aria-pressed={workshopTool === 'feedline'} onClick={() => setWorkshopTool('feedline')}>
          <span>02</span><strong>Feedline &amp; matching</strong><small>Loss, SWR, and power flow</small>
        </button>
        <button type="button" aria-pressed={workshopTool === 'exposure'} onClick={() => setWorkshopTool('exposure')}>
          <span>03</span><strong>RF exposure</strong><small>Official limits · screening under review</small>
        </button>
      </nav>

      {workshopTool === 'antennas'
        ? <AntennaWorkbench jurisdiction={jurisdiction} unitSystem={unitSystem} advancedOpen={advancedOpen} setAdvancedOpen={setAdvancedOpen} />
        : workshopTool === 'feedline'
          ? <FeedlineWorkbench jurisdiction={jurisdiction} unitSystem={unitSystem} />
          : <ExposureReferenceWorkbench jurisdiction={jurisdiction} unitSystem={unitSystem} />}

      <section className="roadmap shell" aria-labelledby="roadmap-title">
        <p className="eyebrow">Workshop roadmap</p>
        <h2 id="roadmap-title">One project, connected tools</h2>
        <div className="roadmap-grid">
          <article><span>01</span><h3>Antenna designs</h3><p>Wire, vertical, beam, loop, portable, and receive antennas with live cut plans.</p></article>
          <article><span>02</span><h3>Feedline and matching</h3><p>Loss, velocity factor, stubs, SWR, impedance, coils, traps, baluns, and ununs.</p></article>
          <article><span>03</span><h3>RF exposure</h3><p>Separate, sourced workflows for Canada and the United States, with more jurisdictions planned.</p></article>
        </div>
      </section>
    </main>

    <footer className="site-footer"><div className="shell footer-layout">
      <a className="footer-mark" href="https://www.tartanleaf.com/" aria-label="Visit Tartanleaf.com Inc."><img src="/antennas/TartanleafLogo.jpg" alt="Tartanleaf tartan maple-leaf logo" width="76" height="76" /></a>
      <div className="footer-copy"><strong>RadioBook Antenna Workshop</strong><p>Practical calculations still require measurement, tuning, and attention to the method's limits.</p><small>Copyright 2026 Tartanleaf.com Inc. · Developed by Greg Weir.</small></div>
      <nav className="footer-links" aria-label="Project and company links"><a href="https://www.radiobook.ca/">RadioBook</a><a href="https://www.tartanleaf.com/">Tartanleaf.com Inc.</a><a href="https://github.com/gregweir/AntennaWorkshop">Source code</a><a href="https://github.com/gregweir/AntennaWorkshop/blob/main/LICENSE">MPL-2.0 licence</a><a href="mailto:gweir@tartanleaf.com">gweir@tartanleaf.com</a></nav>
    </div></footer>
  </>;
}
