# Using Pulsa — no paid developer account needed

This guide gets **Pulsa** onto your iPhone and your watch/band using only a **free Apple ID**. You do **not** need the $99/year Apple Developer Program, and you don't need to publish to any app store.

The only limitation of the free route: an app you install this way **stops opening after 7 days**. Reinstalling it (one command) resets the clock. Everything else works exactly like a normal app.

**What you need**
- A Mac with **Xcode** installed (free from the Mac App Store).
- Your **iPhone** and a **USB cable** (Lightning or USB‑C, whatever your iPhone uses).
- Any **Apple ID** (the one you already use for the App Store is fine).

---

## Part 1 — Put Pulsa on your iPhone

### One-time setup (first time only)

```bash
# from the project folder
npm install
npm run fetch:model     # downloads the sound-recognition model (optional; app still works without it)
npx pod-install         # prepares the iOS native code
```

### Sign the app with your free Apple ID

1. Open the project in Xcode:
   ```bash
   open ios/Tactiq.xcworkspace
   ```
   *(The Xcode project is still named "Tactiq" internally — that's fine, the app shows as **Pulsa** on your phone.)*
2. In the left sidebar click the blue **Tactiq** project → select the **Tactiq** target → open the **Signing & Capabilities** tab.
3. Tick **Automatically manage signing**.
4. Next to **Team**, click **Add an Account…**, sign in with your Apple ID, then choose your **"(Your Name) — Personal Team"** from the Team dropdown.
5. If Xcode complains the bundle identifier is taken, change it to something unique, e.g. `com.yourname.pulsa`, and it will re-sign automatically.

### Install it on the iPhone

1. Plug the iPhone into the Mac with the cable. Unlock the phone and tap **Trust** if asked.
2. Back in the terminal:
   ```bash
   npx expo run:ios --device --configuration Release
   ```
   Pick your iPhone from the list. **Release** means the app runs on its own afterwards — no Mac or cable needed once it's installed.
3. First launch will be blocked by iOS. On the **iPhone**:
   - **Settings → General → VPN & Device Management** → tap your Apple ID → **Trust**.
   - If iOS mentions **Developer Mode**: **Settings → Privacy & Security → Developer Mode → On**, then restart the phone.
4. Open **Pulsa** and allow **Microphone** and **Notifications** when asked.

> **After 7 days** the app will refuse to open ("Untrusted Developer" / just bounces). That's the free-account limit, not a bug. Plug the phone back in and re-run the `npx expo run:ios --device --configuration Release` command to refresh it for another 7 days.

> **Wireless after the first time:** once you've installed over the cable once, in Xcode go to **Window → Devices and Simulators**, select your iPhone, and tick **Connect via network**. After that you can reinstall over Wi‑Fi without the cable.

---

## Part 2 — Get alerts on your watch or band

Pulsa reaches the wrist in one of two ways depending on your device. **Neither needs a paid account.**

### Any band or watch with a companion app — Huawei Band 7, Xiaomi/Amazfit, Garmin, Fitbit, Galaxy… (works immediately, over Bluetooth)

These don't need an app installed on them at all. Pulsa fires a normal phone notification, and your band's companion app forwards it to your wrist over Bluetooth — the band buzzes with its built-in vibration and shows the sound (e.g. "▲ Alarm / Siren").

**Huawei Band 7 (via Huawei Health):**
1. Make sure the Band 7 is paired in **Huawei Health** and buzzes for other notifications (e.g. a text).
2. In **Huawei Health**: **Devices → your band → Notifications** → turn **Notifications** on → find **Pulsa** in the app list and enable it.
3. On the iPhone, confirm **Settings → Notifications → Pulsa → Allow Notifications** is on.

Other bands are the same idea — enable notification access for **Pulsa** inside that band's app (Mi Fitness / Zepp, Garmin Connect, Fitbit, Samsung Wearable, etc.).

> Tip: notification mirroring only fires when the phone actually posts the notification. Keep Pulsa's listening running (tap **Start listening**); it holds a background audio session so detection continues with the screen off.

### Apple Watch (richer, per-sound vibration patterns)

- **Today, with zero setup:** your Apple Watch already buzzes for Pulsa via normal iPhone notification mirroring — same as any band above.
- **For the upgraded experience** — distinct vibration patterns per sound (alarm feels different from a doorbell) and **standalone mode** (the watch listens with its own mic when your phone isn't nearby) — there's a dedicated Apple Watch app in this project. Adding it is a one-time ~5‑minute step in Xcode (still free, still no paid account). Follow **[docs/APPLE_WATCH_SETUP.md](docs/APPLE_WATCH_SETUP.md)**.

### Wear OS watch (Galaxy Watch4+, Pixel Watch…)

There's a full standalone Wear OS app in this project. It installs over USB or Wi‑Fi with `adb` (Android's sideload tool) — no paid account, no Play Store. Steps: **[docs/WEAROS_SETUP.md](docs/WEAROS_SETUP.md)**.

---

## Part 3 — Using Pulsa day to day

1. Open Pulsa and tap **Start listening**. The status reads **LIVE**.
2. The waveform reacts to sound around you. When Pulsa recognises something, the **Detected** card names it and your phone + wrist buzz with a pattern chosen for that sound:

   | Feel / icon | Sound | Urgency |
   |---|---|---|
   | ▲ | Alarm, siren, smoke detector, car horn | High |
   | ◆ | Doorbell, knock, phone ringing | Medium |
   | ♥ | Baby crying | High |
   | ✦ | Dog barking | Medium |
   | ◉ | Someone speaking | Low |
   | ♪ | Music | Low |
   | ◈ | Loud noise, glass, thunder | Medium |

3. The **Watch mirror** panel shows a live preview of exactly the alert your band receives.
4. Leave it running in the background — it keeps listening with the screen off. Tap **Stop listening** to end.

---

## Troubleshooting

- **"Untrusted Developer" or the app won't open** → Settings → General → VPN & Device Management → trust your Apple ID. On iOS 16+, also enable Developer Mode (Part 1, step 3).
- **App bounces / disappeared after about a week** → the free 7‑day signing expired. Re-run `npx expo run:ios --device --configuration Release` to reinstall.
- **Only 3 sideloaded apps allowed** → a free Apple ID can hold up to three self-signed apps at once; delete an old one if Xcode refuses to install.
- **Band doesn't buzz** → confirm it vibrates for a normal text first, then check notification forwarding for **Pulsa** is enabled in its companion app, and that Pulsa is actively listening on the phone.
- **No sound detected** → make sure you granted Microphone permission (Settings → Pulsa → Microphone).

---

## Optional: what a paid account would add

You don't need it, but if you ever join the Apple Developer Program ($99/yr) you'd get **TestFlight** (install wirelessly, lasts 90 days instead of 7, share with others by email) and no reinstall chore. For personal day-to-day use on your own devices, the free route in this guide is enough.
