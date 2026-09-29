import { Redirect } from "expo-router";

import { View, ActivityIndicator } from "react-native";

import { useAuth } from "@/contexts/AuthContext";

// Redireciona a rota inicial de acordo com autenticação e papel do usuário.

export default function Index() {
  const { signed, user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f0f4ff",
        }}
      >
        <ActivityIndicator size="large" color="#f77433" />
      </View>
    );
  }

  if (!signed) {
    return <Redirect href="/(public)/login" />;
  }

  // Primeiro acesso: obriga a definir a senha antes de usar o app.

  if (user?.primeiroAcesso) {
    return (
      <Redirect
        href={{
          pathname: "/(public)/nova-senha",
          params: { primeiroAcesso: "1" },
        }}
      />
    );
  }

  const role = (user?.role || "").toUpperCase();

  if (role === "PROFESSOR") {
    return <Redirect href="/(teacher)/dashboard" />;
  }

  // SECRETARIA e ADMINISTRADOR usam o mesmo fluxo (secretary)

  return <Redirect href="/(secretary)/dashboard" />;
}
