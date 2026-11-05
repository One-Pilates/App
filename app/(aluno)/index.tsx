import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";

export default function StudentHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors } = useTheme();
  const initial = (user?.nome || "A").charAt(0).toUpperCase();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 18, backgroundColor: colors.topBarHeader }]}>
        <Text style={styles.brand}>onepilates</Text>
        <TouchableOpacity onPress={() => router.push("/(aluno)/notificacoes")} accessibilityLabel="Abrir notificações">
          <Feather name="bell" size={21} color="#fff" />
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <Text style={[styles.greeting, { color: colors.text }]}>Olá, {user?.nome?.split(" ")[0] || "aluno"}!</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Acompanhe seus dados e sua rotina no studio.</Text>
        <TouchableOpacity style={[styles.profileCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]} onPress={() => router.push("/(aluno)/perfil")}>
          <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}><Text style={[styles.avatarText, { color: colors.primary }]}>{initial}</Text></View>
          <View style={styles.profileText}><Text style={[styles.profileName, { color: colors.text }]}>{user?.nome || "Meu perfil"}</Text><Text style={[styles.profileMeta, { color: colors.textSecondary }]}>Visualizar meus dados</Text></View>
          <Feather name="chevron-right" size={19} color={colors.textMuted} />
        </TouchableOpacity>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Acesso rápido</Text>
        <TouchableOpacity style={[styles.actionCard, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]} onPress={() => router.push("/(aluno)/mais-alunos")}>
          <View style={[styles.icon, { backgroundColor: colors.primaryLight }]}><Feather name="users" size={20} color={colors.primary} /></View>
          <View style={styles.profileText}><Text style={[styles.profileName, { color: colors.text }]}>Mais alunos</Text><Text style={[styles.profileMeta, { color: colors.textSecondary }]}>Consulte os demais cadastros</Text></View>
          <Feather name="chevron-right" size={19} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 18, paddingBottom: 17, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { color: "#fff", fontSize: 16, fontWeight: "500" },
  content: { padding: 18 },
  greeting: { fontSize: 25, fontWeight: "800", marginTop: 8 },
  subtitle: { fontSize: 13, marginTop: 5, lineHeight: 18 },
  profileCard: { marginTop: 24, padding: 16, flexDirection: "row", alignItems: "center", borderRadius: 17, borderWidth: 1 },
  avatar: { width: 50, height: 50, borderRadius: 25, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 21, fontWeight: "800" },
  profileText: { flex: 1, marginHorizontal: 12 },
  profileName: { fontSize: 15, fontWeight: "700" },
  profileMeta: { fontSize: 12, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: "800", marginTop: 28, marginBottom: 11 },
  actionCard: { padding: 16, flexDirection: "row", alignItems: "center", borderRadius: 17, borderWidth: 1 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
});
