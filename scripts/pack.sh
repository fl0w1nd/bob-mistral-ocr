#!/bin/sh
set -eu

ROOT_DIR=$(CDPATH= cd -- "$(dirname -- "$0")/.." && pwd)
DIST_DIR="$ROOT_DIR/dist"
PACKAGE_NAME="Mistral-OCR.bobplugin"

mkdir -p "$DIST_DIR"
rm -f "$DIST_DIR/$PACKAGE_NAME"

cd "$ROOT_DIR"
zip -q -r "$DIST_DIR/$PACKAGE_NAME" info.json main.js README.md appcast.json icon.png

echo "$DIST_DIR/$PACKAGE_NAME"
