#!/usr/bin/env bash
set -euo pipefail

cd frontend
files=()
for file in "$@"; do
  files+=("${file#frontend/}")
done

exec ../node_modules/.bin/biome check --write --unsafe --no-errors-on-unmatched --files-ignore-unknown=true "${files[@]}"
