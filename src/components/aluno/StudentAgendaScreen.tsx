import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, type RelativePathString } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeColors, useTheme } from "@/contexts/ThemeContext";
import { useStudentAgenda, getStudentAppointmentStatus } from "@/hooks/useStudentAgenda";
import { Agendamento } from "@/types/agenda";
import { diaDeDataHora, formatarDataExtensa, horaDeDataHora } from "@/utils/utils";

type Filter = "proximas" | "realizadas" | "canceladas";

function isPast(appointment: Agendamento) {
  return new Date(appointment.dataHora).getTime() < Date.now();
}

export default function StudentAgendaScreen({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const agendaStudentId = preview ? 999 : user?.id;
  const { appointments, loading, error, reload } = useStudentAgenda(agendaStudentId, preview);
  const [filter, setFilter] = useState<Filter>("proximas");

  const visibleAppointments = appointments
    .filter((appointment) => {
      const status = getStudentAppointmentStatus(appointment, user?.id);
      if (filter === "canceladas") return status.includes("CANCEL");
      if (filter === "realizadas") return isPast(appointment) && !status.includes("CANCEL");
      return !isPast(appointment) && !status.includes("CANCEL");
    })
    .sort((a, b) => a.dataHora.localeCompare(b.dataHora));

  const grouped = visibleAppointments.reduce<Record<string, Agendamento[]>>((accumulator, appointment) => {
    const date = diaDeDataHora(appointment.dataHora);
    (accumulator[date] ||= []).push(appointment);
    return accumulator;
  }, {});

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton} accessibilityLabel="Voltar">
          <Feather name="arrow-left" size={21} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Minha Agenda</Text>
        <View style={styles.headerSpacer} />
      </View>
      {preview ? <Text style={styles.previewLabel}>Modo visualização · dados de demonstração</Text> : null}
      <View style={styles.filters}>
        {([
          ["proximas", "Próximas"],
          ["realizadas", "Realizadas"],
          ["canceladas", "Canceladas"],
        ] as [Filter, string][]).map(([value, label]) => (
          <TouchableOpacity
            key={value}
            style={[styles.filter, filter === value && styles.filterActive]}
            onPress={() => setFilter(value)}
          >
            <Text style={[styles.filterText, filter === value && styles.filterTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={reload} tintColor={colors.primary} />}
      >
        {loading ? (
          <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>
        ) : error ? (
          <View style={styles.empty}>
            <Feather name="wifi-off" size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>{error}</Text>
            <TouchableOpacity style={styles.retry} onPress={reload}><Text style={styles.retryText}>Tentar novamente</Text></TouchableOpacity>
          </View>
        ) : Object.keys(grouped).length === 0 ? (
          <View style={styles.empty}>
            <Feather name="calendar" size={30} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nenhuma aula encontrada</Text>
            <Text style={styles.emptyText}>Suas aulas aparecerão aqui quando houver um agendamento.</Text>
          </View>
        ) : (
          Object.entries(grouped).map(([date, dayAppointments]) => (
            <View key={date}>
              <Text style={styles.dayTitle}>{formatarDataExtensa(date)}</Text>
              {dayAppointments.map((appointment) => {
                const status = getStudentAppointmentStatus(appointment, user?.id);
                const cancelled = status.includes("CANCEL");
                return (
                  <TouchableOpacity
                    key={appointment.id}
                    style={styles.card}
                    activeOpacity={0.78}
                    onPress={() => router.push({ pathname: (preview ? "/(secretary)/aluno-preview-detalhes/[id]" : "/(aluno)/agenda/detalhes/[id]") as RelativePathString, params: { id: String(appointment.id) } })}
                  >
                    <View style={styles.timeColumn}>
                      <Text style={styles.time}>{horaDeDataHora(appointment.dataHora)}</Text>
                      <View style={styles.timeline} />
                    </View>
                    <View style={styles.cardInfo}>
                      <View style={styles.cardTitleRow}>
                        <Text style={styles.className}>{appointment.especialidade || "Aula"}</Text>
                        <Text style={[styles.status, cancelled ? styles.cancelled : status.includes("PEND") ? styles.pending : styles.confirmed]}>
                          {cancelled ? "Cancelada" : status.includes("REAL") ? "Realizada" : status.includes("PEND") ? "Pendente" : "Confirmada"}
                        </Text>
                      </View>
                      <View style={styles.detailRow}><Feather name="user" size={14} color={colors.textSecondary} /><Text style={styles.detailText}>Professor: {appointment.professorNome || appointment.professor || "Não informado"}</Text></View>
                      <View style={styles.detailRow}><Feather name="map-pin" size={14} color={colors.textSecondary} /><Text style={styles.detailText}>Sala: {appointment.salaNome || appointment.sala || "Não informada"}</Text></View>
                      <Text style={styles.detailsLink}>Ver detalhes</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 16, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.topBarHeader },
  backButton: { width: 30, alignItems: "flex-start" },
  headerTitle: { color: "#fff", fontSize: 17, fontWeight: "800" },
  headerSpacer: { width: 30 },
  previewLabel: { paddingHorizontal: 16, paddingTop: 8, color: colors.primary, fontSize: 11, fontWeight: "700" },
  filters: { flexDirection: "row", gap: 10, paddingHorizontal: 16, paddingVertical: 15, backgroundColor: colors.background },
  filter: { paddingHorizontal: 17, paddingVertical: 10, borderRadius: 22, borderWidth: 1, borderColor: colors.borderSubtle, backgroundColor: colors.surfaceCard },
  filterActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { color: colors.textSecondary, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  content: { paddingHorizontal: 16, paddingBottom: 30, flexGrow: 1 },
  dayTitle: { color: colors.textSecondary, fontSize: 15, fontWeight: "800", marginTop: 4, marginBottom: 11 },
  card: { padding: 14, marginBottom: 13, flexDirection: "row", borderRadius: 17, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surfaceCard, shadowColor: "#000", shadowOpacity: isDark ? 0.18 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 },
  timeColumn: { width: 55, alignItems: "center" },
  time: { color: colors.primary, fontSize: 15, fontWeight: "800" },
  timeline: { width: 3, flex: 1, marginTop: 9, backgroundColor: colors.primaryLight, borderRadius: 2 },
  cardInfo: { flex: 1, paddingLeft: 9 },
  cardTitleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
  className: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "800" },
  status: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, fontSize: 11, fontWeight: "800" },
  confirmed: { color: isDark ? "#6ee7b7" : "#059669", backgroundColor: isDark ? "rgba(16,185,129,.2)" : "#dcfce7" },
  pending: { color: colors.primary, backgroundColor: colors.primaryLight },
  cancelled: { color: colors.textMuted, backgroundColor: colors.surfaceSubtle },
  detailRow: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
  detailText: { flex: 1, color: colors.textSecondary, fontSize: 13 },
  detailsLink: { color: colors.primary, fontSize: 14, fontWeight: "800", marginTop: 12 },
  center: { flex: 1, minHeight: 300, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, minHeight: 340, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 },
  emptyTitle: { color: colors.text, fontSize: 16, fontWeight: "800", textAlign: "center", marginTop: 12 },
  emptyText: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 7 },
  retry: { marginTop: 16, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 11, backgroundColor: colors.primary },
  retryText: { color: "#fff", fontWeight: "800" },
});
