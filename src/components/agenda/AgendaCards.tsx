import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { Agendamento, Ausencia } from "@/types/agenda";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import {
  getColorForEspecialidade,
  horaDeDataHora,
  somarHoras,
  formatarDataBr,
} from "@/utils/utils";

export function AulaCard({
  agendamento,
  onPress,
}: {
  agendamento: Agendamento;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { backgroundColor, textColor } = getColorForEspecialidade(
    agendamento.especialidade,
  );

  const inicio = horaDeDataHora(agendamento.dataHora);
  const professor =
    agendamento.professorNome || agendamento.professor || "Professor";
  const sala = agendamento.salaNome || agendamento.sala;
  const totalAlunos = agendamento.alunos?.length ?? 0;

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.faixa, { backgroundColor }]} />

      <View style={styles.horaBox}>
        <Text style={styles.horaText}>{inicio}</Text>
        <Text style={styles.horaFim}>{somarHoras(inicio, 1)}</Text>
      </View>

      <View style={styles.info}>
        <View style={[styles.pill, { backgroundColor }]}>
          <Text style={[styles.pillText, { color: textColor }]}>
            {agendamento.especialidade}
          </Text>
        </View>

        <Text style={styles.professor} numberOfLines={1}>
          {professor}
        </Text>

        {sala ? (
          <View style={styles.salaRow}>
            <Feather name="map-pin" size={11} color={colors.textSecondary} />
            <Text style={styles.salaText} numberOfLines={1}>
              {sala}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.alunosBox}>
        <Feather name="users" size={14} color={colors.primary} />
        <Text style={styles.alunosText}>{totalAlunos}</Text>
      </View>
    </TouchableOpacity>
  );
}

export function AusenciaCard({
  ausencia,
  onPress,
}: {
  ausencia: Ausencia;
  onPress?: () => void;
}) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const inicio = horaDeDataHora(ausencia.dataInicio);
  const fim = horaDeDataHora(ausencia.dataFim);
  const mesmoDia =
    ausencia.dataInicio.substring(0, 10) === ausencia.dataFim.substring(0, 10);

  return (
    <TouchableOpacity
      style={[styles.card, styles.cardAusencia]}
      activeOpacity={0.8}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={[styles.faixa, styles.faixaAusencia]} />

      <View style={styles.horaBox}>
        <Text style={styles.horaText}>{inicio}</Text>
        <Text style={styles.horaFim}>{fim}</Text>
      </View>

      <View style={styles.info}>
        <View style={styles.pillAusencia}>
          <Feather name="slash" size={11} color={colors.textSecondary} />
          <Text style={styles.pillAusenciaText}>Ausência</Text>
        </View>

        <Text style={styles.professor} numberOfLines={2}>
          {ausencia.motivo || "Sem motivo informado"}
        </Text>

        {!mesmoDia && (
          <Text style={styles.periodo}>
            {formatarDataBr(ausencia.dataInicio)} até{" "}
            {formatarDataBr(ausencia.dataFim)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 14,
      paddingLeft: 18,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 12,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: "hidden",
    },

    cardAusencia: { backgroundColor: colors.surfaceSubtle },

    faixa: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },

    faixaAusencia: { backgroundColor: colors.textMuted },

    horaBox: { alignItems: "center", marginRight: 14, minWidth: 46 },

    horaText: { color: colors.text, fontWeight: "bold", fontSize: 15 },

    horaFim: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },

    info: { flex: 1 },

    pill: {
      alignSelf: "flex-start",
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
    },

    pillText: { fontSize: 11, fontWeight: "bold" },

    pillAusencia: {
      alignSelf: "flex-start",
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      paddingHorizontal: 9,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.borderSubtle,
    },

    pillAusenciaText: { fontSize: 11, fontWeight: "bold", color: colors.textSecondary },

    professor: {
      fontSize: 13.5,
      color: colors.text,
      fontWeight: "600",
      marginTop: 5,
    },

    salaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },

    salaText: { fontSize: 12, color: colors.textSecondary },

    periodo: { fontSize: 11.5, color: colors.textSecondary, marginTop: 3 },

    alunosBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 5,
      backgroundColor: colors.surfaceSubtle,
      paddingHorizontal: 10,
      paddingVertical: 7,
      borderRadius: 20,
      marginLeft: 8,
    },

    alunosText: { fontWeight: "700", color: colors.text, fontSize: 13 },
  });
