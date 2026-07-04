# Connecting Tactiq to your watch or band

Tactiq delivers every detection through **three parallel transports**. Whichever ones apply to your hardware just work; the others silently no-op.

| Transport | Hardware | Vibration quality |
|---|---|---|
| Native watch app | Apple Watch, Wear OS watches | Per-sound patterns + on-watch mic (standalone mode) |
| Notification mirroring | **Any** band/watch with a phone companion app | Stock vibration, icon + label on screen |
| Phone haptics | The phone itself | Per-sound patterns |

## Tier 1 — Native watch apps

- **Apple Watch (watchOS 8+)** → [APPLE_WATCH_SETUP.md](APPLE_WATCH_SETUP.md)
- **Wear OS 3+ (Galaxy Watch4+, Pixel Watch, TicWatch…)** → [WEAROS_SETUP.md](WEAROS_SETUP.md)

With the watch app installed you get: distinguishable vibration per category (alarm ≠ doorbell ≠ baby cry by feel alone), and **standalone mode** — the watch listens with its own microphone when the phone isn't with you.

## Tier 2 — Notification mirroring (everything else)

The phone does the listening; each detection fires a high-priority notification which the vendor's companion app forwards to the wrist. Enable per-app notification forwarding for **Tactiq** in the companion app:

| Band / watch | Companion app | Where to enable |
|---|---|---|
| Huawei Band / Watch (incl. Band 7) | Huawei Health | Devices → your band → Notifications → enable Tactiq |
| Xiaomi Smart Band / Watch | Mi Fitness (or Zepp Life) | Device → Notifications → App alerts → Tactiq |
| Amazfit | Zepp | Profile → your device → Notifications & reminders → App alerts |
| Garmin | Garmin Connect | Device → Sounds & Alerts → Smart Notifications |
| Fitbit | Fitbit app | Device → Notifications → App notifications |
| Samsung (non-Wear OS legacy) | Galaxy Wearable | Watch settings → Notifications → Tactiq |
| Apple Watch (without the watch app) | — | Mirrors iPhone notifications by default |

Also check on the phone:
- Tactiq's notification permission is granted, channel **"Tactiq alerts"** not muted.
- Battery optimization for Tactiq set to **Unrestricted** (critical on Huawei/Xiaomi — EMUI/MIUI otherwise kill background mic capture).

### Why no native app for Huawei/Xiaomi bands?

Huawei bands (LiteOS) and Xiaomi bands have **no public third-party app SDK** — nothing can be installed on them. Notification mirroring is the only integration path, which is exactly what Tactiq uses. Huawei *watches* run HarmonyOS and do have an SDK (ArkTS), but that's a separate codebase — out of scope for now.

## Known limitations

- Mirrored notifications use the band's **stock vibration** — every category feels the same on the wrist; the icon + label on the band's screen tells you which sound it was. The phone in your pocket still plays the distinguishing pattern.
- On phones without Google Play services (Huawei), the Wear OS transport resolves to "no watch" gracefully — mirroring still works.
