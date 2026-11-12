/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useMemo, useState } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { ANTENNA_MODELS, calculateBasicYagi, calculateEfhw, calculateFullWaveLoop, calculateGroundMountedVertical, calculateGroundPlane, calculateInvertedV, calculateJpole, calculateMoxon, calculateOcfd, calculateSlimJim, type LoopShape } from '../calculators/designs';
import { calculateHalfWaveDipole, HALF_WAVE_DIPOLE_MODEL } from '../calculators/dipole';
import { formatLength, type UnitSystem } from '../lib/units';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import { BandIndicator } from './BandIndicator';
import { DipoleDiagram } from './DipoleDiagram';
import { EfhwDiagram } from './EfhwDiagram';
import { GroundPlaneDiagram } from './GroundPlaneDiagram';
import { InvertedVDiagram } from './InvertedVDiagram';
import { LoopDiagram } from './LoopDiagram';
import { OcfdDiagram } from './OcfdDiagram';
import { JpoleDiagram } from './JpoleDiagram';
import { SlimJimDiagram } from './SlimJimDiagram';
import { MoxonDiagram } from './MoxonDiagram';
import { YagiDiagram } from './YagiDiagram';
import { GroundMountedVerticalDiagram } from './GroundMountedVerticalDiagram';

type AntennaType = 'dipole' | 'inverted-v' | 'efhw' | 'ocfd' | 'jpole' | 'slim-jim' | 'moxon' | 'yagi' | 'ground-mounted-vertical' | 'ground-plane' | 'full-wave-loop';

const designs: Record<AntennaType, { name: string; short: string }> = {
  dipole: { name: 'Centre-fed half-wave dipole', short: 'Dipole' },
  'inverted-v': { name: 'Inverted-V dipole', short: 'Inverted-V' },
  efhw: { name: 'End-fed half-wave (EFHW)', short: 'EFHW' },
  ocfd: { name: 'Off-centre-fed dipole (OCFD)', short: 'OCFD' },
  jpole: { name: 'J-pole vertical', short: 'J-pole' },
  'slim-jim': { name: 'Slim Jim vertical', short: 'Slim Jim' },
  moxon: { name: 'Moxon rectangle', short: 'Moxon' },
  yagi: { name: 'Three-element Yagi', short: 'Basic Yagi' },
  'ground-mounted-vertical': { name: 'Ground-mounted quarter-wave vertical', short: 'Ground vertical' },
  'ground-plane': { name: 'Quarter-wave ground plane', short: 'Ground plane' },
  'full-wave-loop': { name: 'Full-wave wire loop', short: 'Full-wave loop' }
};

interface Props {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;
}

