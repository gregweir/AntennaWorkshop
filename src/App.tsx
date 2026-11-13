/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { lazy, Suspense, useEffect, useLayoutEffect, useMemo, useState } from 'react';
import { PwaUpdateBanner } from './components/PwaUpdateBanner';
import type { UnitSystem } from './lib/units';
import { loadPreferences, savePreferences, type ThemePreference } from './preferences';
import { jurisdictionProfiles, type JurisdictionCode } from './regulations/catalog';
import type { AntennaDesignHandoff, StationSourceTransfer } from './workflows/stationSourceWorkflow';

const initialJurisdictions = jurisdictionProfiles.filter((profile) => profile.releaseStatus === 'initial');
const AntennaWorkbench = lazy(() => import('./components/AntennaWorkbench').then((module) => ({ default: module.AntennaWorkbench })));
const FeedlineWorkbench = lazy(() => import('./components/FeedlineWorkbench').then((module) => ({ default: module.FeedlineWorkbench })));
const ExposureReferenceWorkbench = lazy(() => import('./components/ExposureReferenceWorkbench').then((module) => ({ default: module.ExposureReferenceWorkbench })));

export function App() {
  const savedPreferences = useMemo(() => loadPreferences(window.localStorage), []);
  const [jurisdiction, setJurisdiction] = useState<JurisdictionCode>(savedPreferences.jurisdiction);
  const [unitSystem, setUnitSystem] = useState<UnitSystem>(savedPreferences.unitSystem);
  const [advancedOpen, setAdvancedOpen] = useState(savedPreferences.advancedOpen);
  const [theme, setTheme] = useState<ThemePreference>(savedPreferences.theme);
  const [workshopTool, setWorkshopTool] = useState<'antennas' | 'feedline' | 'exposure'>('antennas');
  const [antennaHandoff, setAntennaHandoff] = useState<AntennaDesignHandoff | null>(null);
  const [stationSourceTransfer, setStationSourceTransfer] = useState<StationSourceTransfer | null>(null);

  useEffect(() => {
    savePreferences({ jurisdiction, unitSystem, advancedOpen, theme }, window.localStorage);
  }, [jurisdiction, unitSystem, advancedOpen, theme]);

  useLayoutEffect(() => {
    const root = document.documentElement;
    const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    const darkMode = window.matchMedia('(prefers-color-scheme: dark)');
    const apply = () => {
      if (theme === 'system') delete root.dataset.theme;
      else root.dataset.theme = theme;
      const resolved = theme === 'system' ? (darkMode.matches ? 'dark' : 'light') : theme;
      root.style.colorScheme = resolved;
      themeColor?.setAttribute('content', resolved === 'dark' ? '#102a35' : '#f4efe5');
    };
    apply();
    darkMode.addEventListener('change', apply);
    return () => darkMode.removeEventListener('change', apply);
  }, [theme]);

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
            <select aria-label="Station jurisdiction" value={jurisdiction} onChange={(event) => setJurisdiction(event.target.value as JurisdictionCode)}>
              {initialJurisdictions.map((profile) => <option key={profile.code} value={profile.code}>{profile.name}</option>)}
            </select>
          </label>
          <label>
            <span>Theme</span>
            <select aria-label="Theme" value={theme} onChange={(event) => setTheme(event.target.value as ThemePreference)}>
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
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
          <span className="status-chip">Theme: {theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}</span>
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

      <Suspense fallback={<section className="workspace shell tool-loading" role="status" aria-live="polite"><p className="eyebrow">Opening workshop</p><h2>Loading the selected tool…</h2><p>The calculator and its saved on-device data will be ready momentarily.</p></section>}>
        {workshopTool === 'antennas'
          ? <AntennaWorkbench jurisdiction={jurisdiction} unitSystem={unitSystem} advancedOpen={advancedOpen} setAdvancedOpen={setAdvancedOpen} onContinueToSystem={(handoff) => { setAntennaHandoff(handoff); setWorkshopTool('feedline'); }} />
          : workshopTool === 'feedline'
            ? <FeedlineWorkbench jurisdiction={jurisdiction} unitSystem={unitSystem} antennaHandoff={antennaHandoff} onAddToExposure={(transfer) => { setStationSourceTransfer(transfer); setWorkshopTool('exposure'); }} />
            : <ExposureReferenceWorkbench jurisdiction={jurisdiction} setJurisdiction={setJurisdiction} unitSystem={unitSystem} incomingSource={stationSourceTransfer} onSourceConsumed={() => setStationSourceTransfer(null)} />}
      </Suspense>

      <section className="roadmap shell" aria-labelledby="roadmap-title">
        <p className="eyebrow">Workshop roadmap</p>
        <h2 id="roadmap-title">One project, connected tools</h2>
        <div className="roadmap-grid">
          <article><span>01</span><h3>Antenna designs</h3><p>Wire, vertical, beam, loop, portable, and receive antennas with live cut plans.</p></article>
          <article><span>02</span><h3>Feedline and matching</h3><p>Loss, velocity factor, stubs, SWR, impedance, coils, traps, baluns, and ununs.</p></article>
          <article><span>03</span><h3>RF exposure</h3><p>Sourced Canadian, United States, United Kingdom, and Australian reference and assessment workflows.</p></article>
        </div>
      </section>
    </main>

    <footer className="site-footer"><div className="shell footer-layout">
      <a className="footer-mark" href="https://www.tartanleaf.com/" aria-label="Visit Tartanleaf.com Inc."><img src="/antennas/TartanleafLogo.jpg" alt="Tartanleaf tartan maple-leaf logo" width="76" height="76" /></a>
      <div className="footer-copy"><strong>RadioBook Antenna Workshop</strong><p>Practical calculations still require measurement, tuning, and attention to the method's limits.</p><small>Copyright 2026 Tartanleaf.com Inc. · Developed by Greg Weir, VA1GW.</small></div>
      <nav className="footer-links" aria-label="Project and company links"><a href="https://www.radiobook.ca/">RadioBook</a><a href="https://www.tartanleaf.com/">Tartanleaf.com Inc.</a><a href="https://github.com/gregweir/AntennaWorkshop">Source code</a><a href="https://github.com/gregweir/AntennaWorkshop/blob/main/LICENSE">MPL-2.0 licence</a><a href="mailto:gweir@tartanleaf.com">gweir@tartanleaf.com</a></nav>
    </div></footer>
  </>;
}
