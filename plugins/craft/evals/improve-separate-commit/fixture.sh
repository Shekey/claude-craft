#!/usr/bin/env bash
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$case_dir/resources/orders/." .
git init -q
# The eval sandbox only allows writes inside the workspace, so keep craft's per-repo cache here.
mkdir -p .claude
printf '{ "env": { "CRAFT_HOME": "%s/.craft-home" } }\n' "$PWD" > .claude/settings.json
printf '.claude/\n.craft-home/\n' >> .git/info/exclude
git config user.email dev@example.com
git config user.name Dev
git add -A
git commit -qm "Add orders with ERP sync"