export function AntennaWorkbench({ jurisdiction, unitSystem, advancedOpen, setAdvancedOpen }: Props) {
  const [antennaType, setAntennaType] = useState<AntennaType>('dipole');
  const [frequencyText, setFrequencyText] = useState('14.200');
  const [lengthCorrectionFactor, setLengthCorrectionFactor] = useState(0.95);
  const [trimAllowancePercent, setTrimAllowancePercent] = useState(2.5);
  const [includedAngleDegrees, setIncludedAngleDegrees] = useState(120);
  const [radialCount, setRadialCount] = useState(4);
  const [radialSlopeDegrees, setRadialSlopeDegrees] = useState(45);
  const [loopShape, setLoopShape] = useState<LoopShape>('square');
  const [transformerRatio, setTransformerRatio] = useState(49);
  const [estimatedEndImpedanceOhms, setEstimatedEndImpedanceOhms] = useState(2450);
  const [feedpointPercentFromEnd, setFeedpointPercentFromEnd] = useState(33.333);
  const [estimatedOcfdImpedanceOhms, setEstimatedOcfdImpedanceOhms] = useState(200);
  const [jpoleConstruction, setJpoleConstruction] = useState<'twinlead' | 'metal'>('twinlead');
  const [jpoleTapPercent, setJpoleTapPercent] = useState(7.5);
  const [slimJimGapPercent, setSlimJimGapPercent] = useState(5);
  const [moxonConductorDiameterMillimetres, setMoxonConductorDiameterMillimetres] = useState(2.05);
  const [groundRadialCount, setGroundRadialCount] = useState(32);
  const [groundRadialLengthMultiplier, setGroundRadialLengthMultiplier] = useState(1);

  const frequencyMHz = Number(frequencyText);
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const jurisdictionName = jurisdictionProfiles.find((profile) => profile.code === jurisdiction)?.name ?? 'Unknown';

  const calculation = useMemo(() => {
    try {
      const common = { frequencyMHz, lengthCorrectionFactor, trimAllowancePercent };
      if (antennaType === 'dipole') return { type: antennaType, value: calculateHalfWaveDipole(common) } as const;
      if (antennaType === 'inverted-v') return { type: antennaType, value: calculateInvertedV({ ...common, includedAngleDegrees }) } as const;
      if (antennaType === 'efhw') return { type: antennaType, value: calculateEfhw({ ...common, transformerRatio, estimatedEndImpedanceOhms }) } as const;
      if (antennaType === 'ocfd') return { type: antennaType, value: calculateOcfd({ ...common, transformerRatio, feedpointPercentFromEnd, estimatedFeedpointImpedanceOhms: estimatedOcfdImpedanceOhms }) } as const;
      if (antennaType === 'jpole') return { type: antennaType, value: calculateJpole({ ...common, feedpointPercentOfStub: jpoleTapPercent }) } as const;
      if (antennaType === 'slim-jim') return { type: antennaType, value: calculateSlimJim({ ...common, feedpointPercentOfStub: jpoleTapPercent, gapPercentOfStub: slimJimGapPercent }) } as const;
      if (antennaType === 'moxon') return { type: antennaType, value: calculateMoxon({ frequencyMHz, conductorDiameterMillimetres: moxonConductorDiameterMillimetres }) } as const;
      if (antennaType === 'yagi') return { type: antennaType, value: calculateBasicYagi({ frequencyMHz }) } as const;
      if (antennaType === 'ground-mounted-vertical') return { type: antennaType, value: calculateGroundMountedVertical({ ...common, radialCount: groundRadialCount, radialLengthMultiplier: groundRadialLengthMultiplier }) } as const;
      if (antennaType === 'ground-plane') return { type: antennaType, value: calculateGroundPlane({ ...common, radialCount, radialSlopeDegrees }) } as const;
      return { type: antennaType, value: calculateFullWaveLoop({ ...common, shape: loopShape }) } as const;
    } catch {
      return null;
    }
  }, [antennaType, estimatedEndImpedanceOhms, estimatedOcfdImpedanceOhms, feedpointPercentFromEnd, frequencyMHz, groundRadialCount, groundRadialLengthMultiplier, includedAngleDegrees, jpoleTapPercent, lengthCorrectionFactor, loopShape, moxonConductorDiameterMillimetres, radialCount, radialSlopeDegrees, slimJimGapPercent, transformerRatio, trimAllowancePercent]);

  const model = antennaType === 'dipole'
    ? HALF_WAVE_DIPOLE_MODEL
    : antennaType === 'inverted-v'
      ? ANTENNA_MODELS.invertedV
      : antennaType === 'efhw'
        ? ANTENNA_MODELS.efhw
        : antennaType === 'ocfd'
          ? ANTENNA_MODELS.ocfd
          : antennaType === 'jpole'
            ? ANTENNA_MODELS.jpole
            : antennaType === 'slim-jim'
              ? ANTENNA_MODELS.slimJim
              : antennaType === 'moxon'
                ? ANTENNA_MODELS.moxon
                : antennaType === 'yagi'
                  ? ANTENNA_MODELS.basicYagi
                  : antennaType === 'ground-mounted-vertical'
                    ? ANTENNA_MODELS.groundMountedVertical
              : antennaType === 'ground-plane'
                ? ANTENNA_MODELS.groundPlane
                : ANTENNA_MODELS.fullWaveLoop;

  const recommendedFactor = antennaType === 'full-wave-loop' ? 1.02 : antennaType === 'jpole' || antennaType === 'slim-jim' ? (jpoleConstruction === 'twinlead' ? 0.83 : 0.93) : 0.95;
  const selectDesign = (type: AntennaType) => {
    setAntennaType(type);
    setLengthCorrectionFactor(type === 'full-wave-loop' ? 1.02 : type === 'jpole' || type === 'slim-jim' ? (jpoleConstruction === 'twinlead' ? 0.83 : 0.93) : 0.95);
    if (type === 'efhw') setTransformerRatio(49);
    if (type === 'ocfd') setTransformerRatio(4);
  };

  return (
    <section className="workspace shell" id="calculator" aria-labelledby="calculator-title">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Graphical antenna workshop</p>
          <h2 id="calculator-title">{designs[antennaType].name}</h2>
        </div>
        {antennaType !== 'moxon' && antennaType !== 'yagi' && <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(!advancedOpen)}>
          {advancedOpen ? 'Hide advanced' : 'Show advanced'}
        </button>}
      </div>

      <div className="design-picker" aria-label="Antenna design">
        {(Object.keys(designs) as AntennaType[]).map((type) => (
          <button key={type} type="button" aria-pressed={antennaType === type} onClick={() => selectDesign(type)}>
            <span>{designs[type].short}</span>
            <small>{type === 'dipole' ? 'Two straight legs' : type === 'inverted-v' ? 'Single high support' : type === 'efhw' ? 'End transformer · multiband potential' : type === 'ocfd' ? 'Unequal legs · multiband potential' : type === 'jpole' ? 'Vertical radiator · matching stub' : type === 'slim-jim' ? 'Folded radiator · interrupted side' : type === 'moxon' ? 'Two-element directional rectangle' : type === 'yagi' ? 'Reflector · driven · director' : type === 'ground-mounted-vertical' ? 'Ground-level base · radial field' : type === 'ground-plane' ? 'Elevated vertical · sloping radials' : 'Square, triangle, or circle'}</small>
          </button>
        ))}
      </div>

      <div className="calculator-layout">
        <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>Amateur band</span>
            <select className="band-select" value={activeBand?.id ?? 'custom'} onChange={(event) => {
              const band = availableBands.find((candidate) => candidate.id === event.target.value);
              if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1));
            }} aria-describedby="band-help">
              <option value="custom">Custom frequency</option>
              {availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}
            </select>
            <small id="band-help">Loads a central design frequency; adjust it for the part of the band you use.</small>
          </label>

          <label className="field">
            <span>Design frequency</span>
            <span className="input-with-unit">
              <input aria-label="Design frequency" inputMode="decimal" type="number" min="0.001" step="0.001" value={frequencyText} onChange={(event) => setFrequencyText(event.target.value)} />
              <span>MHz</span>
            </span>
            <small>Use the frequency where you want resonance, not just the band name.</small>
          </label>

          {antennaType === 'inverted-v' && <NumberField label="Included apex angle" value={includedAngleDegrees} min={60} max={180} step={1} unit="degrees" help="ARRL guidance recommends 90°–120°; wider values are supported for comparison." onChange={setIncludedAngleDegrees} />}
          {antennaType === 'ground-plane' && <>
            <NumberField label="Number of radials" value={radialCount} min={3} max={64} step={1} unit="wires" help="The drawing shows four directions; the wire total uses the count entered." onChange={setRadialCount} />
            <NumberField label="Radial slope below horizontal" value={radialSlopeDegrees} min={0} max={60} step={1} unit="degrees" help="Drooping elevated radials can raise feedpoint impedance; verify the installed match." onChange={setRadialSlopeDegrees} />
          </>}
          {antennaType === 'ground-mounted-vertical' && <>
            <NumberField label="Number of ground radials" value={groundRadialCount} min={4} max={240} step={1} unit="wires" help="More radials usually reduce ground-system loss. ARRL construction guidance describes 40 or more for strong performance and 120 quarter-wave radials as a well-developed system." onChange={setGroundRadialCount} />
            <NumberField label="Radial length multiplier" value={groundRadialLengthMultiplier} min={0.25} max={2} step={0.05} unit="× ¼λ" help="1.00 makes each radial the corrected quarter-wave baseline. Soil, space, and radial count affect the best practical layout." onChange={setGroundRadialLengthMultiplier} />
          </>}
          {antennaType === 'efhw' && <NumberField label="Transformer impedance ratio" value={transformerRatio} min={4} max={100} step={1} unit=": 1" help="49:1 is the documented ARRL starting point for an approximately 2,500 Ω end impedance." onChange={setTransformerRatio} />}
          {antennaType === 'ocfd' && <>
            <NumberField label="Feedpoint position from short end" value={feedpointPercentFromEnd} min={10} max={50} step={0.1} unit="%" help="About one-third from an end is the conventional starting point for a roughly 200 Ω feedpoint." onChange={setFeedpointPercentFromEnd} />
            <NumberField label="Current-balun impedance ratio" value={transformerRatio} min={1} max={25} step={1} unit=": 1" help="4:1 nominally transforms a 200 Ω feedpoint toward 50 Ω coax." onChange={setTransformerRatio} />
          </>}
          {antennaType === 'jpole' && <>
            <label className="field"><span>Construction medium</span><select value={jpoleConstruction} onChange={(event) => {
              const construction = event.target.value as 'twinlead' | 'metal';
              setJpoleConstruction(construction);
              setLengthCorrectionFactor(construction === 'twinlead' ? 0.83 : 0.93);
            }}><option value="twinlead">300 Ω flat twin-lead</option><option value="metal">Copper wire or pipe</option></select><small>Sets the documented starting factor; actual material and insulation still require trimming.</small></label>
            <NumberField label="Coax tap height on matching stub" value={jpoleTapPercent} min={1} max={25} step={0.5} unit="%" help="Measured upward from the shorted bottom as a percentage of the quarter-wave stub; adjust for minimum SWR." onChange={setJpoleTapPercent} />
          </>}
          {antennaType === 'slim-jim' && <>
            <label className="field"><span>Construction medium</span><select value={jpoleConstruction} onChange={(event) => {
              const construction = event.target.value as 'twinlead' | 'metal';
              setJpoleConstruction(construction);
              setLengthCorrectionFactor(construction === 'twinlead' ? 0.83 : 0.93);
            }}><option value="twinlead">300 Ω flat twin-lead</option><option value="metal">Copper wire or pipe</option></select><small>Sets the starting material factor; preserve parallel spacing throughout the antenna.</small></label>
            <NumberField label="Coax tap height on matching stub" value={jpoleTapPercent} min={1} max={25} step={0.5} unit="%" help="Measured upward from the shorted bottom; adjust the two tap contacts together for minimum SWR." onChange={setJpoleTapPercent} />
            <NumberField label="Interruption gap" value={slimJimGapPercent} min={1} max={15} step={0.5} unit="% of stub" help="Physical opening between the lower matching stub and upper folded section; construction details affect the final value." onChange={setSlimJimGapPercent} />
          </>}
          {antennaType === 'moxon' && <NumberField label="Conductor diameter" value={moxonConductorDiameterMillimetres} min={0.01} max={100} step={0.01} unit="mm" help="Use a constant outside diameter. Tapered elements require an equivalent diameter and separate modelling." onChange={setMoxonConductorDiameterMillimetres} />}
          {antennaType === 'yagi' && <div className="model-note"><strong>NBS reference geometry</strong><p>This scales the measured 0.4λ design as a complete system, including its 0.0085λ element diameter. Different tubing or a conductive boom requires correction or modelling.</p></div>}
          {antennaType === 'full-wave-loop' && <label className="field">
            <span>Loop shape</span>
            <select value={loopShape} onChange={(event) => setLoopShape(event.target.value as LoopShape)}>
              <option value="square">Square</option><option value="triangle">Equilateral triangle</option><option value="circle">Circle</option>
            </select>
            <small>Perimeter stays constant; this converts it into equal sides or a diameter.</small>
          </label>}

          {advancedOpen && antennaType !== 'moxon' && antennaType !== 'yagi' && <div className="advanced-fields">
            {antennaType === 'efhw' && <NumberField label="Estimated antenna end impedance" value={estimatedEndImpedanceOhms} min={200} max={20000} step={50} unit="Ω" help="A planning assumption only: deployment height, geometry, surroundings, and return path can move this value substantially." onChange={setEstimatedEndImpedanceOhms} />}
            {antennaType === 'ocfd' && <NumberField label="Estimated OCFD feedpoint impedance" value={estimatedOcfdImpedanceOhms} min={20} max={5000} step={10} unit="Ω" help="A nominal planning value; height, split, ground, and frequency change both resistance and reactance." onChange={setEstimatedOcfdImpedanceOhms} />}
            <NumberField label="Length correction factor" value={lengthCorrectionFactor} min={0.5} max={1.2} step={0.01} unit="ratio" help={`${recommendedFactor.toFixed(2)} is the default practical starting factor for this design; measure and tune after installation.`} onChange={setLengthCorrectionFactor} />
            <NumberField label="Extra length for trimming" value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added after the resonant estimate so wire can be shortened during tuning." onChange={setTrimAllowancePercent} />
          </div>}

          {!calculation && <p className="validation-message" role="alert">Enter values within the displayed limits to calculate dimensions.</p>}
          {calculation && <ResultSummary calculation={calculation} unitSystem={unitSystem} radialCount={radialCount} loopShape={loopShape} />}
        </form>

        <div className="visual-panel">
          {calculation?.type === 'dipole' && <DipoleDiagram totalMetres={calculation.value.cutTotalMetres} legMetres={calculation.value.cutLegMetres} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
          {calculation?.type === 'inverted-v' && <InvertedVDiagram legMetres={calculation.value.legMetres} spanMetres={calculation.value.endpointSpanMetres} dropMetres={calculation.value.apexDropMetres} angleDegrees={includedAngleDegrees} unitSystem={unitSystem} />}
          {calculation?.type === 'efhw' && <EfhwDiagram radiatorMetres={calculation.value.radiatorMetres} transformerRatio={transformerRatio} unitSystem={unitSystem} />}
          {calculation?.type === 'ocfd' && <OcfdDiagram shortLegMetres={calculation.value.shortLegMetres} longLegMetres={calculation.value.longLegMetres} totalMetres={calculation.value.cutLengthMetres} feedpointPercent={feedpointPercentFromEnd} transformerRatio={transformerRatio} unitSystem={unitSystem} />}
          {calculation?.type === 'jpole' && <JpoleDiagram longElementMetres={calculation.value.longElementMetres} matchingStubMetres={calculation.value.matchingStubMetres} halfWaveRadiatorMetres={calculation.value.halfWaveRadiatorMetres} feedpointFromShortMetres={calculation.value.feedpointFromShortMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'slim-jim' && <SlimJimDiagram overallHeightMetres={calculation.value.overallHeightMetres} matchingStubMetres={calculation.value.matchingStubMetres} upperFoldedSectionMetres={calculation.value.upperFoldedSectionMetres} gapMetres={calculation.value.interruptionGapMetres} feedpointMetres={calculation.value.feedpointFromShortMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'moxon' && <MoxonDiagram aMetres={calculation.value.aMetres} bMetres={calculation.value.bMetres} cMetres={calculation.value.cMetres} dMetres={calculation.value.dMetres} eMetres={calculation.value.eMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'yagi' && <YagiDiagram reflectorMetres={calculation.value.reflectorMetres} drivenElementMetres={calculation.value.drivenElementMetres} directorMetres={calculation.value.directorMetres} reflectorSpacingMetres={calculation.value.reflectorSpacingMetres} directorSpacingMetres={calculation.value.directorSpacingMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'ground-mounted-vertical' && <GroundMountedVerticalDiagram radiatorMetres={calculation.value.radiatorMetres} radialMetres={calculation.value.radialMetres} radialFieldDiameterMetres={calculation.value.radialFieldDiameterMetres} radialCount={groundRadialCount} unitSystem={unitSystem} />}
          {calculation?.type === 'ground-plane' && <GroundPlaneDiagram radiatorMetres={calculation.value.radiatorMetres} radialMetres={calculation.value.radialMetres} footprintDiameterMetres={calculation.value.footprintDiameterMetres} radialCount={radialCount} slopeDegrees={radialSlopeDegrees} unitSystem={unitSystem} />}
          {calculation?.type === 'full-wave-loop' && <LoopDiagram perimeterMetres={calculation.value.perimeterMetres} primaryDimensionMetres={calculation.value.primaryDimensionMetres} shape={loopShape} unitSystem={unitSystem} />}
          {!calculation && <div className="diagram-placeholder">The construction drawing will appear when the inputs are valid.</div>}
        </div>
      </div>

      <BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
      {(calculation?.type === 'efhw' || calculation?.type === 'ocfd') && <HarmonicBands frequencies={calculation.value.harmonicFrequenciesMHz} jurisdiction={jurisdiction} />}
      <p className="allocation-note">Allocation summary for {jurisdictionName}. Licence qualifications, sub-bands, modes, bandwidth, power, and sharing conditions may further restrict operation; confirm current rules before transmitting.{bandSource && <> Source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p>

      {calculation && <div className="explanation-grid">
        <article>
          <p className="eyebrow">Build and tune</p>
          <h3>A starting point, not a promise</h3>
          <p>{calculation.type === 'moxon' ? 'Installation height, nearby objects, conductor construction, feed arrangement, and ground conditions shift resonance and the directional pattern. Build to the calculated geometry, install in the intended position, measure, and make small symmetrical adjustments.' : calculation.type === 'yagi' ? 'Scale every dimension together, preserve element alignment, and measure from element centre to element centre along the boom. Verify the feed match and pattern in the final mounting arrangement before transmitting.' : 'Installation height, nearby objects, conductor construction, feed arrangement, and ground conditions shift resonance and impedance. Build long, install in the intended position, measure, and trim in small steps.'}</p>
        </article>
        <article>
          <p className="eyebrow">Calculation</p>
          <h3>Traceable working</h3>
          <p className="formula">{calculation.type === 'moxon' ? 'A–D = Cebik regression(log₁₀(d ÷ λ)) × λ' : calculation.type === 'yagi' ? 'Element lengths and spacings = NBS ratios × λ' : 'L = (c ÷ f) × design fraction × correction factor'}</p>
          {calculation.type === 'moxon'
            ? <p>The constant-diameter regression is valid only from 0.00001 to 0.01 wavelengths. Dimensions are model starting points and do not include a trim allowance.</p>
            : calculation.type === 'yagi'
              ? <p>The NBS ratios are reflector 0.482λ, driven element 0.500λ, director 0.424λ, and 0.200λ spacing on each side of the driven element.</p>
              : calculation.type === 'ground-mounted-vertical'
                ? <p>The radiator includes a {trimAllowancePercent}% trimming allowance. Ground-radial lengths use the corrected quarter-wave baseline and the selected multiplier without added trim.</p>
              : <p>The displayed cut dimensions include a {trimAllowancePercent}% construction allowance. Geometry values describe the idealized shape, not required support heights.</p>}
        </article>
        {calculation.type === 'efhw' && <article className="caution-card">
          <p className="eyebrow">EFHW safety and installation</p>
          <h3>High voltage does not mean no return current</h3>
          <p>The feedpoint and far end are high-voltage points: keep them out of reach and away from combustible material and power lines. The system still needs an intentional RF return path and common-mode-current plan. Transformer loss, heating, core saturation, and voltage rating must be checked at the intended power.</p>
        </article>}
        {calculation.type === 'ocfd' && <article className="caution-card">
          <p className="eyebrow">OCFD matching and balance</p>
          <h3>The feedpoint is deliberately unbalanced</h3>
          <p>Use a current balun rated for the intended power and provide effective common-mode choking. Feedline routing, antenna height, split percentage, and nearby conductors affect the impedance on every band; verify each intended band with an analyser and expect some installations to require a tuner.</p>
        </article>}
        {calculation.type === 'jpole' && <article className="caution-card">
          <p className="eyebrow">J-pole tuning and installation</p>
          <h3>The tap is part of the matching network</h3>
          <p>Keep the quarter-wave section parallel and clear of conductive supports. Adjust the coax tap and trim the elements in the documented 1:3 proportion while measuring SWR. Add feedline choking if common-mode current is present. A low SWR on a harmonic does not guarantee a useful radiation pattern.</p>
        </article>}
        {calculation.type === 'slim-jim' && <article className="caution-card">
          <p className="eyebrow">Slim Jim construction and tuning</p>
          <h3>The gap and parallel spacing are electrical parts</h3>
          <p>Keep the antenna vertical, the conductors parallel, and the shorted bottom intact. Tune with an analyser by adjusting the tap, gap, and element ends in small steps. Add a feedline choke if common-mode current is present, and do not assume a good match on another band implies a useful pattern.</p>
        </article>}
        {calculation.type === 'moxon' && <article className="caution-card">
          <p className="eyebrow">Moxon construction and pattern</p>
          <h3>Gap accuracy protects the rear null</h3>
          <p>Hold both C gaps and the parallel end spacing accurately; small geometry errors can degrade the intended pattern. Use a balanced feed arrangement and common-mode choke, then verify resonance with an analyser. Gain, front-to-back ratio, and installed pattern depend on height, ground, materials, and tolerances and are not simulated here.</p>
        </article>}
        {calculation.type === 'yagi' && <article className="caution-card">
          <p className="eyebrow">Yagi matching and applicability</p>
          <h3>Scaled dimensions do not guarantee a 50 Ω feed</h3>
          <p>The NBS tests used a folded driven element, a non-conductive boom, and a matching network. A split dipole, different element diameter, conductive through-boom mounting, or nearby mast changes resonance and impedance. The historical reference measured 7.1 dB over a dipole under its test conditions; this tool does not predict installed gain, front-to-back ratio, bandwidth, or SWR.</p>
        </article>}
        {calculation.type === 'ground-mounted-vertical' && <article className="caution-card">
          <p className="eyebrow">Vertical ground system</p>
          <h3>A ground rod is not an RF radial field</h3>
          <p>Bond the coax shield to the radial junction and follow applicable lightning and electrical-safety grounding rules, but do not treat a safety ground rod as the antenna’s missing half. Ground conductivity, radial count and length, buried-wire loss, base hardware, and nearby conductors affect efficiency and feed impedance. Expect roughly 30–35 Ω only for favourable full-size systems and plan to measure and match the installed antenna.</p>
        </article>}
        <article className="provenance-card">
          <p className="eyebrow">Method and sources</p>
          <h3>Model {model.version}</h3>
          <p>{calculation.type === 'moxon' ? 'The wavelength uses the exact SI speed of light in vacuum. Cebik’s regression converts frequency and constant conductor diameter into the A–E construction geometry.' : calculation.type === 'yagi' ? 'The wavelength uses the exact SI speed of light in vacuum. Dimensions reproduce the National Bureau of Standards three-element, 0.4-wavelength reference design at its documented diameter ratio.' : 'The wavelength uses the exact SI speed of light in vacuum. Empirical factors provide practical wire-cutting estimates and remain adjustable for conductor and installation differences.'}</p>
          <ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
          <small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small>
        </article>
      </div>}
    </section>
  );
}

function NumberField({ label, value, min, max, step, unit, help, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; onChange: (value: number) => void }) {
  return <label className="field">
    <span>{label}</span>
    <span className="input-with-unit"><input aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span>
    <small>{help}</small>
  </label>;
}

type Calculation = NonNullable<
  | { type: 'dipole'; value: ReturnType<typeof calculateHalfWaveDipole> }
  | { type: 'inverted-v'; value: ReturnType<typeof calculateInvertedV> }
  | { type: 'efhw'; value: ReturnType<typeof calculateEfhw> }
  | { type: 'ocfd'; value: ReturnType<typeof calculateOcfd> }
  | { type: 'jpole'; value: ReturnType<typeof calculateJpole> }
  | { type: 'slim-jim'; value: ReturnType<typeof calculateSlimJim> }
  | { type: 'moxon'; value: ReturnType<typeof calculateMoxon> }
  | { type: 'yagi'; value: ReturnType<typeof calculateBasicYagi> }
  | { type: 'ground-mounted-vertical'; value: ReturnType<typeof calculateGroundMountedVertical> }
  | { type: 'ground-plane'; value: ReturnType<typeof calculateGroundPlane> }
  | { type: 'full-wave-loop'; value: ReturnType<typeof calculateFullWaveLoop> }
  | null
>;

function ResultSummary({ calculation, unitSystem, radialCount, loopShape }: { calculation: Calculation; unitSystem: UnitSystem; radialCount: number; loopShape: LoopShape }) {
  let headline = '';
  let primary = '';
  let details: Array<[string, string]> = [];
  if (calculation.type === 'dipole') {
    headline = 'Cut two equal legs'; primary = `${formatLength(calculation.value.cutLegMetres, unitSystem)} each`;
    details = [['Total cut length', formatLength(calculation.value.cutTotalMetres, unitSystem)], ['Resonant estimate', formatLength(calculation.value.resonantTotalMetres, unitSystem)]];
  } else if (calculation.type === 'inverted-v') {
    headline = 'Cut two equal sloping legs'; primary = `${formatLength(calculation.value.legMetres, unitSystem)} each`;
    details = [['Endpoint span', formatLength(calculation.value.endpointSpanMetres, unitSystem)], ['Vertical drop', formatLength(calculation.value.apexDropMetres, unitSystem)]];
  } else if (calculation.type === 'efhw') {
    headline = 'Cut one half-wave radiator'; primary = formatLength(calculation.value.radiatorMetres, unitSystem);
    details = [['Nominal transformed impedance', `${calculation.value.transformedImpedanceOhms.toFixed(1)} Ω`], ['Transformer turns ratio', `${calculation.value.turnsRatio.toFixed(2)} : 1`]];
  } else if (calculation.type === 'ocfd') {
    headline = 'Cut two unequal legs'; primary = `${formatLength(calculation.value.shortLegMetres, unitSystem)} + ${formatLength(calculation.value.longLegMetres, unitSystem)}`;
    details = [['Total cut length', formatLength(calculation.value.cutLengthMetres, unitSystem)], ['Nominal transformed impedance', `${calculation.value.transformedImpedanceOhms.toFixed(1)} Ω`], ['Long-to-short ratio', `${calculation.value.legLengthRatio.toFixed(2)} : 1`]];
  } else if (calculation.type === 'jpole') {
    headline = 'Cut the parallel J elements'; primary = formatLength(calculation.value.longElementMetres, unitSystem);
    details = [['Quarter-wave matching stub', formatLength(calculation.value.matchingStubMetres, unitSystem)], ['Half-wave radiator section', formatLength(calculation.value.halfWaveRadiatorMetres, unitSystem)], ['Starting coax tap height', formatLength(calculation.value.feedpointFromShortMetres, unitSystem)]];
  } else if (calculation.type === 'slim-jim') {
    headline = 'Build the folded vertical'; primary = formatLength(calculation.value.overallHeightMetres, unitSystem);
    details = [['Quarter-wave matching stub', formatLength(calculation.value.matchingStubMetres, unitSystem)], ['Upper folded section', formatLength(calculation.value.upperFoldedSectionMetres, unitSystem)], ['Interruption gap', formatLength(calculation.value.interruptionGapMetres, unitSystem)], ['Total conductor', formatLength(calculation.value.totalConductorMetres, unitSystem)]];
  } else if (calculation.type === 'moxon') {
    headline = 'Build driven element and reflector'; primary = `${formatLength(calculation.value.aMetres, unitSystem)} × ${formatLength(calculation.value.eMetres, unitSystem)}`;
    details = [['Driven element', formatLength(calculation.value.drivenElementMetres, unitSystem)], ['Reflector', formatLength(calculation.value.reflectorMetres, unitSystem)], ['Critical tip gap', formatLength(calculation.value.cMetres, unitSystem)], ['Total conductor', formatLength(calculation.value.totalConductorMetres, unitSystem)]];
  } else if (calculation.type === 'yagi') {
    headline = 'Cut three boom-mounted elements'; primary = `${formatLength(calculation.value.boomLengthMetres, unitSystem)} boom`;
    details = [['Reflector', formatLength(calculation.value.reflectorMetres, unitSystem)], ['Driven element', formatLength(calculation.value.drivenElementMetres, unitSystem)], ['Director', formatLength(calculation.value.directorMetres, unitSystem)], ['Reference element diameter', formatLength(calculation.value.referenceElementDiameterMetres, unitSystem)], ['Maximum reference tolerance', `± ${formatLength(calculation.value.constructionToleranceMetres, unitSystem)}`]];
  } else if (calculation.type === 'ground-mounted-vertical') {
    headline = 'Build the radiator and radial field'; primary = `${formatLength(calculation.value.radiatorMetres, unitSystem)} radiator`;
    details = [[`${calculation.value.radialCount} radial wires`, formatLength(calculation.value.totalRadialWireMetres, unitSystem)], ['Each radial', formatLength(calculation.value.radialMetres, unitSystem)], ['Radial-field diameter', formatLength(calculation.value.radialFieldDiameterMetres, unitSystem)], ['Total conductor', formatLength(calculation.value.totalConductorMetres, unitSystem)]];
  } else if (calculation.type === 'ground-plane') {
    headline = 'Cut radiator and radials'; primary = `${formatLength(calculation.value.radiatorMetres, unitSystem)} each`;
    details = [[`${radialCount} radial wires`, formatLength(calculation.value.totalRadialWireMetres, unitSystem)], ['Footprint diameter', formatLength(calculation.value.footprintDiameterMetres, unitSystem)]];
  } else {
    headline = 'Cut one continuous loop'; primary = formatLength(calculation.value.perimeterMetres, unitSystem);
    details = [[loopShape === 'circle' ? 'Diameter' : 'Each side', formatLength(calculation.value.primaryDimensionMetres, unitSystem)], ['Resonant perimeter', formatLength(calculation.value.resonantLengthMetres, unitSystem)]];
  }
  details.push(['Free-space wavelength', formatLength(calculation.value.wavelengthMetres, unitSystem)]);
  return <div className="result-summary" aria-live="polite"><p>{headline}</p><strong>{primary}</strong><dl>{details.map(([term, value]) => <div key={term}><dt>{term}</dt><dd>{value}</dd></div>)}</dl></div>;
}

function HarmonicBands({ frequencies, jurisdiction }: { frequencies: Array<{ multiple: number; frequencyMHz: number }>; jurisdiction: JurisdictionCode }) {
  return <section className="harmonic-panel" aria-labelledby="harmonic-title">
    <div><p className="eyebrow">Harmonic-use context</p><h3 id="harmonic-title">Candidate resonances from the fundamental</h3></div>
    <div className="harmonic-grid">{frequencies.map(({ multiple, frequencyMHz }) => {
      const band = findBandForFrequency(frequencyMHz, jurisdiction);
      return <article key={multiple}><span>{multiple}×</span><strong>{frequencyMHz.toFixed(3)} MHz</strong><small>{band ? `${band.label} allocation` : 'No matching listed allocation'}</small></article>;
    })}</div>
    <p>These are mathematical harmonics, not a promise of an acceptable match. Transformer response, wire velocity, installation geometry, and band-specific tuning shift the usable frequencies.</p>
  </section>;
}
