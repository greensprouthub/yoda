#!/bin/bash
cd /app
git add -A
if git diff --cached --quiet; then
  echo "Nothing to commit."
else
  git commit -m "${1:-'Yoda: auto-update'}"
  echo "✅ Committed: ${1:-'Yoda: auto-update'}"
fi
