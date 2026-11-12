# Contributing

Thank you for helping improve RadioBook Antenna Workshop.

## Before opening a change

- Keep calculations pure and independently testable.
- Cite primary technical or regulatory sources for formulas and limits.
- Add reference vectors, boundary cases, invalid-input tests, units, assumptions, and limitations.
- Never describe a simplified RF exposure screen as certification or a complete compliance determination.
- Preserve responsive behavior, keyboard access, and the `/antennas/` deployment path.

Run the verification suite before submitting a pull request:

```bash
npm test
npm run test:e2e
npm run build
```

Pull requests should explain the user problem, calculation sources, assumptions, visible changes, and verification performed. Include screenshots for interface changes and identify any regulatory-source revision.

## Licence

By submitting a contribution, you agree that it is provided under the Mozilla Public License 2.0. Retain applicable copyright, licence, and attribution notices.
