# Testing Binaroo on emulators and real phones

How to run the app on simulators/emulators and physical devices, and what to check. Build details are in `native.md`. Commands run from `game/` unless a block says "from the repo root". The `npm run ios:sim` and `npm run android:emu` scripts do the whole build, install and launch for you.

**Why both:** emulators are fast and good for layout, themes and logic. Real phones are the only way to judge touch, dragging, haptics, sound and performance, so a release needs both.

## 0. Before you start

```sh
cd game
npm install
npm run sync
```

`npm install` is only needed the first time. `npm run sync` builds the web app and copies it into the `ios/` and `android/` projects.

Run `npm run sync` again whenever the web code changes. The native apps carry their own copy of the game, so they do not update by themselves.

Fast check first (no native tools needed): `npm run dev`, then open the printed URL. In Chrome DevTools use the device toolbar (Cmd+Shift+M) to try phone sizes. This tests layout and rules but not touch feel, haptics or the native shell.

## 1. iOS simulator

Needs Xcode (this Mac has it).

**One command** (from `game/`; it syncs, builds, boots the simulator, installs, launches and saves a screenshot):
```sh
npm run ios:sim
```
Another device: `npm run ios:sim -- "iPhone 17e"`. List the names with `xcrun simctl list devices available`.

**In Xcode:** `npm run ios` (syncs and opens Xcode), pick a simulator at the top (for example *iPhone 17*) and press **Run**.

**By hand**, from the repo root (copy one line at a time; `boot` prints an error if the simulator is already running, which is fine):
```sh
xcodebuild -project game/ios/App/App.xcodeproj -scheme App -destination 'platform=iOS Simulator,name=iPhone 17' -derivedDataPath /tmp/binaroo-ios CODE_SIGNING_ALLOWED=NO build
xcrun simctl boot "iPhone 17"
xcrun simctl install "iPhone 17" /tmp/binaroo-ios/Build/Products/Debug-iphonesimulator/App.app
xcrun simctl launch "iPhone 17" com.gernikalabs.binaroo
xcrun simctl io "iPhone 17" screenshot ~/Desktop/binaroo-ios.png
```

**Seeing the screen:** on this Mac there is no separate `Simulator.app` (the script says so), so the simulator runs in the background. Run it from Xcode's **Run** button to watch it, or use the screenshot the script saves.

**Useful switches** (replace the name if you use another device)
- Dark or light: `xcrun simctl ui "iPhone 17" appearance dark` (or `light`), then relaunch. With Settings on *System* the app follows it.
- Relaunch: `xcrun simctl terminate "iPhone 17" com.gernikalabs.binaroo`, then `xcrun simctl launch "iPhone 17" com.gernikalabs.binaroo`.
- Reset the app's saved data (best score, settings): `xcrun simctl uninstall "iPhone 17" com.gernikalabs.binaroo`, then run the script again.
- Stop all simulators: `xcrun simctl shutdown all`.
- Devices worth covering: *iPhone 17e* (smaller screen), *iPhone 17*, *iPhone 18 Pro Max* (largest), *iPad* (to see the layout on a big screen).

**Limits:** the simulator uses the mouse as a finger, plays no haptics, and its sound can differ from a phone. Do not sign off on those here.

## 2. Android emulator

Needs Android Studio's SDK (this Mac has it, with the AVDs `Pixel_9` and `Medium_Phone_API_36.0`).

**One command** (from `game/`; it syncs, builds the APK, starts the emulator if none is running, installs and launches):
```sh
npm run android:emu
```
Another emulator: `npm run android:emu -- Medium_Phone_API_36.0`. No window: `HEADLESS=1 npm run android:emu`. The first start takes a minute or two.

**In Android Studio:** `npm run android`, pick a device in Device Manager, press **Run**.

**By hand**, from `game/`. First set up the tools for this terminal:
```sh
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```
Then, one line at a time (start the emulator in its own terminal tab, because it keeps running):
```sh
emulator -list-avds
emulator -avd Pixel_9
```
```sh
npm run sync
(cd android && ./gradlew assembleDebug)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
adb shell am start -n com.gernikalabs.binaroo/.MainActivity
adb exec-out screencap -p > ~/Desktop/binaroo-android.png
```

**Useful switches**
- Dark or light: `adb shell cmd uimode night yes` (or `no`), then relaunch.
- Taps: `adb shell input tap X Y`. Drag: `adb shell input swipe X1 Y1 X2 Y2 600`.
- Reset saved data: `adb shell pm clear com.gernikalabs.binaroo`
- Errors: `adb logcat -s chromium:E Capacitor:E AndroidRuntime:E`
- Stop the emulator: `adb emu kill`
- Cover a small phone and a tablet too: create AVDs in Android Studio's Device Manager (for example a small-screen phone and a 10" tablet).

**Limits:** no real haptics, and touch is emulated.

## 3. A physical iPhone

