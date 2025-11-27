#!/usr/bin/env bash
set -euo pipefail

TARGET_BIN='openunilink'
SEA_BLOB='sea-prep.blob'
SEA_SENTINEL='NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2'

echo '[OpenUniLink] Building bundled JS...'
npm run build

echo '[OpenUniLink] Generating SEA blob...'
node --experimental-sea-config sea-config.json

if [ ! -f "$SEA_BLOB" ]; then
  echo "[OpenUniLink] ERROR: SEA blob '$SEA_BLOB' not found"
  exit 1
fi

# Make sure we get the *real* node binary, not a shim (volta, etc. can interfere)
NODE_BIN="$(command -v node)"

if [ -z "$NODE_BIN" ]; then
  echo '[OpenUniLink] ERROR: node binary not found in PATH'
  exit 1
fi

echo "[OpenUniLink] Copying node binary from '$NODE_BIN' to '$TARGET_BIN'..."
cp "$NODE_BIN" "$TARGET_BIN"

# Platform-specific postject invocation
UNAME_OUT="$(uname -s)"

case "$UNAME_OUT" in
  Darwin)
    echo '[OpenUniLink] Detected macOS, removing existing code signature (if any)...'
    # codesign removal will fail if the binary is unsigned; ignore that case
    codesign --remove-signature "$TARGET_BIN" || true

    echo '[OpenUniLink] Injecting SEA blob with postject (macOS)...'
    npx postject "$TARGET_BIN" NODE_SEA_BLOB "$SEA_BLOB" \
      --sentinel-fuse "$SEA_SENTINEL" \
      --macho-segment-name NODE_SEA
    ;;

  Linux)
    echo '[OpenUniLink] Detected Linux, injecting SEA blob with postject...'
    npx postject "$TARGET_BIN" NODE_SEA_BLOB "$SEA_BLOB" \
      --sentinel-fuse "$SEA_SENTINEL"
    ;;

  *)
    echo "[OpenUniLink] WARNING: Unsupported platform '$UNAME_OUT'"
    echo 'Attempting generic postject injection (no macho segment)...'
    npx postject "$TARGET_BIN" NODE_SEA_BLOB "$SEA_BLOB" \
      --sentinel-fuse "$SEA_SENTINEL"
    ;;
esac

chmod +x "$TARGET_BIN"

echo
echo "[OpenUniLink] SEA build complete."
echo "  -> Single-file executable: ./$TARGET_BIN"

