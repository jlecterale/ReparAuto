#!/usr/bin/env bash
# Archive, export, and upload the RecarGarage iOS app to App Store Connect.
#
# Usage:
#   scripts/build-ios.sh archive   # expo prebuild + pod install + xcodebuild archive
#   scripts/build-ios.sh export    # export .ipa from the existing archive
#   scripts/build-ios.sh upload    # upload existing .ipa via altool
#   scripts/build-ios.sh release   # archive + export + upload (one command)
#
# `archive` runs `expo prebuild --platform ios --no-install` first so the
# version + buildNumber in app.config.ts are reflected in
# ios/RecarGarage/Info.plist, then runs `pod install` if the Pods are missing.
# If you add/remove/upgrade a native dependency, run `pod install` (in ios/)
# or a full `npx expo prebuild --platform ios` separately before archiving.
#
# Env vars (read from .env if present):
#   APPLE_TEAM_ID    Apple Developer Team ID. Defaults to DLB2RYLUDX.
#   ASC_KEY_ID       App Store Connect API Key ID. Required for upload/release.
#   ASC_ISSUER_ID    App Store Connect Issuer ID. Required for upload/release.
#   ASC_KEY_PATH     Optional. Defaults to ~/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env ]]; then
  set -a
  # shellcheck disable=SC1091
  source .env
  set +a
fi

WORKSPACE="ios/RecarGarage.xcworkspace"
SCHEME="RecarGarage"
CONFIG="Release"
ARCHIVE_PATH="build/RecarGarage.xcarchive"
EXPORT_DIR="build"
EXPORT_OPTIONS="build/ExportOptions.plist"
APPLE_TEAM_ID="${APPLE_TEAM_ID:-DLB2RYLUDX}"

# App Store Connect API key flags for xcodebuild. When all three vars are set,
# xcodebuild can refresh/create provisioning profiles without a logged-in
# Apple ID in Xcode (which is why CLI archives fail with `No Accounts`
# otherwise). Empty array if creds are missing — xcodebuild falls back to the
# Xcode keychain account, if any.
ASC_AUTH_FLAGS=()
if [[ -n "${ASC_KEY_ID:-}" && -n "${ASC_ISSUER_ID:-}" ]]; then
  _asc_key_path="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8}"
  if [[ -f "$_asc_key_path" ]]; then
    ASC_AUTH_FLAGS=(
      -authenticationKeyPath "$_asc_key_path"
      -authenticationKeyID "$ASC_KEY_ID"
      -authenticationKeyIssuerID "$ASC_ISSUER_ID"
    )
  fi
fi

write_export_options() {
  # Generated at runtime so it survives `expo prebuild --clean` and stays in
  # sync with $APPLE_TEAM_ID. Kept under build/ which is gitignored.
  mkdir -p "$(dirname "$EXPORT_OPTIONS")"
  cat > "$EXPORT_OPTIONS" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
	<key>method</key>
	<string>app-store-connect</string>
	<key>teamID</key>
	<string>${APPLE_TEAM_ID}</string>
	<key>signingStyle</key>
	<string>automatic</string>
	<key>stripSwiftSymbols</key>
	<true/>
	<key>uploadSymbols</key>
	<true/>
	<key>destination</key>
	<string>export</string>
</dict>
</plist>
EOF
}

ACTION="${1:-release}"

prebuild_step() {
  echo "==> npx expo prebuild --platform ios (sync app.config.ts → ios/)"
  # --no-install skips `pod install`; we run it ourselves below only when the
  # Pods are missing, so repeat archives stay fast.
  npx expo prebuild --platform ios --no-install
  if [[ ! -d ios/Pods ]]; then
    echo "==> pod install (first prebuild / Pods missing)"
    ( cd ios && pod install )
  fi
}

archive_step() {
  prebuild_step
  echo "==> xcodebuild archive (team $APPLE_TEAM_ID)"
  mkdir -p build
  xcodebuild \
    -workspace "$WORKSPACE" \
    -scheme "$SCHEME" \
    -configuration "$CONFIG" \
    -destination 'generic/platform=iOS' \
    -archivePath "$ARCHIVE_PATH" \
    -allowProvisioningUpdates \
    ${ASC_AUTH_FLAGS[@]+"${ASC_AUTH_FLAGS[@]}"} \
    DEVELOPMENT_TEAM="$APPLE_TEAM_ID" \
    CODE_SIGN_STYLE=Automatic \
    archive
}

export_step() {
  echo "==> xcodebuild -exportArchive (team $APPLE_TEAM_ID)"
  if [[ ! -d "$ARCHIVE_PATH" ]]; then
    echo "Archive not found at $ARCHIVE_PATH — run \`archive\` first" >&2
    exit 1
  fi
  write_export_options
  rm -f "$EXPORT_DIR"/*.ipa
  xcodebuild \
    -exportArchive \
    -archivePath "$ARCHIVE_PATH" \
    -exportPath "$EXPORT_DIR" \
    -exportOptionsPlist "$EXPORT_OPTIONS" \
    -allowProvisioningUpdates \
    ${ASC_AUTH_FLAGS[@]+"${ASC_AUTH_FLAGS[@]}"}
}

upload_step() {
  : "${ASC_KEY_ID:?ASC_KEY_ID missing — set it in .env or the environment}"
  : "${ASC_ISSUER_ID:?ASC_ISSUER_ID missing — set it in .env or the environment}"
  local key_path="${ASC_KEY_PATH:-$HOME/.appstoreconnect/private_keys/AuthKey_${ASC_KEY_ID}.p8}"
  if [[ ! -f "$key_path" ]]; then
    echo "API key not found at $key_path" >&2
    echo "Place AuthKey_${ASC_KEY_ID}.p8 there or set ASC_KEY_PATH." >&2
    exit 1
  fi
  local ipa
  ipa="$(find "$EXPORT_DIR" -maxdepth 1 -name '*.ipa' -print -quit 2>/dev/null || true)"
  if [[ -z "$ipa" ]]; then
    echo "No .ipa found in $EXPORT_DIR — run \`export\` first" >&2
    exit 1
  fi
  echo "==> xcrun altool --upload-app ($ipa)"
  xcrun altool --upload-app \
    -f "$ipa" \
    -t ios \
    --apiKey "$ASC_KEY_ID" \
    --apiIssuer "$ASC_ISSUER_ID"
}

case "$ACTION" in
  archive) archive_step ;;
  export)  export_step ;;
  upload)  upload_step ;;
  release) archive_step; export_step; upload_step ;;
  -h|--help)
    sed -n '2,14p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
    ;;
  *)
    echo "Unknown action: $ACTION. Use: archive | export | upload | release" >&2
    exit 1
    ;;
esac
