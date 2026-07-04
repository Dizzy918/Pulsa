import { StyleSheet, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { colors } from "@/theme/colors";

interface Props {
  levels: number[];
  active: boolean;
}

export function Waveform({ levels, active }: Props) {
  return (
    <View style={styles.row}>
      {levels.map((v, i) => {
        const h = Math.max(4, Math.round(v * 120));
        return (
          <View key={i} style={[styles.slot, { opacity: active ? 1 : 0.25 }]}>
            <LinearGradient
              colors={[colors.marineLight, colors.marine]}
              start={{ x: 0, y: 1 }}
              end={{ x: 0, y: 0 }}
              style={[styles.bar, { height: h }]}
            />
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    height: 128,
  },
  slot: { flex: 1, marginHorizontal: 1.5, alignItems: "stretch" },
  bar: { flex: 1, borderRadius: 999 },
});
