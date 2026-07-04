import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";
import type { Detection } from "@/lib/soundClassifier";

interface Props {
  detection: Detection | null;
  listening: boolean;
}

export function DetectionCard({ detection, listening }: Props) {
  const showing = detection && detection.category !== "silence";
  return (
    <View style={styles.card}>
      <Text style={styles.label}>Detected</Text>
      <View style={styles.row}>
        <Text style={styles.icon}>{detection?.icon ?? "◦"}</Text>
        <View style={styles.textCol}>
          <Text style={styles.title}>{detection?.label ?? "—"}</Text>
          <Text style={styles.meta}>
            {showing
              ? `${Math.round((detection?.confidence ?? 0) * 100)}% confidence · ${detection?.urgency}`
              : listening
                ? "Waiting for sound"
                : "Not active"}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  label: {
    color: colors.inkFaint,
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: "uppercase",
    marginBottom: 8,
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { color: colors.marine, fontSize: 28, lineHeight: 32 },
  textCol: { flex: 1 },
  title: { color: colors.ink, fontSize: 16, fontWeight: "500" },
  meta: { color: colors.inkMuted, fontSize: 11, marginTop: 2 },
});
