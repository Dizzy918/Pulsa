// Wrist-delivery layer. Each detection fans out over failure-tolerant
// transports: a mirrored notification (every band) and WatchConnectivity
// (iOS → watchOS app). The Android WearBridge native module was removed with
// the Wear OS app (commit fd4861a); its guarded calls below are no-ops until
// the module is restored.
import { NativeModules, Platform } from "react-native";
import type { Detection } from "./soundClassifier";
import { notifyDetection } from "./notifier";

interface WearBridgeModule {
  sendDetection(json: string): Promise<boolean>;
  startListeningService(): Promise<boolean>;
  stopListeningService(): Promise<boolean>;
}

const WearBridge: WearBridgeModule | undefined = NativeModules.WearBridge;

// react-native-watch-connectivity throws on import when its native module is
// absent (Android, or iOS before pod install), so load it lazily and best-effort.
type WatchLib = {
  sendMessage(msg: Record<string, unknown>, ok?: (r: unknown) => void, err?: (e: unknown) => void): void;
};
let watchLib: WatchLib | null = null;
if (Platform.OS === "ios") {
  try {
    watchLib = require("react-native-watch-connectivity");
  } catch {
    watchLib = null;
  }
}

export function serializeDetection(d: Detection) {
  return {
    category: d.category,
    label: d.label,
    icon: d.icon,
    urgency: d.urgency,
    confidence: d.confidence,
    timestamp: d.timestamp,
  };
}

/** Fan a committed detection out to the phone (haptics + notification) and every reachable watch. */
export async function forwardDetection(d: Detection): Promise<void> {
  // Notification first — it doubles as the universal wearable transport.
  await notifyDetection(d);

  const payload = serializeDetection(d);

  if (Platform.OS === "android" && WearBridge) {
    WearBridge.sendDetection(JSON.stringify(payload)).catch(() => {});
  }

  if (Platform.OS === "ios" && watchLib) {
    // No paired watch → mirroring already covers it, so ignore failures.
    try {
      watchLib.sendMessage(payload, undefined, () => {});
    } catch {}
  }
}

/**
 * Android: hold a microphone foreground service while listening so detection
 * keeps running with the screen off. No-op elsewhere (iOS uses the `audio`
 * background mode declared in Info.plist).
 */
export async function startBackgroundListening(): Promise<void> {
  if (Platform.OS === "android" && WearBridge) {
    await WearBridge.startListeningService().catch(() => {});
  }
}

export async function stopBackgroundListening(): Promise<void> {
  if (Platform.OS === "android" && WearBridge) {
    await WearBridge.stopListeningService().catch(() => {});
  }
}
