# Tactiq for Apple Watch — Xcode target setup

The watch app's complete Swift sources live in [`watchos/TactiqWatch/`](../watchos/TactiqWatch). Adding a watchOS target to an Xcode project can't be scripted reliably, so it's a one-time manual step (~5 minutes).

## What it does

- **Standalone mode** — the watch mic + Apple's built-in SoundAnalysis classifier (`SNClassifySoundRequest`, ~300 classes, watchOS 8+, fully on-device, no bundled model) detect sounds and play per-category haptic sequences.
- **Companion mode** — detections classified on the iPhone arrive via WatchConnectivity (`react-native-watch-connectivity` on the RN side) and play the same haptics.
- Without the watch app, the Apple Watch still vibrates via standard iPhone notification mirroring — the app upgrades the experience, it isn't required.

## One-time setup

1. Install pods for the new native modules first:

   ```bash
   npx pod-install
   ```

2. Open `ios/Tactiq.xcworkspace` in Xcode.
3. **File → New → Target… → watchOS → App**. Configure:
   - Product Name: `TactiqWatch`
   - Check **"Watch App for Existing iOS App"** and select the `Tactiq` app
   - Interface: SwiftUI · Language: Swift
   - Bundle id must end up as `com.tactiq.app.watchkitapp` (Xcode derives it)
4. Delete the generated `ContentView.swift` / `TactiqWatchApp.swift` in the new target, then drag all files from `watchos/TactiqWatch/` into the watch target's group (check *Copy items if needed* → **off**, add to the **TactiqWatch** target only).
5. In the watch target's **Info** tab add:
   - `NSMicrophoneUsageDescription` = "Tactiq listens to ambient sound to alert you to alarms, doorbells and voices."
6. Watch target → Signing & Capabilities: same team as the iOS app.
7. Select the `TactiqWatch` scheme → run on a paired Apple Watch (or watch simulator).

## Verifying the two modes

- **Companion**: run the phone app, start listening, play a siren video — the watch should tap the alarm pattern (3 strong taps) while the phone shows the detection. Requires the watch app to be reachable (foreground / recently active); otherwise the mirrored notification covers it.
- **Standalone**: leave the phone, open Tactiq on the watch, *Start listening* — detections show "WATCH MIC".

## Platform limitations (honest notes)

- watchOS suspends third-party apps that leave the foreground; continuous all-day listening like Apple's own Noise app is not available to third parties. Standalone mode is for sessions where the app stays frontmost (set *Settings → General → Return to App* and wake duration to maximize this). For all-day monitoring, use the phone as the microphone.
- watchOS has no custom vibration waveforms — patterns are sequences of fixed `WKHapticType`s (see `Haptics.swift`).
- The `watchos/TactiqWatch/*.swift` files show SourceKit errors when viewed outside Xcode (no target membership, macOS platform assumed). They compile cleanly inside the watchOS target.
