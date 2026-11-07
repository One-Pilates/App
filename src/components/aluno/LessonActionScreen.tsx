import React, { useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type RelativePathString } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeColors, useTheme } from "@/contexts/ThemeContext";
import { useStudentAgenda } from "@/hooks/useStudentAgenda";
import { horaDeDataHora } from "@/utils/utils";
import api from "@/services/api";
import { notify } from "@/utils/notify";

type Action = "confirmar" | "cancelar";

export default function LessonActionScreen({ action, preview = false }: { action: Action; preview?: boolean }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { appointments, loading } = useStudentAgenda(preview ? 999 : user?.id, preview);
  const appointment = appointments.find((item) => String(item.id) === id);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  async function submit() {
    if (!appointment || !user?.id) return;
    setSaving(true);
    try {
      if (!preview) {
        await api.patch(`api/agendamentos/${appointment.id}/alunos/${user.id}/status`, {
          status: action === "confirmar" ? "CONFIRMADA" : "CANCELADA",
        });
      }
      setSuccess(true);
    } catch (error) {
      console.error(`Erro ao ${action} aula:`, error);
      notify.error(`Não foi possível ${action} a aula. Tente novamente.`);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <View style={styles.center}><ActivityIndicator size="large" color={colors.primary} /></View>;
  if (!appointment) return <View style={styles.center}><Text style={styles.title}>Aula não encontrada</Text><TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>Voltar</Text></TouchableOpacity></View>;

  if (success) {
    const cancelled = action === "cancelar";
    return <View style={styles.container}><View style={[styles.header, { paddingTop: insets.top + 12 }]}><TouchableOpacity onPress={() => router.replace((preview ? "/(secretary)/aluno-preview" : "/(aluno)/agenda") as RelativePathString)}><Feather name="arrow-left" size={21} color="#fff" /></TouchableOpacity><Text style={styles.headerTitle}>Agenda</Text><View style={{ width: 21 }} /></View><View style={styles.successContent}><View style={[styles.successIcon, { backgroundColor: cancelled ? "#e85b70" : "#19896f" }]}><Feather name={cancelled ? "x" : "check"} size={48} color="#fff" /></View><Text style={styles.successTitle}>Aula {cancelled ? "cancelada" : "confirmada"} com sucesso</Text><Text style={styles.successSubtitle}>{cancelled ? "O cancelamento da sua aula foi registrado." : "Sua presença foi confirmada para esta aula."}</Text><View style={styles.summary}><View style={styles.summaryIcon}><Feather name="activity" size={20} color={colors.primary} /></View><View><Text style={styles.summaryTitle}>{appointment.especialidade || "Aula"}</Text><Text style={styles.summaryText}>{horaDeDataHora(appointment.dataHora)}</Text></View></View><TouchableOpacity style={styles.primaryButton} onPress={() => router.replace((preview ? "/(secretary)/aluno-preview" : "/(aluno)/agenda") as RelativePathString)}><Text style={styles.primaryText}>Ver na Agenda</Text></TouchableOpacity><TouchableOpacity style={styles.outlineButton} onPress={() => router.replace((preview ? "/(secretary)/mais" : "/(aluno)/index") as RelativePathString)}><Text style={styles.outlineText}>Voltar ao Início</Text></TouchableOpacity></View></View>;
  }

  const cancelled = action === "cancelar";
  return <View style={styles.container}><View style={[styles.header, { paddingTop: insets.top + 12 }]}><TouchableOpacity onPress={() => router.back()}><Feather name="arrow-left" size={21} color="#fff" /></TouchableOpacity><Text style={styles.headerTitle}>Agenda</Text><View style={{ width: 21 }} /></View><View style={styles.actionContent}><View style={[styles.actionIcon, { backgroundColor: cancelled ? "#e85b70" : "#19896f" }]}><Feather name={cancelled ? "x" : "check"} size={48} color="#fff" /></View><Text style={styles.actionTitle}>Deseja {cancelled ? "cancelar" : "confirmar"} sua presença?</Text><Text style={styles.actionSubtitle}>Confirme se deseja realmente {cancelled ? "cancelar sua participação" : "confirmar sua participação"} nesta aula.</Text><View style={styles.summary}><View style={styles.summaryIcon}><Feather name="activity" size={20} color={colors.primary} /></View><View><Text style={styles.summaryTitle}>{appointment.especialidade || "Aula"}</Text><Text style={styles.summaryText}>{horaDeDataHora(appointment.dataHora)}</Text></View></View><View style={styles.actions}><TouchableOpacity style={styles.outlineButton} onPress={() => router.back()} disabled={saving}><Text style={styles.outlineText}>Voltar</Text></TouchableOpacity><TouchableOpacity style={[styles.primaryButton, cancelled && styles.dangerButton]} onPress={submit} disabled={saving}>{saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryText}>{cancelled ? "Confirmar cancelamento" : "Confirmar presença"}</Text>}</TouchableOpacity></View></View></View>;
}

const getStyles = (colors: ThemeColors, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background }, header: { paddingHorizontal: 17, paddingBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: colors.topBarHeader }, headerTitle: { color: "#fff", fontSize: 16, fontWeight: "800" }, actionContent: { flex: 1, alignItems: "center", paddingHorizontal: 25, paddingTop: 70 }, actionIcon: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: 20 }, actionTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" }, actionSubtitle: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, textAlign: "center", marginTop: 10 }, summary: { width: "100%", padding: 14, marginTop: 22, flexDirection: "row", alignItems: "center", borderRadius: 15, backgroundColor: colors.surfaceSubtle }, summaryIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: colors.primaryLight, marginRight: 12 }, summaryTitle: { color: colors.text, fontSize: 15, fontWeight: "800" }, summaryText: { color: colors.textSecondary, fontSize: 12, marginTop: 4 }, actions: { width: "100%", flexDirection: "row", gap: 10, marginTop: 14 }, primaryButton: { minHeight: 52, flex: 1, borderRadius: 13, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, backgroundColor: colors.primary }, dangerButton: { backgroundColor: "#e85b70" }, primaryText: { color: "#fff", fontSize: 14, fontWeight: "800", textAlign: "center" }, outlineButton: { minHeight: 52, flex: 1, borderRadius: 13, borderWidth: 1, borderColor: colors.borderSubtle, alignItems: "center", justifyContent: "center", paddingHorizontal: 12, backgroundColor: colors.surfaceCard }, outlineText: { color: colors.text, fontSize: 14, fontWeight: "800", textAlign: "center" }, successContent: { flex: 1, alignItems: "center", paddingHorizontal: 25, paddingTop: 70 }, successIcon: { width: 104, height: 104, borderRadius: 52, alignItems: "center", justifyContent: "center", marginBottom: 18 }, successTitle: { color: colors.text, fontSize: 21, fontWeight: "800", textAlign: "center" }, successSubtitle: { color: colors.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 19, marginTop: 9 }, center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background }, title: { color: colors.text, fontSize: 16, fontWeight: "800" }, link: { color: colors.primary, fontWeight: "800", marginTop: 12 },
});
