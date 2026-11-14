/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at https://mozilla.org/MPL/2.0/.
 *
 * Copyright 2026 Tartanleaf.com Inc.
 */

import { lazy, Suspense, useId, useMemo, useState, type ReactNode } from 'react';
import { findBandForFrequency, formatFrequencyRange, getBandSource, getBandsForJurisdiction } from '../bands/catalog';
import { ANTENNA_MODELS, calculateBasicYagi, calculateEfhw, calculateFanDipole, calculateFullWaveLoop, calculateGroundMountedVertical, calculateGroundPlane, calculateInvertedV, calculateJpole, calculateMoxon, calculateOcfd, calculateSlimJim, type DeltaLoopFeedMode, type DeltaLoopOrientation, type LoopShape } from '../calculators/designs';
import { calculateLargestAntennaDimension } from '../calculators/antennaEnvelope';
import { calculateHalfWaveDipole, HALF_WAVE_DIPOLE_MODEL } from '../calculators/dipole';
import { calculateFoldedDipole, FOLDED_DIPOLE_MODEL } from '../calculators/foldedDipole';
import { calculateDoublet, DOUBLET_MODEL } from '../calculators/doublet';
import { calculateG5rv, G5RV_MODEL, type G5rvPreset } from '../calculators/g5rv';
import { calculateLoadedDipole, calculateLoadedVertical, LOADED_ANTENNA_MODEL } from '../calculators/loadedAntennas';
import { calculateTrapDipole, TRAP_DIPOLE_MODEL } from '../calculators/trapDipole';
import { calculateSmallTransmittingLoop, SMALL_TRANSMITTING_LOOP_MODEL, type SmallLoopConductorMaterial } from '../calculators/smallTransmittingLoop';
import { calculatePhasedWireCollinear, PHASED_WIRE_COLLINEAR_MODEL } from '../calculators/phasedWireCollinear';
import { calculateTurnstile, TURNSTILE_MODEL, type TurnstileQuadratureOrder } from '../calculators/turnstile';
import { calculateHalo, HALO_MODEL, type HaloShape } from '../calculators/halo';
import { calculateSkywire, SKYWIRE_MODEL, type SkywireFeedSide } from '../calculators/skywire';
import { calculateHexBeam, HEX_BEAM_MODEL, type HexBeamBand, type HexBeamWireGauge } from '../calculators/hexBeam';
import { calculateVBeam, V_BEAM_MODEL, type VBeamLegWavelengths, type VBeamMode } from '../calculators/vBeam';
import { calculateRhombic, RHOMBIC_MODEL, type RhombicMode } from '../calculators/rhombic';
import { calculateVerticalHalfRhombic, VERTICAL_HALF_RHOMBIC_MODEL, type VerticalHalfRhombicMode } from '../calculators/verticalHalfRhombic';
import { calculateT2fd, T2FD_MODEL } from '../calculators/t2fd';
import { calculateTwoElementCubicalQuad, TWO_ELEMENT_CUBICAL_QUAD_MODEL, type QuadMastReference } from '../calculators/twoElementCubicalQuad';
import { calculateAxialModeHelix, AXIAL_MODE_HELIX_MODEL } from '../calculators/axialModeHelix';
import { calculateDiscone, DISCONE_MODEL } from '../calculators/discone';
import { calculateLogPeriodic, LOG_PERIODIC_MODEL } from '../calculators/logPeriodic';
import { calculateBeverage, BEVERAGE_MODEL, type BeverageReceptionMode } from '../calculators/beverage';
import { calculateCompactReceive, COMPACT_RECEIVE_MODEL, COMPACT_RECEIVE_PRESETS, type CompactReceiveGeometry } from '../calculators/compactReceive';
import { calculateK9ay, K9AY_MODEL } from '../calculators/k9ay';
import { calculateLoopOnGround, LOOP_ON_GROUND_MODEL } from '../calculators/loopOnGround';
import { calculateActiveReceiveLoop, ACTIVE_RECEIVE_LOOP_MODEL } from '../calculators/activeReceiveLoop';
import type { ReceiveAntennaCandidate } from '../calculators/receiveAntennaSelector';
import { ANTENNA_DESIGNS, type AntennaType } from '../lib/antennaDesignCatalog';
import { feetToMetres, formatLength, metresToFeet, type UnitSystem } from '../lib/units';
import { restoreAntennaPlanWorkspace, type AntennaPlan, type AntennaPlanValue, type AntennaPlanWorkspace } from '../projects/antennaPlans';
import { jurisdictionProfiles, type JurisdictionCode } from '../regulations/catalog';
import { createAntennaDesignHandoff, type AntennaDesignHandoff } from '../workflows/stationSourceWorkflow';
import { BandIndicator } from './BandIndicator';
import { DipoleDiagram } from './DipoleDiagram';
import { ReceiveAntennaSelector } from './ReceiveAntennaSelector';
import { AntennaDesignPicker } from './AntennaDesignPicker';
import { HelpTip, StepByStepHelp } from './ContextHelp';
import { ResultEvidenceGuide } from './ResultEvidenceGuide';

const AntennaDesignComparison = lazy(() => import('./AntennaDesignComparison').then((module) => ({ default: module.AntennaDesignComparison })));
const AntennaResultSummary = lazy(() => import('./AntennaResultSummary').then((module) => ({ default: module.AntennaResultSummary })));
const AntennaPlanLibrary = lazy(() => import('./AntennaPlanLibrary').then((module) => ({ default: module.AntennaPlanLibrary })));
const AirCoreCoilPanel = lazy(() => import('./AirCoreCoilPanel').then((module) => ({ default: module.AirCoreCoilPanel })));
const TrapCommissioningPanel = lazy(() => import('./TrapCommissioningPanel').then((module) => ({ default: module.TrapCommissioningPanel })));
const EfhwDiagram = lazy(() => import('./EfhwDiagram').then((module) => ({ default: module.EfhwDiagram })));
const InvertedVDiagram = lazy(() => import('./InvertedVDiagram').then((module) => ({ default: module.InvertedVDiagram })));
const OcfdDiagram = lazy(() => import('./OcfdDiagram').then((module) => ({ default: module.OcfdDiagram })));
const JpoleDiagram = lazy(() => import('./JpoleDiagram').then((module) => ({ default: module.JpoleDiagram })));
const SlimJimDiagram = lazy(() => import('./SlimJimDiagram').then((module) => ({ default: module.SlimJimDiagram })));
const FanDipoleDiagram = lazy(() => import('./FanDipoleDiagram').then((module) => ({ default: module.FanDipoleDiagram })));
const DoubletDiagram = lazy(() => import('./DoubletDiagram').then((module) => ({ default: module.DoubletDiagram })));
const G5rvDiagram = lazy(() => import('./G5rvDiagram').then((module) => ({ default: module.G5rvDiagram })));
const LoadedDipoleDiagram = lazy(() => import('./LoadedDipoleDiagram').then((module) => ({ default: module.LoadedDipoleDiagram })));
const LoadedVerticalDiagram = lazy(() => import('./LoadedVerticalDiagram').then((module) => ({ default: module.LoadedVerticalDiagram })));
const TrapDipoleDiagram = lazy(() => import('./TrapDipoleDiagram').then((module) => ({ default: module.TrapDipoleDiagram })));
const FoldedDipoleDiagram = lazy(() => import('./FoldedDipoleDiagram').then((module) => ({ default: module.FoldedDipoleDiagram })));
const LoopDiagram = lazy(() => import('./LoopDiagram').then((module) => ({ default: module.LoopDiagram })));
const TurnstileDiagram = lazy(() => import('./TurnstileDiagram').then((module) => ({ default: module.TurnstileDiagram })));
const PhasedWireCollinearDiagram = lazy(() => import('./PhasedWireCollinearDiagram').then((module) => ({ default: module.PhasedWireCollinearDiagram })));
const PhasedWireCollinearPanel = lazy(() => import('./PhasedWireCollinearPanel').then((module) => ({ default: module.PhasedWireCollinearPanel })));
const HaloDiagram = lazy(() => import('./HaloDiagram').then((module) => ({ default: module.HaloDiagram })));
const HaloGuide = lazy(() => import('./HaloPlannerPanel').then((module) => ({ default: module.HaloGuide })));
const HaloControls = lazy(() => import('./HaloPlannerPanel').then((module) => ({ default: module.HaloControls })));
const HaloEducation = lazy(() => import('./HaloPlannerPanel').then((module) => ({ default: module.HaloEducation })));
const SkywireDiagram = lazy(() => import('./SkywireDiagram').then((module) => ({ default: module.SkywireDiagram })));
const SkywireGuide = lazy(() => import('./SkywirePlannerPanel').then((module) => ({ default: module.SkywireGuide })));
const SkywireControls = lazy(() => import('./SkywirePlannerPanel').then((module) => ({ default: module.SkywireControls })));
const SkywireEducation = lazy(() => import('./SkywirePlannerPanel').then((module) => ({ default: module.SkywireEducation })));
const SmallLoopDiagram = lazy(() => import('./SmallLoopDiagram').then((module) => ({ default: module.SmallLoopDiagram })));
const SmallLoopAnalysisPanel = lazy(() => import('./SmallLoopAnalysisPanel').then((module) => ({ default: module.SmallLoopAnalysisPanel })));
const MoxonDiagram = lazy(() => import('./MoxonDiagram').then((module) => ({ default: module.MoxonDiagram })));
const YagiDiagram = lazy(() => import('./YagiDiagram').then((module) => ({ default: module.YagiDiagram })));
const GroundMountedVerticalDiagram = lazy(() => import('./GroundMountedVerticalDiagram').then((module) => ({ default: module.GroundMountedVerticalDiagram })));
const GroundPlaneDiagram = lazy(() => import('./GroundPlaneDiagram').then((module) => ({ default: module.GroundPlaneDiagram })));
const DisconeDiagram = lazy(() => import('./DisconeDiagram').then((module) => ({ default: module.DisconeDiagram })));
const DisconeConstructionPanel = lazy(() => import('./DisconeConstructionPanel').then((module) => ({ default: module.DisconeConstructionPanel })));
const DisconeConstructionControls = lazy(() => import('./DisconeConstructionPanel').then((module) => ({ default: module.DisconeConstructionControls })));
const CubicalQuadDiagram = lazy(() => import('./CubicalQuadDiagram').then((module) => ({ default: module.CubicalQuadDiagram })));
const CubicalQuadSurveyPanel = lazy(() => import('./CubicalQuadSurveyPanel').then((module) => ({ default: module.CubicalQuadSurveyPanel })));
const AxialModeHelixDiagram = lazy(() => import('./AxialModeHelixDiagram').then((module) => ({ default: module.AxialModeHelixDiagram })));
const HelixConstructionPanel = lazy(() => import('./HelixConstructionPanel').then((module) => ({ default: module.HelixConstructionPanel })));
const HelixConstructionControls = lazy(() => import('./HelixConstructionPanel').then((module) => ({ default: module.HelixConstructionControls })));
const HexBeamDiagram = lazy(() => import('./HexBeamDiagram').then((module) => ({ default: module.HexBeamDiagram })));
const HexBeamGuide = lazy(() => import('./HexBeamPlannerPanel').then((module) => ({ default: module.HexBeamGuide })));
const HexBeamControls = lazy(() => import('./HexBeamPlannerPanel').then((module) => ({ default: module.HexBeamControls })));
const HexBeamSchedule = lazy(() => import('./HexBeamPlannerPanel').then((module) => ({ default: module.HexBeamSchedule })));
const HexBeamEducation = lazy(() => import('./HexBeamPlannerPanel').then((module) => ({ default: module.HexBeamEducation })));
const VBeamDiagram = lazy(() => import('./VBeamDiagram').then((module) => ({ default: module.VBeamDiagram })));
const VBeamGuide = lazy(() => import('./VBeamPlannerPanel').then((module) => ({ default: module.VBeamGuide })));
const VBeamControls = lazy(() => import('./VBeamPlannerPanel').then((module) => ({ default: module.VBeamControls })));
const VBeamSurvey = lazy(() => import('./VBeamPlannerPanel').then((module) => ({ default: module.VBeamSurvey })));
const VBeamEducation = lazy(() => import('./VBeamPlannerPanel').then((module) => ({ default: module.VBeamEducation })));
const RhombicDiagram = lazy(() => import('./RhombicDiagram').then((module) => ({ default: module.RhombicDiagram })));
const RhombicGuide = lazy(() => import('./RhombicPlannerPanel').then((module) => ({ default: module.RhombicGuide })));
const RhombicControls = lazy(() => import('./RhombicPlannerPanel').then((module) => ({ default: module.RhombicControls })));
const RhombicSurvey = lazy(() => import('./RhombicPlannerPanel').then((module) => ({ default: module.RhombicSurvey })));
const RhombicEducation = lazy(() => import('./RhombicPlannerPanel').then((module) => ({ default: module.RhombicEducation })));
const VerticalHalfRhombicDiagram = lazy(() => import('./VerticalHalfRhombicDiagram').then((module) => ({ default: module.VerticalHalfRhombicDiagram })));
const VerticalHalfRhombicGuide = lazy(() => import('./VerticalHalfRhombicPlannerPanel').then((module) => ({ default: module.VerticalHalfRhombicGuide })));
const VerticalHalfRhombicControls = lazy(() => import('./VerticalHalfRhombicPlannerPanel').then((module) => ({ default: module.VerticalHalfRhombicControls })));
const VerticalHalfRhombicSurvey = lazy(() => import('./VerticalHalfRhombicPlannerPanel').then((module) => ({ default: module.VerticalHalfRhombicSurvey })));
const VerticalHalfRhombicEducation = lazy(() => import('./VerticalHalfRhombicPlannerPanel').then((module) => ({ default: module.VerticalHalfRhombicEducation })));
const T2fdGuide = lazy(() => import('./T2fdPlannerPanel').then((module) => ({ default: module.T2fdGuide })));
const T2fdControls = lazy(() => import('./T2fdPlannerPanel').then((module) => ({ default: module.T2fdControls })));
const T2fdDiagram = lazy(() => import('./T2fdPlannerPanel').then((module) => ({ default: module.T2fdDiagram })));
const T2fdEducation = lazy(() => import('./T2fdPlannerPanel').then((module) => ({ default: module.T2fdEducation })));
const LogPeriodicDiagram = lazy(() => import('./LogPeriodicDiagram').then((module) => ({ default: module.LogPeriodicDiagram })));
const LogPeriodicSchedule = lazy(() => import('./LogPeriodicDiagram').then((module) => ({ default: module.LogPeriodicSchedule })));
const LogPeriodicConstructionPanel = lazy(() => import('./LogPeriodicDiagram').then((module) => ({ default: module.LogPeriodicConstructionPanel })));
const LogPeriodicConstructionControls = lazy(() => import('./LogPeriodicDiagram').then((module) => ({ default: module.LogPeriodicConstructionControls })));
const BeverageDiagram = lazy(() => import('./BeverageDiagram').then((module) => ({ default: module.BeverageDiagram })));
const BeverageConstructionPanel = lazy(() => import('./BeverageDiagram').then((module) => ({ default: module.BeverageConstructionPanel })));
const BeverageConstructionControls = lazy(() => import('./BeverageDiagram').then((module) => ({ default: module.BeverageConstructionControls })));
const CompactReceiveDiagram = lazy(() => import('./CompactReceiveDiagram').then((module) => ({ default: module.CompactReceiveDiagram })));
const CompactReceiveConstructionPanel = lazy(() => import('./CompactReceiveDiagram').then((module) => ({ default: module.CompactReceiveConstructionPanel })));
const CompactReceiveConstructionControls = lazy(() => import('./CompactReceiveDiagram').then((module) => ({ default: module.CompactReceiveConstructionControls })));
const K9ayDiagram = lazy(() => import('./K9ayDiagram').then((module) => ({ default: module.K9ayDiagram })));
const K9ayConstructionPanel = lazy(() => import('./K9ayDiagram').then((module) => ({ default: module.K9ayConstructionPanel })));
const K9ayConstructionControls = lazy(() => import('./K9ayDiagram').then((module) => ({ default: module.K9ayConstructionControls })));
const LoopOnGroundDiagram = lazy(() => import('./LoopOnGroundDiagram').then((module) => ({ default: module.LoopOnGroundDiagram })));
const LoopOnGroundConstructionPanel = lazy(() => import('./LoopOnGroundDiagram').then((module) => ({ default: module.LoopOnGroundConstructionPanel })));
const ActiveReceiveLoopDiagram = lazy(() => import('./ActiveReceiveLoopDiagram').then((module) => ({ default: module.ActiveReceiveLoopDiagram })));
const ActiveReceiveLoopConstructionPanel = lazy(() => import('./ActiveReceiveLoopDiagram').then((module) => ({ default: module.ActiveReceiveLoopConstructionPanel })));

interface Props {
  jurisdiction: JurisdictionCode;
  setJurisdiction: (jurisdiction: JurisdictionCode) => void;
  unitSystem: UnitSystem;
  setUnitSystem: (unitSystem: UnitSystem) => void;
  advancedOpen: boolean;
  setAdvancedOpen: (open: boolean) => void;
  onContinueToSystem: (handoff: AntennaDesignHandoff) => void;
}

function planBinding<T extends AntennaPlanValue>(value: T, setter: (value: T) => void): readonly [AntennaPlanValue, (next: AntennaPlanValue) => void] {
  return [value, (next) => setter(next as T)];
}

