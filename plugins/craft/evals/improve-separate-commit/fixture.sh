#!/usr/bin/env bash
set -euo pipefail
case_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp -R "$case_dir/resources/orders/." .
git init -q
git config user.email dev@example.com
git config user.name Dev
git add -A
git commit -qm "Add orders with ERP sync"
