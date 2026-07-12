import * as Notifications from "expo-notifications";
import { Platform, Vibration } from "react-native";
import type { Detection } from "./soundClassifier";

let configured = false;

// Notifications must show even in the foreground — that's what mirroring bands
// (Huawei Band 7 etc.) forward to the wrist.
export async function configureNotifications() {
  if (configured) return;
  configured = true;

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      // shouldShowAlert is legacy; newer expo-notifications splits it into banner + list.
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  try {
    const perm = await Notifications.getPermissionsAsync();
    if (perm.status !== "granted") {
      await Notifications.requestPermissionsAsync();
    }
  } catch {
    // Permission APIs can reject on some OS versions; keep going so the
    // Android channel below is still created.
  }

  if (Platform.OS === "android") {
    // A distinct channel so users can filter Pulsa alerts and so the Band 7
    // mirrors them with its default alert style. Channel ID stays "tactiq-alerts"
    // so existing installs keep their channel settings.
    await Notifications.setNotificationChannelAsync("tactiq-alerts", {
      name: "Pulsa alerts",
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 100, 250],
      lightColor: "#FFFFFF",
      showBadge: false,
      enableVibrate: true,
    });
  }
}

const MIN_INTERVAL_MS: Record<string, number> = {
  alarm: 4000,
  doorbell: 3000,
  baby_cry: 5000,
  dog_bark: 3000,
  speech: 8000,
  music: 15000,
  loud_noise: 4000,
  silence: Infinity,
};

const lastFiredAt: Record<string, number> = {};

// Fires a per-sound phone haptic and a notification (the latter is what
// mirroring bands forward). Rate-limited per category.
export async function notifyDetection(d: Detection) {
  if (d.category === "silence") return;

  const now = Date.now();
  const interval = MIN_INTERVAL_MS[d.category] ?? 3000;
  if (now - (lastFiredAt[d.category] ?? 0) < interval) return;
  lastFiredAt[d.category] = now;

  // Patterns are [vibrate, gap, …]; RN's Android Vibration expects a leading
  // wait, so prepend 0 to get the intended waveform.
  if (d.vibrationPattern.length > 0) {
    Vibration.vibrate([0, ...d.vibrationPattern]);
  }

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: `${d.icon}  ${d.label}`,
        body: `Detected · ${Math.round(d.confidence * 100)}% · ${d.urgency}`,
        priority:
          d.urgency === "high"
            ? Notifications.AndroidNotificationPriority.MAX
            : Notifications.AndroidNotificationPriority.HIGH,
        ...(Platform.OS === "android" ? { channelId: "tactiq-alerts" } : {}),
        vibrate: d.vibrationPattern.length ? [0, ...d.vibrationPattern] : undefined,
      },
      trigger: null,
    });
  } catch {
    // Notifications disabled or channel missing — the phone haptic above still
    // fired, so on-device alerting keeps working.
  }
}
