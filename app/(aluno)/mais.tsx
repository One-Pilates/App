import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, type RelativePathString } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function MoreScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { logout } = useAuth();
  const { colors } = useTheme();
  const items = [
    { label: "Editar Perfil", description: "Seus dados e informações pessoais", icon: "user" as const, onPress: () => router.push("/(aluno)/perfil" as RelativePathString) },
    { label: "Notificações", description: "Lembretes e atualizações das aulas", icon: "bell" as const, onPress: () => router.push("/(aluno)/notificacoes" as RelativePathString) },
  ];
  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]} contentContainerStyle={{ paddingTop: insets.top + 18, paddingBottom: 28 }}>
      <Text style={[styles.title, { color: colors.text }]}>Mais</Text>
      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Gestão e configurações</Text>
      <View style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
        {items.map((item, index) => (
          <TouchableOpacity key={item.label} style={[styles.row, index < items.length - 1 && { borderBottomColor: colors.borderSubtle, borderBottomWidth: 1 }]} onPress={item.onPress} activeOpacity={0.75}>
            <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}><Feather name={item.icon} size={20} color={colors.primary} /></View>
            <View style={styles.rowText}><Text style={[styles.label, { color: colors.text }]}>{item.label}</Text><Text style={[styles.description, { color: colors.textSecondary }]}>{item.description}</Text></View>
            <Feather name="chevron-right" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity style={[styles.logout, { backgroundColor: colors.dangerBg, borderColor: colors.dangerBorder }]} onPress={logout}>
        <Feather name="log-out" size={18} color={colors.danger} />
        <Text style={[styles.logoutText, { color: colors.danger }]}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 18 },
  title: { fontSize: 27, fontWeight: "800" },
  subtitle: { fontSize: 13, marginTop: 4 },
  card: { marginTop: 24, borderRadius: 17, borderWidth: 1, overflow: "hidden" },
  row: { minHeight: 76, padding: 15, flexDirection: "row", alignItems: "center" },
  icon: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1, marginHorizontal: 13 },
  label: { fontSize: 15, fontWeight: "700" },
  description: { fontSize: 12, marginTop: 4 },
  logout: { marginTop: 28, paddingVertical: 14, borderRadius: 13, borderWidth: 1, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8 },
  logoutText: { fontSize: 15, fontWeight: "700" },
});
