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
# Before archiving it also guards node_modules: this is an npm-only project, and
# installing with pnpm (or a mixed npm+pnpm tree) leaves two copies of
# react-native-css-interop installed — NativeWind then registers styles in one
# instance while components read from the other, so every `className` silently
# renders unstyled on iOS (Android happens to resolve consistently). When that
# state is detected the script rebuilds node_modules with `npm ci` and forces a
# `pod install` (the Pods would otherwise point at now-deleted .pnpm paths).
#
# After archiving it rewrites BuildMachineOSBuild when the machine runs a beta
# macOS — see strip_beta_build_machine_os below for why (ITMS-90111).
#
# Env vars (read from .env if present):
#   APPLE_TEAM_ID       Apple Developer Team ID. Defaults to DLB2RYLUDX.
#   PUBLIC_MACOS_BUILD  Public macOS build string used by the ITMS-90111 workaround.
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

# Set when ensure_npm_node_modules reinstalls, so prebuild_step knows to force a
# pod install (the reinstall changes on-disk module paths the Pods reference).
NODE_MODULES_REINSTALLED=0

# Guard against a pnpm / mixed-package-manager node_modules, which silently
# breaks NativeWind styling on iOS (see the header comment). This project is
# npm-only (package-lock.json committed, no pnpm-lock.yaml). A healthy npm tree
# has exactly one react-native-css-interop and no .pnpm store, so this is a fast
# no-op on normal repeat archives.
ensure_npm_node_modules() {
  if command -v pnpm >/dev/null 2>&1 && [[ "${npm_config_user_agent:-}" == pnpm/* ]]; then
    echo "==> Refusing to build under pnpm: this is an npm-only project." >&2
    echo "    Run the release with npm (e.g. \`npm run release:ios\`)." >&2
    exit 1
  fi

  local css_interop_copies=0
  if [[ -d node_modules ]]; then
    css_interop_copies="$(find node_modules -type d -name react-native-css-interop 2>/dev/null | wc -l | tr -d ' ')"
  fi

  if [[ ! -d node_modules ]]; then
    echo "==> node_modules missing — installing with npm ci."
  elif [[ -d node_modules/.pnpm ]]; then
    echo "==> node_modules was installed with pnpm (found node_modules/.pnpm)."
    echo "    pnpm breaks iOS NativeWind styling — rebuilding with npm ci."
  elif [[ "$css_interop_copies" -gt 1 ]]; then
    echo "==> Found $css_interop_copies copies of react-native-css-interop (mixed npm/pnpm tree)."
    echo "    This breaks iOS NativeWind styling — rebuilding with npm ci."
  else
    return 0  # healthy npm install — nothing to do
  fi

  rm -rf node_modules
  npm ci
  NODE_MODULES_REINSTALLED=1
}

prebuild_step() {
  ensure_npm_node_modules
  echo "==> npx expo prebuild --platform ios (sync app.config.ts → ios/)"
  # --no-install skips `pod install`; we run it ourselves below only when the
  # Pods are missing or node_modules was just reinstalled, so repeat archives
  # stay fast.
  npx expo prebuild --platform ios --no-install
  if [[ ! -d ios/Pods || "$NODE_MODULES_REINSTALLED" == "1" ]]; then
    echo "==> pod install (Pods missing or node_modules reinstalled)"
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
  strip_beta_build_machine_os
}

# Xcode stamps the machine's macOS build into BuildMachineOSBuild in every
# bundled Info.plist. When that build is a beta seed, App Store Connect rejects
# the upload with ITMS-90111 ("Unsupported SDK or Xcode version") even though
# Xcode and the iOS SDK are the current public releases. Rewriting the key in
# the archive — before `-exportArchive`, which re-signs everything — makes the
# binary acceptable without downgrading macOS.
#
# Override the substituted value with PUBLIC_MACOS_BUILD when a newer macOS
# ships; it only has to be a real, publicly released build string.
PUBLIC_MACOS_BUILD="${PUBLIC_MACOS_BUILD:-25F84}"  # macOS 26.5.2

# Apple seed builds carry a 4+ digit number starting with 5 after the letter
# (26A5378n), while public builds are short (25F84). Anything else is public.
is_beta_macos_build() {
  [[ "$1" =~ ^[0-9]+[A-Z]5[0-9]{3,}[a-z]?$ ]]
}

strip_beta_build_machine_os() {
  local machine_build
  machine_build="$(sw_vers -buildVersion)"
  if ! is_beta_macos_build "$machine_build"; then
    return 0
  fi

  echo "==> Building on a beta macOS ($machine_build) — rewriting"
  echo "    BuildMachineOSBuild to $PUBLIC_MACOS_BUILD to avoid ITMS-90111."
  local plist patched=0
  while IFS= read -r plist; do
    if /usr/libexec/PlistBuddy -c "Set :BuildMachineOSBuild $PUBLIC_MACOS_BUILD" \
        "$plist" >/dev/null 2>&1; then
      patched=$((patched + 1))
    fi
  done < <(find "$ARCHIVE_PATH/Products" -name Info.plist)
  echo "    Patched $patched Info.plist file(s)."
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
