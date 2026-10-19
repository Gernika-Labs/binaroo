#!/usr/bin/env bash
# Builds Binaroo for an iOS simulator, installs it and launches it. Run from anywhere.
# Usage: npm run ios:sim              (iPhone 17)
#        npm run ios:sim -- "iPhone 17e"
set -euo pipefail

DEVICE="${1:-iPhone 17}"
cd "$(dirname "$0")/.."

npm run sync
DERIVED="${TMPDIR:-/tmp}/binaroo-ios"
xcodebuild -project ios/App/App.xcodeproj -scheme App \
  -destination "platform=iOS Simulator,name=$DEVICE" \
  -derivedDataPath "$DERIVED" CODE_SIGNING_ALLOWED=NO build | tail -3

# a freshly booted simulator launches the app slowly, so wait longer in that case
if xcrun simctl list devices booted | grep -q "$DEVICE"; then WAIT=5; else WAIT=15; fi
xcrun simctl boot "$DEVICE" 2>/dev/null || true
# Xcode 27 replaced Simulator.app with Device Hub; older Xcodes still have Simulator.app
if ! open -a Simulator 2>/dev/null && ! open -a DeviceHub 2>/dev/null; then
  echo "Could not open Simulator or Device Hub: run from Xcode to see the screen. Saving a screenshot instead."
fi
xcrun simctl install "$DEVICE" "$DERIVED/Build/Products/Debug-iphonesimulator/App.app"
xcrun simctl launch "$DEVICE" com.gernikalabs.binaroo

echo "Waiting ${WAIT}s for the app to finish launching..."
sleep "$WAIT"
SHOT="${TMPDIR:-/tmp}/binaroo-ios.png"
xcrun simctl io "$DEVICE" screenshot "$SHOT" >/dev/null && echo "Screenshot: $SHOT"
echo "Still on the splash or the home screen? Wait a few seconds and run: npm run ios:shot"
