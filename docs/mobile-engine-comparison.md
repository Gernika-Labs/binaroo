# Godot vs Capacitor for the Byte Blast mobile app

Written 2026-10-18. Facts marked **(verified)** were checked against the official page on that date. Everything marked **(judgment)** is my assessment and has not been tested. Re-check prices and plugins before committing.

## Is each one free?

| | Godot | Capacitor |
|---|---|---|
| License | **MIT (verified).** The Godot license page says "free and open source software released under the permissive MIT license" and "You are free to use Godot Engine, for any purpose." | **MIT (verified).** GitHub shows "MIT license" for `ionic-team/capacitor`. |
| Royalties / fees to the tool | None mentioned on the license page. Your game is yours; you only need to include Godot's copyright and license notice when you distribute the engine. | None. MIT. |
| Costs that apply **either way** | Apple Developer Program: **US$99 per year (verified)**. Google Play Console: **US$25, one-time (verified)**. | Same. |

Both are free. The only unavoidable costs are the store fees, which are the same for any engine.

## Ads and in-app purchases

| | Godot | Capacitor |
|---|---|---|
| Ads (AdMob) | Community plugin on the Godot Asset Library, MIT, versions 5.x and 6.0 targeting Godot 4.4. **Android only** in what I found, so iOS would need another plugin. Not confirmed for Godot 4.5+. | Not checked. An AdMob plugin is likely available but I have not verified one. |
| Purchases | The plugin I found is a **paid** itch.io plugin (Thunder Plugins) with Google Play Billing v7 support. Buyers on the product page report no written documentation and a zip missing a component shown in the video. Treat those as user reports. | Several MIT plugins: Capgo `capacitor-native-purchases` (StoreKit 2 and Google Play Billing), `capacitor-billing`, Capawesome Purchases. Qonversion and Adapty also exist but depend on a hosted service. `@capgo/capacitor-purchases` is marked deprecated. |

(judgment) Ads and purchases are easier and better supported on Capacitor than on Godot today, but both are still plugin-dependent.

## Fit for Byte Blast

| | Godot | Capacitor |
|---|---|---|
| Reuse of the current prototype | (judgment) Close to none. The game would be rewritten in GDScript or C#, with the UI rebuilt in Godot's UI nodes. | (judgment) Nearly all of `index.html` carries over. Wrap it, then restyle to the 1A design. |
| What the game is | A UI-heavy puzzle: 8×8 grid, numbers, timers, CSS animations. | Same, and the web is a natural fit for that. |
| Audio timing | (judgment) Better for rhythm games like Bit Beats. | (judgment) Web audio on phones can have noticeable latency. Fine for the current tone effects, risky for Bit Beats. |
| Light and dark theme | Build it in the theme system. | CSS variables. Easy. |
| Time to a build on real phones | (judgment) Weeks, because of the rewrite. | (judgment) Days. |
| App size, performance | (judgment) Larger engine runtime than a webview wrapper, but good performance. Check actual export sizes. | (judgment) Small app, runs in the phone's webview. Fine for this game. |

## Recommendation

1. **Use Capacitor now.** Wrap the existing game, restyle it to design 1A, and get it onto real phones through TestFlight and Play internal testing. This tests touch, performance and the rules with real people for the cost of the store fees.
2. **Keep Godot as the option for later.** Move to it only if (a) playtesting shows the webview feels bad, or (b) Bit Beats goes ahead and audio timing matters.
3. **Don't choose a monetization stack yet.** Playtest first.
