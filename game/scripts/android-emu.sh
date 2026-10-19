#!/usr/bin/env bash
# Builds the debug APK, starts an Android emulator if none is running, installs and launches Binaroo.
# Usage: npm run android:emu                (Pixel_9)
#        npm run android:emu -- Medium_Phone_API_36.0
#        HEADLESS=1 npm run android:emu     (no emulator window)
set -euo pipefail

AVD="${1:-Pixel_9}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Library/Android/sdk}"
ADB="$ANDROID_HOME/platform-tools/adb"
cd "$(dirname "$0")/.."

npm run sync
(cd android && ./gradlew assembleDebug)

if ! "$ADB" get-state >/dev/null 2>&1; then
  echo "Starting emulator $AVD..."
  args=(-avd "$AVD" -no-snapshot -no-audio)
  [ -n "${HEADLESS:-}" ] && args+=(-no-window)
  nohup "$ANDROID_HOME/emulator/emulator" "${args[@]}" >"${TMPDIR:-/tmp}/binaroo-emulator.log" 2>&1 &
  "$ADB" wait-for-device
  until [ "$("$ADB" shell getprop sys.boot_completed | tr -d '\r')" = 1 ]; do sleep 2; done
fi

"$ADB" install -r android/app/build/outputs/apk/debug/app-debug.apk
"$ADB" shell am start -n com.gernikalabs.binaroo/.MainActivity