Needs a Mac with Xcode, a cable (or Wi-Fi pairing), and an Apple ID. A free Apple ID is enough to install on your own phone for testing, but the app expires after 7 days. The paid Developer Program ($99/year) is needed for TestFlight and the App Store.

One-time setup:
1. On the iPhone: **Settings > Privacy & Security > Developer Mode** > on (the phone restarts).
2. Connect the phone, unlock it, and tap **Trust** on the prompt.
3. `npm run ios` to open Xcode. Click the **App** project > **Signing & Capabilities** > tick *Automatically manage signing* > choose your **Team**.
4. If Xcode says the bundle ID is taken, you are on a free account and someone else holds it; change it only for local testing (for example `com.gernikalabs.binaroo.dev`) and change it back before release.

Run it: choose your phone as the destination at the top and press **Run**. The first time, the phone may say *Untrusted Developer*: go to **Settings > General > VPN & Device Management**, open your Apple ID, and tap **Trust**.

**Inspecting it:** on the iPhone enable **Settings > Safari > Advanced > Web Inspector** (on iOS 18 and later it is under **Settings > Apps > Safari**). In Safari on the Mac enable the Develop menu (Safari > Settings > Advanced), then **Develop > [your iPhone] > Binaroo** opens the console.

**Beta testers:** once you have the paid account, upload an archive (Product > Archive) to App Store Connect and invite people through **TestFlight**.

## 4. A physical Android phone

1. On the phone: **Settings > About phone**, tap **Build number** 7 times to unlock Developer options.
2. **Settings > System > Developer options > USB debugging** > on. Connect the cable and accept the *Allow USB debugging* prompt.
3. Check it: `adb devices` should list the phone as `device` (not `unauthorized`).
4. Install: `adb install -r android/app/build/outputs/apk/debug/app-debug.apk`, or press **Run** in Android Studio with the phone selected.

Wireless instead of a cable (Android 11+): Developer options > **Wireless debugging** > pair, then `adb pair HOST:PORT` and `adb connect HOST:PORT`.

**Inspecting it:** in Chrome on the Mac open `chrome://inspect/#devices`, find Binaroo under the phone and click **inspect**. If a page does not appear, make sure it is a debug build.

**Sharing with testers without the Play Store:** send the `app-debug.apk` (they must allow installs from unknown sources). A signed release build for testers goes through Play Console internal testing, see `native.md`.

## 5. What to test

Use this on at least one iPhone and one Android phone, plus the extra sizes above. Tick as you go.

### Play (every device)
- [ ] The first screen shows the board, 8 target numbers, the shape picker, and `Lv 1 · 0/5 rows`, `Easy`, `○○○`.
- [ ] Tap a shape, then tap the board: on touch the shape is placed where you tap (there is no preview step). With a mouse, a preview follows the pointer first.
- [ ] The shape **stays selected** after placing; tap the selected shape again to deselect.
- [ ] **Drag** a shape from the picker to the board with a finger: the ghost follows above your finger and drops where the preview showed. Try the 4-line, the 2×2 and a big L.
- [ ] Place a shape that doesn't fit: you get "Doesn't fit there".
- [ ] Match a row exactly: it flashes and clears, you get "Exact! +N", the row gets a new target and a new timer.
- [ ] Fill a whole row with single squares that **doesn't** match: it does **not** clear.
- [ ] Put a wrong bit in a row: it turns amber, shows `✗ impossible`, and stays that way.
- [ ] Clear 5 exact rows: the **Level 2** celebration plays (wave, confetti, cheer), timers freeze, tapping skips it, the header says `Lv 2 · 0/5 rows`, `Normal`.
- [ ] Let it sit idle for about 10 s: a hint glows on a reachable row and costs 15 points.
- [ ] Let it sit idle for about 60 s (Easy). All rows start with the same timer, so the first three time out together: each costs 25 points (never below 0) and a strike, the strikes read `✕✕✕`, and the game ends ("Time's up" with a bit fact). **Play again** starts fresh. (To see one strike at a time you need rows whose timers differ, which only happens after a clear.)
- [ ] **Best** survives closing and reopening the app.

### Look and feel
- [ ] Nothing is cut off by the notch, Dynamic Island, camera hole, rounded corners or the home bar/gesture bar.
- [ ] Text is readable and numbers don't overlap on the **smallest** phone, including the right-hand `value/target` column (try `255/255`).
- [ ] Every control is easy to hit with a thumb; the shape slots and the header buttons are not too small.
- [ ] The page doesn't scroll, bounce, double-tap-zoom or select text while playing. Note whether pinch-zoom works (it is not blocked on purpose yet).
- [ ] Portrait is locked on phones. Rotate the phone: the app stays portrait.
- [ ] Animations are smooth: dragging, the clear flash, the celebration. Note any stutter and the device model.

