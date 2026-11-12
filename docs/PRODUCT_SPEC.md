# Product Specification

## Product vision

RadioBook Antenna Workshop will be an approachable, comprehensive workbench for people who build their own antennas. It should help a newcomer succeed without concealing the assumptions, controls, and source material an experienced builder needs.

The application will run in a desktop or mobile browser, install as an offline-capable PWA, and ultimately be hosted below `radiobook.ca/antennas`.

## Confirmed decisions

- Canada is the default jurisdiction, with a prominent persistent selector.
- United States support is required for the first release. United Kingdom support follows; Australia requires further scoping.
- Station location, not browsing location, determines the applicable jurisdiction. Network-derived location may suggest a first-visit default but never overrides an explicit selection.
- Metric is the default unit system. Imperial conversion is available everywhere through a single toggle.
- Design frequency inputs include jurisdiction-aware amateur-band selectors. The interface distinguishes conventional band names from the actual wavelength at the selected frequency.
- The standard experience is beginner-friendly; Advanced controls remain available from day one.
- The visual system follows RadioBook and Tartanleaf branding.
- The application remains useful offline and does not require an account.
- Licensing will be chosen before public release or outside contributions are accepted.

## Core experience

Users can begin either by choosing an antenna family or by describing a goal such as portable HF, a fixed VHF antenna, or an RF exposure check. Each calculator provides:

1. Clear inputs with units, defaults, and contextual help.
2. A live, dimensioned construction diagram.
3. A cut list and practical build notes.
4. Formula, source, assumptions, applicability, and intermediate values.
5. A tuning procedure that distinguishes the calculated starting point from the finished antenna.
6. Saved projects, comparison, print, and export capabilities.

## Visual language

Visuals are functional rather than decorative:

- **Construction drawing:** dimensioned and intended for building.
- **Conceptual illustration:** educational and explicitly not to scale.
- **Calculated estimate:** derived from a documented formula.
- **Simulated result:** produced by an identified model and configuration.

Initial visuals cover a dipole or inverted-V, vertical with radials, loop, Moxon or Yagi, feedline path, tuning plot, and RF exposure side view. Colour reinforces meaning but never carries it alone.

## Initial calculator roadmap

The first useful release includes wavelength, dipole, inverted-V, quarter-wave vertical, ground plane, full-wave loop, EFHW, off-centre-fed dipole, J-pole, Slim Jim, Moxon, basic Yagi, feedline loss, velocity factor, coaxial stubs, SWR, return loss, mismatch loss, ERP/EIRP, and unit conversion.

Advanced families later include loaded and trap antennas, fan dipoles, doublets, multiband designs, magnetic loops, loaded verticals, collinears, cubical quads, helices, discones, log-periodics, receive antennas, coils, traps, and matching networks.

## RF exposure

Exposure tools are jurisdiction-specific and versioned. The first release includes separate Canadian and United States workflows, multiple transmitters, controlled and uncontrolled environments, duty cycle, feedline loss, antenna gain, ground reflection, accessible locations, and printable records.

The result vocabulary must distinguish:

- a screen that demonstrates compliance under its stated conservative assumptions;
- a screen that is inconclusive and requires detailed calculation, measurement, or mitigation;
- an invalid scenario outside the method's applicability.

The application must not turn an inconclusive simplified screen into a claim of non-compliance or certification.

## Acceptance criteria for the first public beta

- Responsive operation on current Android, iOS, and desktop browsers.
- Keyboard and screen-reader operability, visible focus, and 44-pixel minimum targets.
- Cold offline return after one complete online visit.
- Persistent projects survive reload, browser restart, and application upgrade.
- Every shipped calculator has traceable sources and automated reference tests.
- Exposure calculations pass independent review and official-example cross-checks.
- Production output works correctly from the `/antennas/` subpath.
