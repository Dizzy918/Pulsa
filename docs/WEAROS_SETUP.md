# Tactiq for Wear OS — build & install

The watch app lives in [`android/wear/`](../android/wear) as a standard Android application module (`:wear`), built inside the same Gradle project as the phone app.

## What it does

- **Standalone mode** — tap *Start listening*: the watch mic + on-watch YAMNet (TFLite task-audio) classify sounds locally and vibrate with the per-category pattern. Runs as a microphone foreground service; the phone can stay at home.
- **Companion mode** — always on: detections classified on the phone arrive over the Wearable Data Layer (`/tactiq/detection`) and vibrate the watch.
- Sets `notificationBridgeMode: NO_BRIDGING`, so you don't get double alerts (watch app + mirrored phone notification).

## Requirements

- Android Studio (brings the Android SDK **and** a bundled JDK 17/21).
- ⚠️ **Do not build with JDK 25** — Gradle 8.10 fails with `Unsupported class file major version 69`. Point `JAVA_HOME` at Android Studio's JDK:

  ```bash
  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"
  ```

- `android/local.properties` with `sdk.dir=/Users/<you>/Library/Android/sdk` (Android Studio creates this on first open).

## Build

```bash
cd android
./gradlew :wear:assembleDebug
# → android/wear/build/outputs/apk/debug/wear-debug.apk
```

## Install on the watch (ADB over Wi-Fi)

1. On the watch: Settings → System → About → tap *Build number* 7× (developer mode), then Developer options → **ADB debugging** + **Debug over Wi-Fi**.
2. Watch shows an IP:port. Then:

   ```bash
   adb pair <ip>:<pair-port>      # Wear OS 4+: pairing code flow
   adb connect <ip>:5555
   adb -s <ip>:5555 install android/wear/build/outputs/apk/debug/wear-debug.apk
   ```

3. Open Tactiq on the watch, grant microphone + notifications.

## Data Layer pairing requirements

Phone app and watch app **must** have the same `applicationId` (`com.tactiq.app`) and the same signing key — both already configured (the wear module reuses `android/app/debug.keystore`). If you ever change the phone app's signing config, mirror it in `android/wear/build.gradle`.

## Play Store notes (later)

- Release builds need a real keystore (replace the debug signing config in `android/wear/build.gradle`).
- Wear OS apps are uploaded as a separate APK/AAB under the same package name with a `wear` form factor track.
