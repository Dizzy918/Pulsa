import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { configureNotifications } from "@/lib/notifier";
import { colors } from "@/theme/colors";

export default function RootLayout() {
  useEffect(() => {
    configureNotifications().catch(() => {});
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.cream },
          animation: "fade",
        }}
      />
    </SafeAreaProvider>
  );
}
