#!/usr/bin/env bash

set -euo pipefail

output_root="${1:-}"
if [[ -z "$output_root" ]]; then
  echo "usage: npm run release:package -- /path/to/private-release-directory" >&2
  exit 2
fi

repository_root="$(git rev-parse --show-toplevel)"
cd "$repository_root"

if [[ -n "$(git status --porcelain)" ]]; then
  echo "refusing to package a dirty checkout" >&2
  exit 1
fi

commit="$(git rev-parse HEAD)"
short_commit="$(git rev-parse --short=8 HEAD)"
timestamp="$(date -u +%Y%m%dT%H%M%SZ)"
release_name="AntennaWorkshop-${short_commit}-${timestamp}"
release_directory="${output_root%/}/$release_name"

if [[ -e "$release_directory" ]]; then
  echo "release directory already exists: $release_directory" >&2
  exit 1
fi

npm run build
npm run release:check

mkdir -p "$release_directory"

archive_name="${release_name}-dist.tar.gz"
tar -czf "$release_directory/$archive_name" -C dist .

(
  cd dist
  find . -type f -print0 \
    | sort -z \
    | while IFS= read -r -d '' file; do
        size="$(stat -c '%s' "$file")"
        hash="$(sha256sum "$file" | cut -d ' ' -f 1)"
        printf '%s\t%s\t%s\n' "$hash" "$size" "${file#./}"
      done
) > "$release_directory/FILE-INVENTORY.tsv"

file_count="$(find dist -type f | wc -l | tr -d ' ')"
archive_hash="$(sha256sum "$release_directory/$archive_name" | cut -d ' ' -f 1)"
index_hash="$(sha256sum dist/index.html | cut -d ' ' -f 1)"
worker_hash="$(sha256sum dist/sw.js | cut -d ' ' -f 1)"
manifest_hash="$(sha256sum dist/manifest.webmanifest | cut -d ' ' -f 1)"

{
  echo "RadioBook Antenna Workshop release"
  echo "Source commit: $commit"
  echo "Created UTC: $timestamp"
  echo "Deployment base: /antennas/"
  echo "Packaged files: $file_count"
  echo "Archive: $archive_name"
  echo "Archive SHA-256: $archive_hash"
  echo "index.html SHA-256: $index_hash"
  echo "sw.js SHA-256: $worker_hash"
  echo "manifest.webmanifest SHA-256: $manifest_hash"
  echo "Publication rule: publish and verify all resources and index.html before sw.js"
} > "$release_directory/RELEASE-MANIFEST.txt"

(
  cd "$release_directory"
  sha256sum "$archive_name" FILE-INVENTORY.tsv RELEASE-MANIFEST.txt > SHA256SUMS
  sha256sum -c SHA256SUMS
)

echo "release package created: $release_directory"
