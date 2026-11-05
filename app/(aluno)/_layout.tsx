import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, Easing, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const hiddenTabOptions = {
  tabBarItemStyle: { display: "none" as const },
  tabBarButton: () => null,
};

export default function StudentLayout() {
  const { signed, user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }
  if (!signed) return <Redirect href="/(public)/login" />;
  if ((user?.role || "").toUpperCase() !== "ALUNO") {
    return <Redirect href="/(secretary)/dashboard" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        transitionSpec: { animation: "timing", config: { duration: 200, easing: Easing.out(Easing.ease) } },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopColor: colors.tabBorder,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Início", tabBarIcon: ({ color, size }) => <Feather name="pie-chart" size={size} color={String(color)} /> }} />
      <Tabs.Screen name="agenda" options={{ title: "Agenda", tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={String(color)} /> }} />
      <Tabs.Screen name="alunos" options={{ title: "Alunos", tabBarIcon: ({ color, size }) => <Feather name="users" size={size} color={String(color)} /> }} />
      <Tabs.Screen name="mais" options={{ title: "Mais", tabBarIcon: ({ color, size }) => <Feather name="menu" size={size} color={String(color)} /> }} />
      <Tabs.Screen name="perfil" options={hiddenTabOptions} />
      <Tabs.Screen name="perfil/[id]" options={hiddenTabOptions} />
      <Tabs.Screen name="mais-alunos" options={hiddenTabOptions} />
      <Tabs.Screen name="notificacoes" options={hiddenTabOptions} />
      <Tabs.Screen name="agenda/detalhes/[id]" options={hiddenTabOptions} />
      <Tabs.Screen name="agenda/confirmar/[id]" options={hiddenTabOptions} />
      <Tabs.Screen name="agenda/cancelar/[id]" options={hiddenTabOptions} />
    </Tabs>
  );
}
