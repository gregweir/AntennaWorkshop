/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { useId, useMemo, useState, type ReactNode } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { ANTENNA_MODELS, calculateBasicYagi, calculateEfhw, calculateFanDipole, calculateFullWaveLoop, calculateGroundMountedVertical, calculateGroundPlane, calculateInvertedV, calculateJpole, calculateMoxon, calculateOcfd, calculateSlimJim, type LoopShape } from '../calculators/designs';
import { calculateLargestAntennaDimension } from '../calculators/antennaEnvelope';
import { calculateHalfWaveDipole, HALF_WAVE_DIPOLE_MODEL } from '../calculators/dipole';
import { calculateDoublet, DOUBLET_MODEL } from '../calculators/doublet';
import { calculateLoadedDipole, calculateLoadedVertical, LOADED_ANTENNA_MODEL } from '../calculators/loadedAntennas';
import { calculateTrapDipole, TRAP_DIPOLE_MODEL } from '../calculators/trapDipole';
import { calculateSmallTransmittingLoop, SMALL_TRANSMITTING_LOOP_MODEL } from '../calculators/smallTransmittingLoop';
import { calculatePhasedWireCollinear, PHASED_WIRE_COLLINEAR_MODEL } from '../calculators/phasedWireCollinear';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import { createAntennaDesignHandoff, type AntennaDesignHandoff } from '../workflows/stationSourceWorkflow';
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
import { FanDipoleDiagram } from './FanDipoleDiagram';
import { DoubletDiagram } from './DoubletDiagram';
import { LoadedDipoleDiagram } from './LoadedDipoleDiagram';
import { LoadedVerticalDiagram } from './LoadedVerticalDiagram';
import { TrapDipoleDiagram } from './TrapDipoleDiagram';
import { AirCoreCoilPanel } from './AirCoreCoilPanel';
import { TrapCommissioningPanel } from './TrapCommissioningPanel';
import { SmallLoopDiagram } from './SmallLoopDiagram';
import { PhasedWireCollinearDiagram } from './PhasedWireCollinearDiagram';
import { HelpTip, StepByStepHelp } from './ContextHelp';

type AntennaType = 'dipole' | 'fan-dipole' | 'doublet' | 'phased-collinear' | 'loaded-dipole' | 'trap-dipole' | 'small-loop' | 'inverted-v' | 'efhw' | 'ocfd' | 'jpole' | 'slim-jim' | 'moxon' | 'yagi' | 'loaded-vertical' | 'ground-mounted-vertical' | 'ground-plane' | 'full-wave-loop';

const designs: Record<AntennaType, { name: string; short: string; description: string }> = {
  dipole: { name: 'Centre-fed half-wave dipole', short: 'Dipole', description: 'Two straight legs' },
  'fan-dipole': { name: 'Multiband fan dipole', short: 'Fan dipole', description: 'Parallel resonant wire pairs' },
  doublet: { name: 'Balanced-line multiband doublet', short: 'Doublet', description: 'Equal legs · balanced line · tuner' },
  'phased-collinear': { name: 'Phased wire collinear array', short: 'Collinear', description: 'Equal half waves · phasing stubs' },
  'loaded-dipole': { name: 'Inductively loaded dipole', short: 'Loaded dipole', description: 'Shortened span · two series coils' },
  'trap-dipole': { name: 'Two-band parallel-LC trap dipole', short: 'Trap dipole', description: 'Two bands · matched parallel traps' },
  'small-loop': { name: 'Small transmitting loop', short: 'Small loop', description: 'Circular loop · measured-L tuning' },
  'inverted-v': { name: 'Inverted-V dipole', short: 'Inverted-V', description: 'Single high support' },
  efhw: { name: 'End-fed half-wave (EFHW)', short: 'EFHW', description: 'End transformer · multiband potential' },
  ocfd: { name: 'Off-centre-fed dipole (OCFD)', short: 'OCFD', description: 'Unequal legs · multiband potential' },
  jpole: { name: 'J-pole vertical', short: 'J-pole', description: 'Vertical radiator · matching stub' },
  'slim-jim': { name: 'Slim Jim vertical', short: 'Slim Jim', description: 'Folded radiator · interrupted side' },
  moxon: { name: 'Moxon rectangle', short: 'Moxon', description: 'Two-element directional rectangle' },
  yagi: { name: 'Three-element Yagi', short: 'Basic Yagi', description: 'Reflector · driven · director' },
  'loaded-vertical': { name: 'Inductively loaded vertical', short: 'Loaded vertical', description: 'Shortened radiator · movable coil' },
  'ground-mounted-vertical': { name: 'Ground-mounted quarter-wave vertical', short: 'Ground vertical', description: 'Ground-level base · radial field' },
  'ground-plane': { name: 'Quarter-wave ground plane', short: 'Ground plane', description: 'Elevated vertical · sloping radials' },
  'full-wave-loop': { name: 'Full-wave wire loop', short: 'Full-wave loop', description: 'Square, triangle, or circle' }
};

interface Props {
  jurisdiction: JurisdictionCode;
  unitSystem: UnitSystem;
  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;
  onContinueToSystem: (handoff: AntennaDesignHandoff) => void;
}

