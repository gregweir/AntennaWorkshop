# Production Deployment

RadioBook Antenna Workshop is a static PWA built for `https://www.radiobook.ca/antennas/`. Hosting access, server names, private paths, credentials, and infrastructure configuration belong in the private operations runbook, not this repository.

## Release package

Start from a clean `main` checkout whose validation workflow has passed:

```bash
npm ci
npm test
npm run build
npm run release:package -- /path/to/private-release-directory
```

The packaging command refuses a dirty checkout, rebuilds the application, verifies the `/antennas/` base path and required PWA files, and creates a versioned archive, file inventory, release manifest, and checksums. Verify `SHA256SUMS` before and after transferring the package.

## Hosting prerequisites

Configure `/antennas/` as a dedicated static application path before publishing. The origin must:

- serve `/antennas/` and application navigations with the Antenna Workshop `index.html`;
- serve JavaScript, CSS, images, the manifest, Workbox, and `sw.js` as their real content types;
- return an error for a missing static asset instead of the main RadioBook page;
- keep the worker scope under `/antennas/`;
- send `index.html`, `sw.js`, and the manifest with revalidation or no-cache headers; and
- allow hashed files under `/antennas/assets/` to be cached immutably.

Before release, prove that `/antennas/sw.js` is JavaScript rather than an HTML fallback. Do not publish a service worker until the dedicated path and every referenced resource are available.

## Safe publication order

Create a timestamped backup and inventory of any existing `/antennas/` tree. Extract the new package into a separate staging directory and compare it with `FILE-INVENTORY.tsv`.

Publish without mirroring, purging, or deleting old hashed assets:

1. Copy new hashed assets, icons, images, the manifest, registration script, and imported Workbox file. Exclude `index.html` and `sw.js`.
2. Verify staged and published file hashes.
3. Replace `index.html` through a verified temporary file and same-directory rename.
4. Confirm every resource referenced by the staged worker returns HTTP 200 with the expected bytes.
5. Replace `sw.js` last through a verified temporary file and same-directory rename. Give it a fresh publication timestamp.

If CDN cache invalidation is required, expose and verify resources and `index.html` first, then invalidate `sw.js` last. Preserve both old and new hashed assets throughout the observation window.

## Production verification

Verify the origin before the public CDN, then test a fresh browser profile and an installed application:

```bash
curl -fsSI https://www.radiobook.ca/antennas/
curl -fsSI https://www.radiobook.ca/antennas/manifest.webmanifest
curl -fsSI https://www.radiobook.ca/antennas/sw.js
```

Require the expected title and hashes—not only HTTP 200. Confirm the scoped manifest, worker control, all workspaces, saved settings, offline return, update prompt, light/dark/system themes, and a representative antenna and RF-exposure calculation. Check desktop and mobile independently. Never clear browser storage to make an update succeed.

## Rollback

Restore the verified previous resources and `index.html` while retaining new hashed assets. Confirm every resource referenced by the old worker is present, then republish the old `sw.js` last with a fresh timestamp. Verify origin and CDN hashes, update convergence, saved local data, and offline return. Do not remove either asset generation until installed clients have passed the rollback observation window.