export function AntennaWorkbench({ jurisdiction, setJurisdiction, unitSystem, setUnitSystem, advancedOpen, setAdvancedOpen, onContinueToSystem }: Props) {
  const [antennaType, setAntennaType] = useState<AntennaType>('dipole');
  const [frequencyText, setFrequencyText] = useState('14.200');
  const [foldedDipoleSpacingMetres, setFoldedDipoleSpacingMetres] = useState(0.15);
  const [foldedDipoleReferenceResistanceOhms, setFoldedDipoleReferenceResistanceOhms] = useState(73);
  const [foldedDipoleFeedlineImpedanceOhms, setFoldedDipoleFeedlineImpedanceOhms] = useState(50);
  const [fanAdditionalFrequencyTexts, setFanAdditionalFrequencyTexts] = useState(['21.200', '28.400']);
  const [doubletLineLengthMetres, setDoubletLineLengthMetres] = useState(12);
  const [doubletLineVelocityFactor, setDoubletLineVelocityFactor] = useState(0.95);
  const [doubletLineImpedanceOhms, setDoubletLineImpedanceOhms] = useState(450);
  const [doubletCheckFrequencyText, setDoubletCheckFrequencyText] = useState('14.200');
  const [doubletTunerInterface, setDoubletTunerInterface] = useState<'balanced' | 'external-balun'>('balanced');
  const [g5rvPreset, setG5rvPreset] = useState<G5rvPreset>('classic');
  const [g5rvLineVelocityFactor, setG5rvLineVelocityFactor] = useState(0.95);
  const [g5rvLineImpedanceOhms, setG5rvLineImpedanceOhms] = useState(450);
  const [g5rvCustomRadiatorMetres, setG5rvCustomRadiatorMetres] = useState(31.1);
  const [g5rvCustomElectricalLineMetres, setG5rvCustomElectricalLineMetres] = useState(10.36);
  const [collinearElementCount, setCollinearElementCount] = useState(4);
  const [collinearPhasingVelocityFactor, setCollinearPhasingVelocityFactor] = useState(0.95);
  const [collinearStubTrimAllowancePercent, setCollinearStubTrimAllowancePercent] = useState(2.5);
  const [collinearStubLengthToleranceMillimetres, setCollinearStubLengthToleranceMillimetres] = useState(5);
  const [collinearMaximumJunctionPhaseErrorDegrees, setCollinearMaximumJunctionPhaseErrorDegrees] = useState(5);
  const [turnstilePhasingVelocityFactor, setTurnstilePhasingVelocityFactor] = useState(0.66);
  const [turnstileQuadratureOrder, setTurnstileQuadratureOrder] = useState<TurnstileQuadratureOrder>('b-lags-a');
  const [haloShape, setHaloShape] = useState<HaloShape>('circular');
  const [haloFarEndGapMetres, setHaloFarEndGapMetres] = useState(0.05);
  const [haloFeedpointGapMetres, setHaloFeedpointGapMetres] = useState(0.025);
  const [skywireAspectRatio, setSkywireAspectRatio] = useState(1.5);
  const [skywireSupportHeightsMetres, setSkywireSupportHeightsMetres] = useState<[number, number, number, number]>([12, 12, 12, 12]);
  const [skywireRiggingReservePercent, setSkywireRiggingReservePercent] = useState(3);
  const [skywireFeedSide, setSkywireFeedSide] = useState<SkywireFeedSide>('north');
  const [skywireFeedPositionPercent, setSkywireFeedPositionPercent] = useState(50);
  const [hexBeamBands, setHexBeamBands] = useState<HexBeamBand[]>(['20m', '17m', '15m', '12m', '10m']);
  const [hexBeamWireGauge, setHexBeamWireGauge] = useState<HexBeamWireGauge>('14-16');
  const [vBeamLegWavelengths, setVBeamLegWavelengths] = useState<VBeamLegWavelengths>(2);
  const [vBeamTargetBearingDegrees, setVBeamTargetBearingDegrees] = useState(0);
  const [vBeamMode, setVBeamMode] = useState<VBeamMode>('open');
  const [vBeamTerminationResistanceOhms, setVBeamTerminationResistanceOhms] = useState(300);
  const [vBeamTrimAllowancePercent, setVBeamTrimAllowancePercent] = useState(2.5);
  const [rhombicSideWavelengths, setRhombicSideWavelengths] = useState(2);
  const [rhombicIncludedAngleDegrees, setRhombicIncludedAngleDegrees] = useState(60);
  const [rhombicForwardBearingDegrees, setRhombicForwardBearingDegrees] = useState(0);
  const [rhombicMode, setRhombicMode] = useState<RhombicMode>('open');
  const [rhombicTerminationResistanceOhms, setRhombicTerminationResistanceOhms] = useState(600);
  const [rhombicTrimAllowancePercent, setRhombicTrimAllowancePercent] = useState(2.5);
  const [halfRhombicWireWavelengths, setHalfRhombicWireWavelengths] = useState(2);
  const [halfRhombicApexHeightMetres, setHalfRhombicApexHeightMetres] = useState(6);
  const [halfRhombicForwardBearingDegrees, setHalfRhombicForwardBearingDegrees] = useState(0);
  const [halfRhombicMode, setHalfRhombicMode] = useState<VerticalHalfRhombicMode>('terminated');
  const [halfRhombicTerminationResistanceOhms, setHalfRhombicTerminationResistanceOhms] = useState(550);
  const [halfRhombicAttachmentAllowancePercent, setHalfRhombicAttachmentAllowancePercent] = useState(2.5);
  const [t2fdTiltDegrees, setT2fdTiltDegrees] = useState(30);
  const [t2fdLowAttachmentHeightMetres, setT2fdLowAttachmentHeightMetres] = useState(1.8288);
  const [t2fdTerminationResistanceOhms, setT2fdTerminationResistanceOhms] = useState(600);
  const [t2fdFeedSystemImpedanceOhms, setT2fdFeedSystemImpedanceOhms] = useState(600);
  const [t2fdTransmitterPowerWatts, setT2fdTransmitterPowerWatts] = useState(100);
  const [t2fdWireAllowancePercent, setT2fdWireAllowancePercent] = useState(2.5);
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
  const [smallLoopConductorMaterial, setSmallLoopConductorMaterial] = useState<SmallLoopConductorMaterial>('copper');
  const [smallLoopConductorOutsideDiameterMillimetres, setSmallLoopConductorOutsideDiameterMillimetres] = useState(22);
  const [smallLoopAdditionalSeriesLossMilliohms, setSmallLoopAdditionalSeriesLossMilliohms] = useState(0);
  const [smallLoopAcceptedPowerWatts, setSmallLoopAcceptedPowerWatts] = useState(10);
  const [loadedVerticalHeightMetres, setLoadedVerticalHeightMetres] = useState(3.5);
  const [loadedVerticalCoilPositionMetres, setLoadedVerticalCoilPositionMetres] = useState(0);
  const [loadedVerticalConductorDiameterMillimetres, setLoadedVerticalConductorDiameterMillimetres] = useState(25);
  const [lengthCorrectionFactor, setLengthCorrectionFactor] = useState(0.95);
  const [trimAllowancePercent, setTrimAllowancePercent] = useState(2.5);
  const [includedAngleDegrees, setIncludedAngleDegrees] = useState(120);
  const [radialCount, setRadialCount] = useState(4);
  const [radialSlopeDegrees, setRadialSlopeDegrees] = useState(45);
  const [loopShape, setLoopShape] = useState<LoopShape>('square');
  const [deltaLoopOrientation, setDeltaLoopOrientation] = useState<DeltaLoopOrientation>('apex-up');
  const [deltaLoopFeedMode, setDeltaLoopFeedMode] = useState<DeltaLoopFeedMode>('horizontal');
  const [transformerRatio, setTransformerRatio] = useState(49);
  const [estimatedEndImpedanceOhms, setEstimatedEndImpedanceOhms] = useState(2450);
  const [feedpointPercentFromEnd, setFeedpointPercentFromEnd] = useState(33.333);
  const [estimatedOcfdImpedanceOhms, setEstimatedOcfdImpedanceOhms] = useState(200);
  const [jpoleConstruction, setJpoleConstruction] = useState<'twinlead' | 'metal'>('twinlead');
  const [jpoleTapPercent, setJpoleTapPercent] = useState(7.5);
  const [slimJimGapPercent, setSlimJimGapPercent] = useState(5);
  const [moxonConductorDiameterMillimetres, setMoxonConductorDiameterMillimetres] = useState(2.05);
  const [quadElementSpacingWavelengths, setQuadElementSpacingWavelengths] = useState(0.2);
  const [quadPolarization, setQuadPolarization] = useState<'horizontal' | 'vertical'>('horizontal');
  const [quadForwardBearingDegrees, setQuadForwardBearingDegrees] = useState(0);
  const [quadBoomCentreHeightMetres, setQuadBoomCentreHeightMetres] = useState(10);
  const [quadMastReference, setQuadMastReference] = useState<QuadMastReference>('boom-midpoint');
  const [helixCircumferenceWavelengths, setHelixCircumferenceWavelengths] = useState(1);
  const [helixPitchAngleDegrees, setHelixPitchAngleDegrees] = useState(12.5);
  const [helixTurnCount, setHelixTurnCount] = useState(6);
  const [helixGroundPlaneWavelengths, setHelixGroundPlaneWavelengths] = useState(0.8);
  const [helixHandedness, setHelixHandedness] = useState<'right' | 'left'>('right');
  const [helixConductorWidthMillimetres, setHelixConductorWidthMillimetres] = useState(6.35);
  const [helixDiameterToleranceMillimetres, setHelixDiameterToleranceMillimetres] = useState(2);
  const [helixTurnSpacingToleranceMillimetres, setHelixTurnSpacingToleranceMillimetres] = useState(2);
  const [helixFeedlineImpedanceOhms, setHelixFeedlineImpedanceOhms] = useState(50);
  const [disconeHalfAngleDegrees, setDisconeHalfAngleDegrees] = useState(30);
  const [disconeConeRadialCount, setDisconeConeRadialCount] = useState(8);
  const [disconeDiscRadialCount, setDisconeDiscRadialCount] = useState(8);
  const [disconeRadialConductorDiameterMillimetres, setDisconeRadialConductorDiameterMillimetres] = useState(6.35);
  const [disconeFeedGapMillimetres, setDisconeFeedGapMillimetres] = useState(5);
  const [disconeRadialLengthToleranceMillimetres, setDisconeRadialLengthToleranceMillimetres] = useState(2);
  const [logPeriodicUpperFrequencyText, setLogPeriodicUpperFrequencyText] = useState('14.350');
  const [logPeriodicTau, setLogPeriodicTau] = useState(0.92);
  const [logPeriodicSigma, setLogPeriodicSigma] = useState(0.12);
  const [logPeriodicActiveRegionFactor, setLogPeriodicActiveRegionFactor] = useState(1.46);
  const [logPeriodicElementConductorDiameterMillimetres, setLogPeriodicElementConductorDiameterMillimetres] = useState(6.35);
  const [logPeriodicElementLengthToleranceMillimetres, setLogPeriodicElementLengthToleranceMillimetres] = useState(2);
  const [logPeriodicBoomPositionToleranceMillimetres, setLogPeriodicBoomPositionToleranceMillimetres] = useState(1);
  const [logPeriodicBoomConductorSpacingMillimetres, setLogPeriodicBoomConductorSpacingMillimetres] = useState(25);
  const [beverageWireLengthWavelengths, setBeverageWireLengthWavelengths] = useState(1);
  const [beverageWireHeightMetres, setBeverageWireHeightMetres] = useState(2);
  const [beverageTargetBearingDegrees, setBeverageTargetBearingDegrees] = useState(45);
  const [beverageReceptionMode, setBeverageReceptionMode] = useState<BeverageReceptionMode>('terminated');
  const [beverageTerminationResistanceOhms, setBeverageTerminationResistanceOhms] = useState(470);
  const [beverageAssumedImpedanceOhms, setBeverageAssumedImpedanceOhms] = useState(450);
  const [beverageFeedlineImpedanceOhms, setBeverageFeedlineImpedanceOhms] = useState(50);
  const [beverageFeedDropMetres, setBeverageFeedDropMetres] = useState(2);
  const [beverageFarEndDropMetres, setBeverageFarEndDropMetres] = useState(2);
  const [beverageMaximumSupportSpanMetres, setBeverageMaximumSupportSpanMetres] = useState(20);
  const [beverageAntennaWindingTurns, setBeverageAntennaWindingTurns] = useState(9);
  const [beverageFeedlineWindingTurns, setBeverageFeedlineWindingTurns] = useState(3);
  const [compactReceiveGeometry, setCompactReceiveGeometry] = useState<CompactReceiveGeometry>('flag');
  const [compactReceiveSpanMetres, setCompactReceiveSpanMetres] = useState(COMPACT_RECEIVE_PRESETS.flag.horizontalSpanMetres);
  const [compactReceiveHeightMetres, setCompactReceiveHeightMetres] = useState(COMPACT_RECEIVE_PRESETS.flag.verticalHeightMetres);
  const [compactReceiveClearanceMetres, setCompactReceiveClearanceMetres] = useState(COMPACT_RECEIVE_PRESETS.flag.bottomClearanceMetres);
  const [compactReceiveBearingDegrees, setCompactReceiveBearingDegrees] = useState(45);
  const [compactReceiveTerminationOhms, setCompactReceiveTerminationOhms] = useState(COMPACT_RECEIVE_PRESETS.flag.terminationResistanceOhms);
  const [compactReceiveAssumedImpedanceOhms, setCompactReceiveAssumedImpedanceOhms] = useState(COMPACT_RECEIVE_PRESETS.flag.assumedAntennaImpedanceOhms);
  const [compactReceiveFeedlineImpedanceOhms, setCompactReceiveFeedlineImpedanceOhms] = useState(50);
  const [compactReceiveAntennaWindingTurns, setCompactReceiveAntennaWindingTurns] = useState(COMPACT_RECEIVE_PRESETS.flag.antennaWindingTurns);
  const [compactReceiveFeedlineWindingTurns, setCompactReceiveFeedlineWindingTurns] = useState(COMPACT_RECEIVE_PRESETS.flag.feedlineWindingTurns);
  const [k9ayApexHeightMetres, setK9ayApexHeightMetres] = useState(7.62);
  const [k9ayHalfWidthMetres, setK9ayHalfWidthMetres] = useState(4.572);
  const [k9ayLowerCornerHeightMetres, setK9ayLowerCornerHeightMetres] = useState(1.524);
  const [k9ayFirstReceiveBearingDegrees, setK9ayFirstReceiveBearingDegrees] = useState(45);
  const [k9aySelectedDirectionIndex, setK9aySelectedDirectionIndex] = useState(0);
  const [k9ayTerminationResistanceOhms, setK9ayTerminationResistanceOhms] = useState(390);
  const [k9ayAssumedImpedanceOhms, setK9ayAssumedImpedanceOhms] = useState(450);
  const [k9ayFeedlineImpedanceOhms, setK9ayFeedlineImpedanceOhms] = useState(50);
  const [k9ayWireAllowancePercent, setK9ayWireAllowancePercent] = useState(4.14);
  const [k9ayAntennaWindingTurns, setK9ayAntennaWindingTurns] = useState(3);
  const [k9ayFeedlineWindingTurns, setK9ayFeedlineWindingTurns] = useState(1);
  const [logSideLengthMetres, setLogSideLengthMetres] = useState(4.572);
  const [logReceiveAxisBearingDegrees, setLogReceiveAxisBearingDegrees] = useState(45);
  const [logAntennaWindingTurns, setLogAntennaWindingTurns] = useState(5);
  const [logCoaxWindingTurns, setLogCoaxWindingTurns] = useState(2);
  const [logFeedlineImpedanceOhms, setLogFeedlineImpedanceOhms] = useState(75);
  const [logWireAllowancePercent, setLogWireAllowancePercent] = useState(2.5);
  const [activeLoopUpperFrequencyText, setActiveLoopUpperFrequencyText] = useState('14.350');
  const [activeLoopDiameterMetres, setActiveLoopDiameterMetres] = useState(0.762);
  const [activeLoopBaseHeightMetres, setActiveLoopBaseHeightMetres] = useState(1.524);
  const [activeLoopNullAxisBearingDegrees, setActiveLoopNullAxisBearingDegrees] = useState(45);
  const [activeLoopWireAllowancePercent, setActiveLoopWireAllowancePercent] = useState(2.5);
  const [groundRadialCount, setGroundRadialCount] = useState(32);
  const [groundRadialLengthMultiplier, setGroundRadialLengthMultiplier] = useState(1);

  const frequencyMHz = Number(frequencyText);
  const shownDoubletLineLength = unitSystem === 'metric' ? doubletLineLengthMetres : metresToFeet(doubletLineLengthMetres);
  const shownFoldedDipoleSpacing = unitSystem === 'metric' ? foldedDipoleSpacingMetres : metresToFeet(foldedDipoleSpacingMetres);
  const shownG5rvCustomRadiator = unitSystem === 'metric' ? g5rvCustomRadiatorMetres : metresToFeet(g5rvCustomRadiatorMetres);
  const shownG5rvCustomElectricalLine = unitSystem === 'metric' ? g5rvCustomElectricalLineMetres : metresToFeet(g5rvCustomElectricalLineMetres);
  const shownLoadedDipoleSpan = unitSystem === 'metric' ? loadedDipoleSpanMetres : metresToFeet(loadedDipoleSpanMetres);
  const shownLoadedDipoleCoilPosition = unitSystem === 'metric' ? loadedDipoleCoilPositionMetres : metresToFeet(loadedDipoleCoilPositionMetres);
  const shownLoadedDipoleHeight = unitSystem === 'metric' ? loadedDipoleHeightMetres : metresToFeet(loadedDipoleHeightMetres);
  const shownLoadedDipoleDiameter = unitSystem === 'metric' ? loadedDipoleConductorDiameterMillimetres : loadedDipoleConductorDiameterMillimetres / 25.4;
  const shownTrapDipoleSpan = unitSystem === 'metric' ? trapDipoleSpanMetres : metresToFeet(trapDipoleSpanMetres);
  const shownTrapPosition = unitSystem === 'metric' ? trapPositionMetres : metresToFeet(trapPositionMetres);
  const shownTrapDipoleHeight = unitSystem === 'metric' ? trapDipoleHeightMetres : metresToFeet(trapDipoleHeightMetres);
  const shownTrapDipoleDiameter = unitSystem === 'metric' ? trapDipoleConductorDiameterMillimetres : trapDipoleConductorDiameterMillimetres / 25.4;
  const shownSmallLoopCircumference = unitSystem === 'metric' ? smallLoopCircumferenceMetres : metresToFeet(smallLoopCircumferenceMetres);
  const shownSmallLoopConductorDiameter = unitSystem === 'metric' ? smallLoopConductorOutsideDiameterMillimetres : smallLoopConductorOutsideDiameterMillimetres / 25.4;
  const shownLoadedVerticalHeight = unitSystem === 'metric' ? loadedVerticalHeightMetres : metresToFeet(loadedVerticalHeightMetres);
  const shownLoadedVerticalCoilPosition = unitSystem === 'metric' ? loadedVerticalCoilPositionMetres : metresToFeet(loadedVerticalCoilPositionMetres);
  const shownLoadedVerticalDiameter = unitSystem === 'metric' ? loadedVerticalConductorDiameterMillimetres : loadedVerticalConductorDiameterMillimetres / 25.4;
  const shownBeverageWireHeight = unitSystem === 'metric' ? beverageWireHeightMetres : metresToFeet(beverageWireHeightMetres);
  const shownCompactReceiveSpan = unitSystem === 'metric' ? compactReceiveSpanMetres : metresToFeet(compactReceiveSpanMetres);
  const shownCompactReceiveHeight = unitSystem === 'metric' ? compactReceiveHeightMetres : metresToFeet(compactReceiveHeightMetres);
  const shownCompactReceiveClearance = unitSystem === 'metric' ? compactReceiveClearanceMetres : metresToFeet(compactReceiveClearanceMetres);
  const shownK9ayApexHeight = unitSystem === 'metric' ? k9ayApexHeightMetres : metresToFeet(k9ayApexHeightMetres);
  const shownK9ayHalfWidth = unitSystem === 'metric' ? k9ayHalfWidthMetres : metresToFeet(k9ayHalfWidthMetres);
  const shownK9ayLowerCornerHeight = unitSystem === 'metric' ? k9ayLowerCornerHeightMetres : metresToFeet(k9ayLowerCornerHeightMetres);
  const shownLogSideLength = unitSystem === 'metric' ? logSideLengthMetres : metresToFeet(logSideLengthMetres);
  const shownActiveLoopDiameter = unitSystem === 'metric' ? activeLoopDiameterMetres : metresToFeet(activeLoopDiameterMetres);
  const shownActiveLoopBaseHeight = unitSystem === 'metric' ? activeLoopBaseHeightMetres : metresToFeet(activeLoopBaseHeightMetres);
  const availableBands = getBandsForJurisdiction(jurisdiction);
  const activeBand = findBandForFrequency(frequencyMHz, jurisdiction);
  const bandSource = getBandSource(jurisdiction);
  const jurisdictionName = jurisdictionProfiles.find((profile) => profile.code === jurisdiction)?.name ?? 'Unknown';
  const selectedBandId = antennaType === 'log-periodic' || antennaType === 'active-receive-loop'
    ? availableBands.find((band) => Math.abs(frequencyMHz - band.lowerMHz) < 0.000_001 && Math.abs(Number(antennaType === 'log-periodic' ? logPeriodicUpperFrequencyText : activeLoopUpperFrequencyText) - band.upperMHz) < 0.000_001)?.id ?? 'custom'
    : activeBand?.id ?? 'custom';

  const calculation = useMemo(() => {
    try {
      const common = { frequencyMHz, lengthCorrectionFactor, trimAllowancePercent };
      if (antennaType === 'dipole') return { type: antennaType, value: calculateHalfWaveDipole(common) } as const;
      if (antennaType === 'folded-dipole') return { type: antennaType, value: calculateFoldedDipole({ ...common, conductorSpacingMetres: foldedDipoleSpacingMetres, assumedSingleDipoleResistanceOhms: foldedDipoleReferenceResistanceOhms, plannedFeedlineImpedanceOhms: foldedDipoleFeedlineImpedanceOhms }) } as const;
      if (antennaType === 'fan-dipole') return { type: antennaType, value: calculateFanDipole({ frequenciesMHz: [frequencyMHz, ...fanAdditionalFrequencyTexts.map(Number)], lengthCorrectionFactor, trimAllowancePercent }) } as const;
      if (antennaType === 'doublet') return { type: antennaType, value: calculateDoublet({ lowestFrequencyMHz: frequencyMHz, lengthCorrectionFactor, trimAllowancePercent, balancedLineLengthMetres: doubletLineLengthMetres, balancedLineVelocityFactor: doubletLineVelocityFactor, balancedLineImpedanceOhms: doubletLineImpedanceOhms, lineCheckFrequencyMHz: Number(doubletCheckFrequencyText) }) } as const;
      if (antennaType === 'g5rv') return { type: antennaType, value: calculateG5rv({ preset: g5rvPreset, inspectionFrequencyMHz: frequencyMHz, matchingSectionVelocityFactor: g5rvLineVelocityFactor, matchingSectionImpedanceOhms: g5rvLineImpedanceOhms, customRadiatorLengthMetres: g5rvCustomRadiatorMetres, customMatchingSectionElectricalLengthMetres: g5rvCustomElectricalLineMetres }) } as const;
      if (antennaType === 'phased-collinear') return { type: antennaType, value: calculatePhasedWireCollinear({ frequencyMHz, elementCount: collinearElementCount, radiatorCorrectionFactor: lengthCorrectionFactor, radiatorTrimAllowancePercent: trimAllowancePercent, phasingLineVelocityFactor: collinearPhasingVelocityFactor, phasingStubTrimAllowancePercent: collinearStubTrimAllowancePercent, phasingStubLengthToleranceMillimetres: collinearStubLengthToleranceMillimetres, maximumJunctionPhaseErrorDegrees: collinearMaximumJunctionPhaseErrorDegrees }) } as const;
      if (antennaType === 'turnstile') return { type: antennaType, value: calculateTurnstile({ ...common, phasingLineVelocityFactor: turnstilePhasingVelocityFactor, quadratureOrder: turnstileQuadratureOrder }) } as const;
      if (antennaType === 'halo') return { type: antennaType, value: calculateHalo({ ...common, shape: haloShape, farEndGapMetres: haloFarEndGapMetres, feedpointGapMetres: haloFeedpointGapMetres }) } as const;
      if (antennaType === 'skywire') return { type: antennaType, value: calculateSkywire({ ...common, longToShortAspectRatio: skywireAspectRatio, supportHeightsMetres: skywireSupportHeightsMetres, riggingReservePercent: skywireRiggingReservePercent, feedSide: skywireFeedSide, feedPositionPercent: skywireFeedPositionPercent }) } as const;
      if (antennaType === 'hex-beam') return { type: antennaType, value: calculateHexBeam({ bands: hexBeamBands, wireGauge: hexBeamWireGauge }) } as const;
      if (antennaType === 'v-beam') return { type: antennaType, value: calculateVBeam({ frequencyMHz, legWavelengths: vBeamLegWavelengths, targetBearingDegrees: vBeamTargetBearingDegrees, mode: vBeamMode, terminationResistanceOhms: vBeamTerminationResistanceOhms, trimAllowancePercent: vBeamTrimAllowancePercent }) } as const;
      if (antennaType === 'rhombic') return { type: antennaType, value: calculateRhombic({ frequencyMHz, sideWavelengths: rhombicSideWavelengths, includedAngleDegrees: rhombicIncludedAngleDegrees, forwardBearingDegrees: rhombicForwardBearingDegrees, mode: rhombicMode, terminationResistanceOhms: rhombicTerminationResistanceOhms, trimAllowancePercent: rhombicTrimAllowancePercent }) } as const;
      if (antennaType === 'vertical-half-rhombic') return { type: antennaType, value: calculateVerticalHalfRhombic({ frequencyMHz, totalWireWavelengths: halfRhombicWireWavelengths, apexHeightMetres: halfRhombicApexHeightMetres, forwardBearingDegrees: halfRhombicForwardBearingDegrees, mode: halfRhombicMode, terminationResistanceOhms: halfRhombicTerminationResistanceOhms, attachmentAllowancePercent: halfRhombicAttachmentAllowancePercent }) } as const;
      if (antennaType === 't2fd') return { type: antennaType, value: calculateT2fd({ lowestFrequencyMHz: frequencyMHz, tiltDegrees: t2fdTiltDegrees, lowAttachmentHeightMetres: t2fdLowAttachmentHeightMetres, terminationResistanceOhms: t2fdTerminationResistanceOhms, feedSystemImpedanceOhms: t2fdFeedSystemImpedanceOhms, transmitterPowerWatts: t2fdTransmitterPowerWatts, wireAllowancePercent: t2fdWireAllowancePercent }) } as const;
      if (antennaType === 'loaded-dipole') return { type: antennaType, value: calculateLoadedDipole({ frequencyMHz, lengthCorrectionFactor, totalSpanMetres: loadedDipoleSpanMetres, loadingPointFromCentreMetres: loadedDipoleCoilPositionMetres, heightAboveGroundMetres: loadedDipoleHeightMetres, conductorDiameterMillimetres: loadedDipoleConductorDiameterMillimetres }) } as const;
      if (antennaType === 'trap-dipole') return { type: antennaType, value: calculateTrapDipole({ lowerFrequencyMHz: frequencyMHz, upperFrequencyMHz: Number(trapUpperFrequencyText), lengthCorrectionFactor, totalSpanMetres: trapDipoleSpanMetres, trapPositionFromCentreMetres: trapPositionMetres, heightAboveGroundMetres: trapDipoleHeightMetres, conductorDiameterMillimetres: trapDipoleConductorDiameterMillimetres }) } as const;
      if (antennaType === 'small-loop') return { type: antennaType, value: calculateSmallTransmittingLoop({ lowerFrequencyMHz: frequencyMHz, upperFrequencyMHz: Number(smallLoopUpperFrequencyText), circumferenceMetres: smallLoopCircumferenceMetres, measuredInductanceMicrohenries: smallLoopMeasuredInductanceMicrohenries, strayCapacitancePicofarads: smallLoopStrayCapacitancePicofarads, capacitorMinimumPicofarads: smallLoopCapacitorMinimumPicofarads, capacitorMaximumPicofarads: smallLoopCapacitorMaximumPicofarads, conductorMaterial: smallLoopConductorMaterial, conductorOutsideDiameterMillimetres: smallLoopConductorOutsideDiameterMillimetres, additionalSeriesLossMilliohms: smallLoopAdditionalSeriesLossMilliohms, acceptedPowerWatts: smallLoopAcceptedPowerWatts }) } as const;
      if (antennaType === 'inverted-v') return { type: antennaType, value: calculateInvertedV({ ...common, includedAngleDegrees }) } as const;
      if (antennaType === 'efhw') return { type: antennaType, value: calculateEfhw({ ...common, transformerRatio, estimatedEndImpedanceOhms }) } as const;
      if (antennaType === 'ocfd') return { type: antennaType, value: calculateOcfd({ ...common, transformerRatio, feedpointPercentFromEnd, estimatedFeedpointImpedanceOhms: estimatedOcfdImpedanceOhms }) } as const;
      if (antennaType === 'jpole') return { type: antennaType, value: calculateJpole({ ...common, feedpointPercentOfStub: jpoleTapPercent }) } as const;
      if (antennaType === 'slim-jim') return { type: antennaType, value: calculateSlimJim({ ...common, feedpointPercentOfStub: jpoleTapPercent, gapPercentOfStub: slimJimGapPercent }) } as const;
      if (antennaType === 'moxon') return { type: antennaType, value: calculateMoxon({ frequencyMHz, conductorDiameterMillimetres: moxonConductorDiameterMillimetres }) } as const;
      if (antennaType === 'cubical-quad') return { type: antennaType, value: calculateTwoElementCubicalQuad({ frequencyMHz, elementSpacingWavelengths: quadElementSpacingWavelengths, trimAllowancePercent, forwardBearingDegrees: quadForwardBearingDegrees, boomCentreHeightMetres: quadBoomCentreHeightMetres, mastReference: quadMastReference }) } as const;
      if (antennaType === 'axial-helix') return { type: antennaType, value: calculateAxialModeHelix({ frequencyMHz, circumferenceWavelengths: helixCircumferenceWavelengths, pitchAngleDegrees: helixPitchAngleDegrees, turnCount: helixTurnCount, groundPlaneWavelengths: helixGroundPlaneWavelengths, trimAllowancePercent, conductorWidthMillimetres: helixConductorWidthMillimetres, diameterToleranceMillimetres: helixDiameterToleranceMillimetres, turnSpacingToleranceMillimetres: helixTurnSpacingToleranceMillimetres, feedlineImpedanceOhms: helixFeedlineImpedanceOhms }) } as const;
      if (antennaType === 'discone') return { type: antennaType, value: calculateDiscone({ lowerFrequencyMHz: frequencyMHz, coneHalfAngleDegrees: disconeHalfAngleDegrees, coneRadialCount: disconeConeRadialCount, discRadialCount: disconeDiscRadialCount, connectionAllowancePercent: trimAllowancePercent, radialConductorDiameterMillimetres: disconeRadialConductorDiameterMillimetres, feedGapMillimetres: disconeFeedGapMillimetres, radialLengthToleranceMillimetres: disconeRadialLengthToleranceMillimetres }) } as const;
      if (antennaType === 'log-periodic') return { type: antennaType, value: calculateLogPeriodic({ lowerFrequencyMHz: frequencyMHz, upperFrequencyMHz: Number(logPeriodicUpperFrequencyText), tau: logPeriodicTau, sigma: logPeriodicSigma, activeRegionBandwidthFactor: logPeriodicActiveRegionFactor, elementCutAllowancePercent: trimAllowancePercent, elementConductorDiameterMillimetres: logPeriodicElementConductorDiameterMillimetres, elementLengthToleranceMillimetres: logPeriodicElementLengthToleranceMillimetres, boomPositionToleranceMillimetres: logPeriodicBoomPositionToleranceMillimetres, boomConductorSpacingMillimetres: logPeriodicBoomConductorSpacingMillimetres }) } as const;
      if (antennaType === 'beverage') return { type: antennaType, value: calculateBeverage({ frequencyMHz, wireLengthWavelengths: beverageWireLengthWavelengths, wireHeightMetres: beverageWireHeightMetres, targetBearingDegrees: beverageTargetBearingDegrees, receptionMode: beverageReceptionMode, terminationResistanceOhms: beverageTerminationResistanceOhms, assumedAntennaImpedanceOhms: beverageAssumedImpedanceOhms, feedlineImpedanceOhms: beverageFeedlineImpedanceOhms, wireCutAllowancePercent: trimAllowancePercent, feedDropMetres: beverageFeedDropMetres, farEndDropMetres: beverageFarEndDropMetres, maximumSupportSpanMetres: beverageMaximumSupportSpanMetres, antennaWindingTurns: beverageAntennaWindingTurns, feedlineWindingTurns: beverageFeedlineWindingTurns }) } as const;
      if (antennaType === 'compact-receive') return { type: antennaType, value: calculateCompactReceive({ frequencyMHz, geometry: compactReceiveGeometry, horizontalSpanMetres: compactReceiveSpanMetres, verticalHeightMetres: compactReceiveHeightMetres, bottomClearanceMetres: compactReceiveClearanceMetres, receiveBearingDegrees: compactReceiveBearingDegrees, terminationResistanceOhms: compactReceiveTerminationOhms, assumedAntennaImpedanceOhms: compactReceiveAssumedImpedanceOhms, feedlineImpedanceOhms: compactReceiveFeedlineImpedanceOhms, wireCutAllowancePercent: trimAllowancePercent, antennaWindingTurns: compactReceiveAntennaWindingTurns, feedlineWindingTurns: compactReceiveFeedlineWindingTurns }) } as const;
      if (antennaType === 'k9ay') return { type: antennaType, value: calculateK9ay({ frequencyMHz, apexHeightMetres: k9ayApexHeightMetres, halfWidthMetres: k9ayHalfWidthMetres, lowerCornerHeightMetres: k9ayLowerCornerHeightMetres, firstReceiveBearingDegrees: k9ayFirstReceiveBearingDegrees, selectedDirectionIndex: k9aySelectedDirectionIndex, terminationResistanceOhms: k9ayTerminationResistanceOhms, assumedAntennaImpedanceOhms: k9ayAssumedImpedanceOhms, feedlineImpedanceOhms: k9ayFeedlineImpedanceOhms, wireCutAllowancePercent: k9ayWireAllowancePercent, antennaWindingTurns: k9ayAntennaWindingTurns, feedlineWindingTurns: k9ayFeedlineWindingTurns }) } as const;
      if (antennaType === 'loop-on-ground') return { type: antennaType, value: calculateLoopOnGround({ frequencyMHz, sideLengthMetres: logSideLengthMetres, receiveAxisBearingDegrees: logReceiveAxisBearingDegrees, antennaWindingTurns: logAntennaWindingTurns, coaxWindingTurns: logCoaxWindingTurns, feedlineImpedanceOhms: logFeedlineImpedanceOhms, wireCutAllowancePercent: logWireAllowancePercent }) } as const;
      if (antennaType === 'active-receive-loop') return { type: antennaType, value: calculateActiveReceiveLoop({ lowerFrequencyMHz: frequencyMHz, upperFrequencyMHz: Number(activeLoopUpperFrequencyText), loopDiameterMetres: activeLoopDiameterMetres, baseHeightMetres: activeLoopBaseHeightMetres, nullAxisBearingDegrees: activeLoopNullAxisBearingDegrees, conductorCutAllowancePercent: activeLoopWireAllowancePercent }) } as const;
      if (antennaType === 'yagi') return { type: antennaType, value: calculateBasicYagi({ frequencyMHz }) } as const;
      if (antennaType === 'loaded-vertical') return { type: antennaType, value: calculateLoadedVertical({ frequencyMHz, lengthCorrectionFactor, radiatorHeightMetres: loadedVerticalHeightMetres, loadingPointFromBaseMetres: loadedVerticalCoilPositionMetres, conductorDiameterMillimetres: loadedVerticalConductorDiameterMillimetres }) } as const;
      if (antennaType === 'ground-mounted-vertical') return { type: antennaType, value: calculateGroundMountedVertical({ ...common, radialCount: groundRadialCount, radialLengthMultiplier: groundRadialLengthMultiplier }) } as const;
      if (antennaType === 'ground-plane') return { type: antennaType, value: calculateGroundPlane({ ...common, radialCount, radialSlopeDegrees }) } as const;
      return { type: antennaType, value: calculateFullWaveLoop({ ...common, shape: loopShape, deltaOrientation: deltaLoopOrientation, deltaFeedMode: deltaLoopFeedMode }) } as const;
    } catch {
      return null;
    }
  }, [antennaType, beverageAntennaWindingTurns, beverageAssumedImpedanceOhms, beverageFarEndDropMetres, beverageFeedDropMetres, beverageFeedlineImpedanceOhms, beverageFeedlineWindingTurns, beverageMaximumSupportSpanMetres, beverageReceptionMode, beverageTargetBearingDegrees, beverageTerminationResistanceOhms, beverageWireHeightMetres, beverageWireLengthWavelengths, collinearElementCount, collinearMaximumJunctionPhaseErrorDegrees, collinearPhasingVelocityFactor, collinearStubLengthToleranceMillimetres, collinearStubTrimAllowancePercent, compactReceiveAntennaWindingTurns, compactReceiveAssumedImpedanceOhms, compactReceiveBearingDegrees, compactReceiveClearanceMetres, compactReceiveFeedlineImpedanceOhms, compactReceiveFeedlineWindingTurns, compactReceiveGeometry, compactReceiveHeightMetres, compactReceiveSpanMetres, compactReceiveTerminationOhms, deltaLoopFeedMode, deltaLoopOrientation, disconeConeRadialCount, disconeDiscRadialCount, disconeFeedGapMillimetres, disconeHalfAngleDegrees, disconeRadialConductorDiameterMillimetres, disconeRadialLengthToleranceMillimetres, doubletCheckFrequencyText, doubletLineImpedanceOhms, doubletLineLengthMetres, doubletLineVelocityFactor, estimatedEndImpedanceOhms, estimatedOcfdImpedanceOhms, fanAdditionalFrequencyTexts, feedpointPercentFromEnd, foldedDipoleFeedlineImpedanceOhms, foldedDipoleReferenceResistanceOhms, foldedDipoleSpacingMetres, frequencyMHz, g5rvCustomElectricalLineMetres, g5rvCustomRadiatorMetres, g5rvLineImpedanceOhms, g5rvLineVelocityFactor, g5rvPreset, groundRadialCount, groundRadialLengthMultiplier, halfRhombicApexHeightMetres, halfRhombicAttachmentAllowancePercent, halfRhombicForwardBearingDegrees, halfRhombicMode, halfRhombicTerminationResistanceOhms, halfRhombicWireWavelengths, haloFarEndGapMetres, haloFeedpointGapMetres, haloShape, helixCircumferenceWavelengths, helixConductorWidthMillimetres, helixDiameterToleranceMillimetres, helixFeedlineImpedanceOhms, helixGroundPlaneWavelengths, helixPitchAngleDegrees, helixTurnCount, helixTurnSpacingToleranceMillimetres, hexBeamBands, hexBeamWireGauge, includedAngleDegrees, jpoleTapPercent, k9ayAntennaWindingTurns, k9ayApexHeightMetres, k9ayAssumedImpedanceOhms, k9ayFeedlineImpedanceOhms, k9ayFeedlineWindingTurns, k9ayFirstReceiveBearingDegrees, k9ayHalfWidthMetres, k9ayLowerCornerHeightMetres, k9aySelectedDirectionIndex, k9ayTerminationResistanceOhms, k9ayWireAllowancePercent, lengthCorrectionFactor, loadedDipoleCoilPositionMetres, loadedDipoleConductorDiameterMillimetres, loadedDipoleHeightMetres, loadedDipoleSpanMetres, loadedVerticalCoilPositionMetres, loadedVerticalConductorDiameterMillimetres, loadedVerticalHeightMetres, logAntennaWindingTurns, logCoaxWindingTurns, logFeedlineImpedanceOhms, logPeriodicActiveRegionFactor, logPeriodicBoomConductorSpacingMillimetres, logPeriodicBoomPositionToleranceMillimetres, logPeriodicElementConductorDiameterMillimetres, logPeriodicElementLengthToleranceMillimetres, logPeriodicSigma, logPeriodicTau, logPeriodicUpperFrequencyText, logReceiveAxisBearingDegrees, logSideLengthMetres, logWireAllowancePercent, loopShape, moxonConductorDiameterMillimetres, quadBoomCentreHeightMetres, quadElementSpacingWavelengths, quadForwardBearingDegrees, quadMastReference, radialCount, radialSlopeDegrees, rhombicForwardBearingDegrees, rhombicIncludedAngleDegrees, rhombicMode, rhombicSideWavelengths, rhombicTerminationResistanceOhms, rhombicTrimAllowancePercent, skywireAspectRatio, skywireFeedPositionPercent, skywireFeedSide, skywireRiggingReservePercent, skywireSupportHeightsMetres, slimJimGapPercent, smallLoopAcceptedPowerWatts, smallLoopAdditionalSeriesLossMilliohms, smallLoopCapacitorMaximumPicofarads, smallLoopCapacitorMinimumPicofarads, smallLoopCircumferenceMetres, smallLoopConductorMaterial, smallLoopConductorOutsideDiameterMillimetres, smallLoopMeasuredInductanceMicrohenries, smallLoopStrayCapacitancePicofarads, smallLoopUpperFrequencyText, t2fdFeedSystemImpedanceOhms, t2fdLowAttachmentHeightMetres, t2fdTerminationResistanceOhms, t2fdTiltDegrees, t2fdTransmitterPowerWatts, t2fdWireAllowancePercent, transformerRatio, trapDipoleConductorDiameterMillimetres, trapDipoleHeightMetres, trapDipoleSpanMetres, trapPositionMetres, trapUpperFrequencyText, trimAllowancePercent, turnstilePhasingVelocityFactor, turnstileQuadratureOrder, vBeamLegWavelengths, vBeamMode, vBeamTargetBearingDegrees, vBeamTerminationResistanceOhms, vBeamTrimAllowancePercent, activeLoopBaseHeightMetres, activeLoopDiameterMetres, activeLoopNullAxisBearingDegrees, activeLoopUpperFrequencyText, activeLoopWireAllowancePercent]);

  const model = antennaType === 'dipole'
    ? HALF_WAVE_DIPOLE_MODEL
    : antennaType === 'folded-dipole'
      ? FOLDED_DIPOLE_MODEL
    : antennaType === 't2fd'
      ? T2FD_MODEL
    : antennaType === 'fan-dipole'
      ? ANTENNA_MODELS.fanDipole
      : antennaType === 'doublet'
        ? DOUBLET_MODEL
        : antennaType === 'g5rv'
          ? G5RV_MODEL
        : antennaType === 'phased-collinear'
          ? PHASED_WIRE_COLLINEAR_MODEL
        : antennaType === 'turnstile'
          ? TURNSTILE_MODEL
        : antennaType === 'halo'
          ? HALO_MODEL
        : antennaType === 'skywire'
          ? SKYWIRE_MODEL
        : antennaType === 'hex-beam'
          ? HEX_BEAM_MODEL
        : antennaType === 'v-beam'
          ? V_BEAM_MODEL
        : antennaType === 'rhombic'
          ? RHOMBIC_MODEL
        : antennaType === 'vertical-half-rhombic'
          ? VERTICAL_HALF_RHOMBIC_MODEL
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
                : antennaType === 'cubical-quad'
                  ? TWO_ELEMENT_CUBICAL_QUAD_MODEL
                : antennaType === 'axial-helix'
                  ? AXIAL_MODE_HELIX_MODEL
                : antennaType === 'discone'
                  ? DISCONE_MODEL
                : antennaType === 'log-periodic'
                  ? LOG_PERIODIC_MODEL
                : antennaType === 'beverage'
                  ? BEVERAGE_MODEL
                : antennaType === 'compact-receive'
                  ? COMPACT_RECEIVE_MODEL
                : antennaType === 'k9ay'
                  ? K9AY_MODEL
                : antennaType === 'loop-on-ground'
                  ? LOOP_ON_GROUND_MODEL
                : antennaType === 'active-receive-loop'
                  ? ACTIVE_RECEIVE_LOOP_MODEL
                : antennaType === 'yagi'
                  ? ANTENNA_MODELS.basicYagi
                  : antennaType === 'ground-mounted-vertical'
                    ? ANTENNA_MODELS.groundMountedVertical
              : antennaType === 'ground-plane'
                ? ANTENNA_MODELS.groundPlane
                : ANTENNA_MODELS.fullWaveLoop;
  const handoffFrequencyMHz = calculation?.type === 'hex-beam' ? calculation.value.referenceFrequencyMHz : calculation?.type === 'small-loop' ? calculation.value.centreFrequencyMHz : calculation?.type === 'log-periodic' ? Math.sqrt(calculation.value.lowerFrequencyMHz * calculation.value.upperFrequencyMHz) : frequencyMHz;
  const workspaceBindings = [
    planBinding(antennaType, setAntennaType),
    planBinding(frequencyText, setFrequencyText),
    planBinding(foldedDipoleSpacingMetres, setFoldedDipoleSpacingMetres),
    planBinding(foldedDipoleReferenceResistanceOhms, setFoldedDipoleReferenceResistanceOhms),
    planBinding(foldedDipoleFeedlineImpedanceOhms, setFoldedDipoleFeedlineImpedanceOhms),
    planBinding(fanAdditionalFrequencyTexts, setFanAdditionalFrequencyTexts),
    planBinding(doubletLineLengthMetres, setDoubletLineLengthMetres),
    planBinding(doubletLineVelocityFactor, setDoubletLineVelocityFactor),
    planBinding(doubletLineImpedanceOhms, setDoubletLineImpedanceOhms),
    planBinding(doubletCheckFrequencyText, setDoubletCheckFrequencyText),
    planBinding(doubletTunerInterface, setDoubletTunerInterface),
    planBinding(g5rvPreset, setG5rvPreset),
    planBinding(g5rvLineVelocityFactor, setG5rvLineVelocityFactor),
    planBinding(g5rvLineImpedanceOhms, setG5rvLineImpedanceOhms),
    planBinding(g5rvCustomRadiatorMetres, setG5rvCustomRadiatorMetres),
    planBinding(g5rvCustomElectricalLineMetres, setG5rvCustomElectricalLineMetres),
    planBinding(collinearElementCount, setCollinearElementCount),
    planBinding(collinearPhasingVelocityFactor, setCollinearPhasingVelocityFactor),
    planBinding(collinearStubTrimAllowancePercent, setCollinearStubTrimAllowancePercent),
    planBinding(collinearStubLengthToleranceMillimetres, setCollinearStubLengthToleranceMillimetres),
    planBinding(collinearMaximumJunctionPhaseErrorDegrees, setCollinearMaximumJunctionPhaseErrorDegrees),
    planBinding(turnstilePhasingVelocityFactor, setTurnstilePhasingVelocityFactor),
    planBinding(turnstileQuadratureOrder, setTurnstileQuadratureOrder),
    planBinding(haloShape, setHaloShape),
    planBinding(haloFarEndGapMetres, setHaloFarEndGapMetres),
    planBinding(haloFeedpointGapMetres, setHaloFeedpointGapMetres),
    planBinding(skywireAspectRatio, setSkywireAspectRatio),
    planBinding(skywireSupportHeightsMetres, setSkywireSupportHeightsMetres),
    planBinding(skywireRiggingReservePercent, setSkywireRiggingReservePercent),
    planBinding(skywireFeedSide, setSkywireFeedSide),
    planBinding(skywireFeedPositionPercent, setSkywireFeedPositionPercent),
    planBinding(hexBeamBands, setHexBeamBands),
    planBinding(hexBeamWireGauge, setHexBeamWireGauge),
    planBinding(vBeamLegWavelengths, setVBeamLegWavelengths),
    planBinding(vBeamTargetBearingDegrees, setVBeamTargetBearingDegrees),
    planBinding(vBeamMode, setVBeamMode),
    planBinding(vBeamTerminationResistanceOhms, setVBeamTerminationResistanceOhms),
    planBinding(vBeamTrimAllowancePercent, setVBeamTrimAllowancePercent),
    planBinding(rhombicSideWavelengths, setRhombicSideWavelengths),
    planBinding(rhombicIncludedAngleDegrees, setRhombicIncludedAngleDegrees),
    planBinding(rhombicForwardBearingDegrees, setRhombicForwardBearingDegrees),
    planBinding(rhombicMode, setRhombicMode),
    planBinding(rhombicTerminationResistanceOhms, setRhombicTerminationResistanceOhms),
    planBinding(rhombicTrimAllowancePercent, setRhombicTrimAllowancePercent),
    planBinding(halfRhombicWireWavelengths, setHalfRhombicWireWavelengths),
    planBinding(halfRhombicApexHeightMetres, setHalfRhombicApexHeightMetres),
    planBinding(halfRhombicForwardBearingDegrees, setHalfRhombicForwardBearingDegrees),
    planBinding(halfRhombicMode, setHalfRhombicMode),
    planBinding(halfRhombicTerminationResistanceOhms, setHalfRhombicTerminationResistanceOhms),
    planBinding(halfRhombicAttachmentAllowancePercent, setHalfRhombicAttachmentAllowancePercent),
    planBinding(loadedDipoleSpanMetres, setLoadedDipoleSpanMetres),
    planBinding(loadedDipoleCoilPositionMetres, setLoadedDipoleCoilPositionMetres),
    planBinding(loadedDipoleHeightMetres, setLoadedDipoleHeightMetres),
    planBinding(loadedDipoleConductorDiameterMillimetres, setLoadedDipoleConductorDiameterMillimetres),
    planBinding(trapUpperFrequencyText, setTrapUpperFrequencyText),
    planBinding(trapDipoleSpanMetres, setTrapDipoleSpanMetres),
    planBinding(trapPositionMetres, setTrapPositionMetres),
    planBinding(trapDipoleHeightMetres, setTrapDipoleHeightMetres),
    planBinding(trapDipoleConductorDiameterMillimetres, setTrapDipoleConductorDiameterMillimetres),
    planBinding(smallLoopUpperFrequencyText, setSmallLoopUpperFrequencyText),
    planBinding(smallLoopCircumferenceMetres, setSmallLoopCircumferenceMetres),
    planBinding(smallLoopMeasuredInductanceMicrohenries, setSmallLoopMeasuredInductanceMicrohenries),
    planBinding(smallLoopStrayCapacitancePicofarads, setSmallLoopStrayCapacitancePicofarads),
    planBinding(smallLoopCapacitorMinimumPicofarads, setSmallLoopCapacitorMinimumPicofarads),
    planBinding(smallLoopCapacitorMaximumPicofarads, setSmallLoopCapacitorMaximumPicofarads),
    planBinding(smallLoopConductorMaterial, setSmallLoopConductorMaterial),
    planBinding(smallLoopConductorOutsideDiameterMillimetres, setSmallLoopConductorOutsideDiameterMillimetres),
    planBinding(smallLoopAdditionalSeriesLossMilliohms, setSmallLoopAdditionalSeriesLossMilliohms),
    planBinding(smallLoopAcceptedPowerWatts, setSmallLoopAcceptedPowerWatts),
    planBinding(loadedVerticalHeightMetres, setLoadedVerticalHeightMetres),
    planBinding(loadedVerticalCoilPositionMetres, setLoadedVerticalCoilPositionMetres),
    planBinding(loadedVerticalConductorDiameterMillimetres, setLoadedVerticalConductorDiameterMillimetres),
    planBinding(lengthCorrectionFactor, setLengthCorrectionFactor),
    planBinding(trimAllowancePercent, setTrimAllowancePercent),
    planBinding(includedAngleDegrees, setIncludedAngleDegrees),
    planBinding(radialCount, setRadialCount),
    planBinding(radialSlopeDegrees, setRadialSlopeDegrees),
    planBinding(loopShape, setLoopShape),
    planBinding(deltaLoopOrientation, setDeltaLoopOrientation),
    planBinding(deltaLoopFeedMode, setDeltaLoopFeedMode),
    planBinding(transformerRatio, setTransformerRatio),
    planBinding(estimatedEndImpedanceOhms, setEstimatedEndImpedanceOhms),
    planBinding(feedpointPercentFromEnd, setFeedpointPercentFromEnd),
    planBinding(estimatedOcfdImpedanceOhms, setEstimatedOcfdImpedanceOhms),
    planBinding(jpoleConstruction, setJpoleConstruction),
    planBinding(jpoleTapPercent, setJpoleTapPercent),
    planBinding(slimJimGapPercent, setSlimJimGapPercent),
    planBinding(moxonConductorDiameterMillimetres, setMoxonConductorDiameterMillimetres),
    planBinding(quadElementSpacingWavelengths, setQuadElementSpacingWavelengths),
    planBinding(quadPolarization, setQuadPolarization),
    planBinding(helixCircumferenceWavelengths, setHelixCircumferenceWavelengths),
    planBinding(helixPitchAngleDegrees, setHelixPitchAngleDegrees),
    planBinding(helixTurnCount, setHelixTurnCount),
    planBinding(helixGroundPlaneWavelengths, setHelixGroundPlaneWavelengths),
    planBinding(helixHandedness, setHelixHandedness),
    planBinding(disconeHalfAngleDegrees, setDisconeHalfAngleDegrees),
    planBinding(disconeConeRadialCount, setDisconeConeRadialCount),
    planBinding(disconeDiscRadialCount, setDisconeDiscRadialCount),
    planBinding(logPeriodicUpperFrequencyText, setLogPeriodicUpperFrequencyText),
    planBinding(logPeriodicTau, setLogPeriodicTau),
    planBinding(logPeriodicSigma, setLogPeriodicSigma),
    planBinding(logPeriodicActiveRegionFactor, setLogPeriodicActiveRegionFactor),
    planBinding(beverageWireLengthWavelengths, setBeverageWireLengthWavelengths),
    planBinding(beverageWireHeightMetres, setBeverageWireHeightMetres),
    planBinding(beverageTargetBearingDegrees, setBeverageTargetBearingDegrees),
    planBinding(beverageReceptionMode, setBeverageReceptionMode),
    planBinding(beverageTerminationResistanceOhms, setBeverageTerminationResistanceOhms),
    planBinding(beverageAssumedImpedanceOhms, setBeverageAssumedImpedanceOhms),
    planBinding(beverageFeedlineImpedanceOhms, setBeverageFeedlineImpedanceOhms),
    planBinding(compactReceiveGeometry, setCompactReceiveGeometry),
    planBinding(compactReceiveSpanMetres, setCompactReceiveSpanMetres),
    planBinding(compactReceiveHeightMetres, setCompactReceiveHeightMetres),
    planBinding(compactReceiveClearanceMetres, setCompactReceiveClearanceMetres),
    planBinding(compactReceiveBearingDegrees, setCompactReceiveBearingDegrees),
    planBinding(compactReceiveTerminationOhms, setCompactReceiveTerminationOhms),
    planBinding(compactReceiveAssumedImpedanceOhms, setCompactReceiveAssumedImpedanceOhms),
    planBinding(compactReceiveFeedlineImpedanceOhms, setCompactReceiveFeedlineImpedanceOhms),
    planBinding(k9ayApexHeightMetres, setK9ayApexHeightMetres),
    planBinding(k9ayHalfWidthMetres, setK9ayHalfWidthMetres),
    planBinding(k9ayLowerCornerHeightMetres, setK9ayLowerCornerHeightMetres),
    planBinding(k9ayFirstReceiveBearingDegrees, setK9ayFirstReceiveBearingDegrees),
    planBinding(k9aySelectedDirectionIndex, setK9aySelectedDirectionIndex),
    planBinding(k9ayTerminationResistanceOhms, setK9ayTerminationResistanceOhms),
    planBinding(k9ayAssumedImpedanceOhms, setK9ayAssumedImpedanceOhms),
    planBinding(k9ayFeedlineImpedanceOhms, setK9ayFeedlineImpedanceOhms),
    planBinding(k9ayWireAllowancePercent, setK9ayWireAllowancePercent),
    planBinding(logSideLengthMetres, setLogSideLengthMetres),
    planBinding(logReceiveAxisBearingDegrees, setLogReceiveAxisBearingDegrees),
    planBinding(logAntennaWindingTurns, setLogAntennaWindingTurns),
    planBinding(logCoaxWindingTurns, setLogCoaxWindingTurns),
    planBinding(logFeedlineImpedanceOhms, setLogFeedlineImpedanceOhms),
    planBinding(logWireAllowancePercent, setLogWireAllowancePercent),
    planBinding(activeLoopUpperFrequencyText, setActiveLoopUpperFrequencyText),
    planBinding(activeLoopDiameterMetres, setActiveLoopDiameterMetres),
    planBinding(activeLoopBaseHeightMetres, setActiveLoopBaseHeightMetres),
    planBinding(activeLoopNullAxisBearingDegrees, setActiveLoopNullAxisBearingDegrees),
    planBinding(activeLoopWireAllowancePercent, setActiveLoopWireAllowancePercent),
    planBinding(groundRadialCount, setGroundRadialCount),
    planBinding(groundRadialLengthMultiplier, setGroundRadialLengthMultiplier),
    planBinding(t2fdTiltDegrees, setT2fdTiltDegrees),
    planBinding(t2fdLowAttachmentHeightMetres, setT2fdLowAttachmentHeightMetres),
    planBinding(t2fdTerminationResistanceOhms, setT2fdTerminationResistanceOhms),
    planBinding(t2fdFeedSystemImpedanceOhms, setT2fdFeedSystemImpedanceOhms),
    planBinding(t2fdTransmitterPowerWatts, setT2fdTransmitterPowerWatts),
    planBinding(t2fdWireAllowancePercent, setT2fdWireAllowancePercent),
    planBinding(quadForwardBearingDegrees, setQuadForwardBearingDegrees),
    planBinding(quadBoomCentreHeightMetres, setQuadBoomCentreHeightMetres),
    planBinding(quadMastReference, setQuadMastReference),
    planBinding(helixConductorWidthMillimetres, setHelixConductorWidthMillimetres),
    planBinding(helixDiameterToleranceMillimetres, setHelixDiameterToleranceMillimetres),
    planBinding(helixTurnSpacingToleranceMillimetres, setHelixTurnSpacingToleranceMillimetres),
    planBinding(helixFeedlineImpedanceOhms, setHelixFeedlineImpedanceOhms),
    planBinding(disconeRadialConductorDiameterMillimetres, setDisconeRadialConductorDiameterMillimetres),
    planBinding(disconeFeedGapMillimetres, setDisconeFeedGapMillimetres),
    planBinding(disconeRadialLengthToleranceMillimetres, setDisconeRadialLengthToleranceMillimetres),
    planBinding(logPeriodicElementConductorDiameterMillimetres, setLogPeriodicElementConductorDiameterMillimetres),
    planBinding(logPeriodicElementLengthToleranceMillimetres, setLogPeriodicElementLengthToleranceMillimetres),
    planBinding(logPeriodicBoomPositionToleranceMillimetres, setLogPeriodicBoomPositionToleranceMillimetres),
    planBinding(logPeriodicBoomConductorSpacingMillimetres, setLogPeriodicBoomConductorSpacingMillimetres),
    planBinding(beverageFeedDropMetres, setBeverageFeedDropMetres),
    planBinding(beverageFarEndDropMetres, setBeverageFarEndDropMetres),
    planBinding(beverageMaximumSupportSpanMetres, setBeverageMaximumSupportSpanMetres),
    planBinding(beverageAntennaWindingTurns, setBeverageAntennaWindingTurns),
    planBinding(beverageFeedlineWindingTurns, setBeverageFeedlineWindingTurns),
    planBinding(compactReceiveAntennaWindingTurns, setCompactReceiveAntennaWindingTurns),
    planBinding(compactReceiveFeedlineWindingTurns, setCompactReceiveFeedlineWindingTurns),
    planBinding(k9ayAntennaWindingTurns, setK9ayAntennaWindingTurns),
    planBinding(k9ayFeedlineWindingTurns, setK9ayFeedlineWindingTurns),
  ];
  const currentWorkspace = Object.fromEntries(workspaceBindings.map(([value], index) => [`s${index}`, value])) as AntennaPlanWorkspace;
  const openAntennaPlan = (plan: AntennaPlan) => {
    const restored = restoreAntennaPlanWorkspace({ ...plan.workspace, s0: plan.antennaType }, currentWorkspace);
    workspaceBindings.forEach(([, setter], index) => setter(restored[`s${index}`]));
    setJurisdiction(plan.jurisdiction);
    setUnitSystem(plan.unitSystem);
    globalThis.requestAnimationFrame?.(() => document.getElementById('calculator-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const recommendedFactor = antennaType === 'full-wave-loop' || antennaType === 'skywire' ? 1.02 : antennaType === 'jpole' || antennaType === 'slim-jim' ? (jpoleConstruction === 'twinlead' ? 0.83 : 0.93) : 0.95;
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
            : antennaType === 'dipole' || antennaType === 'folded-dipole' || antennaType === 'fan-dipole' || antennaType === 'doublet' || antennaType === 'inverted-v' || antennaType === 'turnstile' || antennaType === 'halo'
              ? 'This factor scales the free-space half-wave estimate before it is divided into equal legs. Conductor insulation, diameter, support geometry, height, and surroundings still shift the installed resonance.'
              : antennaType === 'full-wave-loop' || antennaType === 'skywire'
                ? 'This factor scales the complete free-space wavelength into a practical starting perimeter. The selected shape changes the displayed side or diameter, not the total perimeter.'
      : undefined;
  const trimAllowanceTooltip = antennaType === 'efhw'
    ? 'This percentage is added after the corrected resonant estimate. Install the antenna before trimming, remove wire in small increments, and remeasure because removed wire cannot be restored easily.'
    : antennaType === 'ocfd'
      ? 'This percentage adds adjustment room to both legs after the corrected total length is divided. Install and measure before trimming, and preserve the intended split while making small changes.'
      : antennaType === 'jpole' || antennaType === 'slim-jim'
        ? 'This percentage adds adjustment room to the calculated conductor sections. Build and measure before trimming, make small changes, and preserve the intended matching-section relationships and parallel spacing.'
        : antennaType === 'cubical-quad'
          ? 'This percentage is added to both loop perimeters while preserving the reflector at five percent larger than the driven loop. Build and support both loops before shortening them in small measured steps.'
        : antennaType === 'ground-mounted-vertical'
          ? 'This allowance is added to the vertical radiator only; the ground-radial length uses the corrected quarter-wave baseline and selected multiplier. Install before trimming the radiator in small steps.'
          : antennaType === 'ground-plane'
            ? 'This allowance is added to both the radiator and elevated radials. Keep the radials equal and symmetrical while tuning the installed antenna.'
            : antennaType === 'phased-collinear'
              ? 'This percentage is added to every equal radiator section. Tune a representative section first, preserve equality, and keep phasing-stub adjustment separate.'
            : antennaType === 'dipole' || antennaType === 'folded-dipole' || antennaType === 'fan-dipole' || antennaType === 'doublet' || antennaType === 'inverted-v' || antennaType === 'turnstile' || antennaType === 'halo'
              ? 'This percentage is added to the total corrected length before it is divided into equal legs. Install first, then trim both legs equally in small steps.'
              : antennaType === 'full-wave-loop' || antennaType === 'skywire'
                ? 'This percentage is added to the complete loop perimeter. Install the closed loop before trimming and preserve the intended shape and symmetry while making small changes.'
      : undefined;
  const selectDesign = (type: AntennaType) => {
    setAntennaType(type);
    setLengthCorrectionFactor(type === 'full-wave-loop' || type === 'skywire' ? 1.02 : type === 'jpole' || type === 'slim-jim' ? (jpoleConstruction === 'twinlead' ? 0.83 : 0.93) : 0.95);
    if (type === 'efhw') setTransformerRatio(49);
    if (type === 'ocfd') setTransformerRatio(4);
    if (type === 'g5rv') setFrequencyText('14.150');
    if (type === 'small-loop' && activeBand) {
      setFrequencyText(activeBand.lowerMHz.toFixed(activeBand.lowerMHz < 30 ? 3 : 1));
      setSmallLoopUpperFrequencyText(activeBand.upperMHz.toFixed(activeBand.upperMHz < 30 ? 3 : 1));
    }
    if (type === 'log-periodic' && activeBand) {
      setFrequencyText(activeBand.lowerMHz.toFixed(activeBand.lowerMHz < 30 ? 3 : 1));
      setLogPeriodicUpperFrequencyText(activeBand.upperMHz.toFixed(activeBand.upperMHz < 30 ? 3 : 1));
    }
    if (type === 'active-receive-loop' && activeBand) {
      setFrequencyText(activeBand.lowerMHz.toFixed(activeBand.lowerMHz < 30 ? 3 : 1));
      setActiveLoopUpperFrequencyText(activeBand.upperMHz.toFixed(activeBand.upperMHz < 30 ? 3 : 1));
    }
  };
  const openReceivePlanner = (candidate: ReceiveAntennaCandidate) => {
    if (candidate.compactGeometry) {
      const preset = COMPACT_RECEIVE_PRESETS[candidate.compactGeometry];
      setCompactReceiveGeometry(candidate.compactGeometry);
      setCompactReceiveSpanMetres(preset.horizontalSpanMetres);
      setCompactReceiveHeightMetres(preset.verticalHeightMetres);
      setCompactReceiveClearanceMetres(preset.bottomClearanceMetres);
      setCompactReceiveTerminationOhms(preset.terminationResistanceOhms);
      setCompactReceiveAssumedImpedanceOhms(preset.assumedAntennaImpedanceOhms);
    }
    selectDesign(candidate.plannerType);
    globalThis.requestAnimationFrame?.(() => document.getElementById('calculator-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const openComparedPlanner = (type: AntennaType) => {
    selectDesign(type);
    globalThis.requestAnimationFrame?.(() => document.getElementById('calculator-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const printBuildSheet = () => {
    const printClass = 'antenna-build-print';
    const closedDetails = [...document.querySelectorAll<HTMLDetailsElement>('.result-supporting-details:not([open])')];
    const cleanup = () => {
      document.body.classList.remove(printClass);
      closedDetails.forEach((details) => details.removeAttribute('open'));
    };
    document.body.classList.add(printClass);
    closedDetails.forEach((details) => details.setAttribute('open', ''));
    window.addEventListener('afterprint', cleanup, { once: true });
    try {
      window.print();
    } finally {
      window.setTimeout(cleanup, 0);
    }
  };

  return (
    <section className="workspace shell" id="calculator" aria-labelledby="calculator-title" tabIndex={-1}>
      <div className="workspace-heading">
        <div>
          <p className="eyebrow">Graphical antenna workshop</p>
          <h2 id="calculator-title">{ANTENNA_DESIGNS[antennaType].name}</h2>
        </div>
        {antennaType !== 'moxon' && antennaType !== 'yagi' && antennaType !== 'small-loop' && antennaType !== 'g5rv' && antennaType !== 'hex-beam' && antennaType !== 'v-beam' && antennaType !== 'rhombic' && antennaType !== 'vertical-half-rhombic' && antennaType !== 't2fd' && <button className="advanced-toggle" type="button" aria-expanded={advancedOpen} onClick={() => setAdvancedOpen(!advancedOpen)}>
          {advancedOpen ? 'Hide advanced' : 'Show advanced'}
        </button>}
      </div>

      <Suspense fallback={<div className="antenna-plan-loading" role="status">Loading saved plans…</div>}>
        <AntennaPlanLibrary antennaType={antennaType} jurisdiction={jurisdiction} unitSystem={unitSystem} modelId={model.id} modelVersion={model.version} workspace={currentWorkspace} onOpen={openAntennaPlan} />
      </Suspense>

      <ReceiveAntennaSelector referenceFrequencyMHz={frequencyMHz} unitSystem={unitSystem} onOpenPlanner={openReceivePlanner} />

      <Suspense fallback={<div className="antenna-comparison comparison-loading" role="status">Loading design comparison…</div>}>
        <AntennaDesignComparison activeType={antennaType} onOpenPlanner={openComparedPlanner} />
      </Suspense>

      <AntennaDesignPicker activeType={antennaType} onSelect={selectDesign} />

      {antennaType === 'dipole' && <StepByStepHelp title="Build and tune a centre-fed dipole" intro="Use this sequence to turn two equal calculated legs into a measured antenna in its final support geometry. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the design frequency', detail: 'Select the frequency where you want the installed antenna to resonate, rather than relying only on the conventional band name.' },
        { title: 'Plan the installed span', detail: 'Choose supports, height, orientation, centre location, endpoint clearances, feedline route, and safe access before cutting wire.' },
        { title: 'Prepare the centre feed', detail: 'Use a mechanically secure centre insulator and balanced feed arrangement with suitable common-mode control for the installation.' },
        { title: 'Cut two equal long legs', detail: 'Retain the selected trim allowance and measure each leg from the electrical centre connection to its endpoint.' },
        { title: 'Install before measuring', detail: 'Raise the antenna in its intended position with both legs straight, equal, and clear of conductive or lossy objects.' },
        { title: 'Tune symmetrically', detail: 'Use low analyser power and remove equal small amounts from both ends, then remeasure after every change in the final geometry.' }
      ]} limit="This calculator does not predict installed feedpoint impedance, bandwidth, common-mode current, losses, support coupling, or radiation pattern." />}

      {antennaType === 'folded-dipole' && <StepByStepHelp title="Build and tune a folded dipole" intro="Use this sequence to turn two equal parallel conductors into a mechanically stable, balanced antenna with a measured feed system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the design frequency', detail: 'Set the intended installed resonance. The parallel conductor span uses the same corrected half-wave starting length as a conventional dipole.' },
        { title: 'Choose a stable spacing', detail: 'Keep the two long conductors parallel with uniform centre-to-centre spacing. Use insulating spreaders or a documented parallel-line material that remains stable in weather.' },
        { title: 'Cut two equal long conductors', detail: 'Retain the trimming allowance on both conductors, mark their centres, and prepare two equal end joins without shortening one side.' },
        { title: 'Join both ends and open one centre', detail: 'Bond the two conductors together at each end. Create the balanced feed gap at the exact centre of only one conductor; the other remains continuous.' },
        { title: 'Plan matching and common-mode control', detail: 'Treat the four-times resistance as a nominal equal-conductor assumption. Choose a measured balanced feed or suitable transformer and choke for the actual impedance and power.' },
        { title: 'Install, sweep, and tune symmetrically', detail: 'Raise the finished antenna at its final height and orientation, sweep the complete band, and shorten symmetrically while preserving equality, spacing, and both end joins.' }
      ]} limit="This planner sizes equal-conductor geometry and shows a nominal four-times resistance assumption. It does not predict installed complex impedance, transformer design, bandwidth, loss, current balance, common-mode behaviour, power rating, or radiation pattern." />}

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

      {antennaType === 'g5rv' && <StepByStepHelp title="Build and commission a G5RV-family system" intro="Use this sequence to preserve the relationship between the radiator, two-conductor matching section, coax transition, choke, and station matching network. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the named system deliberately', detail: 'Classic, half-size, and ZS6BKW dimensions are different systems. Select the one that fits both the available span and the bands you intend to evaluate.' },
        { title: 'Choose the actual matching-section line', detail: 'Use the measured or manufacturer-specified velocity factor and characteristic impedance of the exact open-wire, window-line, or ribbon-line construction.' },
        { title: 'Preserve the complete geometry', detail: 'Build equal radiator legs and the calculated physical matching-section length. Do not substitute an arbitrary feedline length and continue calling the result the same named system.' },
        { title: 'Plan the line-to-coax transition', detail: 'Keep the balanced section clear of metal and lossy materials, provide suitable common-mode control at the coax transition, and route coax without making it an unintended radiator.' },
        { title: 'Install before evaluating bands', detail: 'Raise the complete system in its final shape and height before sweeping impedance. Nearby objects, ground, folding, and feedline routing can substantially change the measured result.' },
        { title: 'Commission each intended band', detail: 'Use low analyser power, document tuner settings and line behaviour, then verify feedline current, tuner or balun heating, voltage clearance, loss, and RF exposure at intended power.' }
      ]} limit="This planner reproduces published geometry and line-length relationships. It does not predict installed impedance, SWR, tuner range, line or coax loss, balun stress, common-mode current, efficiency, bandwidth, pattern, exposure, or safe power." />}

      {antennaType === 'phased-collinear' && <StepByStepHelp title="Build and commission a phased wire collinear" intro="Use this sequence to keep equal half-wave radiator sections and equal quarter-wave phase-reversing stubs as one measured array. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose one design frequency', detail: 'Use the frequency where the complete installed array should be tuned. A collinear is a narrow, interacting system rather than several independent dipoles.' },
        { title: 'Choose the number of radiator sections', detail: 'Two to eight equal half-wave sections are supported. More sections increase span, weight, support load, pattern complexity, and sensitivity to dimensional error.' },
        { title: 'Establish the electrical half wave', detail: 'Build and tune a test dipole from the actual wire, insulators, and construction method, then use its measured total length to refine the radiator correction factor.' },
        { title: 'Make and measure identical phase-reversing stubs', detail: 'Use equal two-conductor lines, short each far end, apply the measured velocity factor, and retain separate trimming allowance for the quarter-wave electrical length. Set a realistic finished-length tolerance and use the phase worksheet as a construction-control target.' },
        { title: 'Assemble and support the full array', detail: 'Keep every radiator equal, every stub equal, connections symmetrical, stub conductors consistently spaced, and high-voltage junctions safely insulated and strain relieved.' },
        { title: 'Engineer the feed and verify the pattern', detail: 'Use the documented odd/even current- or voltage-feed context as a starting reference, then model or measure the actual feed and matching arrangement. Install at final height, tune at low power, and verify match, common-mode current, heating, and directional behaviour.' }
      ]} limit="The stub worksheet converts physical line-length tolerance into transmission-line phase error; it does not predict the antenna-current phase. This construction planner does not select a feedpoint or matching network and does not predict impedance, gain, beamwidth, sidelobes, bandwidth, loss, current, voltage, common-mode behaviour, or safe power." />}

      {antennaType === 'turnstile' && <StepByStepHelp title="Build and commission a crossed-dipole turnstile" intro="Use this sequence to build two equal orthogonal dipoles and treat the power split, balance, phase, matching, and polarization as one measured system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose one design frequency', detail: 'Set the frequency where both dipoles and the complete quadrature feed should operate. Equal amplitude and a 90-degree phase difference are normally narrowband conditions.' },
        { title: 'Build two equal half-wave dipoles', detail: 'Use the same conductor, diameter, insulation, feed gaps, supports, correction factor, and trimming allowance for Dipoles A and B.' },
        { title: 'Mount the dipoles at right angles', detail: 'Centre both radiators on the same axis, preserve a true 90-degree crossing, and keep supports and feed conductors symmetrical around both ports.' },
        { title: 'Develop the quadrature feed', detail: 'Use an engineered equal-power splitter or hybrid and measured transmission-line paths. The displayed quarter-wave amount is a path-difference reference, not a complete network.' },
        { title: 'Choose and document the phase order', detail: 'Record whether Dipole B leads or lags Dipole A. Reversing that order reverses field rotation, but polarization sense must be verified from the intended viewing direction.' },
        { title: 'Measure the complete antenna system', detail: 'Verify both complex port impedances, amplitude balance, relative phase, match, common-mode current, axial ratio, polarization sense, bandwidth, pattern, heating, and RF exposure.' }
      ]} limit="This planner sizes equal crossed radiators and an ideal quarter-wave path difference. It does not design a splitter, hybrid, balun, matching network, or ground plane and does not predict port coupling, amplitude balance, impedance, axial ratio, polarization sense, bandwidth, pattern, gain, exposure, or safe power." />}

      {antennaType === 'halo' && <Suspense fallback={<div className="step-guide" role="status">Loading halo build guide…</div>}><HaloGuide /></Suspense>}

      {antennaType === 'cubical-quad' && <StepByStepHelp title="Build and commission a two-element cubical quad" intro="Use this sequence to turn the driven-loop, reflector-loop, and boom-spacing starting dimensions into a modelled and measured directional antenna. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose one design frequency', detail: 'Use the frequency where the driven loop should be centred. A band name alone is not precise enough for cutting and modelling the finished antenna.' },
        { title: 'Choose and model element spacing', detail: 'Start within the displayed 0.10–0.25 wavelength range, then model the actual conductor, support, height, boom, and feed because spacing changes impedance, forward response, and rear rejection together.' },
        { title: 'Orient the boom and survey the site', detail: 'Enter a true forward bearing, installed boom-centre height, and practical mast reference. Use the plan and coordinate schedule to check the footprint and lower-corner clearance on level ground.' },
        { title: 'Build two separate diamond frames', detail: 'Use electrically insulating spreaders where practical. Keep each four-sided loop planar, symmetrical, centred on the boom, and free from conductive support paths that are absent from the model.' },
        { title: 'Separate cut length from finished geometry', detail: 'Cut each complete loop to its longer cut perimeter, divide that allowance evenly among four sides, then trim toward the finished target. The reflector remains five percent larger; measure every side from electrical corner to electrical corner.' },
        { title: 'Choose polarization at the feedpoint', detail: 'Feed the bottom corner for horizontal polarization or a side corner for vertical polarization, then provide a suitable balanced feed, current choke, and modelled matching arrangement.' },
        { title: 'Install, tune, and verify directionality', detail: 'Set the final boom spacing and height, tune at low analyser power, preserve loop symmetry, and verify match, common-mode current, front direction, rear rejection, heating, and structural stability.' }
      ]} limit="This calculator scales a historical starting geometry. It does not predict feedpoint impedance, match, gain, beamwidth, front-to-back ratio, sidelobes, bandwidth, conductor or boom interaction, wind load, current, voltage, exposure, or safe power." />}

      {antennaType === 'axial-helix' && <StepByStepHelp title="Build and commission an axial-mode helix" intro="Use this sequence to turn wavelength ratios into a mechanically repeatable circularly polarized endfire antenna. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the exact design frequency', detail: 'Set the frequency where circumference and spacing ratios are evaluated. An axial helix scales directly with wavelength, so small dimensional errors matter more as frequency rises.' },
        { title: 'Choose circumference, pitch, and turns', detail: 'Begin near one-wavelength circumference and a 12–14° pitch angle. Turn count changes axial length and the classical performance estimates together.' },
        { title: 'Choose polarization before winding', detail: 'Use a right-handed helix for RHCP or a left-handed helix for LHCP in direct endfire. A dish reflection reverses polarization sense, so verify the complete link arrangement.' },
        { title: 'Build to measurable checkpoints', detail: 'Mark each full-turn boundary from the feed plane, keep the diameter uniform, record the actual conductor cross section, and inspect spacing and diameter against the worksheet tolerances.' },
        { title: 'Build a rigid ground plane and support', detail: 'Keep the helix circular, axis straight, and support material low loss. Include the real reflector, connector, support, and conductor dimensions in the model.' },
        { title: 'Develop the feed transition empirically', detail: 'The classical terminal-resistance estimate is not a 50-ohm match. NASA’s cited prototype needed an empirically shaped copper triangle at the feed. Build an adjustable transition and sweep complex impedance with the complete structure installed.' },
        { title: 'Measure pattern, match, and polarization', detail: 'Verify S11, feedline current, forward direction, beamwidth, sidelobes, circular-polarization sense, heating, and structural stability before relying on the classical estimates.' }
      ]} limit="Geometry is calculated exactly from the selected ratios, but gain, beamwidth, axial ratio, and terminal resistance are classical estimates. The planner does not model conductor diameter, supports, reflector shape, matching, losses, sidelobes, bandwidth, exposure, or safe power." />}

      {antennaType === 'discone' && <StepByStepHelp title="Build and commission a radial discone" intro="Use this sequence to turn a required lowest frequency into a mechanically repeatable disc-and-cone starting geometry. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the lowest required frequency', detail: 'Size the antenna from the bottom of the intended coverage range, not from its centre. The calculator deliberately does not claim an upper cutoff or usable bandwidth.' },
        { title: 'Choose the cone angle', detail: 'Use a 25–40° half-angle. A 30° half-angle produces the documented 60° included cone while preserving the sourced slant length.' },
        { title: 'Choose the radial construction', detail: 'Solid surfaces may be approximated with radial elements, but count, conductor diameter, ring supports, and symmetry change the electrical structure. Model the exact build.' },
        { title: 'Keep the conventional feed compact', detail: 'For the disc-over-cone arrangement shown here, bond the coax outer conductor to the cone apex and the centre conductor to the disc. Keep the separation short and record the actual connector, gap, and insulator.' },
        { title: 'Build concentrically and rigidly', detail: 'Distribute both radial sets evenly, preserve the cone angle, keep the disc level and centred, and avoid conductive supports that are absent from the model.' },
        { title: 'Measure the complete frequency range', detail: 'Sweep S11 across every intended band and verify feedline current, pattern, polarization, heating, structural stability, and exposure before transmitting.' }
      ]} limit="This planner supplies sourced starting dimensions only. It does not predict upper-frequency limit, bandwidth, impedance, VSWR, gain, elevation pattern, loss, conductor or support effects, exposure, or safe power." />}

      {antennaType === 'log-periodic' && <StepByStepHelp title="Build and commission a log-periodic dipole array" intro="Use this sequence to turn an operating range into a repeatable scaled array while keeping the feed and performance questions explicit. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the complete operating range', detail: 'Enter the lowest and highest frequencies that the finished array must cover. The band selector can load one allocation; enter custom edges for a multiband or continuous range.' },
        { title: 'Choose τ and σ together', detail: 'Tau sets the length scale between adjacent elements, while sigma sets their centre spacing. The displayed apex angle follows from both values; these choices also affect size, element count, impedance, and pattern.' },
        { title: 'Reserve structure for the active region', detail: 'The radiating active region has finite width, so Carrel distinguishes operating bandwidth from the larger structural bandwidth. Keep the reserve explicit and verify it against a complete design model.' },
        { title: 'Cut and position from the schedule', detail: 'Label every dipole, keep both halves equal, and measure every boom position from the centre of the longest element. Preserve the geometric progression rather than rounding all dimensions alike.' },
        { title: 'Alternate the balanced connections', detail: 'Reverse the two boom-conductor connections at every adjacent element. Feed from the short-element end and engineer the boom line, crossover, termination, coax transition, and common-mode control together.' },
        { title: 'Model, sweep, and verify direction', detail: 'Include conductor diameter, split gaps, boom dimensions, mast, feedline, supports, and termination. Sweep the complete range and verify match, forward direction, rear response, heating, pattern, and exposure.' }
      ]} limit="This planner generates Carrel-scaled construction geometry. It does not predict input impedance, feeder impedance, SWR, gain, beamwidth, front-to-back ratio, sidelobes, cross-polarization, loss, bandwidth, exposure, or safe power." />}

      {antennaType === 'beverage' && <StepByStepHelp title="Plan and commission a Beverage receiving antenna" intro="Use this sequence to turn a receive frequency, wire length, and target bearing into a surveyed low-wire route with explicit feed, ground, and termination assumptions. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose a reference frequency and length', detail: 'Use the lowest or most important receive frequency for the wavelength reference. The original wave-antenna work describes long horizontal conductors of about one-half wavelength or more.' },
        { title: 'Survey a straight, safe route', detail: 'Run the wire axis from the feed end toward the desired arrival bearing. Avoid power lines, public access, vehicles, livestock, parallel conductors, uneven terrain, and any route where a low wire could become a hazard.' },
        { title: 'Choose one-way or comparison mode', detail: 'The classic terminated form uses a non-inductive far-end resistance and expects primary response toward that termination. The unterminated comparison leaves the far end insulated and may tend toward two-axis response, but reflections require modelling.' },
        { title: 'Build stable ground returns', detail: 'Treat feed and termination grounds as RF circuit elements, not symbols. Soil, moisture, electrode construction, bonding, and seasonal change affect impedance and directivity; measure and maintain them.' },
        { title: 'Engineer the receive transformer', detail: 'Use the entered antenna-side impedance only to show a nominal ratio toward the feedline. Verify transformer bandwidth, loss, common-mode isolation, receiver protection, and static/lightning discharge arrangements separately.' },
        { title: 'Measure noise and directionality', detail: 'Compare signals and noise from the target, reverse, and side directions across the intended bands. Adjust termination and grounding from measurements; do not judge a receive antenna by signal strength alone.' }
      ]} limit="This is a receive-only route and impedance-assumption planner. It does not predict gain, RDF, beamwidth, front-to-back ratio, pattern, ground loss, surge impedance, transformer performance, receiver safety, exposure, or transmit power handling." />}

      {antennaType === 'compact-receive' && <StepByStepHelp title="Build and commission a compact directional receiving antenna" intro="Use this sequence to choose a Flag, point-fed Pennant, or EWE and keep its feed, termination, direction, and grounding convention explicit. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the geometry for the site', detail: 'A Flag is a rectangular elevated loop, a point-fed Pennant is triangular, and an EWE is an inverted U whose two ends use separate ground returns. Load the sourced starting dimensions, then adjust only with modelling or measured evidence.' },
        { title: 'Aim the feed end toward the target', detail: 'These antennas receive primarily toward the feedpoint and place the principal null toward the termination. This is the opposite end-direction convention from a terminated Beverage.' },
        { title: 'Keep the feed and termination opposite', detail: 'The Flag uses the centres of opposite vertical sides. This point-fed Pennant uses its point as the feed and the centre of the vertical side as the termination. The EWE uses a grounded feed transformer at one bottom end and grounded termination at the other.' },
        { title: 'Build the complete RF circuit', detail: 'Use a non-inductive adjustable termination, a suitable receive transformer, feedline common-mode isolation, static and lightning provisions, receiver overload protection, and non-conductive supports.' },
        { title: 'Treat EWE grounds as antenna parts', detail: 'For an EWE, soil, moisture, electrode geometry, bonding, and nearby conductors affect both impedance and directionality. The elevated Flag and Pennant close the current path in wire instead.' },
        { title: 'Measure signal-to-noise and rejection', detail: 'Compare target, side, and termination-end signals across the intended bands. Adjust the termination from repeatable measurements; do not infer the installed pattern from the starting dimensions.' }
      ]} limit="This is a receive-only construction and impedance-assumption planner. It does not predict gain, RDF, beamwidth, front-to-back ratio, null depth, pattern, loss, transformer performance, receiver safety, exposure, or transmit power handling." />}

      {antennaType === 'k9ay' && <StepByStepHelp title="Build and commission four-direction K9AY loops" intro="Use this sequence to construct two crossed terminated loops and map every switch state to its physical feed end. Experienced builders can leave the guide closed." steps={[
        { title: 'Set the crossed-loop footprint', detail: 'The original system uses two identical quasi-delta loops on one support, oriented at right angles. The published starting geometry is 25 ft high with 15 ft half-width and lower corners 5 ft above ground.' },
        { title: 'Choose the first feed-end bearing', detail: 'Enter the true bearing for loop 1 in its reference state. The planner derives the second loop at 90 degrees and the two reversed directions at 180 and 270 degrees.' },
        { title: 'Map the relay states before installation', detail: 'One switching function selects loop 1 or loop 2; another exchanges the transformer and termination. Label all four states from verified physical connections, not from assumed controller wiring.' },
        { title: 'Build one stable shared ground', detail: 'Both loops, the matching transformer, termination, enclosure, and switching return meet at the base. Ground conductivity, moisture, electrode construction, and nearby metal can change the response.' },
        { title: 'Isolate control and receive paths', detail: 'Use weatherproof switching, static and lightning provisions, receiver protection, and feedline common-mode isolation. A separate low-voltage control cable avoids placing control power through the receive transformer.' },
        { title: 'Commission every direction', detail: 'Verify relay continuity with power removed, then compare target, side, and termination-end signals on all four switch states across the intended bands. Adjust termination only from repeatable installed measurements.' }
      ]} limit="This is a receive-only geometry, direction-map, and impedance-assumption planner. It does not design the relay controller or predict gain, RDF, beamwidth, front-to-back ratio, null depth, pattern, loss, receiver safety, exposure, or transmit power handling." />}

      {antennaType === 'loop-on-ground' && <StepByStepHelp title="Install and evaluate a Loop-on-Ground receiving antenna" intro="Use this sequence to lay out an isolated surface loop, orient its broad low-angle receive axis, and evaluate it without confusing quiet audio with guaranteed signal improvement. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose a safe surface location', detail: 'The loop lies directly on the ground and must remain clear of mowing, digging, snow removal, vehicles, animals, foot traffic, and utility work. Use insulated outdoor wire and non-damaging anchors appropriate to the site.' },
        { title: 'Lay out a symmetric square', detail: 'The published prototype uses four 15 ft sides. Keep opposite sides parallel and the feedpoint axis symmetric; frequency provides size context but does not automatically rescale the physical loop.' },
        { title: 'Aim the broad receive axis', detail: 'At low elevation angles the two broad lobes are normal to the feedpoint diagonal. Enter one desired true bearing; the opposite bearing is received on the same axis. Higher-angle response becomes much less directional.' },
        { title: 'Keep the loop isolated from earth', detail: 'The wire may touch the surface but the antenna circuit is not grounded. Use a true two-winding isolation transformer; bond and protect the coax at the building entry under the applicable electrical and lightning rules.' },
        { title: 'Control feedline pickup', detail: 'Route suitable outdoor coax flush with or below the surface only where safe and permitted. Preserve transformer isolation and add common-mode control when measurements show the feedline is becoming part of the antenna.' },
        { title: 'Compare signal-to-noise, not S-meter alone', detail: 'Check whether connecting the loop raises the receiver noise above its internal floor, then compare intelligibility and repeatability against other antennas across the intended bands and both axis directions.' }
      ]} limit="This is a receive-only geometry, orientation, and transformer-ratio planner. It does not predict signal-to-noise improvement, gain, impedance, RDF, beamwidth, pattern, polarization purity, soil loss, transformer performance, receiver safety, exposure, or transmit power handling." />}

      {antennaType === 'active-receive-loop' && <StepByStepHelp title="Build and commission an untuned active receiving loop" intro="Use this sequence to keep the loop, balanced amplifier, feedline, power path, receiver, and transmitter protection as one receive-only system. Experienced builders can leave the guide closed." steps={[
        { title: 'Choose the complete receive range', detail: 'Enter the lowest and highest frequencies of interest. The upper edge provides the strictest electrical-size checks; it is not a guaranteed amplifier bandwidth.' },
        { title: 'Build one rigid balanced loop', detail: 'Form one circular turn with a feed gap at the bottom, preserve symmetry, minimize unintended contact resistance, and support the amplifier enclosure without making the mast part of the loop.' },
        { title: 'Place the balanced amplifier at the loop', detail: 'Use a documented wideband loop amplifier designed for the loop inductance and receive range. Keep both input paths equal and short; do not substitute an unspecified voltage preamplifier.' },
        { title: 'Plan power, isolation, and protection', detail: 'Document DC voltage and current, bias arrangement, filtering, entry bonding, static and lightning provisions, receiver overload protection, and a positive transmit interlock or disconnection method.' },
        { title: 'Control common-mode pickup', detail: 'Route coax away from the loop plane, apply suitable common-mode isolation, and compare response with feedline position and power source changed. An asymmetric feed can fill the nulls.' },
        { title: 'Rotate, compare, and stress-test', detail: 'Measure signal-to-noise and null direction across the range, then check broadcast-band and local-transmitter overload with attenuation and filtering. More gain is not automatically better.' }
      ]} limit="This is a receive-only geometry, orientation, and electrical-size planner. It does not design an amplifier or predict gain, sensitivity, noise figure, dynamic range, overload margin, impedance, bandwidth, signal-to-noise improvement, null depth, pattern, receiver safety, exposure, or transmit power handling." />}

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
      ]} limit="This planner uses measured inductance plus a classical uniform-current loop and smooth-conductor model to estimate resistance, efficiency, unloaded Q, 3 dB resonator bandwidth, current, and capacitor voltage. It does not model the feed coupling, matching, pattern, reactive near field, exposure, component ratings, or safe operating power; finished measurements remain essential." />}

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
        { title: 'Choose a practical shape', detail: 'Use a square, circle, or equilateral delta loop as the starting geometry while recognizing that distortion changes impedance and pattern.' },
        { title: 'Cut the complete perimeter long', detail: 'Retain the selected trim allowance and mark support and feedpoint locations without changing the total conductor length.' },
        { title: 'Prepare the feed arrangement', detail: loopShape === 'triangle' ? 'Use the selected midpoint or quarter-perimeter delta-loop feed location as a polarization starting arrangement, then provide a balanced transition, matching as measured, and common-mode control.' : 'Choose a feedpoint and balanced feed, matching, and common-mode-control approach appropriate to the desired bands and installed geometry.' },
        { title: 'Install before measuring', detail: 'Raise and close the complete loop in its intended shape and plane before judging resonance or impedance.' },
        { title: 'Tune the perimeter evenly', detail: 'Use low analyser power, make small distributed or symmetrical length changes, preserve the intended shape, and remeasure each intended band.' }
      ]} limit="This calculator does not predict feedpoint impedance, matching ratio, bandwidth, multiband response, losses, common-mode current, or the installed radiation pattern." />}

      {antennaType === 'skywire' && <Suspense fallback={<div className="step-guide" role="status">Loading skywire guide…</div>}><SkywireGuide /></Suspense>}

      {antennaType === 'hex-beam' && <Suspense fallback={<div className="step-guide" role="status">Loading hex-beam guide…</div>}><HexBeamGuide /></Suspense>}

      {antennaType === 'v-beam' && <Suspense fallback={<div className="step-guide" role="status">Loading V-beam guide…</div>}><VBeamGuide /></Suspense>}

      {antennaType === 'rhombic' && <Suspense fallback={<div className="step-guide" role="status">Loading rhombic guide…</div>}><RhombicGuide /></Suspense>}

      {antennaType === 'vertical-half-rhombic' && <Suspense fallback={<div className="step-guide" role="status">Loading half-rhombic guide…</div>}><VerticalHalfRhombicGuide /></Suspense>}
      {antennaType === 't2fd' && <Suspense fallback={<div className="step-guide" role="status">Loading T2FD guide…</div>}><T2fdGuide /></Suspense>}

      <div className={antennaType === 'g5rv' ? 'calculator-layout g5rv-layout' : antennaType === 'small-loop' ? 'calculator-layout small-loop-layout' : antennaType === 'phased-collinear' ? 'calculator-layout collinear-layout' : antennaType === 'cubical-quad' ? 'calculator-layout quad-layout' : antennaType === 'axial-helix' ? 'calculator-layout helix-layout' : antennaType === 'discone' ? 'calculator-layout discone-layout' : antennaType === 'log-periodic' ? 'calculator-layout lpda-layout' : antennaType === 'beverage' ? 'calculator-layout beverage-layout' : antennaType === 'compact-receive' ? 'calculator-layout compact-receive-layout' : antennaType === 'k9ay' ? 'calculator-layout k9ay-layout' : antennaType === 'loop-on-ground' ? 'calculator-layout loop-on-ground-layout' : antennaType === 'active-receive-loop' ? 'calculator-layout active-receive-loop-layout' : 'calculator-layout'}>
        <form className="input-panel" onSubmit={(event) => event.preventDefault()}>
          {antennaType !== 'hex-beam' && <><label className="field">
            <span>Amateur band</span>
            <select className="band-select" value={selectedBandId} onChange={(event) => {
              const band = availableBands.find((candidate) => candidate.id === event.target.value);
              if (band && (antennaType === 'small-loop' || antennaType === 'log-periodic' || antennaType === 'active-receive-loop')) {
                setFrequencyText(band.lowerMHz.toFixed(band.lowerMHz < 30 ? 3 : 1));
                if (antennaType === 'small-loop') setSmallLoopUpperFrequencyText(band.upperMHz.toFixed(band.upperMHz < 30 ? 3 : 1));
                else if (antennaType === 'log-periodic') setLogPeriodicUpperFrequencyText(band.upperMHz.toFixed(band.upperMHz < 30 ? 3 : 1));
                else setActiveLoopUpperFrequencyText(band.upperMHz.toFixed(band.upperMHz < 30 ? 3 : 1));
              } else if (band && antennaType === 'discone') {
                setFrequencyText(band.lowerMHz.toFixed(band.lowerMHz < 30 ? 3 : 1));
              } else if (band) setFrequencyText(band.designMHz.toFixed(band.designMHz < 30 ? 3 : 1));
            }} aria-describedby="band-help">
              <option value="custom">Custom frequency</option>
              {availableBands.map((band) => <option key={band.id} value={band.id}>{band.label} · {formatFrequencyRange(band)}</option>)}
            </select>
            <small id="band-help">{antennaType === 'small-loop' ? 'Loads the listed lower and upper band edges; narrow them to the frequencies the capacitor must actually cover.' : antennaType === 'log-periodic' ? 'Loads both listed band edges; enter custom edges when the array must span several bands.' : antennaType === 'active-receive-loop' ? 'Loads both listed band edges for the loop electrical-size checks; enter custom edges for a wider receive range.' : antennaType === 'g5rv' ? 'Changes the inspection frequency and band context; named-preset dimensions remain fixed.' : antennaType === 'beverage' ? 'Loads the listed centre as the wavelength reference; a Beverage can be evaluated across several receive bands.' : antennaType === 'compact-receive' || antennaType === 'k9ay' || antennaType === 'loop-on-ground' ? 'Loads the listed centre as a size reference; the installed receive response must be measured across every intended band.' : antennaType === 'discone' ? 'Loads the listed lower band edge as the discone starting frequency.' : 'Loads a central design frequency; adjust it for the part of the band you use.'}</small>
          </label>

          <label className="field">
            <span>{antennaType === 'small-loop' ? 'Lower tuning frequency' : antennaType === 'log-periodic' || antennaType === 'active-receive-loop' ? 'Lower operating frequency' : antennaType === 'g5rv' ? 'Inspection frequency' : antennaType === 'beverage' || antennaType === 'compact-receive' || antennaType === 'k9ay' || antennaType === 'loop-on-ground' ? 'Receive reference frequency' : antennaType === 'discone' ? 'Lowest design frequency' : 'Design frequency'}</span>
            <span className="input-with-unit">
              <input aria-label={antennaType === 'small-loop' ? 'Lower tuning frequency' : antennaType === 'log-periodic' || antennaType === 'active-receive-loop' ? 'Lower operating frequency' : antennaType === 'g5rv' ? 'Inspection frequency' : antennaType === 'beverage' || antennaType === 'compact-receive' || antennaType === 'k9ay' || antennaType === 'loop-on-ground' ? 'Receive reference frequency' : antennaType === 'discone' ? 'Lowest design frequency' : 'Design frequency'} inputMode="decimal" type="number" min="0.001" step="0.001" value={frequencyText} onChange={(event) => setFrequencyText(event.target.value)} />
              <span>MHz</span>
            </span>
            <small>{antennaType === 'small-loop' ? 'Lowest frequency the variable capacitor must reach with the measured loop inductance.' : antennaType === 'log-periodic' ? 'Sets the longest half-wave reference element and the low end of the requested operating range.' : antennaType === 'active-receive-loop' ? 'Sets the low edge of the untuned receive range; physical loop dimensions remain independent.' : antennaType === 'g5rv' ? 'Shows radiator and matching-section electrical length at one band; it does not rescale a named preset.' : antennaType === 'beverage' ? 'Converts the selected physical length ratio into metres; it does not imply resonance or a single-band antenna.' : antennaType === 'compact-receive' || antennaType === 'k9ay' || antennaType === 'loop-on-ground' ? 'Provides wavelength context for the entered physical geometry; it does not rescale the sourced preset or predict a single-band response.' : antennaType === 'discone' ? 'Sets the sourced cone and disc starting dimensions; it is not a guaranteed cutoff.' : 'Use the frequency where you want resonance, not just the band name.'}</small>
          </label></>}

          {antennaType === 'hex-beam' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading hex-beam controls…</div>}><HexBeamControls bands={hexBeamBands} setBands={setHexBeamBands} wireGauge={hexBeamWireGauge} setWireGauge={setHexBeamWireGauge} /></Suspense>}

          {antennaType === 'v-beam' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading V-beam controls…</div>}><VBeamControls legWavelengths={vBeamLegWavelengths} setLegWavelengths={setVBeamLegWavelengths} targetBearingDegrees={vBeamTargetBearingDegrees} setTargetBearingDegrees={setVBeamTargetBearingDegrees} mode={vBeamMode} setMode={setVBeamMode} terminationResistanceOhms={vBeamTerminationResistanceOhms} setTerminationResistanceOhms={setVBeamTerminationResistanceOhms} trimAllowancePercent={vBeamTrimAllowancePercent} setTrimAllowancePercent={setVBeamTrimAllowancePercent} /></Suspense>}

          {antennaType === 'rhombic' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading rhombic controls…</div>}><RhombicControls sideWavelengths={rhombicSideWavelengths} setSideWavelengths={setRhombicSideWavelengths} includedAngleDegrees={rhombicIncludedAngleDegrees} setIncludedAngleDegrees={setRhombicIncludedAngleDegrees} forwardBearingDegrees={rhombicForwardBearingDegrees} setForwardBearingDegrees={setRhombicForwardBearingDegrees} mode={rhombicMode} setMode={setRhombicMode} terminationResistanceOhms={rhombicTerminationResistanceOhms} setTerminationResistanceOhms={setRhombicTerminationResistanceOhms} trimAllowancePercent={rhombicTrimAllowancePercent} setTrimAllowancePercent={setRhombicTrimAllowancePercent} /></Suspense>}

          {antennaType === 'vertical-half-rhombic' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading half-rhombic controls…</div>}><VerticalHalfRhombicControls totalWireWavelengths={halfRhombicWireWavelengths} setTotalWireWavelengths={setHalfRhombicWireWavelengths} apexHeightMetres={halfRhombicApexHeightMetres} setApexHeightMetres={setHalfRhombicApexHeightMetres} forwardBearingDegrees={halfRhombicForwardBearingDegrees} setForwardBearingDegrees={setHalfRhombicForwardBearingDegrees} mode={halfRhombicMode} setMode={setHalfRhombicMode} terminationResistanceOhms={halfRhombicTerminationResistanceOhms} setTerminationResistanceOhms={setHalfRhombicTerminationResistanceOhms} attachmentAllowancePercent={halfRhombicAttachmentAllowancePercent} setAttachmentAllowancePercent={setHalfRhombicAttachmentAllowancePercent} unitSystem={unitSystem} /></Suspense>}
          {antennaType === 't2fd' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading T2FD controls…</div>}><T2fdControls tiltDegrees={t2fdTiltDegrees} setTiltDegrees={setT2fdTiltDegrees} lowAttachmentHeightMetres={t2fdLowAttachmentHeightMetres} setLowAttachmentHeightMetres={setT2fdLowAttachmentHeightMetres} terminationResistanceOhms={t2fdTerminationResistanceOhms} setTerminationResistanceOhms={setT2fdTerminationResistanceOhms} feedSystemImpedanceOhms={t2fdFeedSystemImpedanceOhms} setFeedSystemImpedanceOhms={setT2fdFeedSystemImpedanceOhms} transmitterPowerWatts={t2fdTransmitterPowerWatts} setTransmitterPowerWatts={setT2fdTransmitterPowerWatts} wireAllowancePercent={t2fdWireAllowancePercent} setWireAllowancePercent={setT2fdWireAllowancePercent} unitSystem={unitSystem} /></Suspense>}

          {antennaType === 'folded-dipole' && <NumberField label="Parallel conductor spacing" tooltip="Enter the centre-to-centre spacing between the two long conductors. The calculator uses it for construction dimensions and wire inventory only; actual spacing, diameter, insulation, and end geometry affect impedance and resonance." value={Number(shownFoldedDipoleSpacing.toFixed(3))} min={unitSystem === 'metric' ? 0.001 : 0.003} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.01 : 0.05} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Maintain this spacing uniformly with stable insulating supports; electrically wide spacing requires full modelling." onChange={(value) => setFoldedDipoleSpacingMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />}

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

          {antennaType === 'g5rv' && <fieldset className="doublet-system-editor g5rv-system-editor">
            <legend>Named antenna system and matching section</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="g5rv-preset">G5RV-family design</label><HelpTip label="G5RV-family design">These are complete radiator-and-line systems, not interchangeable names for any centre-fed wire. The custom mode preserves the same transparent geometry calculation without claiming the result is a published G5RV or ZS6BKW.</HelpTip></span><select id="g5rv-preset" value={g5rvPreset} onChange={(event) => setG5rvPreset(event.target.value as G5rvPreset)}><option value="classic">Classic full-size G5RV</option><option value="half-size">Half-size G5RV</option><option value="zs6bkw">ZS6BKW / G0GSF</option><option value="custom">Custom G5RV-derived system</option></select><small>Changing the preset loads its published radiator and electrical matching-section relationship.</small></div>
            <label className="field"><span>Matching-section line</span><select aria-label="G5RV matching-section characteristic impedance" value={g5rvLineImpedanceOhms} onChange={(event) => setG5rvLineImpedanceOhms(Number(event.target.value))}><option value="300">300 Ω ribbon or window line</option><option value="450">450 Ω window line</option><option value="600">600 Ω open-wire line</option></select><small>The impedance identifies the construction; this geometry planner does not calculate the coax-transition impedance.</small></label>
            <NumberField label="G5RV matching-section velocity factor" tooltip="Velocity factor converts the preset electrical reference length to the physical length for the actual two-conductor line. Use manufacturer data or measurement; insulation, spacing, moisture, and construction affect it." value={g5rvLineVelocityFactor} min={0.5} max={1} step={0.01} unit="ratio" help="Physical matching-section length = preset electrical reference × velocity factor." onChange={setG5rvLineVelocityFactor} />
            {g5rvPreset === 'custom' && <>
              <NumberField label="Custom total radiator length" tooltip="Complete endpoint-to-endpoint radiator length, divided into two equal legs. This custom value is not represented as a published G5RV-family dimension." value={Number(shownG5rvCustomRadiator.toFixed(3))} min={unitSystem === 'metric' ? 0.01 : 0.033} max={unitSystem === 'metric' ? 10_000 : 32_808} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Enter the complete radiator, not one leg." onChange={(value) => setG5rvCustomRadiatorMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
              <NumberField label="Custom matching-section electrical reference" tooltip="Free-space-equivalent electrical reference length before applying the entered line velocity factor. The result is a physical construction length, not a prediction of input impedance." value={Number(shownG5rvCustomElectricalLine.toFixed(3))} min={unitSystem === 'metric' ? 0.01 : 0.033} max={unitSystem === 'metric' ? 10_000 : 32_808} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Physical length is this value multiplied by the matching line velocity factor." onChange={(value) => setG5rvCustomElectricalLineMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            </>}
          </fieldset>}

          {antennaType === 'phased-collinear' && <fieldset className="collinear-editor">
            <legend>Array and phasing sections</legend>
            <NumberField label="Radiating half-wave sections" tooltip="Choose two to eight equal collinear radiator sections. The calculator does not assign gain because the installed pattern depends on exact current distribution, height, ground, loss, feed arrangement, and dimensional accuracy." value={collinearElementCount} min={2} max={8} step={1} unit="sections" help={`${collinearElementCount - 1} identical phase-reversing ${collinearElementCount - 1 === 1 ? 'stub is' : 'stubs are'} required between adjacent sections.`} onChange={setCollinearElementCount} />
            <NumberField label="Phasing-line velocity factor" tooltip="Use the measured or manufacturer-specified velocity factor of the actual two-conductor phasing line. Wire type, insulation, conductor spacing, coiling, supports, and moisture can change the finished electrical length." value={collinearPhasingVelocityFactor} min={0.5} max={1} step={0.01} unit="ratio" help="Applied only to the physical one-way length of each electrically quarter-wave stub." onChange={setCollinearPhasingVelocityFactor} />
            <NumberField label="Extra phasing-stub length for trimming" tooltip="This allowance is separate from the radiator allowance. Add it to every identical stub, then shorten equally while measuring the completed construction or a representative fixture." value={collinearStubTrimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to each physical stub length; both conductors in a stub remain equal." onChange={setCollinearStubTrimAllowancePercent} />
            <NumberField label="Finished stub length tolerance" tooltip="Enter the largest expected magnitude of one-way length error after every stub has been trimmed and measured. The phase worksheet converts this physical tolerance into round-trip phase-reversal error; it does not predict the finished antenna-current phase." value={collinearStubLengthToleranceMillimetres} min={0} max={10_000} step={0.5} unit="mm" help="A ± construction and measurement tolerance applied independently to every finished one-way stub." onChange={setCollinearStubLengthToleranceMillimetres} />
            <NumberField label="Per-junction phase-error budget" tooltip="Set a construction target for the round-trip phase reversal of each shorted stub. This is a user-selected commissioning budget, not a sourced performance threshold and not a pattern guarantee." value={collinearMaximumJunctionPhaseErrorDegrees} min={0.1} max={90} step={0.5} unit="°" help="Used to calculate the largest finished one-way length error that stays within the selected budget." onChange={setCollinearMaximumJunctionPhaseErrorDegrees} />
          </fieldset>}

          {antennaType === 'turnstile' && <fieldset className="turnstile-editor">
            <legend>Quadrature-feed reference</legend>
            <NumberField label="Phasing-line velocity factor" tooltip="Use the measured or manufacturer-specified velocity factor for the actual transmission line. This converts an electrical quarter wavelength into a physical path-difference reference; connectors, splitter paths, bends, loading, and the antenna ports still affect phase." value={turnstilePhasingVelocityFactor} min={0.5} max={1} step={0.01} unit="ratio" help="Physical quarter-wave reference = free-space wavelength × velocity factor ÷ 4." onChange={setTurnstilePhasingVelocityFactor} />
            <label className="field"><span className="field-label-with-help"><span>Quadrature order</span><HelpTip label="Turnstile quadrature order">The sign states which dipole leads at its antenna port. Reversing it reverses the field-rotation direction. RHCP and LHCP labels depend on the observation direction and complete installation, so verify the desired sense rather than assigning it from this selector alone.</HelpTip></span><select aria-label="Turnstile quadrature order" value={turnstileQuadratureOrder} onChange={(event) => setTurnstileQuadratureOrder(event.target.value as TurnstileQuadratureOrder)}><option value="b-lags-a">Dipole B lags A by 90°</option><option value="b-leads-a">Dipole B leads A by 90°</option></select><small>Dipole A is the 0° reference; confirm relative phase at the two balanced antenna ports.</small></label>
          </fieldset>}

          {antennaType === 'halo' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading halo controls…</div>}><HaloControls shape={haloShape} setShape={setHaloShape} farEndGapMetres={haloFarEndGapMetres} setFarEndGapMetres={setHaloFarEndGapMetres} feedpointGapMetres={haloFeedpointGapMetres} setFeedpointGapMetres={setHaloFeedpointGapMetres} unitSystem={unitSystem} /></Suspense>}

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

          {antennaType === 'small-loop' && <>
          <fieldset className="small-loop-editor">
            <legend>Measured-inductance tuning plan</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="small-loop-upper-frequency">Upper tuning frequency</label><HelpTip label="Upper tuning frequency">This is the highest required resonance. It sets the smallest required total capacitance and the strictest ARRL small-loop diameter check.</HelpTip></span><span className="input-with-unit"><input id="small-loop-upper-frequency" aria-label="Upper tuning frequency" type="number" min="0.001" step="0.001" value={smallLoopUpperFrequencyText} onChange={(event) => setSmallLoopUpperFrequencyText(event.target.value)} /><span>MHz</span></span><small>Use the highest frequency the installed capacitor and loop must reach.</small></div>
            <NumberField label="Main-loop circumference" tooltip="Enter the conductor path around the complete circular main loop. The drawing converts circumference to diameter and area; it does not infer inductance, loss, efficiency, or pattern from this geometry." value={Number(shownSmallLoopCircumference.toFixed(3))} min={unitSystem === 'metric' ? 0.001 : 0.0033} max={unitSystem === 'metric' ? 100_000 : 328_084} step={unitSystem === 'metric' ? 0.01 : 0.05} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Measure the conductive path around the circle; joints and capacitor connections remain part of the finished RF loop." onChange={(value) => setSmallLoopCircumferenceMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Measured finished-loop inductance" tooltip="Use a measurement of the complete main loop and capacitor-lead arrangement with the fixture compensated according to the instrument instructions. A low-frequency LCR value may not represent the RF installation." value={smallLoopMeasuredInductanceMicrohenries} min={0.000001} max={1_000_000} step={0.001} unit="µH" help="The planner deliberately does not estimate inductance from idealized loop geometry." onChange={setSmallLoopMeasuredInductanceMicrohenries} />
            <NumberField label="Parallel fixed and stray capacitance" tooltip="Include only fixed, mounting, lead, and enclosure capacitance that can be represented as parallel with the variable capacitor at the tuning gap. Distributed loop capacitance may not be a valid lumped value. Do not include the variable capacitor’s own minimum here; enter that separately below." value={smallLoopStrayCapacitancePicofarads} min={0} max={1_000_000_000} step={0.1} unit="pF" help="An equivalent parallel value subtracted from ideal total C to show the required variable portion." onChange={setSmallLoopStrayCapacitancePicofarads} />
            <NumberField label="Variable-capacitor minimum" tooltip="Use the installed RF capacitance at the low-capacitance end, including sections placed in series or parallel. Mechanical end stops and safe plate spacing may reduce the usable range." value={smallLoopCapacitorMinimumPicofarads} min={0} max={1_000_000_000} step={0.1} unit="pF" help="Lowest usable installed setting, not necessarily the catalogue headline value." onChange={setSmallLoopCapacitorMinimumPicofarads} />
            <NumberField label="Variable-capacitor maximum" tooltip="Use the installed RF capacitance at the high-capacitance end. This is a range check only; voltage, current, loss, plate spacing, arcing, heating, and tuning resolution require separate engineering." value={smallLoopCapacitorMaximumPicofarads} min={0.001} max={1_000_000_000} step={0.1} unit="pF" help="Highest usable installed setting; it must reach the lower-frequency capacitance requirement." onChange={setSmallLoopCapacitorMaximumPicofarads} />
          </fieldset>
          <fieldset className="small-loop-editor small-loop-performance-editor">
            <legend>Idealized loss and resonant-stress inputs</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="small-loop-conductor-material">Main-loop conductor</label><HelpTip label="Main-loop conductor">The skin-effect estimate uses the NIST conductivity value for smooth copper or aluminium at approximately room temperature. Plating, oxidation, solder, clamps, braids, and dissimilar-metal joints require separate allowance.</HelpTip></span><select id="small-loop-conductor-material" aria-label="Main-loop conductor" value={smallLoopConductorMaterial} onChange={(event) => setSmallLoopConductorMaterial(event.target.value as SmallLoopConductorMaterial)}><option value="copper">Copper</option><option value="aluminium">Aluminium</option></select><small>Select the main loop material; add joint and component loss separately.</small></div>
            <NumberField label="Conductor outside diameter" tooltip="Enter the outside diameter of a smooth round conductor. The high-frequency surface-current estimate assumes a solid conductor or tubing with wall thickness several skin depths or greater; it does not model roughness, seams, braid, current crowding, or proximity effects." value={Number(shownSmallLoopConductorDiameter.toFixed(unitSystem === 'metric' ? 2 : 4))} min={unitSystem === 'metric' ? 0.01 : 0.0004} max={unitSystem === 'metric' ? 10_000 : 393.7} step={unitSystem === 'metric' ? 0.1 : 0.001} unit={unitSystem === 'metric' ? 'mm' : 'in'} help="Outside diameter used by the smooth round-conductor skin-effect estimate." onChange={(value) => setSmallLoopConductorOutsideDiameterMillimetres(unitSystem === 'metric' ? value : value * 25.4)} />
            <NumberField label="Additional series loss" tooltip="Enter a measured or independently estimated series resistance for the capacitor, joints, clamps, connections, surface condition, proximity effects, and other losses not represented by smooth conductor skin effect. Zero produces an optimistic conductor-only estimate." value={smallLoopAdditionalSeriesLossMilliohms} min={0} max={1_000_000} step={0.1} unit="mΩ" help="Explicit extra loss at the analysis frequency; zero omits all non-conductor losses." onChange={setSmallLoopAdditionalSeriesLossMilliohms} />
            <NumberField label="Accepted power at the loop" tooltip="Use RF power delivered to the resonant loop after feedline and matching losses, not transmitter nameplate output. This value scales the current, voltage, and power-split estimates but does not establish a safe operating level." value={smallLoopAcceptedPowerWatts} min={0.001} max={10_000_000} step={1} unit="W" help="Delivered resonant-loop power used only for electrical-stress estimates." onChange={setSmallLoopAcceptedPowerWatts} />
          </fieldset>
          </>}

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
          {antennaType === 'cubical-quad' && <fieldset className="quad-editor">
            <legend>Element geometry, orientation, and polarization</legend>
            <NumberField label="Driven-to-reflector spacing" tooltip="Spacing changes feedpoint impedance, forward response, rear rejection, bandwidth, and boom requirements together. This planner supports 0.10–0.25 wavelength as a modelling range; it does not optimize performance." value={quadElementSpacingWavelengths} min={0.1} max={0.25} step={0.01} unit="wavelength" help="Physical boom spacing is calculated from this ratio. Model the exact conductor and support geometry before construction." onChange={setQuadElementSpacingWavelengths} />
            <NumberField label="Forward bearing" tooltip="Enter the true bearing along the boom from reflector toward driven element and the intended forward direction. This orients the survey drawing; it does not predict the installed pattern." value={quadForwardBearingDegrees} min={0} max={359.9} step={1} unit="° true" help="0° is true north, 90° east, 180° south, and 270° west." onChange={setQuadForwardBearingDegrees} />
            <NumberField label="Boom centre height" tooltip="Height of the horizontal boom and both element centres above local ground. The planner subtracts the larger reflector spreader arm to estimate the lowest wire corner." value={unitSystem === 'metric' ? quadBoomCentreHeightMetres : metresToFeet(quadBoomCentreHeightMetres)} min={unitSystem === 'metric' ? 0.1 : 0.33} max={unitSystem === 'metric' ? 10000 : 32808} step={unitSystem === 'metric' ? 0.1 : 0.5} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Use the installed boom height. Confirm terrain, fall-zone, climbing, electrical, and rotating clearances separately." onChange={(value) => setQuadBoomCentreHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <div className="field"><span className="field-label-with-help"><label htmlFor="quad-mast-reference">Mast reference</label><HelpTip label="Cubical quad mast reference">Choose the point treated as zero east/west and zero north/south in the site schedule. Boom midpoint is symmetric between the elements; driven centre is useful when the mast passes through or supports the driven frame.</HelpTip></span><select id="quad-mast-reference" aria-label="Cubical quad mast reference" value={quadMastReference} onChange={(event) => setQuadMastReference(event.target.value as QuadMastReference)}><option value="boom-midpoint">Boom midpoint</option><option value="driven-centre">Driven-element centre</option></select><small>Sets the survey origin only; element spacing and loop dimensions do not change.</small></div>
            <div className="field"><span className="field-label-with-help"><label htmlFor="quad-polarization">Polarization</label><HelpTip label="Cubical quad polarization">With the diamond orientation shown, feeding the bottom corner produces horizontal polarization and feeding a side corner produces vertical polarization. The feed must remain balanced and suitably choked or matched for the installed system.</HelpTip></span><select id="quad-polarization" aria-label="Cubical quad polarization" value={quadPolarization} onChange={(event) => setQuadPolarization(event.target.value as typeof quadPolarization)}><option value="horizontal">Horizontal · bottom feed</option><option value="vertical">Vertical · side feed</option></select><small>Moves the feedpoint marker only; loop dimensions remain unchanged.</small></div>
          </fieldset>}
          {antennaType === 'axial-helix' && <fieldset className="helix-editor">
            <legend>Helix geometry and direct-endfire polarization</legend>
            <NumberField label="Turn circumference" tooltip="Axial-mode operation is documented around one free-space wavelength of circumference. The supported 0.80–1.25 λ range comes from measured NASA design guidance; values outside 0.90–1.10 λ receive an additional modelling warning." value={helixCircumferenceWavelengths} min={0.8} max={1.25} step={0.01} unit="wavelength" help="1.00 λ is the default; physical diameter is circumference divided by π." onChange={setHelixCircumferenceWavelengths} />
            <NumberField label="Pitch angle" tooltip="Pitch angle is measured between the helical conductor and a plane normal to the antenna axis. Turn spacing is circumference multiplied by the tangent of this angle." value={helixPitchAngleDegrees} min={10} max={20} step={0.5} unit="degrees" help="12–14° is the documented conventional starting region." onChange={setHelixPitchAngleDegrees} />
            <NumberField label="Number of turns" tooltip="The supported whole-number range begins at four turns, following NASA guidance that an axial-mode design use more than three. More turns increase conductor length, axial length, and mechanical demands." value={helixTurnCount} min={4} max={30} step={1} unit="turns" help="Use a whole number from 4 to 30; the final feed transition may alter the first partial turn." onChange={setHelixTurnCount} />
            <NumberField label="Ground-plane diameter" tooltip="NASA reports good impedance and circular-polarization behaviour with a ground plane 0.8–1.0 wavelength in diameter. Larger reflectors are supported for comparison but require complete-structure modelling." value={helixGroundPlaneWavelengths} min={0.5} max={3} step={0.05} unit="wavelength" help="0.80 λ is the documented default; values below it receive a warning." onChange={setHelixGroundPlaneWavelengths} />
            <Suspense fallback={<div className="model-note" role="status">Loading fabrication controls…</div>}><HelixConstructionControls conductorWidthMillimetres={helixConductorWidthMillimetres} setConductorWidthMillimetres={setHelixConductorWidthMillimetres} diameterToleranceMillimetres={helixDiameterToleranceMillimetres} setDiameterToleranceMillimetres={setHelixDiameterToleranceMillimetres} turnSpacingToleranceMillimetres={helixTurnSpacingToleranceMillimetres} setTurnSpacingToleranceMillimetres={setHelixTurnSpacingToleranceMillimetres} feedlineImpedanceOhms={helixFeedlineImpedanceOhms} setFeedlineImpedanceOhms={setHelixFeedlineImpedanceOhms} /></Suspense>
            <div className="field"><span className="field-label-with-help"><label htmlFor="helix-handedness">Direct-endfire polarization</label><HelpTip label="Helix winding and polarization">A right-handed monofilar helix produces RHCP and a left-handed helix produces LHCP in unobstructed direct endfire. Reflection from a parabolic dish reverses the circular-polarization sense.</HelpTip></span><select id="helix-handedness" aria-label="Helix winding and polarization" value={helixHandedness} onChange={(event) => setHelixHandedness(event.target.value as typeof helixHandedness)}><option value="right">Right-handed winding · RHCP</option><option value="left">Left-handed winding · LHCP</option></select><small>Applies to direct endfire away from the ground plane; account for any reflecting dish.</small></div>
          </fieldset>}
          {antennaType === 'discone' && <fieldset className="discone-editor">
            <legend>Cone geometry and radial construction</legend>
            <NumberField label="Cone half-angle" tooltip="Measured from the antenna axis to a cone radial. NTIA documents 25–40°. The 30° default creates the 60° included cone documented in the NASA broadband-match discussion." value={disconeHalfAngleDegrees} min={25} max={40} step={1} unit="degrees" help={`${(disconeHalfAngleDegrees * 2).toFixed(0)}° included cone angle; slant length remains fixed by the lowest frequency.`} onChange={setDisconeHalfAngleDegrees} />
            <NumberField label="Cone radial elements" tooltip="NASA reports that radial elements can approximate a solid cone, but does not make element count electrically interchangeable. More elements create a closer approximation while increasing weight and wind loading." value={disconeConeRadialCount} min={6} max={64} step={1} unit="radials" help="Evenly distribute identical conductors around the cone; model the actual count and diameter." onChange={setDisconeConeRadialCount} />
            <NumberField label="Disc radial elements" tooltip="These conductors approximate the circular disc and, in the conventional disc-over-cone arrangement shown here, connect to the coax centre conductor. Keep them equal, level, evenly spaced, and electrically bonded at the centre." value={disconeDiscRadialCount} min={4} max={64} step={1} unit="radials" help="Each radial runs from the common disc centre to its rim; the displayed disc diameter is twice that length." onChange={setDisconeDiscRadialCount} />
            <Suspense fallback={<div className="model-note" role="status">Loading fabrication controls…</div>}><DisconeConstructionControls radialConductorDiameterMillimetres={disconeRadialConductorDiameterMillimetres} setRadialConductorDiameterMillimetres={setDisconeRadialConductorDiameterMillimetres} feedGapMillimetres={disconeFeedGapMillimetres} setFeedGapMillimetres={setDisconeFeedGapMillimetres} radialLengthToleranceMillimetres={disconeRadialLengthToleranceMillimetres} setRadialLengthToleranceMillimetres={setDisconeRadialLengthToleranceMillimetres} /></Suspense>
          </fieldset>}
          {antennaType === 'log-periodic' && <fieldset className="lpda-editor">
            <legend>Operating range and geometric progression</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="lpda-upper-frequency">Upper operating frequency</label><HelpTip label="Upper operating frequency">This is the top of the requested operating range, not the smallest element’s half-wave reference. The structural bandwidth reserve extends the geometric array beyond this edge to allow for the finite active region.</HelpTip></span><span className="input-with-unit"><input id="lpda-upper-frequency" aria-label="Upper operating frequency" type="number" min="0.001" step="0.001" value={logPeriodicUpperFrequencyText} onChange={(event) => setLogPeriodicUpperFrequencyText(event.target.value)} /><span>MHz</span></span><small>Must be above the lower edge; use custom values for a multiband range.</small></div>
            <NumberField label="Tau length scale" tooltip="τ is the ratio between each element length and the next longer element. Values closer to 1 add more closely spaced sizes for a given structural bandwidth; they also increase element count and usually array length." value={logPeriodicTau} min={0.5} max={0.99} step={0.01} unit="τ" help="Every next element length equals the preceding length multiplied by τ." onChange={setLogPeriodicTau} />
            <NumberField label="Sigma spacing factor" tooltip="Carrel defines σ as the centre spacing to the next smaller dipole divided by twice the current full element length. Values below 0.05 receive the source-specific performance warning." value={logPeriodicSigma} min={0.01} max={0.5} step={0.01} unit="σ" help="Each next centre spacing equals 2σ times the current full element length." onChange={setLogPeriodicSigma} />
            <Suspense fallback={<div className="model-note" role="status">Loading fabrication controls…</div>}><LogPeriodicConstructionControls elementConductorDiameterMillimetres={logPeriodicElementConductorDiameterMillimetres} setElementConductorDiameterMillimetres={setLogPeriodicElementConductorDiameterMillimetres} elementLengthToleranceMillimetres={logPeriodicElementLengthToleranceMillimetres} setElementLengthToleranceMillimetres={setLogPeriodicElementLengthToleranceMillimetres} boomPositionToleranceMillimetres={logPeriodicBoomPositionToleranceMillimetres} setBoomPositionToleranceMillimetres={setLogPeriodicBoomPositionToleranceMillimetres} boomConductorSpacingMillimetres={logPeriodicBoomConductorSpacingMillimetres} setBoomConductorSpacingMillimetres={setLogPeriodicBoomConductorSpacingMillimetres} /></Suspense>
          </fieldset>}
          {antennaType === 'beverage' && <fieldset className="beverage-editor">
            <legend>Receive route, direction, and far-end mode</legend>
            <NumberField label="Horizontal wire length" tooltip="This ratio multiplies the free-space wavelength at the reference frequency. The original work describes wave antennas of about one-half wavelength or more; real optimum length and pattern depend on soil, height, velocity, loss, and frequency." value={beverageWireLengthWavelengths} min={0.25} max={5} step={0.05} unit="wavelength" help="Straight horizontal distance between the feed and far end; routing and sag allowance are added separately." onChange={setBeverageWireLengthWavelengths} />
            <NumberField label="Wire height above ground" tooltip="Enter the intended average height of the horizontal section. Terrain variation, vertical drops, supports, vegetation, snow, people, animals, and vehicles can alter both performance and safety." value={Number(shownBeverageWireHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.1 : 0.328} max={unitSystem === 'metric' ? 30 : 98.425} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Maintain safe visibility, marking, access control, and clearances along the entire route." onChange={(value) => setBeverageWireHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Target bearing from feed" tooltip="True bearing is measured clockwise from geographic north along the wire from the receiver/feed end toward the far end. The terminated form is expected to receive primarily from the termination direction." value={beverageTargetBearingDegrees} min={0} max={359.9} step={1} unit="° true" help="Survey the route from feed to far end; magnetic compass readings require the appropriate local declination correction." onChange={setBeverageTargetBearingDegrees} />
            <div className="field"><span className="field-label-with-help"><label htmlFor="beverage-mode">Far-end configuration</label><HelpTip label="Beverage far-end configuration">The classic one-way form terminates the far end through a non-inductive resistance and ground return. The open comparison omits that termination and may tend toward response along both wire-axis directions, but reflections and pattern are not calculated.</HelpTip></span><select id="beverage-mode" aria-label="Beverage far-end configuration" value={beverageReceptionMode} onChange={(event) => setBeverageReceptionMode(event.target.value as BeverageReceptionMode)}><option value="terminated">Terminated · primary response toward far end</option><option value="unterminated">Unterminated · bidirectional comparison</option></select><small>{beverageReceptionMode === 'terminated' ? 'Use a non-inductive resistor and stable RF ground at the far end.' : 'Insulate the far end; the actual two-direction response requires measurement.'}</small></div>
            {beverageReceptionMode === 'terminated' && <NumberField label="Far-end termination resistance" tooltip="This is a starting resistor value, not a computed answer. The original work calls for a resistance approximately equal to surge impedance so the far-end travelling current is not reflected. Soil, wire geometry, grounds, frequency, and weather affect the correct measured value." value={beverageTerminationResistanceOhms} min={1} max={10_000} step={10} unit="Ω" help="Use a suitable non-inductive component and adjust only from measurements of the complete antenna." onChange={setBeverageTerminationResistanceOhms} />}
            <Suspense fallback={<div className="model-note" role="status">Loading construction controls…</div>}><BeverageConstructionControls unitSystem={unitSystem} feedDropMetres={beverageFeedDropMetres} setFeedDropMetres={setBeverageFeedDropMetres} farEndDropMetres={beverageFarEndDropMetres} setFarEndDropMetres={setBeverageFarEndDropMetres} maximumSupportSpanMetres={beverageMaximumSupportSpanMetres} setMaximumSupportSpanMetres={setBeverageMaximumSupportSpanMetres} antennaWindingTurns={beverageAntennaWindingTurns} setAntennaWindingTurns={setBeverageAntennaWindingTurns} feedlineWindingTurns={beverageFeedlineWindingTurns} setFeedlineWindingTurns={setBeverageFeedlineWindingTurns} /></Suspense>
          </fieldset>}
          {antennaType === 'compact-receive' && <fieldset className="compact-receive-editor">
            <legend>Geometry, feed direction, and termination</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="compact-receive-geometry">Receive antenna geometry</label><HelpTip label="Compact receive antenna geometry">Selecting a geometry loads the cited source dimensions and impedance assumptions. The point-fed Pennant has its feed at the triangular point; its termination is centred on the opposite vertical side.</HelpTip></span><select id="compact-receive-geometry" aria-label="Compact receive antenna geometry" value={compactReceiveGeometry} onChange={(event) => {
              const geometry = event.target.value as CompactReceiveGeometry;
              const preset = COMPACT_RECEIVE_PRESETS[geometry];
              setCompactReceiveGeometry(geometry);
              setCompactReceiveSpanMetres(preset.horizontalSpanMetres);
              setCompactReceiveHeightMetres(preset.verticalHeightMetres);
              setCompactReceiveClearanceMetres(preset.bottomClearanceMetres);
              setCompactReceiveTerminationOhms(preset.terminationResistanceOhms);
              setCompactReceiveAssumedImpedanceOhms(preset.assumedAntennaImpedanceOhms);
              setCompactReceiveAntennaWindingTurns(preset.antennaWindingTurns);
              setCompactReceiveFeedlineWindingTurns(preset.feedlineWindingTurns);
            }}><option value="flag">Flag · rectangular closed loop</option><option value="pennant">Point-fed Pennant · triangular closed loop</option><option value="ewe">EWE · inverted U with two grounds</option></select><small>{COMPACT_RECEIVE_PRESETS[compactReceiveGeometry].label}; changing geometry reloads its complete preset.</small></div>
            <NumberField label="Horizontal span" tooltip="Measure horizontally from the termination side toward the feed side. For the Pennant this is the perpendicular distance from the vertical termination side to the feedpoint." value={Number(shownCompactReceiveSpan.toFixed(3))} min={unitSystem === 'metric' ? 0.1 : 0.328} max={unitSystem === 'metric' ? 1_000 : 3_280.84} step={unitSystem === 'metric' ? 0.01 : 0.1} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Physical span; frequency changes wavelength context but does not automatically rescale this value." onChange={(value) => setCompactReceiveSpanMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Vertical height" tooltip="For a Flag, use the complete vertical side. For the Pennant, use the vertical termination side. For an EWE, use each vertical conductor from its ground connection to the top wire." value={Number(shownCompactReceiveHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.1 : 0.328} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.01 : 0.1} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Keep the loop plane vertical and the intended dimensions mechanically stable." onChange={(value) => setCompactReceiveHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            {compactReceiveGeometry !== 'ewe' && <NumberField label="Bottom wire clearance" tooltip="The K6SE ground-independent examples place the lower wire about 6 ft above ground. This value is a siting dimension and does not add to the wire perimeter." value={Number(shownCompactReceiveClearance.toFixed(3))} min={0} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.1 : 0.25} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Maintain safe access clearance and keep supports and nearby conductors out of the antenna field." onChange={(value) => setCompactReceiveClearanceMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />}
            <NumberField label="Receive bearing toward feed end" tooltip="Enter the true bearing from the termination toward the feedpoint. The primary response is expected toward the feed end and the principal null toward the termination—the opposite end-direction convention from a terminated Beverage." value={compactReceiveBearingDegrees} min={0} max={359.9} step={1} unit="° true" help="Measured clockwise from geographic north; correct magnetic compass observations for local declination." onChange={setCompactReceiveBearingDegrees} />
            <NumberField label="Termination resistance" tooltip="This is a cited starting value for the loaded preset, not a calculated optimum. Frequency, exact geometry, transformer load, feedline current, ground system for an EWE, and surroundings can change the measured best value." value={compactReceiveTerminationOhms} min={1} max={10_000} step={5} unit="Ω" help="Use a non-inductive adjustable termination and determine final settings from repeatable installed measurements." onChange={setCompactReceiveTerminationOhms} />
            <Suspense fallback={<div className="model-note" role="status">Loading construction controls…</div>}><CompactReceiveConstructionControls antennaWindingTurns={compactReceiveAntennaWindingTurns} setAntennaWindingTurns={setCompactReceiveAntennaWindingTurns} feedlineWindingTurns={compactReceiveFeedlineWindingTurns} setFeedlineWindingTurns={setCompactReceiveFeedlineWindingTurns} /></Suspense>
          </fieldset>}
          {antennaType === 'k9ay' && <fieldset className="k9ay-editor">
            <legend>Crossed-loop geometry and four-direction map</legend>
            <NumberField label="Apex height" tooltip="Vertical distance from ground to the shared top support. The original 25 ft starting dimension works with 5 ft lower-corner height and 15 ft half-width to form each quasi-delta loop." value={Number(shownK9ayApexHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.2 : 0.656} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.01 : 0.1} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Published starting value: 7.620 m / 25 ft." onChange={(value) => setK9ayApexHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Loop half-width" tooltip="Horizontal distance from the centre ground and enclosure to either lower outside corner. Two equal half-widths form the complete footprint diameter." value={Number(shownK9ayHalfWidth.toFixed(3))} min={unitSystem === 'metric' ? 0.1 : 0.328} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.01 : 0.1} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Published starting value: 4.572 m / 15 ft; complete diameter is twice this value." onChange={(value) => setK9ayHalfWidthMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Lower corner height" tooltip="Vertical clearance from ground to each outside lower corner. It must remain below the apex and affects both the upper and lower sloping wire lengths." value={Number(shownK9ayLowerCornerHeight.toFixed(3))} min={unitSystem === 'metric' ? 0.1 : 0.328} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.01 : 0.1} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Published starting value: 1.524 m / 5 ft; keep the wires safely out of reach." onChange={(value) => setK9ayLowerCornerHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Loop 1 reference receive bearing" tooltip="True bearing from the centre toward loop 1's feed end in its reference connection state. The other three directions are derived at 90-degree intervals; exchanging feed and termination reverses either loop." value={k9ayFirstReceiveBearingDegrees} min={0} max={359.9} step={1} unit="° true" help="Measured clockwise from geographic north; correct magnetic compass observations for local declination." onChange={setK9ayFirstReceiveBearingDegrees} />
            <div className="field"><span className="field-label-with-help"><label htmlFor="k9ay-selected-direction">Selected receive direction</label><HelpTip label="Selected K9AY receive direction">This maps a user-facing bearing to the required loop-selection and reversal state. Verify the physical relay terminals and label the finished controller from continuity tests with power removed.</HelpTip></span><select id="k9ay-selected-direction" aria-label="Selected K9AY receive direction" value={k9aySelectedDirectionIndex} onChange={(event) => setK9aySelectedDirectionIndex(Number(event.target.value))}>{calculation?.type === 'k9ay' && calculation.value.directions.map((direction) => <option key={direction.index} value={direction.index}>{direction.bearingDegrees.toFixed(0)}° {direction.compassPoint} · Loop {direction.loop} · {direction.reversed ? 'reversed' : 'reference'}</option>)}</select><small>Selecting a direction changes the highlighted feed end and displayed relay state, not the physical dimensions.</small></div>
            <NumberField label="K9AY termination resistance" tooltip="The original 160 m installation used 390 Ω. This is a starting value rather than a calculated optimum; ground conditions, frequency, loop dimensions, transformer loading, weather, and nearby metal affect the best measured value." value={k9ayTerminationResistanceOhms} min={1} max={10_000} step={5} unit="Ω" help="Use a suitable non-inductive component and determine the installed setting from repeatable measurements." onChange={setK9ayTerminationResistanceOhms} />
            <Suspense fallback={<div className="model-note" role="status">Loading construction controls…</div>}><K9ayConstructionControls antennaWindingTurns={k9ayAntennaWindingTurns} setAntennaWindingTurns={setK9ayAntennaWindingTurns} feedlineWindingTurns={k9ayFeedlineWindingTurns} setFeedlineWindingTurns={setK9ayFeedlineWindingTurns} /></Suspense>
          </fieldset>}
          {antennaType === 'loop-on-ground' && <fieldset className="loop-on-ground-editor">
            <legend>Surface-loop geometry and low-angle receive axis</legend>
            <NumberField label="Loop-on-Ground side length" tooltip="The source prototype is a 15 ft square made from insulated wire. Larger loops collect more signal but can lose pattern symmetry as circumference approaches one wavelength at the highest frequency used." value={Number(shownLogSideLength.toFixed(3))} min={unitSystem === 'metric' ? 0.1 : 0.328} max={unitSystem === 'metric' ? 1_000 : 3_280.84} step={unitSystem === 'metric' ? 0.01 : 0.1} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Published prototype: 4.572 m / 15 ft per side, 18.288 m / 60 ft perimeter." onChange={(value) => setLogSideLengthMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Loop-on-Ground receive-axis bearing" tooltip="Enter one true bearing on the broad bidirectional low-angle response axis. The feedpoint corner lies on the perpendicular diagonal. Higher-angle response becomes much less directional, and the installed pattern still requires measurement." value={logReceiveAxisBearingDegrees} min={0} max={359.9} step={1} unit="° true" help="The opposite bearing is included automatically; correct magnetic compass observations for local declination." onChange={setLogReceiveAxisBearingDegrees} />
            <div className="model-note log-isolation-note"><span className="help-heading"><strong>Isolated surface loop</strong><HelpTip label="Loop-on-Ground isolation">The antenna wire lies on the ground but is not electrically grounded. Use two separate transformer windings and keep the loop isolated from the coax. Ground and protect the coax at the building entry according to applicable rules.</HelpTip></span><p>No ground rod or earth bond belongs in the loop circuit. Inspect insulation and the enclosure after weather, landscaping, or animal activity.</p></div>
          </fieldset>}
          {antennaType === 'active-receive-loop' && <fieldset className="active-receive-loop-editor">
            <legend>Untuned loop geometry and expected null axis</legend>
            <div className="field"><span className="field-label-with-help"><label htmlFor="active-loop-upper-frequency">Upper operating frequency</label><HelpTip label="Active-loop upper operating frequency">The upper range edge sets the strictest perimeter and diameter checks. It does not establish amplifier bandwidth, sensitivity, stability, or overload performance.</HelpTip></span><span className="input-with-unit"><input id="active-loop-upper-frequency" aria-label="Active-loop upper operating frequency" type="number" min="0.001" step="0.001" value={activeLoopUpperFrequencyText} onChange={(event) => setActiveLoopUpperFrequencyText(event.target.value)} /><span>MHz</span></span><small>Must be above the lower edge; enter the full receive range you intend to evaluate.</small></div>
            <NumberField label="Active-loop diameter" tooltip="Physical outside diameter of the circular one-turn conductor. Frequency does not resize the loop; the calculator reports its perimeter relative to wavelength at both range edges." value={Number(shownActiveLoopDiameter.toFixed(3))} min={unitSystem === 'metric' ? 0.05 : 0.164} max={unitSystem === 'metric' ? 100 : 328.084} step={unitSystem === 'metric' ? 0.01 : 0.05} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Starting example: 0.762 m / 30 in diameter; verify the chosen amplifier's permitted loop geometry." onChange={(value) => setActiveLoopDiameterMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Active-loop base height" tooltip="Clearance from the local surface to the bottom feed gap and amplifier enclosure. This is a mechanical siting input, not an electrical optimum." value={Number(shownActiveLoopBaseHeight.toFixed(3))} min={0} max={unitSystem === 'metric' ? 1_000 : 3_280.84} step={unitSystem === 'metric' ? 0.01 : 0.05} unit={unitSystem === 'metric' ? 'm' : 'ft'} help="Provide safe access, drainage, weather, vegetation, snow, cable-bend, and maintenance clearance." onChange={(value) => setActiveLoopBaseHeightMetres(unitSystem === 'metric' ? value : feetToMetres(value))} />
            <NumberField label="Active-loop null-axis bearing" tooltip="Enter one true bearing perpendicular to the vertical loop plane. A small balanced loop is expected to have nulls in both directions on this axis, but feedline pickup, imbalance, surroundings, and electrical size can fill or move them." value={activeLoopNullAxisBearingDegrees} min={0} max={359.9} step={1} unit="° true" help="Rotate the complete loop and amplifier together; correct magnetic compass observations for local declination." onChange={setActiveLoopNullAxisBearingDegrees} />
            <div className="model-note active-loop-system-note"><span className="help-heading"><strong>Amplifier is a separate engineered subsystem</strong><HelpTip label="Active-loop amplifier requirements">Use a documented balanced current-input or otherwise purpose-designed wideband loop amplifier. Verify its permitted loop inductance, frequency range, supply, gain, noise, strong-signal performance, stability, output load, weather protection, and transmit protection from primary documentation and measurement.</HelpTip></span><p>The calculator sizes and orients the conductor only. It deliberately does not turn loop geometry into an amplifier circuit or performance claim.</p></div>
          </fieldset>}
          {antennaType === 'yagi' && <div className="model-note"><span className="help-heading"><strong>NBS reference geometry</strong><HelpTip label="NBS Yagi reference geometry">This calculator scales the complete measured reference system, including its 0.0085λ element diameter, folded driven element, matching arrangement, and non-conductive boom. Changing one part without modelling it no longer reproduces the reference design.</HelpTip></span><p>This scales the measured 0.4λ design as a complete system, including its 0.0085λ element diameter. Different tubing or a conductive boom requires correction or modelling.</p></div>}
          {antennaType === 'full-wave-loop' && <div className="field">
            <span className="field-label-with-help"><label htmlFor="full-wave-loop-shape">Loop shape</label><HelpTip label="Loop shape">The selected idealized shape converts one perimeter into equal sides or a diameter. Real support sag, unequal sides, non-planar installation, feedpoint choice, and nearby objects change impedance and pattern.</HelpTip></span>
            <select id="full-wave-loop-shape" aria-label="Loop shape" value={loopShape} onChange={(event) => setLoopShape(event.target.value as LoopShape)}>
              <option value="square">Square</option><option value="triangle">Equilateral triangle</option><option value="circle">Circle</option>
            </select>
            <small>Perimeter stays constant; this converts it into equal sides or a diameter.</small>
          </div>}
          {antennaType === 'skywire' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading skywire controls…</div>}><SkywireControls aspectRatio={skywireAspectRatio} setAspectRatio={setSkywireAspectRatio} supportHeightsMetres={skywireSupportHeightsMetres} setSupportHeight={(index, value) => setSkywireSupportHeightsMetres((current) => current.map((height, candidate) => candidate === index ? value : height) as [number, number, number, number])} riggingReservePercent={skywireRiggingReservePercent} setRiggingReservePercent={setSkywireRiggingReservePercent} feedSide={skywireFeedSide} setFeedSide={setSkywireFeedSide} feedPositionPercent={skywireFeedPositionPercent} setFeedPositionPercent={setSkywireFeedPositionPercent} unitSystem={unitSystem} /></Suspense>}
          {antennaType === 'full-wave-loop' && loopShape === 'triangle' && <fieldset className="delta-loop-controls">
            <legend>Delta-loop installation</legend>
            <label className="field"><span>Triangle orientation</span><select aria-label="Delta-loop orientation" value={deltaLoopOrientation} onChange={(event) => setDeltaLoopOrientation(event.target.value as DeltaLoopOrientation)}><option value="apex-up">Apex up</option><option value="apex-down">Apex down</option></select><small>Choose the support arrangement the drawing should follow; the ideal span and height remain the same.</small></label>
            <label className="field"><span className="field-label-with-help"><span>Feed placement goal</span><HelpTip label="Delta-loop feed placement">For a vertically installed loop, an ARRL example places the feed one-quarter wavelength from the apex for a vertical-polarization arrangement. Feeding the midpoint of a horizontal wire is the conventional horizontal-polarization arrangement. Ground, height, distortion, feedline routing, and common-mode current can change the installed result.</HelpTip></span><select aria-label="Delta-loop feed placement goal" value={deltaLoopFeedMode} onChange={(event) => setDeltaLoopFeedMode(event.target.value as DeltaLoopFeedMode)}><option value="horizontal">Horizontal-polarization starting arrangement</option><option value="vertical">Vertical-polarization starting arrangement</option></select><small>This selects a construction starting point, not a prediction of the installed polarization or pattern.</small></label>
          </fieldset>}

          {advancedOpen && antennaType !== 'moxon' && antennaType !== 'yagi' && antennaType !== 'small-loop' && antennaType !== 'g5rv' && antennaType !== 'hex-beam' && antennaType !== 'v-beam' && antennaType !== 'rhombic' && antennaType !== 'vertical-half-rhombic' && antennaType !== 't2fd' && antennaType !== 'cubical-quad' && antennaType !== 'axial-helix' && antennaType !== 'discone' && antennaType !== 'log-periodic' && antennaType !== 'beverage' && antennaType !== 'compact-receive' && antennaType !== 'k9ay' && antennaType !== 'loop-on-ground' && antennaType !== 'active-receive-loop' && <div className="advanced-fields">
            {antennaType === 'efhw' && <NumberField label="Estimated antenna end impedance" tooltip="This value is a planning assumption used only to show nominal transformed resistance. A real feedpoint also has reactance and changes with height, wire shape, ground, nearby objects, return path, frequency, and loss." value={estimatedEndImpedanceOhms} min={200} max={20000} step={50} unit="Ω" help="A planning assumption only: deployment height, geometry, surroundings, and return path can move this value substantially." onChange={setEstimatedEndImpedanceOhms} />}
            {antennaType === 'ocfd' && <NumberField label="Estimated OCFD feedpoint impedance" tooltip="This value is a resistance assumption used only for the nominal transformed-impedance display. The real feedpoint has resistance and reactance that vary with frequency, split, height, ground, wire geometry, and nearby conductors." value={estimatedOcfdImpedanceOhms} min={20} max={5000} step={10} unit="Ω" help="A nominal planning value; height, split, ground, and frequency change both resistance and reactance." onChange={setEstimatedOcfdImpedanceOhms} />}
            {antennaType === 'folded-dipole' && <><NumberField label="Reference single-dipole resistance" tooltip="The nominal folded resistance is four times this entered real-resistance assumption for two equal conductors. It is not calculated from installation height, conductor geometry, ground, or measured reactance." value={foldedDipoleReferenceResistanceOhms} min={1} max={10_000} step={1} unit="Ω" help="Default 73 Ω gives a nominal 292 Ω folded value; replace it only with a deliberate modelled or measured assumption." onChange={setFoldedDipoleReferenceResistanceOhms} /><NumberField label="Planned feedline impedance" tooltip="Used only to compare the nominal folded resistance with the intended line and show an ideal ratio. The calculator does not design or rate a balun or matching network." value={foldedDipoleFeedlineImpedanceOhms} min={1} max={10_000} step={1} unit="Ω" help="Common examples include 50 Ω coax, 75 Ω coax, and 300 Ω balanced line; verify the installed complex impedance." onChange={setFoldedDipoleFeedlineImpedanceOhms} /></>}
            <NumberField label="Length correction factor" tooltip={lengthCorrectionTooltip} value={lengthCorrectionFactor} min={0.5} max={1.2} step={0.01} unit="ratio" help={`${recommendedFactor.toFixed(2)} is the default practical starting factor for this design; measure and tune after installation.`} onChange={setLengthCorrectionFactor} />
            {antennaType !== 'loaded-dipole' && antennaType !== 'loaded-vertical' && antennaType !== 'trap-dipole' && <NumberField label="Extra length for trimming" tooltip={trimAllowanceTooltip} value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added after the resonant estimate so wire can be shortened during tuning." onChange={setTrimAllowancePercent} />}
          </div>}
          {advancedOpen && antennaType === 'cubical-quad' && <div className="advanced-fields">
            <NumberField label="Extra loop length for trimming" tooltip={trimAllowanceTooltip} value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to both loop perimeters; preserve the five-percent reflector enlargement while tuning." onChange={setTrimAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'axial-helix' && <div className="advanced-fields">
            <NumberField label="Extra helix conductor for connections" tooltip="Adds material to the calculated helical conductor path for the feed transition, end connection, and fabrication tolerance. It does not change the displayed diameter, pitch, spacing, or axial length." value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added only to the cut conductor length; preserve the calculated helix geometry." onChange={setTrimAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'discone' && <div className="advanced-fields">
            <NumberField label="Extra radial length for connections" tooltip="Adds material to every cone and disc radial for centre bonding, rim hardware, and fabrication tolerance. It does not change the sourced design slant length, disc diameter, cone height, or base diameter." value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to each cut radial; preserve the design dimensions between electrical connection points." onChange={setTrimAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'log-periodic' && <div className="advanced-fields lpda-advanced-fields">
            <NumberField label="Active-region bandwidth factor" tooltip="Carrel defines operating bandwidth as structural bandwidth divided by the active-region bandwidth. The 1.46 default reproduces the documented τ = 0.92, σ = 0.12 example; it is exposed because the correct value depends on the selected geometry and performance design." value={logPeriodicActiveRegionFactor} min={1} max={5} step={0.01} unit="×" help="Multiplies the requested operating ratio to set the minimum structural ratio; confirm it from modelling or an appropriate Carrel design chart." onChange={setLogPeriodicActiveRegionFactor} />
            <NumberField label="Extra element length for trimming" tooltip="Adds the same percentage to every full dipole cut length, preserving the τ ratio in the cut schedule. It does not change centre spacing, structural bandwidth, or the source half-wave reference lengths." value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Divide each displayed full cut length equally between its two element halves." onChange={setTrimAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'beverage' && <div className="advanced-fields beverage-advanced-fields">
            <NumberField label="Assumed antenna-side impedance" tooltip="This planning assumption supplies only the nominal transformer ratio. It is not derived from wire height or soil because a real Beverage has a frequency-dependent, lossy ground-return system that must be measured or modelled." value={beverageAssumedImpedanceOhms} min={1} max={10_000} step={10} unit="Ω" help="Use a measured or deliberately assumed antenna-side value; do not treat it as the calculated surge impedance." onChange={setBeverageAssumedImpedanceOhms} />
            <NumberField label="Receiver feedline impedance" tooltip="Enter the nominal impedance of the coaxial or balanced line connected to the receiver-side transformer winding. Cable loss, common-mode current, receiver input impedance, and protection components remain separate." value={beverageFeedlineImpedanceOhms} min={1} max={1_000} step={1} unit="Ω" help="Used with the antenna-side assumption to show nominal impedance and turns ratios." onChange={setBeverageFeedlineImpedanceOhms} />
            <NumberField label="Extra horizontal wire for routing" tooltip="Adds material to the calculated straight horizontal length for sag, supports, terminations, and routing. It does not include vertical drops, ground leads, transformer leads, or a safety margin for relocating supports." value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to the cut-wire amount only; survey the straight endpoint distance separately." onChange={setTrimAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'compact-receive' && <div className="advanced-fields compact-receive-advanced-fields">
            <NumberField label="Assumed antenna-side impedance" tooltip="This explicit planning assumption supplies only the nominal transformer ratio. The preset uses the source model's feedpoint resistance context; it is not a prediction for the entered frequency or installed antenna." value={compactReceiveAssumedImpedanceOhms} min={1} max={10_000} step={5} unit="Ω" help="Replace the preset only with a deliberate modelled or measured assumption." onChange={setCompactReceiveAssumedImpedanceOhms} />
            <NumberField label="Receiver feedline impedance" tooltip="Enter the nominal impedance connected to the receiver-side transformer winding. Transformer bandwidth, loss, common-mode isolation, cable loss, protection, and receiver input remain separate." value={compactReceiveFeedlineImpedanceOhms} min={1} max={1_000} step={1} unit="Ω" help="Used only with the antenna-side assumption to show nominal impedance and turns ratios." onChange={setCompactReceiveFeedlineImpedanceOhms} />
            <NumberField label="Extra wire for connections and trimming" tooltip="Adds material to the complete calculated wire path. It does not change the design span, height, clearance, or orientation between electrical connection points." value={trimAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to total wire only; preserve the entered electrical geometry during construction." onChange={setTrimAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'k9ay' && <div className="advanced-fields k9ay-advanced-fields">
            <NumberField label="K9AY assumed antenna-side impedance" tooltip="This planning assumption supplies only the nominal transformer ratio. The 450 Ω default corresponds to the original 9:1 impedance transformation toward 50 Ω coax; it is not an installed impedance prediction." value={k9ayAssumedImpedanceOhms} min={1} max={10_000} step={5} unit="Ω" help="Replace the default only with a deliberate modelled or measured assumption." onChange={setK9ayAssumedImpedanceOhms} />
            <NumberField label="K9AY receiver feedline impedance" tooltip="Enter the nominal impedance connected to the receiver-side transformer winding. Transformer bandwidth, loss, isolation, feedline pickup, protection, and receiver input remain separate." value={k9ayFeedlineImpedanceOhms} min={1} max={1_000} step={1} unit="Ω" help="Used only to show nominal impedance and turns ratios from the antenna-side assumption." onChange={setK9ayFeedlineImpedanceOhms} />
            <NumberField label="K9AY extra wire for corners and pigtails" tooltip="Adds material to each geometric loop path for corner attachment, base pigtails, routing, and trimming. The 4.14% default brings the published 25 ft, 15 ft, and 5 ft geometry close to the article's 85 ft wire instruction." value={k9ayWireAllowancePercent} min={0} max={25} step={0.01} unit="%" help="Applied separately to each loop; it does not change apex, corner, or footprint dimensions." onChange={setK9ayWireAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'loop-on-ground' && <div className="advanced-fields loop-on-ground-advanced-fields">
            <NumberField label="Loop-on-Ground antenna winding" tooltip="Number of turns on the isolated transformer winding connected only to the loop. The source starting construction uses five antenna turns and two coax turns; core material, winding layout, bandwidth, loss, and isolation require separate verification." value={logAntennaWindingTurns} min={1} max={100} step={1} unit="turns" help="Source starting value: 5 turns on the loop side." onChange={setLogAntennaWindingTurns} />
            <NumberField label="Loop-on-Ground coax winding" tooltip="Number of turns on the separate transformer winding connected to the feedline. Do not join either loop terminal to the coax shield or earth at the antenna." value={logCoaxWindingTurns} min={1} max={100} step={1} unit="turns" help="Source starting value: 2 turns on the coax side." onChange={setLogCoaxWindingTurns} />
            <NumberField label="Loop-on-Ground feedline impedance" tooltip="Enter the nominal impedance of the outdoor receive feedline. The source prototype used mostly 75 Ω cable; nominal referred impedance is shown only from the ideal turns ratio and is not an antenna impedance prediction." value={logFeedlineImpedanceOhms} min={1} max={1_000} step={1} unit="Ω" help="Source context: low-loss outdoor 75 Ω CATV cable; 50 Ω systems require their own verified transformer and feedline plan." onChange={setLogFeedlineImpedanceOhms} />
            <NumberField label="Loop-on-Ground extra wire for anchoring" tooltip="Adds material to the square perimeter for the feed enclosure, corner anchoring, routing, and trimming. It does not alter the entered electrical side length between corners." value={logWireAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to total wire only; preserve symmetry around the feedpoint axis." onChange={setLogWireAllowancePercent} />
          </div>}
          {advancedOpen && antennaType === 'active-receive-loop' && <div className="advanced-fields active-receive-loop-advanced-fields">
            <NumberField label="Active-loop extra conductor for feed gap" tooltip="Adds material to the ideal circular circumference for amplifier terminals, bends, overlap, attachment, and trimming. It does not change the entered finished loop diameter." value={activeLoopWireAllowancePercent} min={0} max={25} step={0.5} unit="%" help="Added to the cut-conductor inventory only; preserve the intended finished circle and balanced feed gap." onChange={setActiveLoopWireAllowancePercent} />
          </div>}

          {!calculation && <p className="validation-message" role="alert">Enter values within the displayed limits to calculate dimensions.</p>}
          {calculation && <><div className="antenna-print-heading">
            <img src="/antennas/TartanleafLogo.jpg" alt="" width="72" height="72" />
            <div><p>RadioBook Antenna Workshop</p><h1>{ANTENNA_DESIGNS[antennaType].name}</h1><span>{calculation.type === 'hex-beam' ? `${calculation.value.elements.map((element) => element.band).join(' · ')} bands` : `${frequencyMHz.toFixed(3)} MHz`} · {unitSystem === 'metric' ? 'Metric' : 'Imperial'} · Model {model.version}</span></div>
          </div><ResultEvidenceGuide /><Suspense fallback={<div className="result-summary" role="status">Loading calculated result…</div>}><AntennaResultSummary calculation={calculation} unitSystem={unitSystem} radialCount={radialCount} loopShape={loopShape} onPrint={printBuildSheet} /></Suspense></>}
          {calculation?.type === 'axial-helix' && calculation.value.warnings.length > 0 && <aside className="model-note helix-advisory" aria-label="Helix design advisories"><strong>Review these design choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'discone' && calculation.value.warnings.length > 0 && <aside className="model-note discone-advisory" aria-label="Discone design advisories"><strong>Review these construction choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'log-periodic' && calculation.value.warnings.length > 0 && <aside className="model-note lpda-advisory" aria-label="Log-periodic design advisories"><strong>Review these design choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'beverage' && calculation.value.warnings.length > 0 && <aside className="model-note beverage-advisory" aria-label="Beverage design advisories"><strong>Review these route and circuit choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'compact-receive' && calculation.value.warnings.length > 0 && <aside className="model-note compact-receive-advisory" aria-label="Compact receive design advisories"><strong>Review these geometry and circuit choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'k9ay' && calculation.value.warnings.length > 0 && <aside className="model-note k9ay-advisory" aria-label="K9AY design advisories"><strong>Review these geometry and circuit choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'loop-on-ground' && calculation.value.warnings.length > 0 && <aside className="model-note loop-on-ground-advisory" aria-label="Loop-on-Ground design advisories"><strong>Review these geometry and transformer choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'active-receive-loop' && calculation.value.warnings.length > 0 && <aside className="model-note active-receive-loop-advisory" aria-label="Active receive loop design advisories"><strong>Review these geometry and range choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'folded-dipole' && calculation.value.warnings.length > 0 && <aside className="model-note folded-dipole-advisory" aria-label="Folded dipole design advisories"><strong>Review these construction assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'turnstile' && calculation.value.warnings.length > 0 && <aside className="model-note turnstile-advisory" aria-label="Turnstile design advisories"><strong>Review these crossed-dipole assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'cubical-quad' && calculation.value.warnings.length > 0 && <aside className="model-note quad-advisory" aria-label="Cubical quad design advisories"><strong>Review these geometry and clearance choices</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'halo' && calculation.value.warnings.length > 0 && <aside className="model-note halo-advisory" aria-label="Halo design advisories"><strong>Review these open-ring assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'skywire' && calculation.value.warnings.length > 0 && <aside className="model-note skywire-advisory" aria-label="Skywire design advisories"><strong>Review this support and rigging plan</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'hex-beam' && calculation.value.warnings.length > 0 && <aside className="model-note hex-beam-advisory" aria-label="Hex-beam design advisories"><strong>Review this published wire adjustment</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'v-beam' && calculation.value.warnings.length > 0 && <aside className="model-note v-beam-advisory" aria-label="V-beam design advisories"><strong>Review these source and termination assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'rhombic' && calculation.value.warnings.length > 0 && <aside className="model-note v-beam-advisory" aria-label="Rhombic design advisories"><strong>Review these source and termination assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 'vertical-half-rhombic' && calculation.value.warnings.length > 0 && <aside className="model-note v-beam-advisory" aria-label="Half-rhombic design advisories"><strong>Review these height and termination assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
          {calculation?.type === 't2fd' && calculation.value.warnings.length > 0 && <aside className="model-note v-beam-advisory" aria-label="T2FD design advisories"><strong>Review these historical and matching assumptions</strong><ul>{calculation.value.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul></aside>}
        </form>

        <div className="visual-panel" id="design-drawing">
          <div className="antenna-print-diagram">
          {calculation?.type === 'dipole' && <DipoleDiagram totalMetres={calculation.value.cutTotalMetres} legMetres={calculation.value.cutLegMetres} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
          {calculation?.type === 'folded-dipole' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading folded-dipole drawing…</div>}><FoldedDipoleDiagram spanMetres={calculation.value.cutSpanMetres} spacingMetres={calculation.value.conductorSpacingMetres} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'fan-dipole' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading fan-dipole drawing…</div>}><FanDipoleDiagram elements={calculation.value.elements} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'doublet' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading doublet drawing…</div>}><DoubletDiagram legMetres={calculation.value.cutLegMetres} totalMetres={calculation.value.cutTotalMetres} feedlineMetres={calculation.value.balancedLineLengthMetres} feedlineImpedanceOhms={calculation.value.balancedLineImpedanceOhms} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'g5rv' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading G5RV drawing…</div>}><G5rvDiagram presetLabel={calculation.value.presetLabel} radiatorMetres={calculation.value.radiatorLengthMetres} legMetres={calculation.value.legLengthMetres} matchingSectionMetres={calculation.value.matchingSectionPhysicalLengthMetres} matchingSectionImpedanceOhms={calculation.value.matchingSectionImpedanceOhms} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'phased-collinear' && <><Suspense fallback={<div className="diagram-placeholder" role="status">Loading collinear drawing…</div>}><PhasedWireCollinearDiagram elementCount={calculation.value.elementCount} radiatingSpanMetres={calculation.value.radiatingSpanMetres} radiatorSectionMetres={calculation.value.resonantRadiatorSectionMetres} phasingStubMetres={calculation.value.resonantPhasingStubPhysicalLengthMetres} feedModeReference={calculation.value.feedModeReference} unitSystem={unitSystem} /></Suspense><Suspense fallback={<div className="diagram-placeholder" role="status">Loading collinear commissioning schedule…</div>}><PhasedWireCollinearPanel result={calculation.value} unitSystem={unitSystem} /></Suspense></>}
          {calculation?.type === 'turnstile' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading turnstile drawing…</div>}><TurnstileDiagram dipoleSpanMetres={calculation.value.cutDipoleSpanMetres} phaseLineMetres={calculation.value.quarterWavePhaseLinePhysicalMetres} quadratureOrder={calculation.value.quadratureOrder} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'halo' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading halo drawing…</div>}><HaloDiagram shape={calculation.value.shape} widthMetres={calculation.value.plannedWidthMetres} armMetres={calculation.value.eachArmMetres} farGapMetres={calculation.value.farEndGapMetres} feedGapMetres={calculation.value.feedpointGapMetres} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'skywire' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading skywire drawing…</div>}><SkywireDiagram longSideMetres={calculation.value.longSideMetres} shortSideMetres={calculation.value.shortSideMetres} supportHeightsMetres={calculation.value.supportHeightsMetres} feedSide={calculation.value.feedSide} feedPositionPercent={calculation.value.feedPositionPercent} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'hex-beam' && <><Suspense fallback={<div className="diagram-placeholder" role="status">Loading hex-beam drawing…</div>}><HexBeamDiagram result={calculation.value} unitSystem={unitSystem} /></Suspense><Suspense fallback={<div className="diagram-placeholder" role="status">Loading hex-beam schedule…</div>}><HexBeamSchedule result={calculation.value} unitSystem={unitSystem} /></Suspense></>}
          {calculation?.type === 'v-beam' && <><Suspense fallback={<div className="diagram-placeholder" role="status">Loading V-beam drawing…</div>}><VBeamDiagram result={calculation.value} unitSystem={unitSystem} /></Suspense><Suspense fallback={<div className="diagram-placeholder" role="status">Loading V-beam survey…</div>}><VBeamSurvey result={calculation.value} unitSystem={unitSystem} /></Suspense></>}
          {calculation?.type === 'rhombic' && <><Suspense fallback={<div className="diagram-placeholder" role="status">Loading rhombic drawing…</div>}><RhombicDiagram result={calculation.value} unitSystem={unitSystem} /></Suspense><Suspense fallback={<div className="diagram-placeholder" role="status">Loading rhombic survey…</div>}><RhombicSurvey result={calculation.value} unitSystem={unitSystem} /></Suspense></>}
          {calculation?.type === 'vertical-half-rhombic' && <><Suspense fallback={<div className="diagram-placeholder" role="status">Loading half-rhombic drawing…</div>}><VerticalHalfRhombicDiagram result={calculation.value} unitSystem={unitSystem} /></Suspense><Suspense fallback={<div className="diagram-placeholder" role="status">Loading half-rhombic survey…</div>}><VerticalHalfRhombicSurvey result={calculation.value} unitSystem={unitSystem} /></Suspense></>}
          {calculation?.type === 't2fd' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading T2FD drawing…</div>}><T2fdDiagram result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'loaded-dipole' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading loaded-dipole drawing…</div>}><LoadedDipoleDiagram totalSpanMetres={calculation.value.totalSpanMetres} loadingPointFromCentreMetres={calculation.value.loadingPointFromCentreMetres} inductanceMicrohenries={calculation.value.inductanceMicrohenries} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'trap-dipole' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading trap-dipole drawing…</div>}><TrapDipoleDiagram totalSpanMetres={calculation.value.totalSpanMetres} trapPositionFromCentreMetres={calculation.value.trapPositionFromCentreMetres} inductanceMicrohenries={calculation.value.inductanceMicrohenries} capacitancePicofarads={calculation.value.capacitancePicofarads} trapResonanceMHz={calculation.value.trapResonanceMHz} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'small-loop' && <><Suspense fallback={<div className="diagram-placeholder" role="status">Loading small-loop drawing…</div>}><SmallLoopDiagram diameterMetres={calculation.value.diameterMetres} circumferenceMetres={calculation.value.circumferenceMetres} minimumCapacitancePicofarads={calculation.value.minimumRequiredVariableCapacitancePicofarads} maximumCapacitancePicofarads={calculation.value.maximumRequiredVariableCapacitancePicofarads} lowerFrequencyMHz={calculation.value.lowerFrequencyMHz} upperFrequencyMHz={calculation.value.upperFrequencyMHz} isUnderArrlSmallLoopBoundary={calculation.value.isUnderArrlSmallLoopBoundary} unitSystem={unitSystem} /></Suspense><Suspense fallback={<div className="diagram-placeholder" role="status">Loading small-loop analysis…</div>}><SmallLoopAnalysisPanel result={calculation.value} /></Suspense></>}
          {calculation?.type === 'inverted-v' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading inverted-V drawing…</div>}><InvertedVDiagram legMetres={calculation.value.legMetres} spanMetres={calculation.value.endpointSpanMetres} dropMetres={calculation.value.apexDropMetres} angleDegrees={includedAngleDegrees} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'efhw' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading EFHW drawing…</div>}><EfhwDiagram radiatorMetres={calculation.value.radiatorMetres} transformerRatio={transformerRatio} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'ocfd' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading OCFD drawing…</div>}><OcfdDiagram shortLegMetres={calculation.value.shortLegMetres} longLegMetres={calculation.value.longLegMetres} totalMetres={calculation.value.cutLengthMetres} feedpointPercent={feedpointPercentFromEnd} transformerRatio={transformerRatio} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'jpole' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading J-pole drawing…</div>}><JpoleDiagram longElementMetres={calculation.value.longElementMetres} matchingStubMetres={calculation.value.matchingStubMetres} halfWaveRadiatorMetres={calculation.value.halfWaveRadiatorMetres} feedpointFromShortMetres={calculation.value.feedpointFromShortMetres} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'slim-jim' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading Slim Jim drawing…</div>}><SlimJimDiagram overallHeightMetres={calculation.value.overallHeightMetres} matchingStubMetres={calculation.value.matchingStubMetres} upperFoldedSectionMetres={calculation.value.upperFoldedSectionMetres} gapMetres={calculation.value.interruptionGapMetres} feedpointMetres={calculation.value.feedpointFromShortMetres} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'moxon' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading Moxon drawing…</div>}><MoxonDiagram aMetres={calculation.value.aMetres} bMetres={calculation.value.bMetres} cMetres={calculation.value.cMetres} dMetres={calculation.value.dMetres} eMetres={calculation.value.eMetres} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'cubical-quad' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading quad drawings…</div>}><CubicalQuadDiagram drivenSideMetres={calculation.value.drivenSideMetres} reflectorSideMetres={calculation.value.reflectorSideMetres} drivenCutSideMetres={calculation.value.drivenCutSideMetres} reflectorCutSideMetres={calculation.value.reflectorCutSideMetres} elementSpacingMetres={calculation.value.elementSpacingMetres} polarization={quadPolarization} unitSystem={unitSystem} /><CubicalQuadSurveyPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'axial-helix' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading helix drawings and worksheet…</div>}><AxialModeHelixDiagram turnCount={calculation.value.turnCount} diameterMetres={calculation.value.diameterMetres} turnSpacingMetres={calculation.value.turnSpacingMetres} axialLengthMetres={calculation.value.axialLengthMetres} groundPlaneDiameterMetres={calculation.value.groundPlaneDiameterMetres} handedness={helixHandedness} unitSystem={unitSystem} /><HelixConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'discone' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading discone drawing and worksheet…</div>}><DisconeDiagram coneRadialCount={calculation.value.coneRadialCount} discRadialCount={calculation.value.discRadialCount} coneSlantLengthMetres={calculation.value.coneSlantLengthMetres} coneHeightMetres={calculation.value.coneHeightMetres} coneBaseDiameterMetres={calculation.value.coneBaseDiameterMetres} discDiameterMetres={calculation.value.discDiameterMetres} coneIncludedAngleDegrees={calculation.value.coneIncludedAngleDegrees} unitSystem={unitSystem} /><DisconeConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'log-periodic' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading log-periodic drawing and worksheets…</div>}><LogPeriodicDiagram elements={calculation.value.elements} boomSpanMetres={calculation.value.boomSpanMetres} apexIncludedAngleDegrees={calculation.value.apexIncludedAngleDegrees} unitSystem={unitSystem} /><LogPeriodicSchedule elements={calculation.value.elements} unitSystem={unitSystem} /><LogPeriodicConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'beverage' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading Beverage drawing and worksheet…</div>}><BeverageDiagram designWireLengthMetres={calculation.value.designWireLengthMetres} wireHeightMetres={calculation.value.wireHeightMetres} targetBearingDegrees={calculation.value.targetBearingDegrees} targetCompassPoint={calculation.value.targetCompassPoint} reverseBearingDegrees={calculation.value.reverseBearingDegrees} reverseCompassPoint={calculation.value.reverseCompassPoint} receptionMode={calculation.value.receptionMode} terminationResistanceOhms={calculation.value.terminationResistanceOhms} transformerTurnsRatio={calculation.value.transformerTurnsRatio} unitSystem={unitSystem} /><BeverageConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'compact-receive' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading compact-receive drawing and worksheet…</div>}><CompactReceiveDiagram geometry={calculation.value.geometry} horizontalSpanMetres={calculation.value.horizontalSpanMetres} verticalHeightMetres={calculation.value.verticalHeightMetres} bottomClearanceMetres={calculation.value.bottomClearanceMetres} receiveBearingDegrees={calculation.value.receiveBearingDegrees} receiveCompassPoint={calculation.value.receiveCompassPoint} nullBearingDegrees={calculation.value.nullBearingDegrees} nullCompassPoint={calculation.value.nullCompassPoint} terminationResistanceOhms={calculation.value.terminationResistanceOhms} transformerTurnsRatio={calculation.value.transformerTurnsRatio} unitSystem={unitSystem} /><CompactReceiveConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'k9ay' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading K9AY drawing and worksheet…</div>}><K9ayDiagram apexHeightMetres={calculation.value.apexHeightMetres} halfWidthMetres={calculation.value.halfWidthMetres} lowerCornerHeightMetres={calculation.value.lowerCornerHeightMetres} footprintDiameterMetres={calculation.value.footprintDiameterMetres} directions={calculation.value.directions} selectedDirectionIndex={calculation.value.selectedDirectionIndex} terminationResistanceOhms={calculation.value.terminationResistanceOhms} transformerTurnsRatio={calculation.value.transformerTurnsRatio} unitSystem={unitSystem} /><K9ayConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'loop-on-ground' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading Loop-on-Ground drawing and worksheet…</div>}><LoopOnGroundDiagram sideLengthMetres={calculation.value.sideLengthMetres} diagonalMetres={calculation.value.diagonalMetres} receiveAxisBearingDegrees={calculation.value.receiveAxisBearingDegrees} receiveCompassPoint={calculation.value.receiveCompassPoint} reverseReceiveBearingDegrees={calculation.value.reverseReceiveBearingDegrees} reverseReceiveCompassPoint={calculation.value.reverseReceiveCompassPoint} feedpointBearingDegrees={calculation.value.feedpointBearingDegrees} feedpointCompassPoint={calculation.value.feedpointCompassPoint} antennaWindingTurns={calculation.value.antennaWindingTurns} coaxWindingTurns={calculation.value.coaxWindingTurns} unitSystem={unitSystem} /><LoopOnGroundConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'active-receive-loop' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading active-loop drawing and worksheet…</div>}><ActiveReceiveLoopDiagram loopDiameterMetres={calculation.value.loopDiameterMetres} baseHeightMetres={calculation.value.baseHeightMetres} topHeightMetres={calculation.value.topHeightMetres} nullAxisBearingDegrees={calculation.value.nullAxisBearingDegrees} nullCompassPoint={calculation.value.nullCompassPoint} reverseNullBearingDegrees={calculation.value.reverseNullBearingDegrees} reverseNullCompassPoint={calculation.value.reverseNullCompassPoint} loopPlaneBearingDegrees={calculation.value.loopPlaneBearingDegrees} loopPlaneCompassPoint={calculation.value.loopPlaneCompassPoint} unitSystem={unitSystem} /><ActiveReceiveLoopConstructionPanel result={calculation.value} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'yagi' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading Yagi drawing…</div>}><YagiDiagram reflectorMetres={calculation.value.reflectorMetres} drivenElementMetres={calculation.value.drivenElementMetres} directorMetres={calculation.value.directorMetres} reflectorSpacingMetres={calculation.value.reflectorSpacingMetres} directorSpacingMetres={calculation.value.directorSpacingMetres} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'loaded-vertical' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading loaded-vertical drawing…</div>}><LoadedVerticalDiagram radiatorHeightMetres={calculation.value.radiatorHeightMetres} loadingPointFromBaseMetres={calculation.value.loadingPointFromBaseMetres} inductanceMicrohenries={calculation.value.inductanceMicrohenries} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'ground-mounted-vertical' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading ground-vertical drawing…</div>}><GroundMountedVerticalDiagram radiatorMetres={calculation.value.radiatorMetres} radialMetres={calculation.value.radialMetres} radialFieldDiameterMetres={calculation.value.radialFieldDiameterMetres} radialCount={groundRadialCount} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'ground-plane' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading ground-plane drawing…</div>}><GroundPlaneDiagram radiatorMetres={calculation.value.radiatorMetres} radialMetres={calculation.value.radialMetres} footprintDiameterMetres={calculation.value.footprintDiameterMetres} radialCount={radialCount} slopeDegrees={radialSlopeDegrees} unitSystem={unitSystem} /></Suspense>}
          {calculation?.type === 'full-wave-loop' && <Suspense fallback={<div className="diagram-placeholder" role="status">Loading loop drawing…</div>}><LoopDiagram perimeterMetres={calculation.value.perimeterMetres} primaryDimensionMetres={calculation.value.primaryDimensionMetres} shape={loopShape} unitSystem={unitSystem} deltaOrientation={calculation.value.deltaOrientation} deltaFeedMode={calculation.value.deltaFeedMode} triangleHeightMetres={calculation.value.triangleHeightMetres} feedpointDistanceFromApexMetres={calculation.value.feedpointDistanceFromApexMetres} /></Suspense>}
          {!calculation && <div className="diagram-placeholder">The construction drawing will appear when the inputs are valid.</div>}
          </div>
        </div>
      </div>

      {calculation && <aside className="mobile-work-summary" aria-label="Current antenna working summary">
        <div><small>{ANTENNA_DESIGNS[antennaType].short} · {activeBand?.label ?? `${frequencyMHz.toFixed(3)} MHz`}</small><strong>Max {formatLength(largestAntennaDimension(calculation, loopShape), unitSystem)}</strong></div>
        <button type="button" onClick={() => document.getElementById('design-drawing')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>View drawing</button>
      </aside>}

      {(calculation?.type === 'loop-on-ground' || calculation?.type === 'active-receive-loop') && <section className="receive-family-comparison" aria-labelledby="receive-family-heading">
        <div><p className="eyebrow">Receive-antenna selection</p><h3 id="receive-family-heading">Choose by site and directional need</h3><p>These distinctions describe construction topology and intended use. They do not rank installed performance.</p></div>
        <div className="receive-family-table-wrap"><table><thead><tr><th scope="col">Family</th><th scope="col">Physical site</th><th scope="col">Direction context</th><th scope="col">Ground and switching</th></tr></thead><tbody>
          <tr><th scope="row">Loop on Ground</th><td>Square insulated loop on the surface; no vertical support</td><td>Broad bidirectional low-angle axis; much less directional at high angles</td><td>Loop isolated from earth; no direction switching</td></tr>
          <tr><th scope="row">Flag / Pennant</th><td>Compact elevated vertical loop</td><td>Feed-end response with termination-end null context</td><td>Closed loop; one feed and termination state</td></tr>
          <tr><th scope="row">EWE / Beverage</th><td>Vertical compact wire or long low route</td><td>One physical axis; end convention differs by design</td><td>Ground-return electrodes are antenna circuit elements</td></tr>
          <tr><th scope="row">K9AY</th><td>Two crossed vertical loops on one support</td><td>Four selectable feed-end directions</td><td>Shared ground plus loop selection and reversal switching</td></tr>
          <tr><th scope="row">Active small loop</th><td>Compact vertical loop with feedpoint amplifier</td><td>Rotatable bidirectional null-axis context</td><td>No RF ground required; DC power, overload, common-mode, and transmit protection required</td></tr>
        </tbody></table></div>
      </section>}

      <Suspense fallback={<div className="diagram-placeholder" role="status">Loading coil worksheet…</div>}>
        {calculation?.type === 'loaded-dipole' && <AirCoreCoilPanel targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} coilLabel="Each loading coil" unitSystem={unitSystem} />}
        {calculation?.type === 'trap-dipole' && <AirCoreCoilPanel targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} coilLabel="Each trap coil" unitSystem={unitSystem} />}
        {calculation?.type === 'trap-dipole' && <TrapCommissioningPanel key={`${calculation.value.inductanceMicrohenries}-${calculation.value.capacitancePicofarads}-${calculation.value.trapResonanceMHz}`} targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} targetCapacitancePicofarads={calculation.value.capacitancePicofarads} targetResonanceMHz={calculation.value.trapResonanceMHz} />}
        {calculation?.type === 'loaded-vertical' && <AirCoreCoilPanel targetInductanceMicrohenries={calculation.value.inductanceMicrohenries} coilLabel="Loading coil" unitSystem={unitSystem} />}
      </Suspense>

      {calculation && calculation.type !== 'beverage' && calculation.type !== 'compact-receive' && calculation.type !== 'k9ay' && calculation.type !== 'loop-on-ground' && calculation.type !== 'active-receive-loop' && <section className="workflow-handoff" aria-labelledby="antenna-handoff-heading">
        <div><p className="eyebrow">Connected workflow</p><h3 id="antenna-handoff-heading">Use this design in an RF station project</h3><p>Carry a representative frequency and the largest physical dimension into the feed-system calculator. Gain, loss, power, duty cycle, installed height, and the exact operating frequency remain explicit inputs.</p></div>
        <dl><div><dt>Design</dt><dd>{ANTENNA_DESIGNS[antennaType].short}</dd></div><div><dt>{calculation.type === 'small-loop' || calculation.type === 'log-periodic' ? 'Range centre' : calculation.type === 'hex-beam' ? 'Lowest selected band reference' : 'Frequency'}</dt><dd>{handoffFrequencyMHz.toFixed(3)} MHz</dd></div><div><dt>Largest dimension</dt><dd>{formatLength(largestAntennaDimension(calculation, loopShape), unitSystem)}</dd></div></dl>
        <button type="button" onClick={() => onContinueToSystem(createAntennaDesignHandoff({
          handoffId: globalThis.crypto?.randomUUID?.() ?? `antenna-${Date.now()}`,
          label: ANTENNA_DESIGNS[antennaType].name,
          frequencyMHz: handoffFrequencyMHz,
          largestDimensionMetres: largestAntennaDimension(calculation, loopShape),
          antennaModelId: model.id,
          antennaModelVersion: model.version
        }))}>Continue to feedline and exposure</button>
      </section>}

      {calculation?.type !== 'hex-beam' && <BandIndicator band={activeBand} frequencyMHz={frequencyMHz} unitSystem={unitSystem} />}
      {(calculation?.type === 'efhw' || calculation?.type === 'ocfd') && <HarmonicBands frequencies={calculation.value.harmonicFrequenciesMHz} jurisdiction={jurisdiction} />}
      <p className="allocation-note">{calculation?.type === 'hex-beam' ? `The selected wire sets name amateur bands; they do not establish permission at every frequency in ${jurisdictionName}.` : `Allocation summary for ${jurisdictionName}.`} Licence qualifications, sub-bands, modes, bandwidth, power, and sharing conditions may further restrict operation; confirm current rules before transmitting.{bandSource && <> Source: <a href={bandSource.url} target="_blank" rel="noreferrer">{bandSource.title}</a> (reviewed {bandSource.reviewedOn}).</>}</p>

      {calculation?.type === 'hex-beam' && <div className="explanation-grid">
        <article><p className="eyebrow">Build and verify</p><h3>Reproduce one complete documented system</h3><p>Use the selected published wire sets, tip spacers, guide locations, six-spreader framework, centre-post stack, and feed polarity as one construction. Label every section before assembly, then sweep every band and verify direction, common-mode current, and structure after final installation.</p></article>
        <article><p className="eyebrow">Calculation</p><h3>Published dimensions, not frequency scaling</h3><p className="formula">Selected conductor length = published length × documented wire-gauge factor · tip spacer = published length</p><p>The calculator reproduces the current KIO PVC-insulated schedule for only the selected bands. It applies only K4KIO's documented 12 or 18 AWG conductor adjustment when selected; the published framework envelope remains fixed and no performance is inferred.</p></article>
        <Suspense fallback={<div className="model-note" role="status">Loading hex-beam construction notes…</div>}><HexBeamEducation /></Suspense>
        <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>KIO Assembly Instructions 12 supply the PVC-insulated driver, reflector, tip-spacer, and framework-envelope schedule. K4KIO documents the G3TXQ broadband topology and feed sequence, while the ARRL review independently confirms the nested two-element, six-spreader form. Interconnect dimensions and installed performance are deliberately not inferred.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
      </div>}

      {calculation?.type === 'v-beam' && <div className="explanation-grid">
        <article><p className="eyebrow">Survey and verify</p><h3>Build the site around the complete antenna system</h3><p>Stake both endpoints from the feed apex, then design safe supports, height, sag, strain relief, balanced feedline, matching, common-mode control, and—when selected—two separate termination and ground systems. Model and measure the complete installed geometry.</p></article>
        <article><p className="eyebrow">Calculation</p><h3>Published long-wire correction and ordinary survey geometry</h3><p className="formula">Leg = 150(2N − 0.05) ÷ fMHz · span = 2L sin(apex ÷ 2) · depth = L cos(apex ÷ 2)</p><p>N is the selected leg length in wavelengths. The Army formula supplies the physical long-wire starting length; the published table supplies the apex angle. True-bearing trigonometry then produces endpoint offsets without predicting electrical performance.</p></article>
        <Suspense fallback={<div className="model-note" role="status">Loading V-beam construction notes…</div>}><VBeamEducation /></Suspense>
        <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>ATP 6-02.53 supplies the corrected long-wire formula, discrete leg-length/apex-angle table, balanced-feed context, open bidirectional description, and separately terminated forward arrangement. TC 9-64 independently describes basic V-beam formation. Gain, impedance, matching, pattern, ground quality, termination loading, and structure remain outside the geometry model.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
      </div>}

      {calculation?.type === 'rhombic' && <div className="explanation-grid">
        <article><p className="eyebrow">Direction and footprint</p><h3>{calculation.value.mode === 'terminated' ? 'Forward intent follows the long diagonal to the far apex' : 'Open operation retains both directions on the long diagonal'}</h3><p>The entered {calculation.value.includedAngleDegrees}° angle produces a {formatLength(calculation.value.forwardDepthMetres, unitSystem)} feed-to-far-apex depth and {formatLength(calculation.value.crossSpanMetres, unitSystem)} cross span. This is survey geometry, not a simulated pattern.</p></article>
        <Suspense fallback={<div className="model-note" role="status">Loading rhombic construction notes…</div>}><RhombicEducation /></Suspense>
        <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>TC 9-64 supplies the four-sided, one-or-more-wavelength construction premise and the open-versus-terminated direction context. ATP 6-02.53 supplies the corrected physical long-wire length. The entered angle and true bearing are converted into ordinary rhombus and survey geometry; electrical performance is deliberately not inferred.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
      </div>}

      {calculation?.type === 'vertical-half-rhombic' && <div className="explanation-grid">
        <article><p className="eyebrow">Elevation and direction</p><h3>{calculation.value.mode === 'terminated' ? 'The far-end resistor establishes the forward site direction' : 'Open operation retains front-and-back direction context'}</h3><p>Two equal {formatLength(calculation.value.designLegMetres, unitSystem)} slopes meet at a {formatLength(calculation.value.apexHeightMetres, unitSystem)} apex. The resulting {formatLength(calculation.value.baseSpanMetres, unitSystem)} ground axis is aimed to {calculation.value.forwardBearingDegrees.toFixed(0)}° {calculation.value.forwardCompassPoint}; this is geometry, not a simulated pattern.</p></article>
        <Suspense fallback={<div className="model-note" role="status">Loading half-rhombic construction notes…</div>}><VerticalHalfRhombicEducation /></Suspense>
        <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>ATP 6-02.53 supplies the two-or-more-wavelength wire, 3–7 m support range, open front-and-back context, 500–600 Ω terminated arrangement, ground guidance, and resistor-rating minimum. STP 11-25C13-SM-TG supplies the equal-leg apex construction, counterpoise route, and far end aimed toward the distant station. Right-triangle and true-bearing calculations provide the survey without inferring electrical performance.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
      </div>}

      {calculation?.type === 't2fd' && <div className="explanation-grid">
        <article><p className="eyebrow">Historical geometry, modern verification</p><h3>The drawing reproduces dimensions—not broadband performance</h3><p>Countryman’s equations produce a {formatLength(calculation.value.designSpanMetres, unitSystem)} sloping span and {formatLength(calculation.value.conductorSpacingMetres, unitSystem)} conductor spacing from the entered lowest frequency. The five-to-one frequency range is historical experimental context, not a promise of SWR, efficiency, radiation, or regulatory suitability.</p></article>
        <Suspense fallback={<div className="model-note" role="status">Loading T2FD construction notes…</div>}><T2fdEducation /></Suspense>
        <article className="provenance-card"><p className="eyebrow">Method and sources</p><h3>Model {model.version}</h3><p>Countryman’s June 1949 QST article supplies the half-span and spacing equations, 30° tilt context, 600 Ω line and termination, approximately five-to-one experimental range, and 35% minimum resistor rating. Ordinary trigonometry supplies only the entered support geometry. No installed electrical performance is inferred.</p><ul>{model.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.title}</a></li>)}</ul><small>Model ID: {model.id} · Reviewed {model.reviewedOn}</small></article>
      </div>}

      {calculation && calculation.type !== 'hex-beam' && calculation.type !== 'v-beam' && calculation.type !== 'rhombic' && calculation.type !== 'vertical-half-rhombic' && calculation.type !== 't2fd' && <div className="explanation-grid">
        <article>
          <p className="eyebrow">Build and tune</p>
          <h3>A starting point, not a promise</h3>
          <p>{calculation.type === 'beverage' ? 'Survey the straight route before installing wire, then treat the horizontal conductor, vertical drops, grounds, termination or open end, transformer, feedline, receiver protection, terrain, and nearby conductors as one receive system. Compare signal-to-noise and directionality across the intended bands.' : calculation.type === 'compact-receive' ? 'Preserve the feed-opposite-termination topology and vertical geometry, then treat the loop or EWE grounds, termination, transformer, feedline isolation, receiver protection, supports, and surroundings as one receive system. Compare signal-to-noise and directionality across every intended band.' : calculation.type === 'k9ay' ? 'Build two identical loops at right angles, preserve every labelled base lead, and treat the shared ground, switching, transformer, termination, feedline isolation, receiver protection, support, and surroundings as one receive system. Verify all four directions on every intended band.' : calculation.type === 'loop-on-ground' ? 'Lay out a symmetric insulated loop, preserve galvanic isolation from earth and feedline, and treat the wire, enclosure, transformer, coax route, entry protection, receiver, soil, vegetation, and nearby conductors as one receive system. Compare signal-to-noise across bands and directions.' : calculation.type === 'active-receive-loop' ? 'Build one symmetric circular turn and mount a documented balanced wideband amplifier directly at its feed gap. Treat loop, amplifier, power path, coax, common-mode control, entry protection, receiver overload, and transmit isolation as one receive system; rotate and compare signal-to-noise rather than signal strength alone.' : calculation.type === 'log-periodic' ? 'Preserve the calculated element ratios, centre spacing, and alternating connections, then model the two-conductor boom, feed transition, termination, element gaps, conductor diameter, mast, and supports as one structure. Sweep the complete operating range and verify the beam points toward the shorter elements.' : calculation.type === 'discone' ? 'Build the radial disc, radial cone, compact feed region, connector, supports, and feedline choke as one modelled structure. Sweep the finished antenna across the intended range rather than assuming broadband operation from dimensions alone.' : calculation.type === 'axial-helix' ? 'Build the ground plane, support, helix, connector, and feed transition as one modelled structure. Preserve circularity and turn spacing, then measure the match, polarization, and pattern rather than treating the classical estimates as finished performance.' : calculation.type === 'cubical-quad' ? 'Cut both loops to the longer cut dimensions, support them symmetrically, and trim toward the separate finished targets while preserving the five-percent reflector enlargement. Survey the final bearing and clearance, then model the complete feed, boom, mast, and support geometry before low-power tuning.' : calculation.type === 'phased-collinear' ? 'Establish one electrical half-wave radiator and one electrical quarter-wave shorted stub using the actual materials, then reproduce those measured sections consistently. Engineer the feed separately and tune only after the complete array is installed.' : calculation.type === 'small-loop' ? 'Build the mechanically complete main loop first, measure its installed inductance, then use the displayed capacitance range to select and commission the tuning system. Develop the feed coupling separately with an analyser and low power.' : calculation.type === 'g5rv' ? 'Preserve the selected radiator and matching-section relationship, then treat the balanced section, coax transition, choke, coax route, tuner, grounding, and surroundings as one system. Sweep and commission every intended band after final installation.' : calculation.type === 'moxon' ? 'Installation height, nearby objects, conductor construction, feed arrangement, and ground conditions shift resonance and the directional pattern. Build to the calculated geometry, install in the intended position, measure, and make small symmetrical adjustments.' : calculation.type === 'yagi' ? 'Scale every dimension together, preserve element alignment, and measure from element centre to element centre along the boom. Verify the feed match and pattern in the final mounting arrangement before transmitting.' : calculation.type === 'trap-dipole' ? 'The displayed inductance and capacitance are ideal targets for two matched traps. Measure each finished trap, install the complete antenna, tune at low power, and recheck both operating bands after every adjustment.' : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical' ? 'The displayed inductance is a starting target for the entered idealized geometry. Build the coil with adjustment range, install the complete antenna and RF return system, measure, and tune in small steps.' : 'Installation height, nearby objects, conductor construction, feed arrangement, and ground conditions shift resonance and impedance. Build long, install in the intended position, measure, and trim in small steps.'}</p>
        </article>
        <article>
          <p className="eyebrow">Calculation</p>
          <h3>Traceable working</h3>
          <p className="formula">{calculation.type === 'beverage' ? 'λ = c ÷ f · Lhorizontal = λ × selected ratio · east = L sin(bearing) · north = L cos(bearing)' : calculation.type === 'compact-receive' ? 'Flag wire = 2(span + height) · Pennant wire = height + 2√(span² + (height ÷ 2)²) · EWE wire = span + 2height' : calculation.type === 'k9ay' ? 'Each loop = 2[√(half-width² + (apex − corner)²) + √(half-width² + corner²)] · directions = first bearing + n × 90°' : calculation.type === 'loop-on-ground' ? 'Perimeter = 4 × side · diagonal = side√2 · feedpoint bearing = receive-axis bearing − 90° · impedance ratio = (Nantenna ÷ Ncoax)²' : calculation.type === 'active-receive-loop' ? 'Circumference = π × diameter · area = π(diameter ÷ 2)² · opposite null = bearing + 180° · loop plane = null bearing + 90°' : calculation.type === 'log-periodic' ? 'lₙ₊₁ = τlₙ · dₙ = 2σlₙ · tan(α) = (1 − τ) ÷ 4σ · Bs = τ¹⁻ᴺ' : calculation.type === 'discone' ? 'Cone slant (in) = 2958 ÷ flow(MHz) · Disc Ø (in) = 2008 ÷ flow(MHz)' : calculation.type === 'axial-helix' ? 'C = λ × circumference ratio · D = C ÷ π · S = C tan(α) · Laxial = N × S · resistive-only Γ = |(Restimate − Zfeed) ÷ (Restimate + Zfeed)|' : calculation.type === 'cubical-quad' ? 'Driven design perimeter (ft) = 1005 ÷ f(MHz) · Cut = design × (1 + allowance) · east = distance sin(bearing) · north = distance cos(bearing)' : calculation.type === 'phased-collinear' ? 'Radiator section = λ × ½ × correction · Stub length = λ × ¼ × VF · round-trip phase error = 720° × length error ÷ (λ × VF)' : calculation.type === 'small-loop' ? 'Ctotal = 1 ÷ (4π²f²Lmeasured) · Cvariable = Ctotal − Cstray · D = circumference ÷ π' : calculation.type === 'g5rv' ? 'Lphysical matching section = Lelectrical reference × velocity factor · line phase = 360° × Lphysical ÷ (λ × VF)' : calculation.type === 'moxon' ? 'A–D = Cebik regression(log₁₀(d ÷ λ)) × λ' : calculation.type === 'yagi' ? 'Element lengths and spacings = NBS ratios × λ' : calculation.type === 'fan-dipole' ? 'Each pair: L = (c ÷ f) × ½ × correction factor' : calculation.type === 'doublet' ? 'Radiator L ≈ (c ÷ flow) × ½ · line phase = 360° × length ÷ (λ × VF)' : calculation.type === 'trap-dipole' ? 'X₁, X₂ = Z₀[cot(βouter) − tan(βinner)] · f₀, L, C from parallel-LC reactance' : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical' ? 'Xload = Z₀[cot(βouter) − tan(βinner)] · L = Xload ÷ (2πf)' : 'L = (c ÷ f) × design fraction × correction factor'}</p>
          {calculation.type === 'beverage'
            ? <p>The route length is an explicit multiple of the reference wavelength. True-bearing trigonometry converts the straight run into east/west and north/south survey offsets. The impedance and turns ratios use entered assumptions only; no soil-dependent surge impedance, termination value, gain, or pattern is calculated.</p>
            : calculation.type === 'compact-receive'
            ? <p>Ordinary geometry totals the physical conductor and converts the true receive bearing into the opposite null bearing. Nominal impedance and turns ratios use entered assumptions only. The frequency supplies wavelength context; no termination optimum, gain, null depth, front-to-back ratio, or pattern is calculated.</p>
            : calculation.type === 'k9ay'
            ? <p>Ordinary geometry totals each quasi-delta wire path, while two orthogonal loop axes and feed/termination reversal map four bearings. Nominal impedance and turns ratios use entered assumptions only. No relay circuit, termination optimum, gain, null depth, front-to-back ratio, or pattern is calculated.</p>
            : calculation.type === 'loop-on-ground'
            ? <p>Square geometry supplies perimeter, diagonal, area, and the feedpoint corner normal to the chosen receive axis. The ideal winding ratio provides impedance-ratio context only. Frequency supplies electrical-size warnings; no antenna impedance, signal level, noise improvement, gain, beamwidth, or installed pattern is calculated.</p>
            : calculation.type === 'active-receive-loop'
            ? <p>Circle geometry supplies circumference, area, and mounting height. Frequency converts the fixed loop into lower- and upper-edge electrical-size ratios, while bearings express the expected small-loop null axis. No amplifier response, sensitivity, gain, noise, overload margin, impedance, bandwidth, signal-to-noise improvement, or installed null depth is calculated.</p>
            : calculation.type === 'log-periodic'
            ? <p>Carrel defines τ as the adjacent element-length ratio, σ as centre spacing divided by twice the current full element length, and the one-sided apex angle from those two values. The requested operating ratio is multiplied by the explicit active-region factor, then the element count is rounded up. Conductor, boom spacing, and fabrication tolerances are recorded without being converted into unmodelled RF performance.</p>
            : calculation.type === 'discone'
            ? <p>NTIA’s sourced equations set the cone slant length and disc diameter from the intended starting frequency. The selected cone half-angle then determines height and base diameter by ordinary geometry. Angular spacing, rim arc spacing, gap ratio, and tolerance percentages are fabrication arithmetic; none predicts RF performance.</p>
            : calculation.type === 'axial-helix'
            ? <p>Physical dimensions follow the entered wavelength ratios and pitch geometry. The turn schedule and tolerance worksheet are ordinary construction arithmetic. Beamwidth, gain, resistance, axial ratio, and the resistive-only SWR reference remain estimates; conductor geometry, finite reflector geometry, supports, feed transition, loss, reactance, and fabrication error can move the measured results.</p>
            : calculation.type === 'cubical-quad'
            ? <p>The ARRL starting geometry uses full-wave loops, a driven perimeter of 1005 divided by frequency in megahertz, and a reflector five percent larger. The allowance length is kept outside the finished geometry. Ordinary true-bearing trigonometry supplies only the flat-site survey offsets and does not predict directionality.</p>
            : calculation.type === 'phased-collinear'
            ? <p>The Navy reference identifies the half wavelength as the collinear element basis and requires every section to adhere closely to the same length. The QST construction method uses shorted quarter-wave two-conductor stubs to reverse phase between adjacent sections.</p>
            : calculation.type === 'small-loop'
            ? <p>The ideal LC relationship uses the entered measured inductance and treats the entered fixed or stray capacitance as an equivalent parallel value at the tuning gap. Distributed loop capacitance may not be valid as one lumped value. The ARRL classification requires the circular diameter to remain under one-sixteenth wavelength at the highest requested frequency.</p>
            : calculation.type === 'g5rv'
            ? <p>The selected preset supplies a published radiator length and free-space-equivalent matching-section reference. Velocity factor converts that reference to the physical two-conductor line length. Inspection frequency supplies wavelength and phase context only; characteristic impedance is identified but no complex impedance transformation is inferred.</p>
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
        {calculation.type === 'folded-dipole' && <article>
          <p className="eyebrow">Equal-conductor assumption</p>
          <h3>Four times is a planning reference</h3>
          <p className="formula">Zfolded ≈ 4 × Zdipole</p>
          <p>Equal current division in two equal conductors gives the familiar four-times resistance relationship. With the entered {calculation.value.assumedSingleDipoleResistanceOhms.toFixed(1)} Ω reference, the nominal folded value is {calculation.value.nominalFoldedResistanceOhms.toFixed(1)} Ω. Real spacing, diameter, insulation, end connections, feed gap, height, ground, surroundings, and reactance require modelling or measurement.</p>
        </article>}
        {calculation.type === 'full-wave-loop' && loopShape === 'triangle' && <article>
          <p className="eyebrow">Delta-loop geometry</p>
          <h3>One perimeter, three equal sides</h3>
          <p className="formula">side = perimeter ÷ 3 · ideal height = side × √3 ÷ 2</p>
          <p>The feed marker follows the selected vertical-loop starting arrangement. The quarter-perimeter side location is measured along the conductor from the apex; the horizontal arrangement is at the midpoint of the horizontal side. Preserve the complete perimeter when changing orientation.</p>
        </article>}
        {calculation.type === 'turnstile' && <article>
          <p className="eyebrow">Turnstile quadrature target</p>
          <h3>Equal amplitude and ninety degrees are both required</h3>
          <p className="formula">Δφ = ±90° · ΔLphysical = λ × VF ÷ 4</p>
          <p>NASA defines the turnstile using two orthogonal dipoles with equal-magnitude currents in phase quadrature. The displayed line length is only the physical path difference corresponding to one electrical quarter wavelength in the entered line.</p>
        </article>}
        {calculation.type === 'halo' && <Suspense fallback={<div className="model-note" role="status">Loading halo construction notes…</div>}><HaloEducation /></Suspense>}
        {calculation.type === 'skywire' && <Suspense fallback={<div className="model-note" role="status">Loading skywire construction notes…</div>}><SkywireEducation /></Suspense>}
        {calculation.type === 'efhw' && <article className="caution-card">
          <p className="eyebrow">EFHW safety and installation</p>
          <h3>High voltage does not mean no return current</h3>
          <p>The feedpoint and far end are high-voltage points: keep them out of reach and away from combustible material and power lines. The system still needs an intentional RF return path and common-mode-current plan. Transformer loss, heating, core saturation, and voltage rating must be checked at the intended power.</p>
        </article>}
        {calculation.type === 'folded-dipole' && <article className="caution-card">
          <p className="eyebrow">Folded-dipole feed system</p>
          <h3>A nominal ratio is not a transformer design</h3>
          <p>The displayed impedance and turns ratios compare real-resistance assumptions only. Select a documented balanced transformer or balanced line for the measured complex impedance, frequency range, power, voltage, current, loss, and environment. Provide suitable common-mode control and verify heating and SWR across the complete operating band.</p>
        </article>}
        {calculation.type === 'full-wave-loop' && loopShape === 'triangle' && <article className="caution-card">
          <p className="eyebrow">Delta-loop polarization and matching</p>
          <h3>Feed placement is a starting arrangement, not a field prediction</h3>
          <p>The cited feed locations assume a vertical, symmetrical loop. Height, ground, unequal sides, sag, nearby conductors, feedline routing, the balanced transition, and common-mode current can alter polarization, impedance, and pattern. Measure the installed complex impedance, control feedline current, and model or verify the far-field result when polarization or direction matters.</p>
        </article>}
        {calculation.type === 'turnstile' && <article className="caution-card">
          <p className="eyebrow">Turnstile feed network and polarization</p>
          <h3>A quarter-wave cable is not an equal-power quadrature system by itself</h3>
          <p>The splitter, hybrids or transformers, two balanced ports, line impedances, connector lengths, antenna coupling, and port loads jointly determine amplitude and phase. Verify both ports at the design frequency and confirm axial ratio and polarization sense in the intended axial direction. Reversing the selected lead/lag order reverses rotation, but this planner does not assign an RHCP or LHCP label.</p>
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
        {calculation.type === 'g5rv' && <article className="caution-card">
          <p className="eyebrow">G5RV-family matching and common mode</p>
          <h3>A named geometry is not an all-band match</h3>
          <p>The matching section is an electrical part of the antenna, not an arbitrary feedline extension. Preserve its balance and clearance, engineer the transition to coax with suitable common-mode control, and expect a matching network wherever the installed impedance requires one. Verify loss, tuner or balun heating, voltage clearance, feedline current, and every intended band at the final height and shape.</p>
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
        {calculation.type === 'cubical-quad' && <article className="caution-card">
          <p className="eyebrow">Quad structure, feed, and directionality</p>
          <h3>Loop dimensions alone do not define the finished beam</h3>
          <p>Conductor diameter, corner shape, spreader flex, wire sag, boom material, mast placement, feedpoint hardware, choking, height, ground, and nearby objects alter resonance, impedance, bandwidth, and pattern. Model the complete structure, use non-conductive spreaders where practical, provide suitable mechanical and electrical safety margins, tune at low power, and verify the forward direction and rear response experimentally.</p>
        </article>}
        {calculation.type === 'axial-helix' && <article className="caution-card">
          <p className="eyebrow">Helix feed, reflector, and pattern</p>
          <h3>A one-wavelength turn is not a completed 50-ohm antenna</h3>
          <p>The classical terminal resistance is near 140 Ω at one-wavelength circumference, so a deliberate feed transition is normally required. NASA’s measured prototype used a copper triangle whose shape and location were determined empirically; this planner intentionally does not invent its dimensions. Conductor cross section, the first partial turn, connector, reflector dimensions, support dielectric, winding accuracy, feedline current, and nearby structures alter the match and pattern. Model the complete structure and verify complex impedance, polarization sense, S11, beamwidth, sidelobes, heating, exposure, and mechanical stability experimentally.</p>
        </article>}
        {calculation.type === 'discone' && <article className="caution-card">
          <p className="eyebrow">Discone feed region and usable range</p>
          <h3>Broadband geometry does not establish broadband performance</h3>
          <p>Disc-to-cone spacing, connector dimensions, radial count and diameter, centre bonding, rim hardware, support dielectric, mast coupling, feedline current, and nearby structures can introduce mismatch and pattern changes. Follow one documented feed topology without swapping its conductors: this conventional disc-over-cone worksheet connects coax centre to disc and outer conductor to cone. Keep the gap as short as practical, model the exact build, and sweep every intended receive and transmit band. Verify loss, heating, exposure, and power handling separately.</p>
        </article>}
        {calculation.type === 'log-periodic' && <article className="caution-card">
          <p className="eyebrow">Log-periodic feed, truncation, and performance</p>
          <h3>A scaled element schedule is not a finished wideband feed system</h3>
          <p>The boom-conductor impedance, element diameter and split gap, alternating connections, termination, feed transition, mast, supports, and construction tolerances determine whether a useful active region forms across the requested range. The displayed reserve is a planning input, not an automatic performance solution. Model the complete array and measure impedance, pattern, polarization, heating, exposure, and power handling before service.</p>
        </article>}
        {calculation.type === 'beverage' && <article className="caution-card">
          <p className="eyebrow">Receive-only wire, grounding, and physical safety</p>
          <h3>A low, long wire is both an RF circuit and a site hazard</h3>
          <p>Do not transmit into this receive-only plan. Keep the complete route away from power lines and inaccessible to vehicles, people, and animals; use visible marking, breakaway provisions where appropriate, suitable static and lightning protection, and disconnect procedures. Grounds, soil moisture, nearby conductors, transformer isolation, and receiver overload protection affect both performance and safety.</p>
        </article>}
        {calculation.type === 'compact-receive' && <article className="caution-card">
          <p className="eyebrow">Receive-only termination, isolation, and site safety</p>
          <h3>A compact loop is still a complete outdoor RF system</h3>
          <p>Do not transmit into this receive-only plan. Keep wire and supports away from power lines and inaccessible to people, vehicles, and animals. Provide suitable static and lightning protection, receiver overload protection, disconnect procedures, feedline common-mode isolation, weatherproof non-inductive termination hardware, and safe mechanical clearances. Treat both EWE grounds as live parts of the antenna circuit.</p>
        </article>}
        {calculation.type === 'k9ay' && <article className="caution-card">
          <p className="eyebrow">Receive-only switching, grounding, and site safety</p>
          <h3>Four directions require four verified circuit states</h3>
          <p>Do not transmit into this receive-only plan. Verify relay isolation and continuity with control power removed, and never infer a direction label from coil voltage alone. Keep all wires away from power lines and inaccessible to people, vehicles, and animals. Provide suitable static and lightning protection, receiver overload protection, disconnect procedures, weatherproof switching, feedline isolation, and one stable shared RF ground.</p>
        </article>}
        {calculation.type === 'loop-on-ground' && <article className="caution-card">
          <p className="eyebrow">Receive-only surface wire, utilities, and isolation</p>
          <h3>Invisible wire is a physical hazard unless the site is controlled</h3>
          <p>Do not transmit into this receive-only plan. Keep the loop out of mowing, digging, snow-removal, vehicle, animal, and public-access areas. Confirm underground services before using any stake or burying cable. Use outdoor insulated wire, protected connections, a sealed enclosure, a true isolation transformer, receiver overload protection, and applicable entry bonding, static, lightning, and disconnect provisions. Do not connect the loop itself to earth.</p>
        </article>}
        {calculation.type === 'active-receive-loop' && <article className="caution-card">
          <p className="eyebrow">Receive-only active electronics and transmitter protection</p>
          <h3>A broadband amplifier can overload before the receiver does</h3>
          <p>Do not transmit into this loop or its amplifier. Use a positive interlock, relay, or physical disconnection arrangement that remains safe under power loss and operator error. Verify strong-signal performance with local broadcast and amateur transmitters, add filtering or attenuation where needed, and provide suitable supply protection, common-mode isolation, static and lightning provisions, entry bonding, weatherproofing, and receiver input protection.</p>
        </article>}
        {calculation.type === 'small-loop' && <article className="caution-card">
          <p className="eyebrow">Small-loop voltage, current, and exposure</p>
          <h3>Resonance does not establish a safe transmitting system</h3>
          <p>A transmitting loop can develop high circulating current and high capacitor voltage, while its narrow tuning can move with nearby people, objects, weather, and heating. The displayed electrical-stress values are idealized estimates, not ratings. The calculator does not rate the conductor, joints, capacitor, drive, enclosure, coupling network, or installation. Keep the tuning assembly inaccessible, tune at low power, and perform the applicable RF-exposure assessment using a method suitable for the loop’s reactive near field.</p>
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
          <p>{calculation.type === 'beverage' ? 'Beverage’s patent describes the long horizontal directional receiving conductor, half-wavelength order of magnitude, transformer coupling, grounds, and a resistance near surge impedance to suppress far-end reflection. The 1923 AIEE paper supplies the straight-route, ground-stability, length, location, and construction context. This planner intentionally leaves soil-dependent impedance and pattern to modelling and measurement.' : calculation.type === 'compact-receive' ? 'Cunningham supplies the Flag and point-fed Pennant geometry, opposite feed and termination locations, source-model resistance values, elevation context, and response toward the feed end. Koontz supplies the grounded inverted-U EWE construction and example dimensions. These values are cited starting points, not generalized performance predictions.' : calculation.type === 'k9ay' ? 'Breed supplies the two crossed quasi-delta loops, one-support and shared-ground arrangement, 25 ft by 15 ft starting dimensions, 85 ft wire instruction, 390 Ω 160 m termination, 9:1 impedance transformation, response toward the active feed end, and four states formed by loop selection and reversal. The planner does not reproduce or certify a controller circuit.' : calculation.type === 'loop-on-ground' ? 'Roberts supplies the corner-fed 15 ft square insulated loop, surface installation, lack of an antenna earth connection, two-winding 5:2 isolation transformer, 75 Ω feedline context, low-angle bidirectional orientation normal to the feedpoint, high-angle response context, and the caution to remain below one wavelength in circumference. No modelled performance plot is reproduced.' : calculation.type === 'log-periodic' ? 'Carrel supplies the geometric progression, spacing definition, apex-angle relationship, structural-bandwidth equation, active-region distinction, alternating feed arrangement, beam direction, and termination context. NASA independently documents full-length LPDA construction and the longest-element half-wave relationship. No impedance, gain, pattern, or bandwidth claim is inferred from geometry alone.' : calculation.type === 'discone' ? 'NTIA supplies the lower-frequency cone-slant and disc-diameter equations, the 25–40° half-angle range, and the compact-feed-gap requirement. NASA supports the radial-surface approximation for its explicitly inverted topology. The portable-discone patent documents the conventional disc-over-cone feed used in this worksheet: centre conductor to disc and outer conductor to cone. No upper limit or installed match is inferred.' : calculation.type === 'axial-helix' ? 'The wavelength uses the exact SI speed of light in vacuum. NASA references supply the axial-mode circumference region, turn-spacing geometry, reflector context, classical performance equations, and a measured prototype whose connector centre reached the helix at the ground plane and whose copper-triangle match was empirically shaped and positioned. The worksheet does not infer that transition’s dimensions or finished performance.' : calculation.type === 'cubical-quad' ? 'The ARRL introductory quad relationship supplies the driven-loop perimeter, five-percent reflector enlargement, and spacing context. The QST practical build supports diamond-mounted insulating spreaders and emphasizes that boom, cross-arm, and feed construction are part of the finished antenna.' : calculation.type === 'phased-collinear' ? 'The wavelength uses the exact SI speed of light in vacuum. Equal corrected half-wave radiator sections follow the Navy collinear-array description; each junction uses the QST shorted quarter-wave phase-reversing-stub construction, with physical length set by the entered line velocity factor. NASA’s collinear-array test work supports measuring and correcting relative RF phase; the tolerance worksheet applies the standard transmission-line phase-length relationship without predicting antenna-current phase or pattern.' : calculation.type === 'small-loop' ? 'ARRL’s current loop guidance supplies the under-one-sixteenth-wavelength diameter classification. The National Bureau of Standards resonance relationship converts the measured finished-loop inductance and requested frequency range into ideal total capacitance; the entered equivalent parallel fixed or stray capacitance is then subtracted.' : calculation.type === 'g5rv' ? 'ARRL identifies Varney’s approximately 102 ft multiband radiator and his preference for balanced line and a matching network outside 20 m. The RSGB reference supplies the original G5RV matching-section context and the optimized ZS6BKW radiator and matching-section dimensions. Band-use statements remain cited context rather than installed performance predictions.' : calculation.type === 'moxon' ? 'The wavelength uses the exact SI speed of light in vacuum. Cebik’s regression converts frequency and constant conductor diameter into the A–E construction geometry.' : calculation.type === 'yagi' ? 'The wavelength uses the exact SI speed of light in vacuum. Dimensions reproduce the National Bureau of Standards three-element, 0.4-wavelength reference design at its documented diameter ratio.' : calculation.type === 'fan-dipole' ? 'Each wire pair is calculated as an independent corrected half-wave starting length. The model intentionally does not estimate mutual coupling or the parallel combination of installed impedances.' : calculation.type === 'doublet' ? 'The radiator uses a corrected half-wave starting length at the lowest selected frequency. Feedline phase uses physical length, selected velocity factor, and check frequency without inferring the unknown complex load.' : calculation.type === 'trap-dipole' ? 'The Birnbaum/Lopes method calculates the two reactances required by the entered wire geometry, then solves the parallel-LC network that supplies those reactances. The result reproduces the published worked example without claiming the finished antenna’s impedance or performance.' : calculation.type === 'loaded-dipole' || calculation.type === 'loaded-vertical' ? 'The Birnbaum/Lopes single-wire transmission-line method calculates the series reactance replacing omitted radiator length, then converts reactance to an ideal inductance at the design frequency. The vertical uses the article’s stated vertical applicability without modelling the real ground or return system.' : 'The wavelength uses the exact SI speed of light in vacuum. Empirical factors provide practical wire-cutting estimates and remain adjustable for conductor and installation differences.'}</p>
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

export type Calculation = NonNullable<
  | { type: 'dipole'; value: ReturnType<typeof calculateHalfWaveDipole> }
  | { type: 'folded-dipole'; value: ReturnType<typeof calculateFoldedDipole> }
  | { type: 'fan-dipole'; value: ReturnType<typeof calculateFanDipole> }
  | { type: 'doublet'; value: ReturnType<typeof calculateDoublet> }
  | { type: 'g5rv'; value: ReturnType<typeof calculateG5rv> }
  | { type: 'phased-collinear'; value: ReturnType<typeof calculatePhasedWireCollinear> }
  | { type: 'turnstile'; value: ReturnType<typeof calculateTurnstile> }
  | { type: 'halo'; value: ReturnType<typeof calculateHalo> }
  | { type: 'skywire'; value: ReturnType<typeof calculateSkywire> }
  | { type: 'hex-beam'; value: ReturnType<typeof calculateHexBeam> }
  | { type: 'v-beam'; value: ReturnType<typeof calculateVBeam> }
  | { type: 'rhombic'; value: ReturnType<typeof calculateRhombic> }
  | { type: 'vertical-half-rhombic'; value: ReturnType<typeof calculateVerticalHalfRhombic> }
  | { type: 't2fd'; value: ReturnType<typeof calculateT2fd> }
  | { type: 'loaded-dipole'; value: ReturnType<typeof calculateLoadedDipole> }
  | { type: 'trap-dipole'; value: ReturnType<typeof calculateTrapDipole> }
  | { type: 'small-loop'; value: ReturnType<typeof calculateSmallTransmittingLoop> }
  | { type: 'inverted-v'; value: ReturnType<typeof calculateInvertedV> }
  | { type: 'efhw'; value: ReturnType<typeof calculateEfhw> }
  | { type: 'ocfd'; value: ReturnType<typeof calculateOcfd> }
  | { type: 'jpole'; value: ReturnType<typeof calculateJpole> }
  | { type: 'slim-jim'; value: ReturnType<typeof calculateSlimJim> }
  | { type: 'moxon'; value: ReturnType<typeof calculateMoxon> }
  | { type: 'cubical-quad'; value: ReturnType<typeof calculateTwoElementCubicalQuad> }
  | { type: 'axial-helix'; value: ReturnType<typeof calculateAxialModeHelix> }
  | { type: 'discone'; value: ReturnType<typeof calculateDiscone> }
  | { type: 'log-periodic'; value: ReturnType<typeof calculateLogPeriodic> }
  | { type: 'beverage'; value: ReturnType<typeof calculateBeverage> }
  | { type: 'compact-receive'; value: ReturnType<typeof calculateCompactReceive> }
  | { type: 'k9ay'; value: ReturnType<typeof calculateK9ay> }
  | { type: 'loop-on-ground'; value: ReturnType<typeof calculateLoopOnGround> }
  | { type: 'active-receive-loop'; value: ReturnType<typeof calculateActiveReceiveLoop> }
  | { type: 'yagi'; value: ReturnType<typeof calculateBasicYagi> }
  | { type: 'loaded-vertical'; value: ReturnType<typeof calculateLoadedVertical> }
  | { type: 'ground-mounted-vertical'; value: ReturnType<typeof calculateGroundMountedVertical> }
  | { type: 'ground-plane'; value: ReturnType<typeof calculateGroundPlane> }
  | { type: 'full-wave-loop'; value: ReturnType<typeof calculateFullWaveLoop> }
  | null
>;

function largestAntennaDimension(calculation: Calculation, loopShape: LoopShape): number {
  if (calculation.type === 'dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutTotalMetres });
  if (calculation.type === 'folded-dipole') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.cutSpanMetres, depthMetres: calculation.value.conductorSpacingMetres });
  if (calculation.type === 'fan-dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.longestSpanMetres });
  if (calculation.type === 'doublet') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutTotalMetres });
  if (calculation.type === 'g5rv') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatorLengthMetres });
  if (calculation.type === 'phased-collinear') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatingSpanMetres });
  if (calculation.type === 'turnstile') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutDipoleSpanMetres });
  if (calculation.type === 'halo') return calculateLargestAntennaDimension({ shape: 'loop', loopShape: calculation.value.shape === 'circular' ? 'circle' : 'square', primaryDimensionMetres: calculation.value.plannedWidthMetres });
  if (calculation.type === 'skywire') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.longSideMetres, depthMetres: calculation.value.shortSideMetres });
  if (calculation.type === 'hex-beam') return calculateLargestAntennaDimension({ shape: 'loop', loopShape: 'circle', primaryDimensionMetres: calculation.value.publishedDiameterMetres });
  if (calculation.type === 'v-beam') return Math.max(calculation.value.endpointSpanMetres, calculation.value.designLegMetres);
  if (calculation.type === 'rhombic') return Math.max(calculation.value.forwardDepthMetres, calculation.value.crossSpanMetres);
  if (calculation.type === 'vertical-half-rhombic') return Math.max(calculation.value.baseSpanMetres, calculation.value.apexHeightMetres);
  if (calculation.type === 't2fd') return Math.max(calculation.value.horizontalProjectionMetres, calculation.value.highAttachmentHeightMetres);
  if (calculation.type === 'loaded-dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.totalSpanMetres });
  if (calculation.type === 'trap-dipole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.totalSpanMetres });
  if (calculation.type === 'small-loop') return calculateLargestAntennaDimension({ shape: 'loop', loopShape: 'circle', primaryDimensionMetres: calculation.value.diameterMetres });
  if (calculation.type === 'inverted-v') return calculateLargestAntennaDimension({ shape: 'inverted-v', endpointSpanMetres: calculation.value.endpointSpanMetres, legMetres: calculation.value.legMetres });
  if (calculation.type === 'efhw') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatorMetres });
  if (calculation.type === 'ocfd') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.cutLengthMetres });
  if (calculation.type === 'jpole') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.longElementMetres });
  if (calculation.type === 'slim-jim') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.overallHeightMetres });
  if (calculation.type === 'moxon') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.aMetres, depthMetres: calculation.value.eMetres });
  if (calculation.type === 'cubical-quad') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.reflectorDiagonalMetres });
  if (calculation.type === 'axial-helix') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.axialLengthMetres, depthMetres: calculation.value.groundPlaneDiameterMetres });
  if (calculation.type === 'discone') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.coneHeightMetres, depthMetres: Math.max(calculation.value.coneBaseDiameterMetres, calculation.value.discDiameterMetres) });
  if (calculation.type === 'log-periodic') return calculateLargestAntennaDimension({ shape: 'parallel-elements', boomMetres: calculation.value.boomSpanMetres, firstElementMetres: calculation.value.elements[0].cutLengthMetres, lastElementMetres: calculation.value.elements.at(-1)!.cutLengthMetres });
  if (calculation.type === 'beverage') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.designWireLengthMetres });
  if (calculation.type === 'compact-receive') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.horizontalSpanMetres, depthMetres: calculation.value.verticalHeightMetres });
  if (calculation.type === 'k9ay') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.footprintDiameterMetres, depthMetres: calculation.value.apexHeightMetres });
  if (calculation.type === 'loop-on-ground') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.sideLengthMetres, depthMetres: calculation.value.sideLengthMetres });
  if (calculation.type === 'active-receive-loop') return calculateLargestAntennaDimension({ shape: 'rectangle', widthMetres: calculation.value.loopDiameterMetres, depthMetres: calculation.value.topHeightMetres });
  if (calculation.type === 'yagi') return calculateLargestAntennaDimension({ shape: 'parallel-elements', boomMetres: calculation.value.boomLengthMetres, firstElementMetres: calculation.value.reflectorMetres, lastElementMetres: calculation.value.directorMetres });
  if (calculation.type === 'loaded-vertical') return calculateLargestAntennaDimension({ shape: 'linear', lengthMetres: calculation.value.radiatorHeightMetres });
  if (calculation.type === 'ground-mounted-vertical') return calculateLargestAntennaDimension({ shape: 'ground-mounted-vertical', radiatorMetres: calculation.value.radiatorMetres, radialMetres: calculation.value.radialMetres, radialFieldDiameterMetres: calculation.value.radialFieldDiameterMetres });
  if (calculation.type === 'ground-plane') return calculateLargestAntennaDimension({ shape: 'ground-plane', radiatorMetres: calculation.value.radiatorMetres, radialDropMetres: calculation.value.radialDropMetres, footprintDiameterMetres: calculation.value.footprintDiameterMetres });
  return calculateLargestAntennaDimension({ shape: 'loop', loopShape, primaryDimensionMetres: calculation.value.primaryDimensionMetres });
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
