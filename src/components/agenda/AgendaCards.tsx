import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { Feather } from "@expo/vector-icons";

import { Agendamento, Ausencia } from "@/types/agenda";

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
            <Feather name="map-pin" size={11} color="#94a3b8" />

            <Text style={styles.salaText} numberOfLines={1}>
              {sala}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.alunosBox}>
        <Feather name="users" size={15} color="#64748b" />

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
          <Feather name="slash" size={11} color="#475569" />

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

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 14,

    paddingLeft: 18,

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 12,

    borderWidth: 1,

    borderColor: "#f1f5f9",

    overflow: "hidden",
  },

  cardAusencia: { backgroundColor: "#f8fafc" },

  faixa: { position: "absolute", left: 0, top: 0, bottom: 0, width: 5 },

  faixaAusencia: { backgroundColor: "#9d9d9e" },

  horaBox: { alignItems: "center", marginRight: 14, minWidth: 46 },

  horaText: { color: "#0f172a", fontWeight: "bold", fontSize: 15 },

  horaFim: { color: "#94a3b8", fontSize: 12, marginTop: 2 },

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

    backgroundColor: "#e2e8f0",
  },

  pillAusenciaText: { fontSize: 11, fontWeight: "bold", color: "#475569" },

  professor: {
    fontSize: 13.5,
    color: "#334155",
    fontWeight: "600",
    marginTop: 5,
  },

  salaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 3 },

  salaText: { fontSize: 12, color: "#94a3b8" },

  periodo: { fontSize: 11.5, color: "#94a3b8", marginTop: 3 },

  alunosBox: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    backgroundColor: "#f1f5f9",

    paddingHorizontal: 10,

    paddingVertical: 7,

    borderRadius: 20,

    marginLeft: 8,
  },

  alunosText: { fontWeight: "700", color: "#475569", fontSize: 13 },
});
