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

# boot fails harmlessly when the simulator is already running
xcrun simctl boot "$DEVICE" 2>/dev/null || true
if ! open -a Simulator 2>/dev/null; then
  echo "Simulator.app not found on this Mac: run from Xcode to see the screen. Saving a screenshot instead."
fi
xcrun simctl install "$DEVICE" "$DERIVED/Build/Products/Debug-iphonesimulator/App.app"
xcrun simctl launch "$DEVICE" com.gernikalabs.binaroo

sleep 4
SHOT="${TMPDIR:-/tmp}/binaroo-ios.png"
xcrun simctl io "$DEVICE" screenshot "$SHOT" >/dev/null && echo "Screenshot: $SHOT"