export function AntennaWorkbench({ jurisdiction, unitSystem, advancedOpen, setAdvancedOpen, onContinueToSystem }: Props) {
  const [antennaType, setAntennaType] = useState<AntennaType>('dipole');
  const [frequencyText, setFrequencyText] = useState('14.200');
  const [fanAdditionalFrequencyTexts, setFanAdditionalFrequencyTexts] = useState(['21.200', '28.400']);
  const [doubletLineLengthMetres, setDoubletLineLengthMetres] = useState(12);
  const [doubletLineVelocityFactor, setDoubletLineVelocityFactor] = useState(0.95);
  const [doubletLineImpedanceOhms, setDoubletLineImpedanceOhms] = useState(450);
  const [doubletCheckFrequencyText, setDoubletCheckFrequencyText] = useState('14.200');
  const [doubletTunerInterface, setDoubletTunerInterface] = useState<'balanced' | 'external-balun'>('balanced');
  const [collinearElementCount, setCollinearElementCount] = useState(4);
  const [collinearPhasingVelocityFactor, setCollinearPhasingVelocityFactor] = useState(0.95);
  const [collinearStubTrimAllowancePercent, setCollinearStubTrimAllowancePercent] = useState(2.5);
  const [loadedDipoleSpanMetres, setLoadedDipoleSpanMetres] = useState(7.5);
  const [loadedDipoleCoilPositionMetres, setLoadedDipoleCoilPositionMetres] = useState(2.5);
  const [loadedDipoleHeightMetres, setLoadedDipoleHeightMetres] = useState(8);
  const [loadedDipoleConductorDiameterMillimetres, setLoadedDipoleConductorDiameterMillimetres] = useState(2);
  const [trapUpperFrequencyText, setTrapUpperFrequencyText] = useState('21.200');
  const [trapDipoleSpanMetres, setTrapDipoleSpanMetres] = useState(7.5);
  const [trapPositionMetres, setTrapPositionMetres] = useState(2.5);
  const [trapDipoleHeightMetres, setTrapDipoleHeightMetres] = useState(8);
  const [trapDipoleConductorDiameterMillimetres, setTrapDipoleConductorDiameterMillimetres] = useState(2);
  const [smallLoopUpperFrequencyText, setSmallLoopUpperFrequencyText] = useState('14.350');
  const [smallLoopCircumferenceMetres, setSmallLoopCircumferenceMetres] = useState(3);
  const [smallLoopMeasuredInductanceMicrohenries, setSmallLoopMeasuredInductanceMicrohenries] = useState(2.5);
  const [smallLoopStrayCapacitancePicofarads, setSmallLoopStrayCapacitancePicofarads] = useState(10);
  const [smallLoopCapacitorMinimumPicofarads, setSmallLoopCapacitorMinimumPicofarads] = useState(5);
  const [smallLoopCapacitorMaximumPicofarads, setSmallLoopCapacitorMaximumPicofarads] = useState(100);
  const [loadedVerticalHeightMetres, setLoadedVerticalHeightMetres] = useState(3.5);
  const [loadedVerticalCoilPositionMetres, setLoadedVerticalCoilPositionMetres] = useState(0);
  const [loadedVerticalConductorDiameterMillimetres, setLoadedVerticalConductorDiameterMillimetres] = useState(25);
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
  const shownDoubletLineLength = unitSystem === 'metric' ? doubletLineLengthMetres : metresToFeet(doubletLineLengthMetres);
  const shownLoadedDipoleSpan = unitSystem === 'metric' ? loadedDipoleSpanMetres : metresToFeet(loadedDipoleSpanMetres);
  const shownLoadedDipoleCoilPosition = unitSystem === 'metric' ? loadedDipoleCoilPositionMetres : metresToFeet(loadedDipoleCoilPositionMetres);
  const shownLoadedDipoleHeight = unitSystem === 'metric' ? loadedDipoleHeightMetres : metresToFeet(loadedDipoleHeightMetres);
  const shownLoadedDipoleDiameter = unitSystem === 'metric' ? loadedDipoleConductorDiameterMillimetres : loadedDipoleConductorDiameterMillimetres / 25.4;
  const shownTrapDipoleSpan = unitSystem === 'metric' ? trapDipoleSpanMetres : metresToFeet(trapDipoleSpanMetres);
  const shownTrapPosition = unitSystem === 'metric' ? trapPositionMetres : metresToFeet(trapPositionMetres);
  const shownTrapDipoleHeight = unitSystem === 'metric' ? trapDipoleHeightMetres : metresToFeet(trapDipoleHeightMetres);
  const shownTrapDipoleDiameter = unitSystem === 'metric' ? trapDipoleConductorDiameterMillimetres : trapDipoleConductorDiameterMillimetres / 25.4;
  const shownSmallLoopCircumference = unitSystem === 'metric' ? smallLoopCircumferenceMetres : metresToFeet(smallLoopCircumferenceMetres);
  const shownLoadedVerticalHeight = unitSystem === 'metric' ? loadedVerticalHeightMetres : metresToFeet(loadedVerticalHeightMetres);
  const shownLoadedVerticalCoilPosition = unitSystem === 'metric' ? loadedVerticalCoilPositionMetres : metresToFeet(loadedVerticalCoilPositionMetres);
  const shownLoadedVerticalDiameter = unitSystem === 'metric' ? loadedVerticalConductorDiameterMillimetres : loadedVerticalConductorDiameterMillimetres / 25.4;
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const jurisdictionName = jurisdictionProfiles.find((profile) => profile.code === jurisdiction)?.name ?? 'Unknown';

  const calculation = useMemo(() => {
    try {
      const common = { frequencyMHz, lengthCorrectionFactor, trimAllowancePercent };
      if (antennaType === 'dipole') return { type: antennaType, value: calculateHalfWaveDipole(common) } as const;
      if (antennaType === 'fan-dipole') return { type: antennaType, value: calculateFanDipole({ frequenciesMHz: [frequencyMHz, ...fanAdditionalFrequencyTexts.map(Number)], lengthCorrectionFactor, trimAllowancePercent }) } as const;
      if (antennaType === 'doublet') return { type: antennaType, value: calculateDoublet({ lowestFrequencyMHz: frequencyMHz, lengthCorrectionFactor, trimAllowancePercent, balancedLineLengthMetres: doubletLineLengthMetres, balancedLineVelocityFactor: doubletLineVelocityFactor, balancedLineImpedanceOhms: doubletLineImpedanceOhms, lineCheckFrequencyMHz: Number(doubletCheckFrequencyText) }) } as const;
      if (antennaType === 'phased-collinear') return { type: antennaType, value: calculatePhasedWireCollinear({ frequencyMHz, elementCount: collinearElementCount, radiatorCorrectionFactor: lengthCorrectionFactor, radiatorTrimAllowancePercent: trimAllowancePercent, phasingLineVelocityFactor: collinearPhasingVelocityFactor, phasingStubTrimAllowancePercent: collinearStubTrimAllowancePercent }) } as const;
      if (antennaType === 'loaded-dipole') return { type: antennaType, value: calculateLoadedDipole({ frequencyMHz, lengthCorrectionFactor, totalSpanMetres: loadedDipoleSpanMetres, loadingPointFromCentreMetres: loadedDipoleCoilPositionMetres, heightAboveGroundMetres: loadedDipoleHeightMetres, conductorDiameterMillimetres: loadedDipoleConductorDiameterMillimetres }) } as const;
      if (antennaType === 'trap-dipole') return { type: antennaType, value: calculateTrapDipole({ lowerFrequencyMHz: frequencyMHz, upperFrequencyMHz: Number(trapUpperFrequencyText), lengthCorrectionFactor, totalSpanMetres: trapDipoleSpanMetres, trapPositionFromCentreMetres: trapPositionMetres, heightAboveGroundMetres: trapDipoleHeightMetres, conductorDiameterMillimetres: trapDipoleConductorDiameterMillimetres }) } as const;
      if (antennaType === 'small-loop') return { type: antennaType, value: calculateSmallTransmittingLoop({ lowerFrequencyMHz: frequencyMHz, upperFrequencyMHz: Number(smallLoopUpperFrequencyText), circumferenceMetres: smallLoopCircumferenceMetres, measuredInductanceMicrohenries: smallLoopMeasuredInductanceMicrohenries, strayCapacitancePicofarads: smallLoopStrayCapacitancePicofarads, capacitorMinimumPicofarads: smallLoopCapacitorMinimumPicofarads, capacitorMaximumPicofarads: smallLoopCapacitorMaximumPicofarads }) } as const;
      if (antennaType === 'inverted-v') return { type: antennaType, value: calculateInvertedV({ ...common, includedAngleDegrees }) } as const;
      if (antennaType === 'efhw') return { type: antennaType, value: calculateEfhw({ ...common, transformerRatio, estimatedEndImpedanceOhms }) } as const;
      if (antennaType === 'ocfd') return { type: antennaType, value: calculateOcfd({ ...common, transformerRatio, feedpointPercentFromEnd, estimatedFeedpointImpedanceOhms: estimatedOcfdImpedanceOhms }) } as const;
      if (antennaType === 'jpole') return { type: antennaType, value: calculateJpole({ ...common, feedpointPercentOfStub: jpoleTapPercent }) } as const;
      if (antennaType === 'slim-jim') return { type: antennaType, value: calculateSlimJim({ ...common, feedpointPercentOfStub: jpoleTapPercent, gapPercentOfStub: slimJimGapPercent }) } as const;
      if (antennaType === 'moxon') return { type: antennaType, value: calculateMoxon({ frequencyMHz, conductorDiameterMillimetres: moxonConductorDiameterMillimetres }) } as const;
      if (antennaType === 'yagi') return { type: antennaType, value: calculateBasicYagi({ frequencyMHz }) } as const;
      if (antennaType === 'loaded-vertical') return { type: antennaType, value: calculateLoadedVertical({ frequencyMHz, lengthCorrectionFactor, radiatorHeightMetres: loadedVerticalHeightMetres, loadingPointFromBaseMetres: loadedVerticalCoilPositionMetres, conductorDiameterMillimetres: loadedVerticalConductorDiameterMillimetres }) } as const;
      if (antennaType === 'ground-mounted-vertical') return { type: antennaType, value: calculateGroundMountedVertical({ ...common, radialCount: groundRadialCount, radialLengthMultiplier: groundRadialLengthMultiplier }) } as const;
      if (antennaType === 'ground-plane') return { type: antennaType, value: calculateGroundPlane({ ...common, radialCount, radialSlopeDegrees }) } as const;
      return { type: antennaType, value: calculateFullWaveLoop({ ...common, shape: loopShape }) } as const;
    } catch {
      return null;
    }
  }, [antennaType, collinearElementCount, collinearPhasingVelocityFactor, collinearStubTrimAllowancePercent, doubletCheckFrequencyText, doubletLineImpedanceOhms, doubletLineLengthMetres, doubletLineVelocityFactor, estimatedEndImpedanceOhms, estimatedOcfdImpedanceOhms, fanAdditionalFrequencyTexts, feedpointPercentFromEnd, frequencyMHz, groundRadialCount, groundRadialLengthMultiplier, includedAngleDegrees, jpoleTapPercent, lengthCorrectionFactor, loadedDipoleCoilPositionMetres, loadedDipoleConductorDiameterMillimetres, loadedDipoleHeightMetres, loadedDipoleSpanMetres, loadedVerticalCoilPositionMetres, loadedVerticalConductorDiameterMillimetres, loadedVerticalHeightMetres, loopShape, moxonConductorDiameterMillimetres, radialCount, radialSlopeDegrees, slimJimGapPercent, smallLoopCapacitorMaximumPicofarads, smallLoopCapacitorMinimumPicofarads, smallLoopCircumferenceMetres, smallLoopMeasuredInductanceMicrohenries, smallLoopStrayCapacitancePicofarads, smallLoopUpperFrequencyText, transformerRatio, trapDipoleConductorDiameterMillimetres, trapDipoleHeightMetres, trapDipoleSpanMetres, trapPositionMetres, trapUpperFrequencyText, trimAllowancePercent]);

  const model = antennaType === 'dipole'
    ? HALF_WAVE_DIPOLE_MODEL
    : antennaType === 'fan-dipole'
      ? ANTENNA_MODELS.fanDipole
      : antennaType === 'doublet'
        ? DOUBLET_MODEL
        : antennaType === 'phased-collinear'
          ? PHASED_WIRE_COLLINEAR_MODEL
        : antennaType === 'loaded-dipole' || antennaType === 'loaded-vertical'
          ? LOADED_ANTENNA_MODEL
          : antennaType === 'trap-dipole'
            ? TRAP_DIPOLE_MODEL
            : antennaType === 'small-loop'
              ? SMALL_TRANSMITTING_LOOP_MODEL
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
  const handoffFrequencyMHz = calculation?.type === 'small-loop' ? calculation.value.centreFrequencyMHz : frequencyMHz;

  const recommendedFactor = antennaType === 'full-wave-loop' ? 1.02 : antennaType === 'jpole' || antennaType === 'slim-jim' ? (jpoleConstruction === 'twinlead' ? 0.83 : 0.93) : 0.95;
  const lengthCorrectionTooltip = antennaType === 'trap-dipole'
    ? 'This factor defines the practical quarter-wave references used at both design frequencies. The published worked example uses about 0.95. Finished traps, wire, height, ground, and nearby objects still require installed tuning on both bands.'
    : antennaType === 'loaded-dipole' || antennaType === 'loaded-vertical'
    ? 'This factor defines the practical quarter-wave reference used by the loading model. The published worked example uses about 0.95. Coil construction, conductor geometry, ground, and nearby objects still require installed tuning.'
    : antennaType === 'efhw'
    ? 'This factor scales the free-space half-wave estimate for practical wire construction. It does not correct the transformer, feedline, return path, or effects of the installed surroundings.'
    : antennaType === 'ocfd'
      ? 'This factor scales the complete free-space half-wave estimate before it is divided at the selected feedpoint. It does not predict the installed feedpoint impedance or correct the balun and feedline.'
      : antennaType === 'jpole' || antennaType === 'slim-jim'
        ? 'This factor scales all calculated conductor sections for the selected construction medium. It is a starting estimate: insulation, conductor size, spacing, supports, and surroundings still shift the finished antenna.'
        : antennaType === 'ground-mounted-vertical'
          ? 'This factor scales both the radiator and corrected quarter-wave radial baseline. Soil, conductor insulation, base hardware, radial layout, and nearby objects still affect the installed resonance and impedance.'
          : antennaType === 'ground-plane'
            ? 'This factor scales the elevated radiator and radial lengths together. Conductor size, radial slope, support hardware, feed arrangement, height, and surroundings still affect the installed antenna.'
            : antennaType === 'phased-collinear'
              ? 'This factor scales each free-space half-wave radiator section. Establish the electrical half-wave length with a test element made from the actual wire and insulators, then enter the measured ratio here.'
            : antennaType === 'dipole' || antennaType === 'fan-dipole' || antennaType === 'doublet' || antennaType === 'inverted-v'
              ? 'This factor scales the free-space half-wave estimate before it is divided into equal legs. Conductor insulation, diameter, support geometry, height, and surroundings still shift the installed resonance.'
              : antennaType === 'full-wave-loop'
                ? 'This factor scales the complete free-space wavelength into a practical starting perimeter. The selected shape changes the displayed side or diameter, not the total perimeter.'
      : undefined;
  const trimAllowanceTooltip = antennaType === 'efhw'
    ? 'This percentage is added after the corrected resonant estimate. Install the antenna before trimming, remove wire in small increments, and remeasure because removed wire cannot be restored easily.'
    : antennaType === 'ocfd'
      ? 'This percentage adds adjustment room to both legs after the corrected total length is divided. Install and measure before trimming, and preserve the intended split while making small changes.'
      : antennaType === 'jpole' || antennaType === 'slim-jim'
        ? 'This percentage adds adjustment room to the calculated conductor sections. Build and measure before trimming, make small changes, and preserve the intended matching-section relationships and parallel spacing.'
        : antennaType === 'ground-mounted-vertical'
          ? 'This allowance is added to the vertical radiator only; the ground-radial length uses the corrected quarter-wave baseline and selected multiplier. Install before trimming the radiator in small steps.'
          : antennaType === 'ground-plane'
            ? 'This allowance is added to both the radiator and elevated radials. Keep the radials equal and symmetrical while tuning the installed antenna.'
            : antennaType === 'phased-collinear'
              ? 'This percentage is added to every equal radiator section. Tune a representative section first, preserve equality, and keep phasing-stub adjustment separate.'
            : antennaType === 'dipole' || antennaType === 'fan-dipole' || antennaType === 'doublet' || antennaType === 'inverted-v'
              ? 'This percentage is added to the total corrected length before it is divided into equal legs. Install first, then trim both legs equally in small steps.'
              : antennaType === 'full-wave-loop'
                ? 'This percentage is added to the complete loop perimeter. Install the closed loop before trimming and preserve the intended shape and symmetry while making small changes.'
      : undefined;
  const selectDesign = (type: AntennaType) => {
    setAntennaType(type);
    setLengthCorrectionFactor(type === 'full-wave-loop' ? 1.02 : type === 'jpole' || type === 'slim-jim' ? (jpoleConstruction === 'twinlead' ? 0.83 : 0.93) : 0.95);
    if (type === 'efhw') setTransformerRatio(49);
    if (type === 'ocfd') setTransformerRatio(4);
    if (type === 'small-loop' && activeBand) {
      setFrequencyText(activeBand.lowerMHz.toFixed(activeBand.lowerMHz < 30 ? 3 : 1));
      setSmallLoopUpperFrequencyText(activeBand.upperMHz.toFixed(activeBand.upperMHz < 30 ? 3 : 1));
    }
  };

  return (
    <section className="workspace shell" id="calculator" aria-labelledby="calculator-title">
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Graphical antenna workshop</p>
          <h2 id="calculator-title">{designs[antennaType].name}</h2>
        </div>
        {antennaType !== 'moxon' && antennaType !== 'yagi' && antennaType !== 'small-loop' && <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(!advancedOpen)}>
          {advancedOpen ? 'Hide advanced' : 'Show advanced'}
        </button>}
      </div>

      <div className="design-picker" aria-label="Antenna design">
        {(Object.keys(designs) as AntennaType[]).map((type) => (
          <button key={type} type="button" aria-pressed={antennaType === type} onClick={() => selectDesign(type)}>
            <span>{designs[type].short}</span>
            <small>{designs[type].description}</small>
          </button>
        ))}
      </div>

      {antennaType === 'dipole' && <StepByStepHelp title="Build and tune a centre-fed dipole" intro="Use this sequence to turn two equal calculated legs into a measured antenna in its final support geometry. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the design frequency', detail: 'Select the frequency where you want the installed antenna to resonate, rather than relying only on the conventional band name.' },
        { title: 'Plan the installed span', detail: 'Choose supports, height, orientation, centre location, endpoint clearances, feedline route, and safe access before cutting wire.' },
        { title: 'Prepare the centre feed', detail: 'Use a mechanically secure centre insulator and balanced feed arrangement with suitable common-mode control for the installation.' },
        { title: 'Cut two equal long legs', detail: 'Retain the selected trim allowance and measure each leg from the electrical centre connection to its endpoint.' },
        { title: 'Install before measuring', detail: 'Raise the antenna in its intended position with both legs straight, equal, and clear of conductive or lossy objects.' },
        { title: 'Tune symmetrically', detail: 'Use low analyser power and remove equal small amounts from both ends, then remeasure after every change in the final geometry.' }
      ]} limit="This calculator does not predict installed feedpoint impedance, bandwidth, common-mode current, losses, support coupling, or radiation pattern." />}

      {antennaType === 'fan-dipole' && <StepByStepHelp title="Build and tune a fan dipole" intro="Use this sequence to build several resonant dipoles on one feedpoint while controlling interaction between the wire pairs. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose each operating frequency', detail: 'Set one intended resonance in every required band. The displayed lengths are independent starting points, not a prediction of the combined antenna.' },
        { title: 'Plan one balanced feedpoint', detail: 'Connect every left leg together and every right leg together at a mechanically strong centre insulator with suitable common-mode control.' },
        { title: 'Separate and support the pairs', detail: 'Use non-conductive spreaders or separate endpoint directions so adjacent wires do not touch and their spacing remains stable in wind.' },
        { title: 'Cut every pair long', detail: 'Make two equal legs for each frequency and retain the selected trim allowance. Label the pairs before installation.' },
        { title: 'Install the complete fan', detail: 'Raise all wire pairs, feedline, spacers, and supports in their final geometry before measuring any band.' },
        { title: 'Tune from highest frequency downward', detail: 'Adjust only the equal pair for the highest band first, then work toward the lowest band and repeat the sweep because every change can move another resonance.' }
      ]} limit="This calculator does not solve mutual coupling, predict the combined feedpoint impedance, guarantee a tuner-free match, or model the installed bandwidth or pattern. Closely related bands may interact strongly." />}

      {antennaType === 'doublet' && <StepByStepHelp title="Plan and commission a multiband doublet" intro="Use this sequence to treat the radiator, balanced line, tuner interface, and station grounding as one system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the lowest intended frequency', detail: 'Size the equal-leg radiator at about a half wavelength on the lowest band you expect to use; the exact length is not a promise of resonance on higher bands.' },
        { title: 'Plan the complete balanced-line route', detail: 'Measure the physical route to the tuner, keep both conductors equally exposed, avoid sharp bends, and hold the line away from metal, wet surfaces, and lossy building materials.' },
        { title: 'Choose a suitable tuner interface', detail: 'Prefer a tuner designed for balanced loads or use a documented current balun and the shortest practical low-loss coax connection. No fixed balun ratio is universally correct.' },
        { title: 'Build equal radiator legs', detail: 'Cut both legs equally, retain the selected allowance, and use a strong balanced centre connection without inserting a balun between the balanced radiator and balanced line.' },
        { title: 'Install before evaluating the match', detail: 'Raise the radiator and route the complete feed system in its final position before testing tuner range, line balance, heating, or common-mode current.' },
        { title: 'Commission every intended band', detail: 'Tune at low power, verify that the tuner and balun remain within their voltage, current, loss, and heating limits, and change line length if a particular band presents an impractical load.' }
      ]} limit="This calculator does not predict the complex antenna impedance, tuner-side load, line SWR, loss under mismatch, balun stress, tuner range, efficiency, bandwidth, or radiation pattern. The displayed line phase is descriptive only." />}

      {antennaType === 'phased-collinear' && <StepByStepHelp title="Build and commission a phased wire collinear" intro="Use this sequence to keep equal half-wave radiator sections and equal quarter-wave phase-reversing stubs as one measured array. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose one design frequency', detail: 'Use the frequency where the complete installed array should be tuned. A collinear is a narrow, interacting system rather than several independent dipoles.' },
        { title: 'Choose the number of radiator sections', detail: 'Two to eight equal half-wave sections are supported. More sections increase span, weight, support load, pattern complexity, and sensitivity to dimensional error.' },
        { title: 'Establish the electrical half wave', detail: 'Build and tune a test dipole from the actual wire, insulators, and construction method, then use its measured total length to refine the radiator correction factor.' },
        { title: 'Make identical phase-reversing stubs', detail: 'Use equal two-conductor lines, short each far end, apply the measured velocity factor, and retain separate trimming allowance for the quarter-wave electrical length.' },
        { title: 'Assemble and support the full array', detail: 'Keep every radiator equal, every stub equal, connections symmetrical, stub conductors consistently spaced, and high-voltage junctions safely insulated and strain relieved.' },
        { title: 'Engineer the feed and verify the pattern', detail: 'Use the documented odd/even current- or voltage-feed context as a starting reference, then model or measure the actual feed and matching arrangement. Install at final height, tune at low power, and verify match, common-mode current, heating, and directional behaviour.' }
      ]} limit="This construction planner does not select a feedpoint or matching network and does not predict impedance, gain, beamwidth, sidelobes, bandwidth, loss, current, voltage, common-mode behaviour, or safe power." />}

      {antennaType === 'loaded-dipole' && <StepByStepHelp title="Build and tune a loaded dipole" intro="Use this sequence to turn a space-limited span and two calculated series coils into a measured single-band antenna. Experienced builders can leave the guide closed." steps={[
        { title: 'Set the real space limit', detail: 'Enter the complete feedpoint-to-feedpoint span available after allowing safe endpoint, support, and power-line clearances.' },
        { title: 'Choose symmetric coil positions', detail: 'Measure the same distance from the centre along both legs. Moving coils outward preserves more high-current wire but generally requires more inductance.' },
        { title: 'Build two equal high-Q coils', detail: 'Use identical conductor, form, turn spacing, and weather protection. Measure the finished coils at or near the operating frequency when suitable equipment is available.' },
        { title: 'Preserve balance and strength', detail: 'Support coil and wire tension mechanically, keep both legs equal, and use a balanced feed arrangement with appropriate common-mode control.' },
        { title: 'Install before judging resonance', detail: 'Raise the complete antenna at its entered height with the final feedline, supports, and surroundings before measuring.' },
        { title: 'Tune at low power', detail: 'Adjust both coils or both outer wire sections equally in small steps, remeasure after each change, then verify heating and voltage clearance at intended power.' }
      ]} limit="This is a first-order, single-band starting model. It does not design the physical coils or predict coil Q, self-capacitance, loss, heating, voltage, feedpoint impedance, matching, bandwidth, efficiency, or radiation pattern." />}

      {antennaType === 'trap-dipole' && <StepByStepHelp title="Build and tune a two-band trap dipole" intro="Use this sequence to build two matched parallel-LC traps and commission the complete antenna on both design frequencies. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose lower and upper design frequencies', detail: 'Select the intended resonance within each operating band. The trap’s calculated parallel resonance will fall between these two frequencies, not on either one.' },
        { title: 'Enter the installed geometry', detail: 'Set the complete space-limited span, average wire height, conductor diameter, and equal centre-to-trap distance. Both wire sections must remain within the model’s quarter-wave constraints.' },
        { title: 'Select suitable components', detail: 'Choose capacitors and coil construction with suitable RF current, voltage, loss, Q, temperature stability, weather protection, and safety margin for the intended power and duty cycle.' },
        { title: 'Build and measure a matched pair', detail: 'Make both parallel LC networks mechanically identical and measure their resonant frequency and component values with suitable RF test equipment before installation.' },
        { title: 'Install symmetrically', detail: 'Place the traps at equal distances from the feedpoint, keep both wire arms equal, support trap weight and tension independently, and use an appropriate balanced feed and common-mode-control arrangement.' },
        { title: 'Tune and verify both bands', detail: 'Start at low power, adjust in small controlled steps, sweep both bands after every change, and verify trap heating, voltage clearance, feedline current, match, and stability at intended power.' }
      ]} limit="This model calculates ideal component targets, not a power-rated physical trap. It does not predict component Q, parasitics, loss, heating, voltage, bandwidth, feedpoint impedance, matching, efficiency, or radiation pattern." />}

      {antennaType === 'small-loop' && <StepByStepHelp title="Build and tune a small transmitting loop" intro="Use this sequence to plan a circular loop around its measured finished inductance and a real variable-capacitor range. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the complete tuning range', detail: 'Load an amateur band or enter the lowest and highest frequencies the finished loop must reach. The upper edge sets the strictest one-sixteenth-wavelength diameter check.' },
        { title: 'Build the main loop mechanically', detail: 'Use a continuous low-loss conductor where practical, minimize joint resistance, support the loop rigidly, and provide safe clearance around the tuning-capacitor gap.' },
        { title: 'Measure the finished loop inductance', detail: 'Measure the complete main loop with its final conductor, joints, capacitor leads, support arrangement, and documented fixture compensation rather than relying on an ideal geometry estimate.' },
        { title: 'Account for non-variable capacitance', detail: 'Estimate or measure capacitor minimum, mounting, leads, enclosure, and other stray capacitance. These all consume part of the total capacitance required for resonance.' },
        { title: 'Select and install the tuning capacitor', detail: 'Confirm that its usable RF capacitance range covers the calculation and that its RF current, voltage, loss, spacing, drive mechanism, and enclosure suit the intended service.' },
        { title: 'Develop the coupling and tune at low power', detail: 'Treat the illustrated feed loop as conceptual. Adjust the actual matching method with an analyser, keep people clear, and verify heating, arcing, stability, bandwidth, and exposure at progressively higher power.' }
      ]} limit="This planner does not estimate loop inductance from geometry or predict loss resistance, radiation resistance, efficiency, Q, bandwidth, circulating current, capacitor voltage, feed coupling, matching, pattern, exposure, or safe operating power." />}

      {antennaType === 'inverted-v' && <StepByStepHelp title="Build and tune an inverted-V" intro="Use this sequence to preserve equal sloping legs and the selected apex geometry while tuning the installed antenna. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the apex and endpoints', detail: 'Plan the apex height, endpoint locations, included angle, safe clearances, and access without treating the drawing as a support-height prescription.' },
        { title: 'Prepare the centre feed', detail: 'Use a strong centre insulator and balanced feed arrangement with suitable common-mode control at the high support.' },
        { title: 'Cut equal sloping legs', detail: 'Retain adjustment allowance on both legs and measure each from the electrical centre connection to its endpoint.' },
        { title: 'Keep both legs symmetrical', detail: 'Support both sides at the same angle and height relationship, avoiding nearby conductors, buildings, vegetation, and reachable wire ends.' },
        { title: 'Install before measuring', detail: 'Raise the complete antenna with its final feedline route before evaluating resonance or impedance.' },
        { title: 'Tune both sides equally', detail: 'Use low analyser power, trim equal small amounts from both endpoints, and recheck after every change in the installed geometry.' }
      ]} limit="The calculated span and drop describe idealized geometry, not required support heights. This tool does not predict installed impedance, bandwidth, losses, common-mode current, or pattern." />}

      {antennaType === 'efhw' && <StepByStepHelp title="Build and tune an EFHW" intro="Use this sequence to turn the calculated wire length into a measured antenna system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the fundamental', detail: 'Design for the lowest intended band and select the frequency where you want the first resonance.' },
        { title: 'Plan the installed shape', detail: 'Choose supports, clearances, transformer location, and an intentional RF return and common-mode-current strategy before cutting wire.' },
        { title: 'Select a documented transformer', detail: 'Choose an impedance ratio, core, winding, insulation, and enclosure suited to the intended frequencies, power, duty cycle, and environment.' },
        { title: 'Cut with adjustment room', detail: 'Use the calculated length as a starting point and retain the selected trim allowance; do not cut directly to a presumed final dimension.' },
        { title: 'Install before measuring', detail: 'Raise the antenna in its intended geometry with the planned return path, feedline routing, and choke in place.' },
        { title: 'Tune and verify each band', detail: 'Measure the fundamental first, trim in small steps, then check impedance, transformer heating, common-mode current, and pattern suitability on every intended band.' }
      ]} limit="This calculator does not design a transformer, prescribe a universal counterpoise, calculate component voltage or heating, or guarantee a multiband match or useful radiation pattern." />}

      {antennaType === 'ocfd' && <StepByStepHelp title="Build and tune an OCFD" intro="Use this sequence to turn the unequal-leg estimate into a measured multiband antenna system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the fundamental', detail: 'Design from the lowest intended band and choose the frequency where you want the first resonance.' },
        { title: 'Choose the installed geometry', detail: 'Plan the support heights, leg directions, feedpoint access, coax route, clearances, and nearby-conductor spacing before cutting wire.' },
        { title: 'Select the feedpoint split', detail: 'Use the percentage as a starting geometry, recognizing that the split affects leg lengths, feedpoint impedance, and the candidate multiband response.' },
        { title: 'Select balun and choking', detail: 'Choose a documented current balun and common-mode choke suited to the expected impedance range, frequencies, power, duty cycle, and environment.' },
        { title: 'Build long and install', detail: 'Retain trim allowance on both legs, preserve the selected split, and install the complete feed and choking arrangement before measuring.' },
        { title: 'Tune and verify each band', detail: 'Measure every intended band in the final geometry, trim conservatively, and check match, balun heating, common-mode current, and pattern suitability.' }
      ]} limit="This calculator does not design or power-rate a balun, predict installed impedance or radiation patterns, or guarantee an acceptable multiband match. A tuner does not correct balun heating or common-mode current." />}

      {antennaType === 'jpole' && <StepByStepHelp title="Build and tune a J-pole" intro="Use this sequence to preserve the matching-stub geometry while finding the installed resonance and coax tap. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the construction medium', detail: 'Select twin-lead or metal to load its documented starting correction factor, then plan for the actual insulation, conductor size, and supports.' },
        { title: 'Build the parallel section', detail: 'Keep the quarter-wave matching stub parallel to the lower long element with stable spacing and a reliable short at the bottom.' },
        { title: 'Plan mounting and feed routing', detail: 'Keep the matching section clear of conductive supports, route coax deliberately, and include common-mode choking when needed.' },
        { title: 'Start with adjustment room', detail: 'Retain the trim allowance and provide an adjustable, symmetrical coax-tap connection near the calculated starting height.' },
        { title: 'Install before measuring', detail: 'Place the antenna in its intended vertical position and clearance before judging resonance, impedance, or the tap location.' },
        { title: 'Tune in controlled steps', detail: 'Use low analyser power, adjust the two tap contacts together for the best match, then trim cautiously and recheck after every change.' }
      ]} limit="This calculator does not predict feedpoint impedance, conductor-spacing effects, installed pattern, bandwidth, or a universal tap position. A low SWR alone does not establish an effective radiation pattern." />}

      {antennaType === 'slim-jim' && <StepByStepHelp title="Build and tune a Slim Jim" intro="Use this sequence to preserve the folded geometry while adjusting resonance, gap, and coax tap. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the construction medium', detail: 'Select twin-lead or metal to load its documented starting correction factor, then account for actual insulation, conductor size, and supports.' },
        { title: 'Preserve the folded geometry', detail: 'Keep both conductors parallel, maintain stable spacing, and make a dependable short across the bottom.' },
        { title: 'Form the interruption gap', detail: 'Create the calculated opening without disturbing the upper folded section or allowing nearby hardware to bridge or load it.' },
        { title: 'Plan the feed and choke', detail: 'Provide adjustable paired coax contacts near the starting tap and route the feedline with suitable common-mode control.' },
        { title: 'Install before measuring', detail: 'Suspend the antenna vertically in its intended clear location before evaluating resonance, impedance, or tap position.' },
        { title: 'Tune in controlled steps', detail: 'Use low analyser power, adjust the tap contacts together, and change the gap or element ends only in small measured steps before rechecking.' }
      ]} limit="This calculator does not predict feedpoint impedance, conductor-spacing effects, installed pattern, bandwidth, or a universal gap and tap combination. A low SWR on another band does not establish a useful pattern." />}

      {antennaType === 'moxon' && <StepByStepHelp title="Build and verify a Moxon rectangle" intro="Use this sequence to preserve the calculated A–E geometry and evaluate the finished directional antenna. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose frequency and conductor', detail: 'Select the intended operating frequency and enter the constant outside diameter of the conductor used for the complete driven element and reflector.' },
        { title: 'Lay out the A–E geometry', detail: 'Work from the dimensioned drawing or a full-size template, preserving symmetry and measuring bends and endpoints consistently.' },
        { title: 'Build both elements symmetrically', detail: 'Form the driven element and reflector in one plane with stable, non-conductive supports and matching left and right halves.' },
        { title: 'Hold both critical gaps', detail: 'Keep the two C gaps equal and maintain the parallel end spacing; small gap or alignment errors can weaken the intended rear null.' },
        { title: 'Feed and mount without distortion', detail: 'Use a balanced feed arrangement with suitable common-mode control and route the feedline and support structure to minimize pattern disturbance.' },
        { title: 'Measure resonance and pattern', detail: 'Check the installed match with an analyser, adjust geometry symmetrically, and verify front-to-back behaviour by modelling or field measurement.' }
      ]} limit="The regression supplies starting geometry only. It does not predict SWR, matching, gain, front-to-back ratio, bandwidth, losses, or the installed radiation pattern." />}

      {antennaType === 'yagi' && <StepByStepHelp title="Build and verify the NBS Yagi" intro="Use this sequence to reproduce the documented reference geometry before evaluating substitutions or the final installation. Experienced builders can leave the guide closed." steps={[
        { title: 'Treat it as a complete reference system', detail: 'The element lengths, 0.4λ boom geometry, folded driven element, matching arrangement, element diameter, and non-conductive boom belong to one measured design.' },
        { title: 'Scale every dimension together', detail: 'Scale the reflector, driven element, director, centre-to-centre spacings, and 0.0085λ element diameter to the selected frequency.' },
        { title: 'Preserve boom and element geometry', detail: 'Use a non-conductive boom for the reference build, keep elements straight and parallel, and measure every boom spacing from element centre to element centre.' },
        { title: 'Provide the documented feed system', detail: 'Use a balanced folded driven element and suitable matching network, or model and document any split-dipole, tubing, mounting, or feed substitution.' },
        { title: 'Mount clear of coupling objects', detail: 'Plan mast, support, and feedline placement so they do not unintentionally couple to the elements or become part of the directional system.' },
        { title: 'Measure match and pattern', detail: 'Verify the installed impedance, bandwidth, forward response, and front-to-back behaviour with suitable test equipment or a model of the actual construction.' }
      ]} limit="This is scaled historical reference geometry, not a prediction of installed gain, SWR, bandwidth, or front-to-back ratio. Construction substitutions require separate modelling and measurement." />}

      {antennaType === 'loaded-vertical' && <StepByStepHelp title="Build and tune a loaded vertical" intro="Use this sequence to plan one shortened single-band radiator, its RF return system, and a measured series loading coil. Experienced builders can leave the guide closed." steps={[
        { title: 'Set the physical radiator height', detail: 'Enter the conductive length from the feedpoint to the open end, excluding support rope, mast, and any unbonded hardware.' },
        { title: 'Choose the coil position', detail: 'Use zero for base loading or move the coil upward. Centre loading can improve current distribution but usually needs more inductance and stronger mechanical support.' },
        { title: 'Plan the RF return system', detail: 'Design the radial, counterpoise, or vehicle-body connection as part of the antenna. A safety ground rod alone is not the missing half.' },
        { title: 'Build and measure a high-Q coil', detail: 'Choose conductor, form, turn spacing, insulation, and weather protection for the intended current, voltage, power, frequency, and environment.' },
        { title: 'Install the complete system', detail: 'Mount the radiator, coil, return system, feedline, choking, and bonding in their final geometry before evaluating resonance or match.' },
        { title: 'Tune and verify at low power', detail: 'Adjust inductance or radiator length in small steps with an analyser, then check matching, coil heating, voltage clearance, common-mode current, and stability.' }
      ]} limit="This is a first-order, single-band starting model. It does not calculate the RF return system, physical coil turns, Q, self-capacitance, loss, heating, voltage, feedpoint impedance, matching, bandwidth, efficiency, or pattern." />}

      {antennaType === 'ground-mounted-vertical' && <StepByStepHelp title="Build a ground-mounted vertical" intro="Use this sequence to plan the radiator, RF radial field, feed connection, and installed tuning as one antenna system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the site', detail: 'Select a clear location with room for the planned radial field, safe radiator clearances, feedline routing, and access for maintenance.' },
        { title: 'Build the insulated radiator', detail: 'Provide a mechanically secure, weather-resistant base that keeps the vertical radiator insulated from the radial and coax-shield junction.' },
        { title: 'Lay out the RF radial field', detail: 'Choose a practical count and length, distribute wires around the base, and connect every radial with low-resistance, corrosion-resistant hardware.' },
        { title: 'Connect and weatherproof the feed', detail: 'Connect the coax centre to the radiator and shield to the radial junction, add suitable feedline control, and seal outdoor connections.' },
        { title: 'Address electrical safety separately', detail: 'Follow applicable bonding, lightning-protection, and electrical grounding rules; a safety ground rod does not replace the RF radial field.' },
        { title: 'Measure and tune after installation', detail: 'Use low analyser power, trim the radiator in small steps, and evaluate the installed match and efficiency rather than assuming an ideal feedpoint value.' }
      ]} limit="This calculator does not model soil loss, radial-current distribution, efficiency, feedpoint impedance, matching hardware, lightning protection, or installed radiation pattern." />}

      {antennaType === 'ground-plane' && <StepByStepHelp title="Build an elevated ground plane" intro="Use this sequence to preserve equal elevated radials, their slope, and the feedpoint geometry while tuning the complete installation. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the mounting location', detail: 'Plan a clear elevated position with safe radiator and radial clearances, a non-disruptive support, and deliberate coax routing.' },
        { title: 'Build the vertical radiator', detail: 'Mount the radiator securely above an insulated feedpoint and retain the selected adjustment allowance.' },
        { title: 'Make equal elevated radials', detail: 'Cut the selected number of equal radials, distribute them symmetrically, and connect them to the coax-shield side of the feedpoint.' },
        { title: 'Set the radial slope', detail: 'Support every radial at the same downward angle; changing slope alters the footprint and can change the feedpoint impedance.' },
        { title: 'Route, choke, and weatherproof', detail: 'Route coax away from the antenna as consistently as practical, add common-mode control when needed, and seal exposed connections.' },
        { title: 'Measure and tune after mounting', detail: 'Use low analyser power, preserve radial equality and symmetry, and make small radiator or equal-radial adjustments before rechecking.' }
      ]} limit="This calculator does not predict feedpoint impedance, support and mast coupling, matching, bandwidth, common-mode current, or the installed radiation pattern." />}

      {antennaType === 'full-wave-loop' && <StepByStepHelp title="Build and tune a full-wave loop" intro="Use this sequence to preserve the calculated perimeter while choosing a practical installed shape, plane, and feed arrangement. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the installed plane', detail: 'Decide whether the loop will be vertical, horizontal, or sloped and plan supports, height, orientation, clearances, and feedline routing.' },
        { title: 'Choose a practical shape', detail: 'Use a square, triangle, or circle as the starting geometry while recognizing that distortion changes impedance and pattern.' },
        { title: 'Cut the complete perimeter long', detail: 'Retain the selected trim allowance and mark support and feedpoint locations without changing the total conductor length.' },
        { title: 'Prepare the feed arrangement', detail: 'Choose a feedpoint and balanced feed, matching, and common-mode-control approach appropriate to the desired bands and installed geometry.' },
        { title: 'Install before measuring', detail: 'Raise and close the complete loop in its intended shape and plane before judging resonance or impedance.' },
        { title: 'Tune the perimeter evenly', detail: 'Use low analyser power, make small distributed or symmetrical length changes, preserve the intended shape, and remeasure each intended band.' }
      ]} limit="This calculator does not predict feedpoint impedance, matching ratio, bandwidth, multiband response, losses, common-mode current, or the installed radiation pattern." />}

      <div className={antennaType === 'small-loop' ? 'calculator-layout small-loop-layout' : antennaType === 'phased-collinear' ? 'calculator-layout collinear-layout' : 'calculator-layout'}>
        <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
          <label className="field">
            <span>Amateur band</span>
            <select className="band-select" value={activeBand?.id ?? 'custom'} onChange={(event) => {
              const band = availableBands.find((candidate) => candidate.id === event.target.value);
              if (band && antennaType === 'small-loop') {
                setFrequencyText(band.lowerMHz.toFixed(band.lowerMHz < 30 ? 3 : 1));
                setSmallLoopUpperFrequencyText(band.upperMHz.toFixed(band.upperMHz < 30 ? 3 : 1));
              } else if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1));
            }} aria-describedby="band-help">
              <option value="custom">Custom frequency</option>
              {availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}
            </select>
            <small id="band-help">{antennaType === 'small-loop' ? 'Loads the listed lower and upper band edges; narrow them to the frequencies the capacitor must actually cover.' : 'Loads a central design frequency; adjust it for the part of the band you use.'}</small>
          </label>

          <label className="field">
            <span>{antennaType === 'small-loop' ? 'Lower tuning frequency' : 'Design frequency'}</span>
            <span className="input-with-unit">
              <input aria-label={antennaType === 'small-loop' ? 'Lower tuning frequency' : 'Design frequency'} inputMode="decimal" type="number" min="0.001" step="0.001" value={frequencyText} onChange={(event) => setFrequencyText(event.target.value)} />
              <span>MHz</span>
            </span>
            <small>{antennaType === 'small-loop' ? 'Lowest frequency the variable capacitor must reach with the measured loop inductance.' : 'Use the frequency where you want resonance, not just the band name.'}</small>
          </label>

          {antennaType === 'fan-dipole' && <fieldset className="fan-frequency-editor">
            <legend>Additional resonant wire pairs</legend>
            <p>The primary design frequency above is the first pair. Add a distinct frequency for every additional pair.</p>
            {fanAdditionalFrequencyTexts.map((frequency, index) => (
              <div className="fan-frequency-row" key={index}>
                <label htmlFor={`fan-frequency-${index}`}>Wire pair {index + 2}</label>
                <span className="input-with-unit">
                  <input id={`fan-frequency-${index}`} aria-label={`Fan dipole wire pair ${index + 2} frequency`} inputMode="decimal" type="number" min="0.001" step="0.001" value={frequency} onChange={(event) => setFanAdditionalFrequencyTexts((current) => current.map((value, candidateIndex) => candidateIndex === index ? event.target.value : value))} />
                  <span>MHz</span>
                </span>
                {fanAdditionalFrequencyTexts.length > 1 && <button type="button" className="quiet-button" aria-label={`Remove fan dipole wire pair ${index + 2}`} onClick={() => setFanAdditionalFrequencyTexts((current) => current.filter((_, candidateIndex) => candidateIndex !== index))}>Remove</button>}
              </div>
            ))}
            {fanAdditionalFrequencyTexts.length < 5 && <button type="button" className="secondary-button" onClick={() => setFanAdditionalFrequencyTexts((current) => [...current, (frequencyMHz * (current.length + 2)).toFixed(3)])}>Add wire pair</button>}
            <small>Two to six pairs are supported. Installed interaction means every band must be rechecked after each adjustment.</small>
          </fieldset>}

          {antennaType === 'doublet' && <fieldset className="doublet-system-editor">
            <legend>Balanced feed system</legend>
            <label className="field"><span>Balanced-line physical length</span><span className="input-with-unit"><input aria-label="Balanced-line physical length" type="number" min="0.01" step="0.1" value={Number(shownDoubletLineLength.toFixed(3))} onChange={(event) => setDoubletLineLengthMetres(unitSystem === 'metric' ? Number(event.target.value) : feetToMetres(Number(event.target.value)))} /><span>{unitSystem === 'metric' ? 'm' : 'ft'}</span></span><small>Measure the complete two-conductor route from the antenna centre to the tuner interface.</small></label>
            <label className="field"><span>Feedline check frequency</span><span className="input-with-unit"><input aria-label="Doublet feedline check frequency" type="number" min="0.001" step="0.001" value={doubletCheckFrequencyText} onChange={(event) => setDoubletCheckFrequencyText(event.target.value)} /><span>MHz</span></span><small>Shows electrical line length and an eighth-wave adjustment at one troublesome or planned operating frequency.</small></label>
            <div className="field"><span className="field-label-with-help"><label htmlFor="doublet-tuner-interface">Tuner interface</label><HelpTip label="Doublet tuner interface">A truly balanced tuner can connect directly to balanced line. An unbalanced tuner needs an appropriate current balun and a short low-loss coax path. The correct transformation ratio and location depend on the actual impedances and power.</HelpTip></span><select id="doublet-tuner-interface" value={doubletTunerInterface} onChange={(event) => setDoubletTunerInterface(event.target.value as typeof doubletTunerInterface)}><option value="balanced">Balanced-output tuner</option><option value="external-balun">External current balun + unbalanced tuner</option></select><small>{doubletTunerInterface === 'balanced' ? 'Connect the balanced line to the tuner’s documented balanced terminals.' : 'Keep the coax between balun and tuner short and verify balun voltage, current, loss, and heating.'}</small></div>
            <label className="field"><span>Balanced-line characteristic impedance</span><select aria-label="Balanced-line characteristic impedance" value={doubletLineImpedanceOhms} onChange={(event) => setDoubletLineImpedanceOhms(Number(event.target.value))}><option value="300">300 Ω ribbon or window line</option><option value="450">450 Ω window line</option><option value="600">600 Ω open-wire line</option></select><small>This identifies the line; it is not the impedance the tuner will necessarily see.</small></label>
            <NumberField label="Balanced-line velocity factor" tooltip="Velocity factor converts the free-space wavelength to wavelength along the selected line. Use manufacturer data or a measurement for the actual construction; line spacing, insulation, and moisture can change it." value={doubletLineVelocityFactor} min={0.5} max={1} step={0.01} unit="ratio" help="Used only for electrical line length and the eighth-wave adjustment amount." onChange={setDoubletLineVelocityFactor} />
          </fieldset>}

          {antennaType === 'phased-collinear' && <fieldset className="collinear-editor">
            <legend>Array and phasing sections</legend>
            <NumberField label="Radiating half-wave sections" tooltip="Choose two to eight equal collinear radiator sections. The calculator does not assign gain because the installed pattern depends on exact current distribution, height, ground, loss, feed arrangement, and dimensional accuracy." value={collinearElementCount} min={2} max={8} step={1} unit="sections" help={`${collinearElementCount - 1} identical phase-reversing ${collinearElementCount - 1 === 1 ? 'stub is' : 'stubs are'} required between adjacent sections.`} onChange={setCollinearElementCount} />
            <NumberField label="Phasing-line velocity factor" tooltip="Use the measured or manufacturer-specified velocity factor of the actual two-conductor phasing line. Wire type, insulation, conductor spacing, coiling, supports, and moisture can change the finished electrical length." value={collinearPhasingVelocityFactor} min={0.5} max={1} step={0.01} unit="ratio" help="Applied only to the physical one-way length of each electrically quarter-wave stub." onChange={setCollinearPhasingVelocityFactor} />
            <NumberField label="Extra phasing-stub length for trimming" tooltip="This allowance is separate from the radiator allowance. Add it to every identical stub, then shorten equally while measuring the completed construction or a representative fixture." value={collinearStubTrimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to each physical stub length; both conductors in a stub remain equal." onChange={setCollinearStubTrimAllowancePercent} />
          </fieldset>}

          {antennaType === 'loaded-dipole' && <fieldset className="loaded-antenna-editor">
            <legend>Shortened geometry</legend>
            <NumberField label="Available total span" tooltip="Enter the physical end-to-end wire span, not the missing full-size length. Each arm is half this value and must remain shorter than the corrected quarter-wave reference." value={Number(shownLoadedDipoleSpan.toFixed(3))} min={unitSystem === 'metric' ? 0.02 : 0.066} max={unitSystem === 'metric' ? 20_000 : 65_617} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Complete endpoint-to-endpoint span, divided into two equal physical arms." onChange={(value) => setLoadedDipoleSpanMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Coil position from centre" tooltip="Measure from the feedpoint to each identical coil. A position nearer the open ends preserves more of the high-current centre wire but requires greater reactance and often a larger, lossier coil." value={Number(shownLoadedDipoleCoilPosition.toFixed(3))} min={0} max={Number((shownLoadedDipoleSpan / 2).toFixed(3))} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Use the same distance on both legs; the coil must remain before the open end." onChange={(value) => setLoadedDipoleCoilPositionMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Installed wire height" tooltip="The published approximation models each arm as a single-wire transmission line above ground. Enter the planned average wire height; sloping legs, uneven terrain, buildings, vegetation, and real soil require separate modelling or measurement." value={Number(shownLoadedDipoleHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.01 : 0.033} max={unitSystem === 'metric' ? 10_000 : 32_808} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Average model height above ground; use the installed geometry for final tuning." onChange={(value) => setLoadedDipoleHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Conductor outside diameter" tooltip="Use the actual outside diameter represented by the model. Insulated, bundled, cage, tapered, or unusual conductors need an appropriate equivalent diameter and may require electromagnetic modelling." value={Number(shownLoadedDipoleDiameter.toFixed(unitSystem === 'metric' ? 2 : 4))} min={unitSystem === 'metric' ? 0.01 : 0.0004} max={unitSystem === 'metric' ? 1_000 : 39.37} step={unitSystem === 'metric' ? 0.1 : 0.001} unit={unitSystem === 'metric' ? 'mm' : 'in'} help="Outside diameter used by the characteristic-impedance approximation." onChange={(value) => setLoadedDipoleConductorDiameterMillimetres(unitSystem === 'metric' ? value : value * 25.4)} />
          </fieldset>}

          {antennaType === 'trap-dipole' && <fieldset className="loaded-antenna-editor trap-dipole-editor">
            <legend>Two-band trap geometry</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="trap-upper-frequency">Upper design frequency</label><HelpTip label="Upper design frequency">This must be above the primary design frequency. The calculated parallel-LC resonance lies between the two design frequencies so the same trap is inductive on the lower band and capacitive on the upper band.</HelpTip></span><span className="input-with-unit"><input id="trap-upper-frequency" aria-label="Upper design frequency" type="number" min="0.001" step="0.001" value={trapUpperFrequencyText} onChange={(event) => setTrapUpperFrequencyText(event.target.value)} /><span>MHz</span></span><small>Choose the intended upper-band resonance; this is not the trap’s own resonant frequency.</small></div>
            <NumberField label="Available total span" tooltip="Enter the complete physical endpoint-to-endpoint span. Each arm is half this value and is divided into an inner section and an outer section by its trap." value={Number(shownTrapDipoleSpan.toFixed(3))} min={unitSystem === 'metric' ? 0.02 : 0.066} max={unitSystem === 'metric' ? 20_000 : 65_617} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Complete span, divided into two identical physical arms." onChange={(value) => setTrapDipoleSpanMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Trap position from centre" tooltip="Measure the same distance from the feedpoint to each trap. The inner and outer wire sections must each remain shorter than the corrected quarter-wave reference on the upper frequency." value={Number(shownTrapPosition.toFixed(3))} min={unitSystem === 'metric' ? 0.01 : 0.033} max={Number((shownTrapDipoleSpan / 2).toFixed(3))} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Use the same position on both arms; moving the traps changes both required reactances." onChange={(value) => setTrapPositionMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Installed wire height" tooltip="The method models each arm as a single-wire transmission line above ground. Enter the planned average wire height. Sloping legs, uneven terrain, buildings, vegetation, and real soil require separate modelling or measurement." value={Number(shownTrapDipoleHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.01 : 0.033} max={unitSystem === 'metric' ? 10_000 : 32_808} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Average model height above ground; tune only after final installation." onChange={(value) => setTrapDipoleHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Conductor outside diameter" tooltip="Use the outside diameter represented by the model. Insulated, bundled, cage, tapered, or unusual conductors may require an equivalent diameter and electromagnetic modelling." value={Number(shownTrapDipoleDiameter.toFixed(unitSystem === 'metric' ? 2 : 4))} min={unitSystem === 'metric' ? 0.01 : 0.0004} max={unitSystem === 'metric' ? 1_000 : 39.37} step={unitSystem === 'metric' ? 0.1 : 0.001} unit={unitSystem === 'metric' ? 'mm' : 'in'} help="Outside diameter used by the single-wire characteristic-impedance approximation." onChange={(value) => setTrapDipoleConductorDiameterMillimetres(unitSystem === 'metric' ? value : value * 25.4)} />
          </fieldset>}

          {antennaType === 'small-loop' && <fieldset className="small-loop-editor">
            <legend>Measured-inductance tuning plan</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="small-loop-upper-frequency">Upper tuning frequency</label><HelpTip label="Upper tuning frequency">This is the highest required resonance. It sets the smallest required total capacitance and the strictest ARRL small-loop diameter check.</HelpTip></span><span className="input-with-unit"><input id="small-loop-upper-frequency" aria-label="Upper tuning frequency" type="number" min="0.001" step="0.001" value={smallLoopUpperFrequencyText} onChange={(event) => setSmallLoopUpperFrequencyText(event.target.value)} /><span>MHz</span></span><small>Use the highest frequency the installed capacitor and loop must reach.</small></div>
            <NumberField label="Main-loop circumference" tooltip="Enter the conductor path around the complete circular main loop. The drawing converts circumference to diameter and area; it does not infer inductance, loss, efficiency, or pattern from this geometry." value={Number(shownSmallLoopCircumference.toFixed(3))} min={unitSystem === 'metric' ? 0.001 : 0.0033} max={unitSystem === 'metric' ? 100_000 : 328_084} step={unitSystem === 'metric' ? 0.01 : 0.05} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Measure the conductive path around the circle; joints and capacitor connections remain part of the finished RF loop." onChange={(value) => setSmallLoopCircumferenceMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Measured finished-loop inductance" tooltip="Use a measurement of the complete main loop and capacitor-lead arrangement with the fixture compensated according to the instrument instructions. A low-frequency LCR value may not represent the RF installation." value={smallLoopMeasuredInductanceMicrohenries} min={0.000001} max={1_000_000} step={0.001} unit="µH" help="The planner deliberately does not estimate inductance from idealized loop geometry." onChange={setSmallLoopMeasuredInductanceMicrohenries} />
            <NumberField label="Parallel fixed and stray capacitance" tooltip="Include only fixed, mounting, lead, and enclosure capacitance that can be represented as parallel with the variable capacitor at the tuning gap. Distributed loop capacitance may not be a valid lumped value. Do not include the variable capacitor’s own minimum here; enter that separately below." value={smallLoopStrayCapacitancePicofarads} min={0} max={1_000_000_000} step={0.1} unit="pF" help="An equivalent parallel value subtracted from ideal total C to show the required variable portion." onChange={setSmallLoopStrayCapacitancePicofarads} />
            <NumberField label="Variable-capacitor minimum" tooltip="Use the installed RF capacitance at the low-capacitance end, including sections placed in series or parallel. Mechanical end stops and safe plate spacing may reduce the usable range." value={smallLoopCapacitorMinimumPicofarads} min={0} max={1_000_000_000} step={0.1} unit="pF" help="Lowest usable installed setting, not necessarily the catalogue headline value." onChange={setSmallLoopCapacitorMinimumPicofarads} />
            <NumberField label="Variable-capacitor maximum" tooltip="Use the installed RF capacitance at the high-capacitance end. This is a range check only; voltage, current, loss, plate spacing, arcing, heating, and tuning resolution require separate engineering." value={smallLoopCapacitorMaximumPicofarads} min={0.001} max={1_000_000_000} step={0.1} unit="pF" help="Highest usable installed setting; it must reach the lower-frequency capacitance requirement." onChange={setSmallLoopCapacitorMaximumPicofarads} />
          </fieldset>}

          {antennaType === 'loaded-vertical' && <fieldset className="loaded-antenna-editor">
            <legend>Shortened geometry</legend>
            <NumberField label="Physical radiator height" tooltip="Enter the conductive length from the base feedpoint to the open end. It must be shorter than the corrected quarter-wave reference at the design frequency." value={Number(shownLoadedVerticalHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.01 : 0.033} max={unitSystem === 'metric' ? 10_000 : 32_808} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Conductive base-to-tip length; support and unbonded hardware do not count." onChange={(value) => setLoadedVerticalHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Coil position from base" tooltip="Enter zero for base loading. Moving the coil upward can improve current distribution but generally increases the required inductance, coil voltage, and construction demands." value={Number(shownLoadedVerticalCoilPosition.toFixed(3))} min={0} max={Number(shownLoadedVerticalHeight.toFixed(3))} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="0 is base loading; any larger value places the series coil up the radiator." onChange={(value) => setLoadedVerticalCoilPositionMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Conductor outside diameter" tooltip="Use the actual radiator outside diameter. Tapered whips, cages, masts with discontinuities, and nearby conductive supports need an equivalent-diameter treatment or separate modelling." value={Number(shownLoadedVerticalDiameter.toFixed(unitSystem === 'metric' ? 2 : 4))} min={unitSystem === 'metric' ? 0.01 : 0.0004} max={unitSystem === 'metric' ? 1_000 : 39.37} step={unitSystem === 'metric' ? 0.1 : 0.001} unit={unitSystem === 'metric' ? 'mm' : 'in'} help="Outside diameter represented by this thin-conductor approximation." onChange={(value) => setLoadedVerticalConductorDiameterMillimetres(unitSystem === 'metric' ? value : value * 25.4)} />
          </fieldset>}

          {antennaType === 'inverted-v' && <NumberField label="Included apex angle" tooltip="This is the angle between the two wire legs at the centre support. Narrower angles reduce endpoint span and increase drop while also changing feedpoint impedance and pattern; the installed result must be measured." value={includedAngleDegrees} min={60} max={180} step={1} unit="degrees" help="ARRL guidance recommends 90°–120°; wider values are supported for comparison." onChange={setIncludedAngleDegrees} />}
          {antennaType === 'ground-plane' && <>
            <NumberField label="Number of radials" tooltip="These are elevated counterpoise wires connected to the coax-shield side of the feedpoint, not ground-mounted wires. Use at least three, keep them equal, and distribute them symmetrically around the radiator." value={radialCount} min={3} max={64} step={1} unit="wires" help="The drawing shows four directions; the wire total uses the count entered." onChange={setRadialCount} />
            <NumberField label="Radial slope below horizontal" tooltip="This is the downward angle of every elevated radial. Equal droop often raises the feedpoint resistance toward 50 Ω, but the actual result depends on the complete installation and must be measured." value={radialSlopeDegrees} min={0} max={60} step={1} unit="degrees" help="Drooping elevated radials can raise feedpoint impedance; verify the installed match." onChange={setRadialSlopeDegrees} />
          </>}
          {antennaType === 'ground-mounted-vertical' && <>
            <NumberField label="Number of ground radials" tooltip="These wires form the antenna's RF return system on or below the ground. Increasing the number and distributing them around the base generally lowers ground-system loss; a ground rod is not a substitute." value={groundRadialCount} min={4} max={240} step={1} unit="wires" help="More radials usually reduce ground-system loss. ARRL construction guidance describes 40 or more for strong performance and 120 quarter-wave radials as a well-developed system." onChange={setGroundRadialCount} />
            <NumberField label="Radial length multiplier" tooltip="This multiplies the corrected quarter-wave baseline for each ground radial. Shorter or longer wires may fit a site, but count, soil, layout, and total wire all influence loss; the calculator does not optimize that tradeoff." value={groundRadialLengthMultiplier} min={0.25} max={2} step={0.05} unit="× ¼λ" help="1.00 makes each radial the corrected quarter-wave baseline. Soil, space, and radial count affect the best practical layout." onChange={setGroundRadialLengthMultiplier} />
          </>}
          {antennaType === 'efhw' && <NumberField label="Transformer impedance ratio" tooltip="This is the impedance transformation ratio, not the winding turns ratio. A 49:1 impedance ratio corresponds to a 7:1 ideal turns ratio and nominally transforms 2,450 Ω toward 50 Ω." value={transformerRatio} min={4} max={100} step={1} unit=": 1" help="49:1 is the documented ARRL starting point for an approximately 2,500 Ω end impedance." onChange={setTransformerRatio} />}
          {antennaType === 'ocfd' && <>
            <NumberField label="Feedpoint position from short end" tooltip="Measure this percentage along the total wire from the short end. Moving the feedpoint changes both leg lengths and the feedpoint impedance; one split does not guarantee a suitable match or pattern on every harmonic band." value={feedpointPercentFromEnd} min={10} max={50} step={0.1} unit="%" help="About one-third from an end is the conventional starting point for a roughly 200 Ω feedpoint." onChange={setFeedpointPercentFromEnd} />
            <NumberField label="Current-balun impedance ratio" tooltip="This is the nominal impedance transformation ratio. A 4:1 current balun transforms an assumed 200 Ω resistance toward 50 Ω, but the installed impedance is complex and varies by band. Ratio alone does not specify a suitable balun design or choke." value={transformerRatio} min={1} max={25} step={1} unit=": 1" help="4:1 nominally transforms a 200 Ω feedpoint toward 50 Ω coax." onChange={setTransformerRatio} />
          </>}
          {antennaType === 'jpole' && <>
            <div className="field"><span className="field-label-with-help"><label htmlFor="jpole-construction-medium">Construction medium</label><HelpTip label="J-pole construction medium">This choice loads a documented starting correction factor: 0.83 for 300 Ω flat twin-lead or 0.93 for copper wire or pipe. Actual insulation, conductor size, spacing, and supports still require installed measurement.</HelpTip></span><select id="jpole-construction-medium" aria-label="Construction medium" value={jpoleConstruction} onChange={(event) => {
              const construction = event.target.value as 'twinlead' | 'metal';
              setJpoleConstruction(construction);
              setLengthCorrectionFactor(construction === 'twinlead' ? 0.83 : 0.93);
            }}><option value="twinlead">300 Ω flat twin-lead</option><option value="metal">Copper wire or pipe</option></select><small>Sets the documented starting factor; actual material and insulation still require trimming.</small></div>
            <NumberField label="Coax tap height on matching stub" tooltip="Measure upward from the shorted bottom along the quarter-wave matching section. This is a starting location only; move the centre-conductor and shield contacts together while measuring the installed antenna." value={jpoleTapPercent} min={1} max={25} step={0.5} unit="%" help="Measured upward from the shorted bottom as a percentage of the quarter-wave stub; adjust for minimum SWR." onChange={setJpoleTapPercent} />
          </>}
          {antennaType === 'slim-jim' && <>
            <div className="field"><span className="field-label-with-help"><label htmlFor="slim-jim-construction-medium">Construction medium</label><HelpTip label="Slim Jim construction medium">This choice loads a documented starting correction factor: 0.83 for 300 Ω flat twin-lead or 0.93 for copper wire or pipe. Actual insulation, conductor size, spacing, and supports still require installed measurement.</HelpTip></span><select id="slim-jim-construction-medium" aria-label="Construction medium" value={jpoleConstruction} onChange={(event) => {
              const construction = event.target.value as 'twinlead' | 'metal';
              setJpoleConstruction(construction);
              setLengthCorrectionFactor(construction === 'twinlead' ? 0.83 : 0.93);
            }}><option value="twinlead">300 Ω flat twin-lead</option><option value="metal">Copper wire or pipe</option></select><small>Sets the starting material factor; preserve parallel spacing throughout the antenna.</small></div>
            <NumberField label="Coax tap height on matching stub" tooltip="Measure upward from the shorted bottom. This is a starting location only; move the centre-conductor and shield contacts together while measuring the installed antenna." value={jpoleTapPercent} min={1} max={25} step={0.5} unit="%" help="Measured upward from the shorted bottom; adjust the two tap contacts together for minimum SWR." onChange={setJpoleTapPercent} />
            <NumberField label="Interruption gap" tooltip="This is the physical opening between the lower matching section and the upper folded section. Preserve parallel spacing around it; conductor width, insulation, nearby hardware, and the installed geometry affect the final tuned gap." value={slimJimGapPercent} min={1} max={15} step={0.5} unit="% of stub" help="Physical opening between the lower matching stub and upper folded section; construction details affect the final value." onChange={setSlimJimGapPercent} />
          </>}
          {antennaType === 'moxon' && <NumberField label="Conductor diameter" tooltip="Enter the actual constant outside diameter used throughout the antenna. The Cebik regression uses diameter relative to wavelength, so insulated wire, tapered elements, or an assumed equivalent diameter need separate modelling." value={moxonConductorDiameterMillimetres} min={0.01} max={100} step={0.01} unit="mm" help="Use a constant outside diameter. Tapered elements require an equivalent diameter and separate modelling." onChange={setMoxonConductorDiameterMillimetres} />}
          {antennaType === 'yagi' && <div className="model-note"><span className="help-heading"><strong>NBS reference geometry</strong><HelpTip label="NBS Yagi reference geometry">This calculator scales the complete measured reference system, including its 0.0085λ element diameter, folded driven element, matching arrangement, and non-conductive boom. Changing one part without modelling it no longer reproduces the reference design.</HelpTip></span><p>This scales the measured 0.4λ design as a complete system, including its 0.0085λ element diameter. Different tubing or a conductive boom requires correction or modelling.</p></div>}
          {antennaType === 'full-wave-loop' && <div className="field">
            <span className="field-label-with-help"><label htmlFor="full-wave-loop-shape">Loop shape</label><HelpTip label="Loop shape">The selected idealized shape converts one perimeter into equal sides or a diameter. Real support sag, unequal sides, non-planar installation, feedpoint choice, and nearby objects change impedance and pattern.</HelpTip></span>
            <select id="full-wave-loop-shape" aria-label="Loop shape" value={loopShape} onChange={(event) => setLoopShape(event.target.value as LoopShape)}>
              <option value="square">Square</option><option value="triangle">Equilateral triangle</option><option value="circle">Circle</option>
            </select>
            <small>Perimeter stays constant; this converts it into equal sides or a diameter.</small>
          </div>}

          {advancedOpen && antennaType !== 'moxon' && antennaType !== 'yagi' && antennaType !== 'small-loop' && <div className="advanced-fields">
            {antennaType === 'efhw' && <NumberField label="Estimated antenna end impedance" tooltip="This value is a planning assumption used only to show nominal transformed resistance. A real feedpoint also has reactance and changes with height, wire shape, ground, nearby objects, return path, frequency, and loss." value={estimatedEndImpedanceOhms} min={200} max={20000} step={50} unit="Ω" help="A planning assumption only: deployment height, geometry, surroundings, and return path can move this value substantially." onChange={setEstimatedEndImpedanceOhms} />}
            {antennaType === 'ocfd' && <NumberField label="Estimated OCFD feedpoint impedance" tooltip="This value is a resistance assumption used only for the nominal transformed-impedance display. The real feedpoint has resistance and reactance that vary with frequency, split, height, ground, wire geometry, and nearby conductors." value={estimatedOcfdImpedanceOhms} min={20} max={5000} step={10} unit="Ω" help="A nominal planning value; height, split, ground, and frequency change both resistance and reactance." onChange={setEstimatedOcfdImpedanceOhms} />}
            <NumberField label="Length correction factor" tooltip={lengthCorrectionTooltip} value={lengthCorrectionFactor} min={0.5} max={1.2} step={0.01} unit="ratio" help={`${recommendedFactor.toFixed(2)} is the default practical starting factor for this design; measure and tune after installation.`} onChange={setLengthCorrectionFactor} />
            {antennaType !== 'loaded-dipole' && antennaType !== 'loaded-vertical' && antennaType !== 'trap-dipole' && <NumberField label="Extra length for trimming" tooltip={trimAllowanceTooltip} value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added after the resonant estimate so wire can be shortened during tuning." onChange={setTrimAllowancePercent} />}
          </div>}

          {!calculation && <p className="validation-message" role="alert">Enter values within the displayed limits to calculate dimensions.</p>}
          {calculation && <ResultSummary calculation={calculation} unitSystem={unitSystem} radialCount={radialCount} loopShape={loopShape} />}
        </form>

        <div className="visual-panel">
          {calculation?.type === 'dipole' && <DipoleDiagram totalMetres={calculation.value.cutTotalMetres} legMetres={calculation.value.cutLegMetres} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
          {calculation?.type === 'fan-dipole' && <FanDipoleDiagram elements={calculation.value.elements} unitSystem={unitSystem} />}
          {calculation?.type === 'doublet' && <DoubletDiagram legMetres={calculation.value.cutLegMetres} totalMetres={calculation.value.cutTotalMetres} feedlineMetres={calculation.value.balancedLineLengthMetres} feedlineImpedanceOhms={calculation.value.balancedLineImpedanceOhms} unitSystem={unitSystem} />}
          {calculation?.type === 'phased-collinear' && <PhasedWireCollinearDiagram elementCount={calculation.value.elementCount} radiatingSpanMetres={calculation.value.radiatingSpanMetres} radiatorSectionMetres={calculation.value.cutRadiatorSectionMetres} phasingStubMetres={calculation.value.cutPhasingStubPhysicalLengthMetres} feedModeReference={calculation.value.feedModeReference} unitSystem={unitSystem} />}
          {calculation?.type === 'loaded-dipole' && <LoadedDipoleDiagram totalSpanMetres={calculation.value.totalSpanMetres} loadingPointFromCentreMetres={calculation.value.loadingPointFromCentreMetres} inductanceMicrohenries={calculation.value.inductanceMicrohenries} unitSystem={unitSystem} />}
          {calculation?.type === 'trap-dipole' && <TrapDipoleDiagram totalSpanMetres={calculation.value.totalSpanMetres} trapPositionFromCentreMetres={calculation.value.trapPositionFromCentreMetres} inductanceMicrohenries={calculation.value.inductanceMicrohenries} capacitancePicofarads={calculation.value.capacitancePicofarads} trapResonanceMHz={calculation.value.trapResonanceMHz} unitSystem={unitSystem} />}
          {calculation?.type === 'small-loop' && <SmallLoopDiagram diameterMetres={calculation.value.diameterMetres} circumferenceMetres={calculation.value.circumferenceMetres} minimumCapacitancePicofarads={calculation.value.minimumRequiredVariableCapacitancePicofarads} maximumCapacitancePicofarads={calculation.value.maximumRequiredVariableCapacitancePicofarads} lowerFrequencyMHz={calculation.value.lowerFrequencyMHz} upperFrequencyMHz={calculation.value.upperFrequencyMHz} isUnderArrlSmallLoopBoundary={calculation.value.isUnderArrlSmallLoopBoundary} unitSystem={unitSystem} />}
          {calculation?.type === 'inverted-v' && <InvertedVDiagram legMetres={calculation.value.legMetres} spanMetres={calculation.value.endpointSpanMetres} dropMetres={calculation.value.apexDropMetres} angleDegrees={includedAngleDegrees} unitSystem={unitSystem} />}
          {calculation?.type === 'efhw' && <EfhwDiagram radiatorMetres={calculation.value.radiatorMetres} transformerRatio={transformerRatio} unitSystem={unitSystem} />}
          {calculation?.type === 'ocfd' && <OcfdDiagram shortLegMetres={calculation.value.shortLegMetres} longLegMetres={calculation.value.longLegMetres} totalMetres={calculation.value.cutLengthMetres} feedpointPercent={feedpointPercentFromEnd} transformerRatio={transformerRatio} unitSystem={unitSystem} />}
          {calculation?.type === 'jpole' && <JpoleDiagram longElementMetres={calculation.value.longElementMetres} matchingStubMetres={calculation.value.matchingStubMetres} halfWaveRadiatorMetres={calculation.value.halfWaveRadiatorMetres} feedpointFromShortMetres={calculation.value.feedpointFromShortMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'slim-jim' && <SlimJimDiagram overallHeightMetres={calculation.value.overallHeightMetres} matchingStubMetres={calculation.value.matchingStubMetres} upperFoldedSectionMetres={calculation.value.upperFoldedSectionMetres} gapMetres={calculation.value.interruptionGapMetres} feedpointMetres={calculation.value.feedpointFromShortMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'moxon' && <MoxonDiagram aMetres={calculation.value.aMetres} bMetres={calculation.value.bMetres} cMetres={calculation.value.cMetres} dMetres={calculation.value.dMetres} eMetres={calculation.value.eMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'yagi' && <YagiDiagram reflectorMetres={calculation.value.reflectorMetres} drivenElementMetres={calculation.value.drivenElementMetres} directorMetres={calculation.value.directorMetres} reflectorSpacingMetres={calculation.value.reflectorSpacingMetres} directorSpacingMetres={calculation.value.directorSpacingMetres} unitSystem={unitSystem} />}
          {calculation?.type === 'loaded-vertical' && <LoadedVerticalDiagram radiatorHeightMetres={calculation.value.radiatorHeightMetres} loadingPointFromBaseMetres={calculation.value.loadingPointFromBaseMetres} inductanceMicrohenries={calculation.value.inductanceMicrohenries} unitSystem={unitSystem} />}
          {calculation?.type === 'ground-mounted-vertical' && <GroundMountedVerticalDiagram radiatorMetres={calculation.value.radiatorMetres} radialMetres={calculation.value.radialMetres} radialFieldDiameterMetres={calculation.value.radialFieldDiameterMetres} radialCount={groundRadialCount} unitSystem={unitSystem} />}
          {calculation?.type === 'ground-plane' && <GroundPlaneDiagram radiatorMetres={calculation.value.radiatorMetres} radialMetres={calculation.value.radialMetres} footprintDiameterMetres={calculation.value.footprintDiameterMetres} radialCount={radialCount} slopeDegrees={radialSlopeDegrees} unitSystem={unitSystem} />}
          {calculation?.type === 'full-wave-loop' && <LoopDiagram perimeterMetres={calculation.value.perimeterMetres} primaryDimensionMetres={calculation.value.primaryDimensionMetres} shape={loopShape} unitSystem={unitSystem} />}
          {!calculation && <div className="diagram-placeholder">The construction drawing will appear when the inputs are valid.</div>}
        </div>
      </div>

      {calculation?.type === 'loaded-dipole' && <AirCoreCoilPanel targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} coilLabel="Each loading coil" unitSystem={unitSystem} />}
      {calculation?.type === 'trap-dipole' && <AirCoreCoilPanel targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} coilLabel="Each trap coil" unitSystem={unitSystem} />}
      {calculation?.type === 'trap-dipole' && <TrapCommissioningPanel key={`${calculation.value.inductanceMicrohenries}-${calculation.value.capacitancePicofarads}-${calculation.value.trapResonanceMHz}`} targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} targetCapacitancePicofarads={calculation.value.capacitancePicofarads} targetResonanceMHz={calculation.value.trapResonanceMHz} />}
      {calculation?.type === 'loaded-vertical' && <AirCoreCoilPanel targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} coilLabel="Loading coil" unitSystem={unitSystem} />}

      {calculation && <section className="workflow-handoff" aria-labelledby="antenna-handoff-heading">
        <div><p className="eyebrow">Connected workflow</p><h3 id="antenna-handoff-heading">Use this design in an RF station project</h3><p>Carry a representative frequency and the largest physical dimension into the feed-system calculator. Gain, loss, power, duty cycle, installed height, and the exact operating frequency remain explicit inputs.</p></div>
        <dl><div><dt>Design</dt><dd>{designs[antennaType].short}</dd></div><div><dt>{calculation.type === 'small-loop' ? 'Range centre' : 'Frequency'}</dt><dd>{handoffFrequencyMHz.toFixed(3)} MHz</dd></div><div><dt>Largest dimension</dt><dd>{formatLength(largestAntennaDimension(calculation, loopShape), unitSystem)}</dd></div></dl>
        <button type="button" onClick={() => onContinueToSystem(createAntennaDesignHandoff({
          handoffId: globalThis.crypto?.randomUUID?.() ?? `antenna-${Date.now()}`,
          label: designs[antennaType].name,
          frequencyMHz: handoffFrequencyMHz,
          largestDimensionMetres: largestAntennaDimension(calculation, loopShape),
          antennaModelId: model.id,
          antennaModelVersion: model.version
        }))}>Continue to feedline and exposure</button>
      </section>}

      <BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />
      {(calculation?.type === 'efhw' || calculation?.type === 'ocfd') && <HarmonicBands frequencies={calculation.value.harmonicFrequenciesMHz} jurisdiction={jurisdiction} />}
      <p className="allocation-note">Allocation summary for {jurisdictionName}. Licence qualifications, sub-bands, modes, bandwidth, power, and sharing conditions may further restrict operation; confirm current rules before transmitting.{bandSource && <> Source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p>

      {calculation && <div className="explanation-grid">
        <article>
          <p className="eyebrow">Build and tune</p>
          <h3>A starting point, not a promise</h3>
          <p>{calculation.type === 'phased-collinear' ? 'Establish one electrical half-wave radiator and one electrical quarter-wave shorted stub using the actual materials, then reproduce those measured sections consistently. Engineer the feed separately and tune only after the complete array is installed.' : calculation.type === 'small-loop' ? 'Build the mechanically complete main loop first, measure its installed inductance, then use the displayed capacitance range to select and commission the tuning system. Develop the feed coupling separately with an analyser and low power.' : calculation.type === 'moxon' ? 'Installation height, nearby objects, conductor construction, feed arrangement, and ground conditions shift resonance and the directional pattern. Build to the calculated geometry, install in the intended position, measure, and make small symmetrical adjustments.' : calculation.type === 'yagi' ? 'Scale every dimension together, preserve element alignment, and measure from element centre to element centre along the boom. Verify the feed match and pattern in the final mounting arrangement before transmitting.' : calculation.type === 'trap-dipole' ? 'The displayed inductance and capacitance are ideal targets for two matched traps. Measure each finished trap, install the complete antenna, tune at low power, and recheck both operating bands after every adjustment.' : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical' ? 'The displayed inductance is a starting target for the entered idealized geometry. Build the coil with adjustment range, install the complete antenna and RF return system, measure, and tune in small steps.' : 'Installation height, nearby objects, conductor construction, feed arrangement, and ground conditions shift resonance and impedance. Build long, install in the intended position, measure, and trim in small steps.'}</p>
        </article>
        <article>
          <p className="eyebrow">Calculation</p>
          <h3>Traceable working</h3>
          <p className="formula">{calculation.type === 'phased-collinear' ? 'Radiator section = λ × ½ × correction · Stub physical length = λ × ¼ × velocity factor' : calculation.type === 'small-loop' ? 'Ctotal = 1 ÷ (4π²f²Lmeasured) · Cvariable = Ctotal − Cstray · D = circumference ÷ π' : calculation.type === 'moxon' ? 'A–D = Cebik regression(log₁₀(d ÷ λ)) × λ' : calculation.type === 'yagi' ? 'Element lengths and spacings = NBS ratios × λ' : calculation.type === 'fan-dipole' ? 'Each pair: L = (c ÷ f) × ½ × correction factor' : calculation.type === 'doublet' ? 'Radiator L ≈ (c ÷ flow) × ½ · line phase = 360° × length ÷ (λ × VF)' : calculation.type === 'trap-dipole' ? 'X₁, X₂ = Z₀[cot(βouter) − tan(βinner)] · f₀, L, C from parallel-LC reactance' : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical' ? 'Xload = Z₀[cot(βouter) − tan(βinner)] · L = Xload ÷ (2πf)' : 'L = (c ÷ f) × design fraction × correction factor'}</p>
          {calculation.type === 'phased-collinear'
            ? <p>The Navy reference identifies the half wavelength as the collinear element basis and requires every section to adhere closely to the same length. The QST construction method uses shorted quarter-wave two-conductor stubs to reverse phase between adjacent sections.</p>
            : calculation.type === 'small-loop'
            ? <p>The ideal LC relationship uses the entered measured inductance and treats the entered fixed or stray capacitance as an equivalent parallel value at the tuning gap. Distributed loop capacitance may not be valid as one lumped value. The ARRL classification requires the circular diameter to remain under one-sixteenth wavelength at the highest requested frequency.</p>
            : calculation.type === 'moxon'
            ? <p>The constant-diameter regression is valid only from 0.00001 to 0.01 wavelengths. Dimensions are model starting points and do not include a trim allowance.</p>
            : calculation.type === 'yagi'
              ? <p>The NBS ratios are reflector 0.482λ, driven element 0.500λ, director 0.424λ, and 0.200λ spacing on each side of the driven element.</p>
              : calculation.type === 'trap-dipole'
                ? <p>The method solves the required positive lower-band and negative upper-band reactances for the entered geometry, then finds one ideal parallel-LC network with those reactances. Its resonance must fall between the design frequencies.</p>
              : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical'
                ? <p>The published method treats each radiator arm as a single-wire transmission line and replaces the omitted electrical length with positive series reactance. It is a geometry-sensitive approximation, not a physical coil design or NEC solution.</p>
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
        {calculation.type === 'fan-dipole' && <article className="caution-card">
          <p className="eyebrow">Fan-dipole interaction</p>
          <h3>Every wire pair changes the shared feedpoint</h3>
          <p>The elements are connected in parallel, so their installed impedances combine and nearby wires couple to one another. Keep each pair symmetrical, use stable non-conductive spacing, tune from the highest frequency downward, and sweep every band again after each adjustment. ARRL guidance specifically cautions that some related-band combinations can interact strongly.</p>
        </article>}
        {calculation.type === 'doublet' && <article className="caution-card">
          <p className="eyebrow">Doublet matching and feedline</p>
          <h3>A tuner match does not reveal system loss</h3>
          <p>High SWR remains on the balanced line after the transmitter sees a match. Use line with documented low loss, preserve physical balance, keep it clear of conductive and lossy materials, and verify tuner and balun heating at the intended power. The displayed eighth-wave amount is an adjustment increment from ARRL guidance, not a prescribed final line length.</p>
        </article>}
        {(calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical') && <article className="caution-card">
          <p className="eyebrow">Loaded-antenna applicability</p>
          <h3>Inductance alone does not describe the finished coil</h3>
          <p>Coil Q, series resistance, self-capacitance, self-resonant frequency, form material, weatherproofing, lead length, current, and voltage determine whether a physical coil is suitable. Shortening generally reduces bandwidth and can reduce efficiency. Verify resonance, match, common-mode current, heating, and voltage clearance in the complete installed system; use electromagnetic modelling or experienced technical review for critical designs.</p>
        </article>}
        {calculation.type === 'trap-dipole' && <article className="caution-card">
          <p className="eyebrow">Trap construction and power</p>
          <h3>Ideal L and C values are not a power rating</h3>
          <p>Real coils and capacitors add resistance, lead inductance, stray capacitance, tolerance, temperature drift, and weather exposure. Trap current and voltage can be substantial, while loss and heating affect efficiency and reliability. Measure and match both traps, provide mechanical and electrical safety margin, tune at low power, and verify both bands again at the intended power and duty cycle.</p>
        </article>}
        {calculation.type === 'phased-collinear' && <article className="caution-card">
          <p className="eyebrow">Collinear phasing, voltage, and pattern</p>
          <h3>Equal dimensions do not guarantee equal in-phase currents</h3>
          <p>Stub loss, unequal spacing, junction capacitance, supports, feedline current, nearby objects, and feed or matching choices can disturb the intended current distribution. Radiator ends and stub junctions can carry high RF voltage. Use suitable insulation and strain relief, tune at low power, measure common-mode current, verify component heating, and confirm the installed pattern before relying on assumed coverage or gain.</p>
        </article>}
        {calculation.type === 'small-loop' && <article className="caution-card">
          <p className="eyebrow">Small-loop voltage, current, and exposure</p>
          <h3>Resonance does not establish a safe transmitting system</h3>
          <p>A transmitting loop can develop high circulating current and high capacitor voltage, while its narrow tuning can move with nearby people, objects, weather, and heating. The calculator does not rate the conductor, joints, capacitor, drive, enclosure, coupling network, or installation. Keep the tuning assembly inaccessible, tune at low power, and perform the applicable RF-exposure assessment using a method suitable for the loop’s reactive near field.</p>
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
          <p>{calculation.type === 'phased-collinear' ? 'The wavelength uses the exact SI speed of light in vacuum. Equal corrected half-wave radiator sections follow the Navy collinear-array description; each junction uses the QST shorted quarter-wave phase-reversing-stub construction, with physical length set by the entered line velocity factor.' : calculation.type === 'small-loop' ? 'ARRL’s current loop guidance supplies the under-one-sixteenth-wavelength diameter classification. The National Bureau of Standards resonance relationship converts the measured finished-loop inductance and requested frequency range into ideal total capacitance; the entered equivalent parallel fixed or stray capacitance is then subtracted.' : calculation.type === 'moxon' ? 'The wavelength uses the exact SI speed of light in vacuum. Cebik’s regression converts frequency and constant conductor diameter into the A–E construction geometry.' : calculation.type === 'yagi' ? 'The wavelength uses the exact SI speed of light in vacuum. Dimensions reproduce the National Bureau of Standards three-element, 0.4-wavelength reference design at its documented diameter ratio.' : calculation.type === 'fan-dipole' ? 'Each wire pair is calculated as an independent corrected half-wave starting length. The model intentionally does not estimate mutual coupling or the parallel combination of installed impedances.' : calculation.type === 'doublet' ? 'The radiator uses a corrected half-wave starting length at the lowest selected frequency. Feedline phase uses physical length, selected velocity factor, and check frequency without inferring the unknown complex load.' : calculation.type === 'trap-dipole' ? 'The Birnbaum/Lopes method calculates the two reactances required by the entered wire geometry, then solves the parallel-LC network that supplies those reactances. The result reproduces the published worked example without claiming the finished antenna’s impedance or performance.' : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical' ? 'The Birnbaum/Lopes single-wire transmission-line method calculates the series reactance replacing omitted radiator length, then converts reactance to an ideal inductance at the design frequency. The vertical uses the article’s stated vertical applicability without modelling the real ground or return system.' : 'The wavelength uses the exact SI speed of light in vacuum. Empirical factors provide practical wire-cutting estimates and remain adjustable for conductor and installation differences.'}</p>
          <ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul>
          <small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small>
        </article>
      </div>}
    </section>
  );
}

function NumberField({ label, value, min, max, step, unit, help, tooltip, onChange }: { label: string; value: number; min: number; max: number; step: number; unit: string; help: string; tooltip?: ReactNode; onChange: (value: number) => void }) {
  const inputId = useId();
  return <div className="field">
    <span className={tooltip ? 'field-label-with-help' : undefined}><label htmlFor={inputId}>{label}</label>{tooltip && <HelpTip label={label}>{tooltip}</HelpTip>}</span>
    <span className="input-with-unit"><input id={inputId} aria-label={label} type="number" min={min} max={max} step={step} value={value} onChange={(event) => onChange(Number(event.target.value))} /><span>{unit}</span></span>
    <small>{help}</small>
  </div>;
}

type Calculation = NonNullable<
  | { type: 'dipole'; value: ReturnType<typeof calculateHalfWaveDipole> }
  | { type: 'fan-dipole'; value: ReturnType<typeof calculateFanDipole> }
  | { type: 'doublet'; value: ReturnType<typeof calculateDoublet> }
  | { type: 'phased-collinear'; value: ReturnType<typeof calculatePhasedWireCollinear> }
  | { type: 'loaded-dipole'; value: ReturnType<typeof calculateLoadedDipole> }
  | { type: 'trap-dipole'; value: ReturnType<typeof calculateTrapDipole> }
  | { type: 'small-loop'; value: ReturnType<typeof calculateSmallTransmittingLoop> }
  | { type: 'inverted-v'; value: ReturnType<typeof calculateInvertedV> }
  | { type: 'efhw'; value: ReturnType<typeof calculateEfhw> }
  | { type: 'ocfd'; value: ReturnType<typeof calculateOcfd> }
  | { type: 'jpole'; value: ReturnType<typeof calculateJpole> }
  | { type: 'slim-jim'; value: ReturnType<typeof calculateSlimJim> }
  | { type: 'moxon'; value: ReturnType<typeof calculateMoxon> }
  | { type: 'yagi'; value: ReturnType<typeof calculateBasicYagi> }
  | { type: 'loaded-vertical'; value: ReturnType<typeof calculateLoadedVertical> }
  | { type: 'ground-mounted-vertical'; value: ReturnType<typeof calculateGroundMountedVertical> }
  | { type: 'ground-plane'; value: ReturnType<typeof calculateGroundPlane> }
  | { type: 'full-wave-loop'; value: ReturnType<typeof calculateFullWaveLoop> }
  | null
>;

function largestAntennaDimension(calculation: Calculation, loopShape: LoopShape): number {
  if (calculation.type === 'dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutTotalMetres });
  if (calculation.type === 'fan-dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.longestSpanMetres });
  if (calculation.type === 'doublet') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutTotalMetres });
  if (calculation.type === 'phased-collinear') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatingSpanMetres });
  if (calculation.type === 'loaded-dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.totalSpanMetres });
  if (calculation.type === 'trap-dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.totalSpanMetres });
  if (calculation.type === 'small-loop') return calculateLargestAntennaDimension({ shape: 'loop', loopShape: 'circle', primaryDimensionMetres: calculation.value.diameterMetres });
  if (calculation.type === 'inverted-v') return calculateLargestAntennaDimension({ shape: 'inverted-v', endpointSpanMetres: calculation.value.endpointSpanMetres, legMetres: calculation.value.legMetres });
  if (calculation.type === 'efhw') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatorMetres });
  if (calculation.type === 'ocfd') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutLengthMetres });
  if (calculation.type === 'jpole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.longElementMetres });
  if (calculation.type === 'slim-jim') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.overallHeightMetres });
  if (calculation.type === 'moxon') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.aMetres, depthMetres: calculation.value.eMetres });
  if (calculation.type === 'yagi') return calculateLargestAntennaDimension({ shape: 'parallel-elements', boomMetres: calculation.value.boomLengthMetres, firstElementMetres: calculation.value.reflectorMetres, lastElementMetres: calculation.value.directorMetres });
  if (calculation.type === 'loaded-vertical') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatorHeightMetres });
  if (calculation.type === 'ground-mounted-vertical') return calculateLargestAntennaDimension({ shape: 'ground-mounted-vertical', radiatorMetres: calculation.value.radiatorMetres, radialMetres: calculation.value.radialMetres, radialFieldDiameterMetres: calculation.value.radialFieldDiameterMetres });
  if (calculation.type === 'ground-plane') return calculateLargestAntennaDimension({ shape: 'ground-plane', radiatorMetres: calculation.value.radiatorMetres, radialDropMetres: calculation.value.radialDropMetres, footprintDiameterMetres: calculation.value.footprintDiameterMetres });
  return calculateLargestAntennaDimension({ shape: 'loop', loopShape, primaryDimensionMetres: calculation.value.primaryDimensionMetres });
}

function ResultSummary({ calculation, unitSystem, radialCount, loopShape }: { calculation: Calculation; unitSystem: UnitSystem; radialCount: number; loopShape: LoopShape }) {
  let headline = '';
  let primary = '';
  let details: Array<[string, string]> = [];
  if (calculation.type === 'dipole') {
    headline = 'Cut two equal legs'; primary = `${formatLength(calculation.value.cutLegMetres, unitSystem)} each`;
    details = [['Total cut length', formatLength(calculation.value.cutTotalMetres, unitSystem)], ['Resonant estimate', formatLength(calculation.value.resonantTotalMetres, unitSystem)]];
  } else if (calculation.type === 'fan-dipole') {
    headline = `Cut ${calculation.value.elements.length} equal wire pairs`; primary = formatLength(calculation.value.totalWireMetres, unitSystem);
    details = calculation.value.elements.map((element) => [`${element.frequencyMHz.toFixed(3)} MHz · each leg`, formatLength(element.cutLegMetres, unitSystem)]);
    details.push(['Longest installed span', formatLength(calculation.value.longestSpanMetres, unitSystem)]);
  } else if (calculation.type === 'doublet') {
    headline = 'Cut two equal legs and route balanced line'; primary = `${formatLength(calculation.value.cutLegMetres, unitSystem)} each`;
    details = [['Total radiator', formatLength(calculation.value.cutTotalMetres, unitSystem)], ['Balanced-line route', formatLength(calculation.value.balancedLineLengthMetres, unitSystem)], [`Electrical length at ${calculation.value.lineCheckFrequencyMHz.toFixed(3)} MHz`, `${calculation.value.feedlineElectricalWavelengths.toFixed(3)} λ · ${calculation.value.feedlineElectricalDegrees.toFixed(1)}°`], ['Eighth-wave line adjustment', formatLength(calculation.value.eighthWaveAdjustmentMetres, unitSystem)], ['Total conductor', formatLength(calculation.value.totalConductorMetres, unitSystem)]];
  } else if (calculation.type === 'phased-collinear') {
    headline = `Build ${calculation.value.elementCount} equal half-wave radiator sections`;
    primary = `${formatLength(calculation.value.cutRadiatorSectionMetres, unitSystem)} each`;
    details = [['Radiating span', formatLength(calculation.value.radiatingSpanMetres, unitSystem)], ['Shorted phase-reversing stubs', `${calculation.value.phasingStubCount}`], ['Each stub, one-way physical length', formatLength(calculation.value.cutPhasingStubPhysicalLengthMetres, unitSystem)], ['Each stub electrical target', '¼ wavelength'], ['Phasing-line velocity factor', calculation.value.phasingLineVelocityFactor.toFixed(2)], ['Documented feed class', calculation.value.feedModeReference], ['Reference impedance context', calculation.value.feedImpedanceReference], ['Radiator wire', formatLength(calculation.value.totalRadiatorWireMetres, unitSystem)], ['Two-conductor stub wire', formatLength(calculation.value.totalPhasingStubConductorMetres, unitSystem)], ['Minimum conductor before connections', formatLength(calculation.value.minimumConductorMetres, unitSystem)]];
  } else if (calculation.type === 'loaded-dipole') {
    headline = 'Build two equal series loading coils'; primary = `${calculation.value.inductanceMicrohenries.toFixed(2)} µH each`;
    details = [['Physical span', formatLength(calculation.value.totalSpanMetres, unitSystem)], ['Centre to each coil', formatLength(calculation.value.loadingPointFromCentreMetres, unitSystem)], ['Outer wire after each coil', formatLength(calculation.value.outerSectionMetres, unitSystem)], ['Required coil reactance', `${calculation.value.requiredReactanceOhms.toFixed(0)} Ω`], ['Physical shortening', `${calculation.value.shorteningPercent.toFixed(1)}% per arm`]];
  } else if (calculation.type === 'trap-dipole') {
    headline = 'Build two matched parallel-LC traps'; primary = `${calculation.value.inductanceMicrohenries.toFixed(2)} µH ∥ ${calculation.value.capacitancePicofarads.toFixed(1)} pF each`;
    details = [['Physical span', formatLength(calculation.value.totalSpanMetres, unitSystem)], ['Centre to each trap', formatLength(calculation.value.trapPositionFromCentreMetres, unitSystem)], ['Outer wire after each trap', formatLength(calculation.value.outerSectionMetres, unitSystem)], ['Trap parallel resonance', `${calculation.value.trapResonanceMHz.toFixed(3)} MHz`], [`Reactance at ${calculation.value.lowerFrequencyMHz.toFixed(3)} MHz`, `+j${calculation.value.lowerRequiredReactanceOhms.toFixed(0)} Ω`], [`Reactance at ${calculation.value.upperFrequencyMHz.toFixed(3)} MHz`, `−j${Math.abs(calculation.value.upperRequiredReactanceOhms).toFixed(0)} Ω`]];
  } else if (calculation.type === 'small-loop') {
    headline = calculation.value.capacitorCoversRange ? 'Entered capacitor covers the ideal range' : 'Revise the capacitor or tuning range';
    primary = calculation.value.tuningCapacitancePositive ? `${calculation.value.minimumRequiredVariableCapacitancePicofarads.toFixed(1)}–${calculation.value.maximumRequiredVariableCapacitancePicofarads.toFixed(1)} pF` : 'No positive variable-C solution';
    details = [['Circular diameter', formatLength(calculation.value.diameterMetres, unitSystem)], ['Loop circumference', formatLength(calculation.value.circumferenceMetres, unitSystem)], ['Enclosed area', `${calculation.value.areaSquareMetres.toFixed(3)} m²`], ['Measured finished-loop inductance', `${calculation.value.measuredInductanceMicrohenries.toFixed(3)} µH`], ['Entered variable capacitor', `${calculation.value.capacitorMinimumPicofarads.toFixed(1)}–${calculation.value.capacitorMaximumPicofarads.toFixed(1)} pF`], ['Entered parallel fixed/stray C', `${calculation.value.strayCapacitancePicofarads.toFixed(1)} pF`], [`Total C at ${calculation.value.lowerFrequencyMHz.toFixed(3)} MHz`, `${calculation.value.lowerTotalCapacitancePicofarads.toFixed(1)} pF`], [`Total C at ${calculation.value.upperFrequencyMHz.toFixed(3)} MHz`, `${calculation.value.upperTotalCapacitancePicofarads.toFixed(1)} pF`], ['ARRL diameter boundary at upper edge', calculation.value.isUnderArrlSmallLoopBoundary ? `Under ${formatLength(calculation.value.maximumSmallLoopDiameterMetres, unitSystem)}` : `Not under ${formatLength(calculation.value.maximumSmallLoopDiameterMetres, unitSystem)}`], ['Ideal centre tuning sensitivity', `${calculation.value.idealCentreSensitivityKilohertzPerPicofarad.toFixed(1)} kHz/pF`]];
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
  } else if (calculation.type === 'loaded-vertical') {
    headline = calculation.value.loadingPointFromBaseMetres === 0 ? 'Build one base-loading coil' : 'Build one series loading coil'; primary = `${calculation.value.inductanceMicrohenries.toFixed(2)} µH`;
    details = [['Physical radiator', formatLength(calculation.value.radiatorHeightMetres, unitSystem)], ['Coil position from base', formatLength(calculation.value.loadingPointFromBaseMetres, unitSystem)], ['Radiator above coil', formatLength(calculation.value.outerSectionMetres, unitSystem)], ['Required coil reactance', `${calculation.value.requiredReactanceOhms.toFixed(0)} Ω`], ['Physical shortening', `${calculation.value.shorteningPercent.toFixed(1)}%`]];
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
  details.push([calculation.type === 'trap-dipole' ? 'Lower-band free-space wavelength' : calculation.type === 'small-loop' ? 'Lower-edge free-space wavelength' : calculation.type === 'fan-dipole' || calculation.type === 'doublet' ? 'Lowest-band free-space wavelength' : 'Free-space wavelength', formatLength(calculation.value.wavelengthMetres, unitSystem)]);
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