### Settings and themes
- [ ] **System** follows the phone: switch the phone between light and dark with the app open and the app follows.
- [ ] **Dark** and **Light** force the theme and are remembered after a restart, with no flash of the wrong colours at launch.
- [ ] The status bar text is readable in both themes (light text on dark, dark text on light).
- [ ] **Sound** off silences everything and stays off after a restart.
- [ ] **Haptics** appears in Settings in the app (not in a browser) and stays off after a restart.
- [ ] **Android back button / gesture:** note what it does on the board and on Settings. It is not wired to anything yet, so it may close the app.
- [ ] Opening Settings **pauses** the game (the bars stop); closing it resumes. **Done** resumes it.

### Phone-only (cannot be checked on emulators)
- [ ] **Haptics:** a light tap on placing, a firmer one on a match, a different one on a timeout and at game over. With Haptics off, none.
- [ ] **Sound:** you hear placement and clear tones after the first touch. Check with the ringer switch/silent mode on and off and note what happens (on iPhone, web audio can be muted by the silent switch).
- [ ] **Interruptions:** a phone call, a notification banner, pulling down the notification shade, or switching apps mid-game **pauses** the game, and it is still paused when you come back.
- [ ] **Backgrounding for a few minutes:** you return to the pause screen, not to a game that lost lives while you were away.
- [ ] **Offline:** turn on airplane mode and relaunch. The game and the font still load.
- [ ] **Low power mode / battery saver:** the game still runs and animations are acceptable.
- [ ] **Launch:** time from tapping the icon to a playable board. Note it; the splash should be gone in a few seconds.
- [ ] **Heat and battery** after 10 minutes of play: the phone should not get noticeably warm.

### Accessibility quick pass
- [ ] Set the phone's text size to large: the layout may grow but must stay usable.
- [ ] Turn on *Reduce motion*: animations shorten or stop, the celebration doesn't flash.
- [ ] Try it with a screen reader on for a minute and note what is unusable (known gap: the board is not described to screen readers).

## 6. Test matrix

Record what you actually covered, so gaps are visible.

| Device | OS | Type | Theme | Result |
|---|---|---|---|---|
| iPhone 17 | iOS 27 | simulator | dark, light | |
| iPhone 17e | iOS 27 | simulator | | |
| iPad | iOS 27 | simulator | | |
| Pixel 9 | Android 17 | emulator | dark, light | |
| Small Android | | emulator | | |
| (your iPhone) | | real | | |
| (your Android phone) | | real | | |

Aim for: at least 2 real phones (one per platform), the smallest and largest simulator phones, and light and dark on each platform.

## 7. If a command fails

| What you see | Why | Fix |
|---|---|---|
| `'App.xcodeproj' does not exist` | You ran the command from the wrong folder. | Use `npm run ios:sim` from `game/`, or the by-hand commands from the **repo root**. |
| `Unknown argument: #` | Interactive zsh does not accept `# comments` on a command line. | Copy only the command, without the `#` part. The commands in this guide have no trailing comments. |
| `No devices are booted` | The boot step failed or was skipped, so there is nothing to install on. | Check with `xcrun simctl list devices booted`. Boot it with `xcrun simctl boot "iPhone 17"`. |
| `Unable to boot device in current state: Booted` | It is already running. | Ignore it and continue. |
| `Unable to find application named 'Simulator'` | This Xcode install has no `Simulator.app`. | Run from Xcode's Run button, or use the screenshot. |
| `adb: command not found` | The Android tools are not on this terminal's PATH. | Run the two `export` lines in section 2, or use `npm run android:emu`. |
| `no devices/emulators found` | No emulator is running yet. | Start one (`emulator -avd Pixel_9`) and wait for it to boot, or use `npm run android:emu`. |
| `device unauthorized` (real phone) | USB debugging was not accepted. | Unlock the phone and tap **Allow** on the prompt, then `adb devices` again. |
| The app shows an old version | The native app keeps its own copy of the game. | Run `npm run sync` (the scripts do it for you) and install again. |

## 8. Reporting a bug

Put this in a GitHub issue:
- **Device and OS** (for example *iPhone 15, iOS 18.2* or *Pixel 8, Android 15*), and real or emulator.
- **Build:** the git commit or PR, and whether it was a debug build.
- **Steps:** exactly what you did, starting from a fresh launch (and whether it was after *Play again*).
- **Expected and actual.**
- **A screenshot or screen recording.** Phone screen recording works well for drag and animation problems.
- **Logs** if it crashed or froze: Xcode's console, `adb logcat`, or the Web Inspector / chrome://inspect console.
- **Settings:** theme, sound, haptics.

## 9. Known gaps (so you don't report them)

- The icon and splash are placeholders.
- There are no automated UI tests; this guide is the UI test.
- Home, tutorial, levels and stats screens from the design are not built yet.
- The board is not announced by screen readers.
- iPad is not tuned: the layout is the phone layout, centred.
- The Android back button is not handled yet.
