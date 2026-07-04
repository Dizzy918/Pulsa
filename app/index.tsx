import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  PermissionsAndroid,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";
import { colors } from "@/theme/colors";
import { activeEngine, startListening, stopListening } from "@/lib/audio";
import {
  forwardDetection,
  startBackgroundListening,
  stopBackgroundListening,
} from "@/lib/watchBridge";
import type { Detection } from "@/lib/soundClassifier";
import { Waveform } from "@/components/Waveform";
import { DetectionCard } from "@/components/DetectionCard";
import { WatchMirror } from "@/components/WatchMirror";
import { Legend } from "@/components/Legend";

type Status = "idle" | "requesting" | "listening" | "error";

const BAR_COUNT = 32;

export default function Home() {
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string | null>(null);
  const [detection, setDetection] = useState<Detection | null>(null);
  const [levels, setLevels] = useState<number[]>(() =>
    Array.from({ length: BAR_COUNT }, () => 0),
  );
  const [engine, setEngine] = useState<"ml" | "dsp">("dsp");
  const lastNotifiedCategory = useRef<string | null>(null);

  const start = async () => {
    setError(null);
    setStatus("requesting");
    try {
      if (Platform.OS === "android") {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: "Microphone access",
            message:
              "Pulsa listens to ambient sound so it can alert you on your wrist.",
            buttonPositive: "Allow",
            buttonNegative: "Deny",
          },
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          throw new Error("Microphone permission denied");
        }
      }
      await startListening(({ detection, levels }) => {
        setDetection(detection);
        setLevels(levels);
        if (
          detection.category !== "silence" &&
          detection.category !== lastNotifiedCategory.current
        ) {
          lastNotifiedCategory.current = detection.category;
          forwardDetection(detection).catch(() => {});
          // Clear after 4s so the same sound can alert again.
          setTimeout(() => {
            if (lastNotifiedCategory.current === detection.category) {
              lastNotifiedCategory.current = null;
            }
          }, 4000);
        }
      });
      setEngine(activeEngine());
      await startBackgroundListening();
      activateKeepAwakeAsync().catch(() => {});
      setStatus("listening");
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Microphone error";
      setError(msg);
      setStatus("error");
      Alert.alert("Cannot start listening", msg);
    }
  };

  const stop = async () => {
    await stopListening();
    await stopBackgroundListening();
    deactivateKeepAwake().catch(() => {});
    lastNotifiedCategory.current = null;
    setStatus("idle");
    setDetection(null);
    setLevels(Array.from({ length: BAR_COUNT }, () => 0));
  };

  useEffect(() => () => void stopListening(), []);

  const listening = status === "listening";

  return (
    <SafeAreaView style={styles.safe} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <View style={styles.brand}>
            <View style={styles.logo}>
              <View style={styles.logoRing}>
                <View style={styles.logoDot} />
              </View>
            </View>
            <View>
              <Text style={styles.brandName}>Pulsa</Text>
              <Text style={styles.brandTag}>Feel the world around you</Text>
            </View>
          </View>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: listening ? colors.ember : colors.border },
              ]}
            />
            <Text style={styles.statusText}>
              {status === "listening"
                ? `LIVE · ${engine === "ml" ? "ML" : "DSP"}`
                : status === "requesting"
                  ? "…"
                  : status === "error"
                    ? "BLOCKED"
                    : "STANDBY"}
            </Text>
          </View>
        </View>

        <Text style={styles.h1}>
          The sounds around you,{"\n"}
          <Text style={styles.h1Muted}>felt on your wrist.</Text>
        </Text>
        <Text style={styles.subtitle}>
          Pulsa listens through your phone or watch, identifies what&rsquo;s
          happening, and turns it into vibration on your wrist — so alarms,
          doorbells and voices never go unnoticed.
        </Text>

        <View style={styles.waveWrap}>
          <Waveform levels={levels} active={listening} />
        </View>

        <DetectionCard detection={detection} listening={listening} />

        <WatchMirror detection={detection} listening={listening} />

        <Pressable
          onPress={listening ? stop : start}
          disabled={status === "requesting"}
          style={({ pressed }) => [
            styles.cta,
            {
              backgroundColor: listening ? colors.ember : colors.marine,
              opacity: pressed || status === "requesting" ? 0.7 : 1,
            },
          ]}
        >
          {status === "requesting" ? (
            <ActivityIndicator color={colors.onMarine} />
          ) : (
            <Text style={styles.ctaText}>
              {listening ? "Stop listening" : "Start listening"}
            </Text>
          )}
        </Pressable>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Legend />

        <Text style={styles.footer}>
          On-device audio · Apple Watch &amp; Wear OS apps · other bands via
          notification mirroring
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.cream },
  scroll: { paddingHorizontal: 22, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 12,
    paddingBottom: 24,
  },
  brand: { flexDirection: "row", alignItems: "center", gap: 10 },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.marine,
    alignItems: "center",
    justifyContent: "center",
  },
  logoRing: {
    width: 21,
    height: 21,
    borderRadius: 10.5,
    backgroundColor: colors.sun,
    alignItems: "center",
    justifyContent: "center",
  },
  logoDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.ember,
  },
  brandName: { color: colors.ink, fontWeight: "600", fontSize: 15 },
  brandTag: {
    color: colors.inkMuted,
    fontSize: 9,
    letterSpacing: 1.4,
    textTransform: "uppercase",
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: {
    color: colors.inkMuted,
    fontSize: 10,
    letterSpacing: 2,
    textTransform: "uppercase",
  },

  h1: {
    color: colors.ink,
    fontSize: 28,
    lineHeight: 34,
    fontWeight: "600",
    letterSpacing: -0.5,
  },
  h1Muted: { color: colors.marine },
  subtitle: {
    color: colors.inkMuted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: 12,
    marginBottom: 28,
  },

  waveWrap: { marginBottom: 24 },

  cta: {
    marginTop: 24,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  ctaText: { fontSize: 15, fontWeight: "600", color: colors.onMarine },

  error: {
    marginTop: 12,
    color: colors.ember,
    fontSize: 12,
    textAlign: "center",
  },

  footer: {
    marginTop: 28,
    color: colors.inkFaint,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
    textAlign: "center",
  },
});
