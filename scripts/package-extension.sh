#!/usr/bin/env bash
# Package the Chrome extension for upload to the Chrome Web Store.
# Output: dist/unihub-extension-<version>.zip

set -euo pipefail

cd "$(dirname "$0")/.."

EXT_DIR="extension"
DIST_DIR="dist"

if [[ ! -f "$EXT_DIR/manifest.json" ]]; then
  echo "error: $EXT_DIR/manifest.json not found" >&2
  exit 1
fi

VERSION=$(node -p "require('./$EXT_DIR/manifest.json').version")
if [[ -z "$VERSION" ]]; then
  echo "error: could not read version from manifest.json" >&2
  exit 1
fi

OUT="$DIST_DIR/unihub-extension-${VERSION}.zip"

mkdir -p "$DIST_DIR"
rm -f "$OUT"

# Sanity: required files present
for f in manifest.json background.js content.js sync.js popup.html popup.js; do
  if [[ ! -f "$EXT_DIR/$f" ]]; then
    echo "error: missing required file $EXT_DIR/$f" >&2
    exit 1
  fi
done

for icon in 16 48 128; do
  if [[ ! -f "$EXT_DIR/icons/icon-${icon}.png" ]]; then
    echo "error: missing required icon $EXT_DIR/icons/icon-${icon}.png" >&2
    exit 1
  fi
done

# Zip from inside extension/ so paths are relative (Chrome Store requirement)
(
  cd "$EXT_DIR"
  zip -r -q "../$OUT" . \
    -x "*.DS_Store" \
    -x "*/.DS_Store" \
    -x "*.swp" \
    -x ".git*" \
    -x "*.log" \
    -x "*.map"
)

SIZE=$(du -h "$OUT" | cut -f1)
echo "✓ Packaged extension v${VERSION}"
echo "  file: $OUT"
echo "  size: $SIZE"
echo ""
echo "Next steps:"
echo "  1. Open https://chrome.google.com/webstore/devconsole"
echo "  2. Select the UniHub EMIS Connector item"
echo "  3. Upload $OUT as a new package"
echo "  4. Submit for review"
