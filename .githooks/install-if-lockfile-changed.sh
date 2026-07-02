#!/bin/sh
# Shared helper: run `npm install` when package-lock.json differs between two revisions.
# Usage: install-if-lockfile-changed.sh <old-rev> <new-rev>

old_rev="$1"
new_rev="$2"

[ -z "$old_rev" ] || [ -z "$new_rev" ] && exit 0
[ "$old_rev" = "$new_rev" ] && exit 0

if git diff --name-only "$old_rev" "$new_rev" -- package-lock.json | grep -q .; then
  echo "package-lock.json changed — running npm install..."
  npm install
fi
