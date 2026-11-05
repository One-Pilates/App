import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "@/contexts/ThemeContext";

const notifications = [
  { title: "Lembrete de aula", text: "Você tem aula de Pilates amanhã às 09h00.", time: "há 2h", icon: "bell" as const, unread: true },
  { title: "Aula confirmada", text: "Sua aula de Pilates foi marcada para terça às 09h00.", time: "há 5h", icon: "check-circle" as const, unread: true },
  { title: "Alteração na agenda", text: "Uma atualização foi realizada na programação da sua aula.", time: "ontem", icon: "calendar" as const, unread: false },
  { title: "Cancelamento confirmado", text: "O cancelamento da sua aula foi registrado.", time: "2 dias", icon: "x-circle" as const, unread: false },
];

export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 12, backgroundColor: colors.topBarHeader }]}>
        <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar">
          <Feather name="arrow-left" size={21} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notificações</Text>
        <View style={{ width: 21 }} />
      </View>
      <ScrollView contentContainerStyle={styles.list} showsVerticalScrollIndicator={false}>
        {notifications.map((notification) => (
          <View key={notification.title} style={[styles.card, { backgroundColor: colors.surfaceCard, borderColor: colors.border }]}>
            <View style={[styles.icon, { backgroundColor: notification.unread ? colors.primaryLight : colors.surfaceSubtle }]}>
              <Feather name={notification.icon} size={17} color={notification.unread ? colors.primary : colors.textMuted} />
            </View>
            <View style={styles.textWrap}>
              <Text style={[styles.title, { color: colors.text }]}>{notification.title}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]}>{notification.text}</Text>
              <Text style={[styles.time, { color: colors.textMuted }]}>{notification.time}</Text>
            </View>
            {notification.unread ? <View style={[styles.dot, { backgroundColor: colors.primary }]} /> : null}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 13, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerTitle: { color: "#fff", fontSize: 15, fontWeight: "800" },
  list: { padding: 16 },
  card: { minHeight: 88, padding: 12, marginBottom: 10, flexDirection: "row", alignItems: "flex-start", borderRadius: 15, borderWidth: 1 },
  icon: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  textWrap: { flex: 1, marginLeft: 11, paddingRight: 8 },
  title: { fontSize: 13, fontWeight: "800" },
  message: { fontSize: 12, lineHeight: 16, marginTop: 4 },
  time: { fontSize: 11, marginTop: 3 },
  dot: { width: 7, height: 7, borderRadius: 4, marginTop: 5 },
});
