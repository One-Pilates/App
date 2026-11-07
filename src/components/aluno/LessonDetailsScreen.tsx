import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type RelativePathString } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeColors, useTheme } from "@/contexts/ThemeContext";
import { useStudentAgenda, getStudentAppointmentStatus } from "@/hooks/useStudentAgenda";
import { diaDeDataHora, formatarDataBr, horaDeDataHora } from "@/utils/utils";

export default function LessonDetailsScreen({ preview = false }: { preview?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { appointments, loading } = useStudentAgenda(preview ? 999 : user?.id, preview);
  const appointment = appointments.find((item) => String(item.id) === id);

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!appointment) return <View style={styles.center}><Text style={styles.notFound}>Aula não encontrada</Text><TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Voltar</Text></TouchableOpacity></View>;

  const status = getStudentAppointmentStatus(appointment, user?.id);
  const cancelled = status.includes("CANCEL");
  const pending = status.includes("PEND");
  const finished = new Date(appointment.dataHora).getTime() < Date.now();
  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={21} color="#fff" /></TouchableOpacity>
        <Text style={styles.headerTitle}>Detalhes da Aula</Text>
        <View style={{ width: 21 }} />
      </View>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <View style={styles.titleRow}><Text style={styles.className}>{appointment.especialidade || "Aula"}</Text><Text style={[styles.status, cancelled ? styles.cancelled : pending ? styles.pending : styles.confirmed]}>{cancelled ? "Cancelada" : finished ? "Realizada" : pending ? "Pendente" : "Confirmada"}</Text></View>
          <View style={styles.divider} />
          <Info icon="calendar" label="Data" value={formatarDataBr(diaDeDataHora(appointment.dataHora))} colors={colors} styles={styles} />
          <Info icon="clock" label="Horário" value={`${horaDeDataHora(appointment.dataHora)} · 50 min`} colors={colors} styles={styles} />
          <Info icon="user" label="Professor" value={appointment.professorNome || appointment.professor || "Não informado"} colors={colors} styles={styles} />
          <Info icon="map-pin" label="Sala" value={appointment.salaNome || appointment.sala || "Não informada"} colors={colors} styles={styles} />
        </View>
        <View style={styles.card}><View style={styles.sectionTitle}><Feather name="edit-3" size={18} color={colors.primary} /><Text style={styles.sectionTitleText}>Orientações</Text></View><Text style={styles.instructions}>Chegue 10 minutos antes e use roupas confortáveis.</Text></View>
        {!cancelled && !finished ? <><TouchableOpacity style={styles.cancelButton} onPress={() => router.push({ pathname: (preview ? "/(secretary)/aluno-preview-cancelar/[id]" : "/(aluno)/agenda/cancelar/[id]") as RelativePathString, params: { id: String(appointment.id) } })}><Feather name="trash-2" size={18} color={colors.danger} /><Text style={styles.cancelText}>Cancelar aula</Text></TouchableOpacity><TouchableOpacity style={styles.confirmButton} onPress={() => router.push({ pathname: (preview ? "/(secretary)/aluno-preview-confirmar/[id]" : "/(aluno)/agenda/confirmar/[id]") as RelativePathString, params: { id: String(appointment.id) } })}><Feather name="check" size={22} color={isDark ? "#6ee7b7" : "#047857"} /><Text style={styles.confirmText}>{pending ? "Confirmar presença" : "Confirmada"}</Text></TouchableOpacity></> : null}
      </ScrollView>
    </View>
  );
}

function Info({ icon, label, value, colors, styles }: { icon: keyof typeof Feather.glyphMap; label: string; value: string; colors: ThemeColors; styles: ReturnType<typeof getStyles> }) {
  return <View style={styles.info}><Feather name={icon} size={19} color={colors.primary} /><View><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View></View>;
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, header: { paddingHorizontal: 17, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.topBarHeader }, headerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" }, content: { padding: 16, paddingBottom: 30 }, card: { padding: 17, marginBottom: 14, borderRadius: 17, backgroundColor: colors.surfaceCard, borderWidth: 1, borderColor: colors.border, shadowColor: "#000", shadowOpacity: isDark ? 0.18 : 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 2 }, titleRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 }, className: { flex: 1, color: colors.text, fontSize: 24, fontWeight: "800" }, status: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 14, fontSize: 11, fontWeight: "800" },   confirmed: { color: isDark ? "#6ee7b7" : "#059669", backgroundColor: isDark ? "rgba(16,185,129,.2)" : "#dcfce7" }, pending: { color: colors.primary, backgroundColor: colors.primaryLight }, cancelled: { color: colors.textMuted, backgroundColor: colors.surfaceSubtle }, divider: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 16 }, info: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 15 }, infoLabel: { color: colors.textSecondary, fontSize: 12 }, infoValue: { color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 }, sectionTitle: { flexDirection: "row", alignItems: "center", gap: 8 }, sectionTitleText: { color: colors.text, fontSize: 16, fontWeight: "800" }, instructions: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, marginTop: 10 }, cancelButton: { height: 56, marginBottom: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.danger, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, cancelText: { color: colors.danger, fontSize: 16, fontWeight: "800" }, confirmButton: { height: 56, borderRadius: 14, borderWidth: 1, borderColor: isDark ? "#34d399" : "#059669", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9 }, confirmText: { color: isDark ? "#6ee7b7" : "#047857", fontSize: 16, fontWeight: "800" }, center: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }, notFound: { color: colors.text, fontSize: 16, fontWeight: "800" }, link: { color: colors.primary, fontWeight: "800", marginTop: 12 },
});
