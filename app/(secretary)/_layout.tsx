import { Redirect, Tabs } from "expo-router";

import { View, ActivityIndicator, Easing } from "react-native";

import { Feather } from "@expo/vector-icons";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

const hiddenTabOptions = {
  tabBarItemStyle: { display: "none" as const },
  tabBarButton: () => null,
};

// Fluxo de Secretaria/Administrador (tabs principais + telas internas ocultas).

export default function SecretaryLayout() {
  const { signed, user, loading } = useAuth();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const role = (user?.role || "").toUpperCase();

  if (!signed) return <Redirect href="/(public)/login" />;

  if (role === "PROFESSOR") return <Redirect href="/(teacher)/dashboard" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: "fade",
        transitionSpec: {
          animation: "timing",
          config: {
            duration: 200,
            easing: Easing.out(Easing.ease),
          },
        },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,
        tabBarStyle: {
          backgroundColor: colors.tabBg,
          borderTopWidth: 1,
          borderTopColor: colors.tabBorder,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Início",
          tabBarIcon: ({ color, size }) => (
            <Feather name="pie-chart" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="agenda"
        options={{
          title: "Agenda",
          tabBarIcon: ({ color, size }) => (
            <Feather name="calendar" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="alunos"
        options={{
          title: "Alunos",
          tabBarIcon: ({ color, size }) => (
            <Feather name="users" size={size} color={String(color)} />
          ),
        }}
      />

      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: ({ color, size }) => (
            <Feather name="menu" size={size} color={String(color)} />
          ),
        }}
      />

      {/* Telas internas fora da tab bar */}

      <Tabs.Screen name="perfil" options={hiddenTabOptions} />

      <Tabs.Screen name="colaboradores" options={hiddenTabOptions} />

      <Tabs.Screen name="professor" options={hiddenTabOptions} />

      <Tabs.Screen name="secretaria" options={hiddenTabOptions} />

      <Tabs.Screen name="studio" options={hiddenTabOptions} />

      <Tabs.Screen name="aluno/cadastrar" options={hiddenTabOptions} />

      <Tabs.Screen name="aluno/editar/[id]" options={hiddenTabOptions} />

      <Tabs.Screen
        name="colaborador/cadastrar/[role]"
        options={hiddenTabOptions}
      />

      <Tabs.Screen name="agendamento/index" options={hiddenTabOptions} />

      <Tabs.Screen name="agendamento/criar" options={hiddenTabOptions} />

      <Tabs.Screen name="perfilView/[tipo]/[id]" options={hiddenTabOptions} />
    </Tabs>
  );
}
