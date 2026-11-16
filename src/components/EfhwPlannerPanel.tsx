/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import type { EfhwDeployment, EfhwSloperFeedPosition } from '../calculators/designs';
import { feetToMetres, metresToFeet, type UnitSystem } from '../lib/units';
import { HelpTip, StepByStepHelp } from './ContextHelp';

interface ControlsProps {
  deployment: EfhwDeployment;
  setDeployment: (deployment: EfhwDeployment) => void;
  baseHeightMetres: number;
  setBaseHeightMetres: (heightMetres: number) => void;
  sloperAngleDegrees: number;
  setSloperAngleDegrees: (angleDegrees: number) => void;
  sloperFeedPosition: EfhwSloperFeedPosition;
  setSloperFeedPosition: (position: EfhwSloperFeedPosition) => void;
  invertedLVerticalPercent: number;
  setInvertedLVerticalPercent: (percent: number) => void;
  unitSystem: UnitSystem;
}

export function EfhwGuide() {
  return <StepByStepHelp title="Build and tune an EFHW" intro="Use this sequence to turn the calculated wire length and selected portable layout into a measured antenna system. Experienced builders can leave the guide closed." steps={[
    { title: 'Choose the fundamental', detail: 'Design for the lowest intended band and select the frequency where you want the first resonance.' },
    { title: 'Plan the installed shape', detail: 'Choose horizontal, sloper, or inverted-L geometry, then confirm supports, wire heights, endpoint clearance, transformer access, and the complete feedline route.' },
    { title: 'Plan the RF return and common mode', detail: 'Select an intentional return-path strategy and choking arrangement for the actual transformer, feedline length, route, bands, and operating position.' },
    { title: 'Select a documented transformer', detail: 'Choose an impedance ratio, core, winding, insulation, and enclosure suited to the intended frequencies, power, duty cycle, and environment.' },
    { title: 'Cut long, install, then measure', detail: 'Keep the cutting reserve outside the planned finished geometry. Raise the complete antenna in its final shape before evaluating impedance or resonance.' },
    { title: 'Tune and verify every band', detail: 'Measure the fundamental first, trim in small steps, then check impedance, transformer heating, common-mode current, clearance, and pattern suitability on every intended band.' }
  ]} limit="The layout is support geometry for one wire length. Bending or sloping the wire changes coupling, impedance, common mode, and pattern. This calculator does not design or power-rate a transformer, prescribe a universal counterpoise, establish structural safety, or guarantee a multiband match." />;
}

export function EfhwDeploymentControls({ deployment, setDeployment, baseHeightMetres, setBaseHeightMetres, sloperAngleDegrees, setSloperAngleDegrees, sloperFeedPosition, setSloperFeedPosition, invertedLVerticalPercent, setInvertedLVerticalPercent, unitSystem }: ControlsProps) {
  const shownHeight = unitSystem === 'metric' ? baseHeightMetres : metresToFeet(baseHeightMetres);
  const heightUnit = unitSystem === 'metric' ? 'm' : 'ft';
  return <fieldset className="efhw-deployment-editor">
    <legend>Portable deployment geometry</legend>
    <div className="field"><span className="field-label-with-help"><span>Wire layout</span><HelpTip label="EFHW wire layout">ARRL Field Day guidance identifies horizontal, sloping, and L-shaped EFHW installations. The same wire length can be routed in these shapes, but the installed impedance, common-mode current, and pattern still change and must be measured.</HelpTip></span><div className="segmented-control" role="group" aria-label="EFHW wire layout"><button type="button" className={deployment === 'horizontal' ? 'is-selected' : ''} aria-pressed={deployment === 'horizontal'} onClick={() => setDeployment('horizontal')}>Horizontal</button><button type="button" className={deployment === 'sloper' ? 'is-selected' : ''} aria-pressed={deployment === 'sloper'} onClick={() => setDeployment('sloper')}>Sloper</button><button type="button" className={deployment === 'inverted-l' ? 'is-selected' : ''} aria-pressed={deployment === 'inverted-l'} onClick={() => setDeployment('inverted-l')}>Inverted-L</button></div><small>Layout changes support geometry only; it does not preserve or predict the installed electrical result.</small></div>
    <label className="field"><span className="field-label-with-help"><span>{deployment === 'sloper' ? 'Lower wire-end height' : 'Transformer feedpoint height'}</span><HelpTip label="EFHW deployment reference height">{deployment === 'sloper' ? 'Height above the local surface at the lower end of the sloping wire. The transformer position determines whether this is the feedpoint or the far wire end.' : 'Height above the local surface at the transformer and wire connection.'} This is a site-planning input, not an electrically optimum height.</HelpTip></span><span className="input-with-unit"><input aria-label="EFHW deployment reference height" type="number" min="0" max={unitSystem === 'metric' ? 10_000 : 32_808} step={unitSystem === 'metric' ? 0.1 : 0.25} value={Number(shownHeight.toFixed(3))} onChange={(event) => setBaseHeightMetres(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{heightUnit}</span></span><small>{deployment === 'sloper' ? 'The result reports the transformer and far-end heights after applying the selected slope.' : 'Keep the transformer, wire, connectors, and feedline transition inaccessible during transmission.'}</small></label>
    {deployment === 'sloper' && <><label className="field"><span className="field-label-with-help"><span>Wire angle above horizontal</span><HelpTip label="EFHW sloper angle">The calculator treats the finished wire as a straight taut segment and resolves it into horizontal span and vertical rise. Sag and support movement are not modelled.</HelpTip></span><span className="input-with-unit"><input aria-label="EFHW sloper angle" type="number" min="5" max="80" step="1" value={sloperAngleDegrees} onChange={(event) => setSloperAngleDegrees(Number(event.target.value))} /><span>°</span></span><small>Five to 80 degrees; verify real sag, attachment positions, and endpoint clearance.</small></label><div className="field"><span className="field-label-with-help"><span>Transformer end of slope</span><HelpTip label="EFHW sloper feed position">Placing the transformer at the lower end often improves access but puts a high-voltage wire end aloft. A transformer at the upper end needs safe installation and feedline support; the far wire end must still remain above ground and inaccessible.</HelpTip></span><div className="segmented-control" role="group" aria-label="EFHW sloper transformer position"><button type="button" className={sloperFeedPosition === 'lower' ? 'is-selected' : ''} aria-pressed={sloperFeedPosition === 'lower'} onClick={() => setSloperFeedPosition('lower')}>Lower end</button><button type="button" className={sloperFeedPosition === 'upper' ? 'is-selected' : ''} aria-pressed={sloperFeedPosition === 'upper'} onClick={() => setSloperFeedPosition('upper')}>Upper end</button></div><small>The drawing reports both endpoint heights from the selected transformer position.</small></div></>}
    {deployment === 'inverted-l' && <label className="field"><span className="field-label-with-help"><span>Vertical share of finished wire</span><HelpTip label="EFHW inverted-L vertical share">This divides the finished target wire into a vertical rise from the transformer and a horizontal top section. It is geometry only; the bend location is not an electrical optimization.</HelpTip></span><span className="input-with-unit"><input aria-label="EFHW inverted-L vertical share" type="number" min="10" max="90" step="1" value={invertedLVerticalPercent} onChange={(event) => setInvertedLVerticalPercent(Number(event.target.value))} /><span>%</span></span><small>Ten to 90 percent; the remaining finished wire forms the horizontal section.</small></label>}
  </fieldset>;
}
