import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { adicionarDias, dataParaIso, nomeDiaSemanaCurto } from "@/utils/utils";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

interface Props {
  semana: Date; // segunda-feira da semana exibida
  diaSelecionado: string;
  diasComAula: Set<string>;
  onSelecionarDia: (iso: string) => void;
  onMudarSemana: (novaSemana: Date) => void;
}

// Faixa de dias úteis da semana (o studio não agenda em fins de semana).
export default function WeekStrip({
  semana,
  diaSelecionado,
  diasComAula,
  onSelecionarDia,
  onMudarSemana,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const dias = Array.from({ length: 5 }, (_, i) => adicionarDias(semana, i));
  const hoje = dataParaIso(new Date());

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => onMudarSemana(adicionarDias(semana, -7))}
      >
        <Feather name="chevron-left" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.dias}>
        {dias.map((dia) => {
          const iso = dataParaIso(dia);
          const ativo = iso === diaSelecionado;
          const ehHoje = iso === hoje;

          return (
            <TouchableOpacity
              key={iso}
              style={[styles.dayCard, ativo && styles.dayCardActive]}
              onPress={() => onSelecionarDia(iso)}
              activeOpacity={0.8}
            >
              <Text style={[styles.dayText, ativo && styles.dayTextActive]}>
                {nomeDiaSemanaCurto(dia)}
              </Text>

              <Text style={[styles.dateText, ativo && styles.dateTextActive]}>
                {String(dia.getDate()).padStart(2, "0")}
              </Text>

              <View
                style={[
                  styles.dot,
                  diasComAula.has(iso) && styles.dotVisivel,
                  ativo && styles.dotAtivo,
                  !ativo && ehHoje && styles.dotHoje,
                ]}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.navBtn}
        onPress={() => onMudarSemana(adicionarDias(semana, 7))}
      >
        <Feather name="chevron-right" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flexDirection: "row", alignItems: "center" },

    navBtn: { padding: 4 },

    dias: {
      flex: 1,
      flexDirection: "row",
      justifyContent: "space-between",
      paddingHorizontal: 4,
    },

    dayCard: {
      alignItems: "center",
      justifyContent: "center",
      flex: 1,
      marginHorizontal: 3,
      paddingVertical: 10,
      borderRadius: 14,
      backgroundColor: colors.surfaceSubtle,
    },

    dayCardActive: { backgroundColor: colors.primary },

    dayText: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: "600",
      marginBottom: 2,
    },

    dayTextActive: { color: "#fff", opacity: 0.9 },

    dateText: { fontSize: 17, color: colors.text, fontWeight: "bold" },

    dateTextActive: { color: "#fff" },

    dot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      marginTop: 4,
      backgroundColor: "transparent",
    },

    dotVisivel: { backgroundColor: colors.primary },

    dotAtivo: { backgroundColor: "#fff" },

    dotHoje: { backgroundColor: colors.textMuted },
  });
