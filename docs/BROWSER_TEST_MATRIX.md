# Browser and Device Verification

## Automated release gate

Run the complete Chromium suite and the focused browser matrix before a release:

```bash
npm run test:e2e
npm run test:browser-matrix
npm run test:pwa
```

The matrix covers desktop Chromium, Firefox, and WebKit plus representative Pixel 7 and iPhone 13 profiles. Every profile opens all three workspaces, checks representative antenna, feedline, and RF-reference results, persists a preference, exercises the keyboard skip link and numeric entry, and rejects horizontal overflow. Mobile profiles additionally check the 44-pixel navigation target minimum.

These profiles validate browser-engine and responsive behaviour. They do not prove behaviour on physical hardware, with a vendor keyboard, or under a mobile operating system’s installation and storage policies.

## Physical-device release check

Before public deployment, test at least one current Android phone and one current iPhone or iPad over HTTPS:

1. Open `/antennas/`, move among all three workspaces, and rotate between portrait and landscape.
2. Enter and edit numeric values using the on-screen keyboard; confirm fields are not hidden by the keyboard.
3. Verify buttons, disclosures, help controls, diagrams, and tables can be used without horizontal page scrolling.
4. Add the application to the home screen and launch it in standalone mode.
5. Visit every workspace online once, close the application, disable networking, and confirm all three workspaces reopen.
6. Restore networking, publish a test update, and confirm the update prompt applies the new version without losing saved preferences or station projects.
7. Repeat keyboard and screen-reader spot checks with VoiceOver on iOS and TalkBack on Android.

Record the device, operating-system version, browser version, date, result, and any limitation. Plain HTTP LAN access can test layout and calculations, but installation and service-worker checks require HTTPS or the device’s own localhost.
