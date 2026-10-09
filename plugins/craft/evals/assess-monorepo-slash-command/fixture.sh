#!/usr/bin/env bash
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source_app="$case_dir/../assess-finds-design-problems/resources/app"

mkdir -p apps/mobile apps/web/src packages/ui
cp -R "$source_app/." apps/mobile/
cat > package.json <<'JSON'
{ "name": "monorepo", "private": true, "workspaces": ["apps/*", "packages/*"] }
JSON
cat > apps/web/package.json <<'JSON'
{ "name": "web", "private": true }
JSON
cat > packages/ui/package.json <<'JSON'
{ "name": "ui", "private": true }
JSON
echo 'export const Button = () => null;' > packages/ui/index.ts
echo 'export const home = "home";' > apps/web/src/home.ts

cat > apps/mobile/lib/location.ts <<'TS'
type Coords = { lat: number; lon: number };

let lastKnown: Coords | undefined;

export function rememberLocation(coords: Coords) {
  lastKnown = coords;
}

export function locationOrDefault(current?: Coords): Coords {
  return current ?? lastKnown ?? { lat: 0, lon: 0 };
}
TS

screen=apps/mobile/app/add-expense.tsx
{ echo 'import { locationOrDefault } from "../lib/location";'; cat "$screen"; echo; echo 'export const receiptLocation = locationOrDefault();'; } > "$screen.tmp"
mv "$screen.tmp" "$screen"

git init -q
git config user.email dev@example.com
git config user.name Dev
git add -A
git commit -qm "Monorepo with mobile and web apps"
