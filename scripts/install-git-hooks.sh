#!/bin/sh
# Instala hooks que eliminan Co-authored-by: Cursor de los commits.
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
HOOKS="$ROOT/.git/hooks"
SRC="$(cd "$(dirname "$0")" && pwd)/git-hooks"

mkdir -p "$HOOKS"
cp "$SRC/prepare-commit-msg" "$HOOKS/prepare-commit-msg"
cp "$SRC/commit-msg" "$HOOKS/commit-msg"
chmod +x "$HOOKS/prepare-commit-msg" "$HOOKS/commit-msg"
echo "Hooks instalados en $HOOKS"
