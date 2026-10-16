import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { AuthProvider } from "@/contexts/AuthContext";
import GlobalAlertModal from "@/components/GlobalAlertModal";
import { setupGlobalAlertInterceptor } from "@/utils/alertManager";

// Ativa a interceptação de alertas nativos globalmente para o padrão OnePilates (branco e laranja)
setupGlobalAlertInterceptor();

export default function RootLayout() {
  useEffect(() => {
    setupGlobalAlertInterceptor();
  }, []);

  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "fade",
          animationDuration: 240,
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(public)" />
        <Stack.Screen name="(secretary)" />
        <Stack.Screen name="(teacher)" />
      </Stack>
      <GlobalAlertModal />
    </AuthProvider>
  );
}
