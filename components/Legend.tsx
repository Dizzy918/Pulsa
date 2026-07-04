import { StyleSheet, Text, View } from "react-native";
import { colors } from "@/theme/colors";

const items = [
  { icon: "▲", label: "Alarm" },
  { icon: "◆", label: "Doorbell" },
  { icon: "♥", label: "Baby cry" },
  { icon: "✦", label: "Dog bark" },
  { icon: "◉", label: "Speech" },
  { icon: "♪", label: "Music" },
  { icon: "◈", label: "Loud noise" },
  { icon: "◦", label: "Quiet" },
];

export function Legend() {
  return (
    <View style={styles.grid}>
      {items.map((it) => (
        <View key={it.label} style={styles.chip}>
          <Text style={styles.icon}>{it.icon}</Text>
          <Text style={styles.label}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginTop: 24,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    width: "48%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  icon: { color: colors.marine, fontSize: 15 },
  label: {
    color: colors.inkMuted,
    fontSize: 10,
    letterSpacing: 1.6,
    textTransform: "uppercase",
  },
});
