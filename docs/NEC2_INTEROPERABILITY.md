# NEC-2 Interoperability

The centre-fed dipole exporter is checked at the card-field level in the normal unit suite. Two optional solver checks provide separate interoperability evidence without adding a solver to the application or its production dependencies.

## Generated deck check

The `nec2c` check sends the exact generated free-space and perfect-ground decks to the solver and verifies that each run:

- exits successfully without a reported warning or error;
- recognizes the requested antenna environment;
- excites wire tag 1, centre segment 11; and
- returns finite input impedance with positive resistance.

Run the check with a locally trusted `nec2c` executable:

```bash
ANTENNA_NEC2C_BIN=/path/to/nec2c npm run test:nec2c
```

On 2026-11-15, Ubuntu package `nec2c` 1.3.1-2 (`nec2c 1.3.1`) accepted both 14.2 MHz reference decks. It reported 67.513 − j33.263 Ω in free space and 68.261 − j50.672 Ω at 10 m over infinite perfect ground. These values are regression observations for the stated deck, not installed-antenna predictions or acceptance tolerances.

## Independent engine check

The PyNEC check constructs the same wire and source through the PyNEC API, using its NEC2++ engine rather than parsing the exported deck. It compares both environments with the `nec2c` observations to a 0.1 Ω numerical tolerance:

```bash
ANTENNA_PYNEC_PYTHON=/path/to/pynec-python npm run test:pynec
```

On 2026-11-15, PyNEC/NEC2++ 2.4.0 reported 67.516 − j33.241 Ω in free space and 68.262 − j50.651 Ω over perfect ground. Both cases agree with the generated-deck results within 0.022 Ω.

The checks establish deck acceptance and close agreement for one bounded dipole reference at one frequency. They do not validate arbitrary geometries, installed environments, radiation patterns, or every NEC implementation. Results remain starting points for modelling and measurement, not predictions of a completed installation.
