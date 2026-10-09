#!/usr/bin/env bash
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$case_dir/../route-bug/resources/shop/." .
git init -q
git config user.email dev@example.com
git config user.name Dev
git add -A
git commit -qm "Cart, invoice and pricing helpers"
