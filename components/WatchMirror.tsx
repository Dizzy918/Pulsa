import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import type { Detection } from "@/lib/soundClassifier";

interface Props {
  detection: Detection | null;
  listening: boolean;
}

// On-screen preview of the notification a mirroring band (e.g. Huawei Band 7)
// receives — used to sanity-check the alert copy without a paired device.
export function WatchMirror({ detection, listening }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;
  const showing = detection && detection.category !== "silence";

  useEffect(() => {
    if (!showing) return;
    Animated.sequence([
      Animated.parallel([
        Animated.timing(scale, {
          toValue: 1.02,
          duration: 120,
          useNativeDriver: true,
          easing: Easing.out(Easing.quad),
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 120,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(scale, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.out(Easing.quad),
      }),
    ]).start();
  }, [detection?.timestamp, showing, scale, opacity]);

  return (
    <View style={styles.wrap}>
      <View style={styles.headerRow}>
        <Text style={styles.headerLabel}>Watch mirror</Text>
        <View style={styles.dotRow}>
          <View
            style={[
              styles.dot,
              {
                backgroundColor: listening ? colors.ember : colors.border,
              },
            ]}
          />
          <Text style={styles.dotText}>
            {listening ? "PAIRED" : "STANDBY"}
          </Text>
        </View>
      </View>

      <Animated.View
        style={[
          styles.band,
          {
            transform: [{ scale }],
            borderColor: showing
              ? detection?.urgency === "high"
                ? colors.ember
                : detection?.urgency === "medium"
                  ? colors.sun
                  : colors.marineLight
              : colors.border,
          },
        ]}
      >
        <View style={styles.bandRow}>
          <View style={styles.bandIconWrap}>
            <Text style={styles.bandIcon}>{detection?.icon ?? "◦"}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bandTitle}>
              Pulsa{showing ? ` · ${detection?.label}` : ""}
            </Text>
            <Text style={styles.bandBody}>
              {showing
                ? `${Math.round((detection?.confidence ?? 0) * 100)}% · ${detection?.urgency}`
                : listening
                  ? "Listening for sounds…"
                  : "Standing by"}
            </Text>
          </View>
        </View>
        <Text style={styles.bandTime}>now</Text>
      </Animated.View>

      <Text style={styles.hint}>
        Apple Watch &amp; Wear OS play a per-sound vibration pattern. Other
        bands (Huawei, Xiaomi, Garmin…) show this alert with their built-in
        vibration via notification mirroring.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLabel: {
    color: colors.inkFaint,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
  },
  dotRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotText: {
    color: colors.inkMuted,
    fontSize: 9,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },

  band: {
    borderRadius: 14,
    borderWidth: 1,
    backgroundColor: colors.card,
    padding: 12,
  },
  bandRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bandIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: colors.muted,
    alignItems: "center",
    justifyContent: "center",
  },
  bandIcon: { color: colors.marine, fontSize: 18 },
  bandTitle: { color: colors.ink, fontSize: 13, fontWeight: "600" },
  bandBody: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
  bandTime: {
    color: colors.inkFaint,
    fontSize: 10,
    marginTop: 8,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },

  hint: {
    color: colors.inkFaint,
    fontSize: 10,
    lineHeight: 15,
    marginTop: 10,
  },
});
