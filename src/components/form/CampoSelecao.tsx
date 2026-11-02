import React, { useMemo } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

interface Props {
  label: string;
  icone?: keyof typeof Feather.glyphMap;
  valor?: string;
  placeholder?: string;
  obrigatorio?: boolean;
  desabilitado?: boolean;
  erro?: string;
  dica?: string;
  onPress: () => void;
}

// Campo que abre um seletor — substitui os <select> do web.
export default function CampoSelecao({
  label,
  icone,
  valor,
  placeholder = "Selecione",
  obrigatorio,
  desabilitado,
  erro,
  dica,
  onPress,
}: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  return (
    <View style={styles.campo}>
      <Text style={styles.label}>
        {label}
        {obrigatorio ? <Text style={styles.obrigatorio}> *</Text> : null}
      </Text>

      <TouchableOpacity
        style={[
          styles.botao,
          desabilitado && styles.desabilitado,
          !!erro && styles.erro,
        ]}
        onPress={onPress}
        disabled={desabilitado}
        activeOpacity={0.7}
      >
        {icone && <Feather name={icone} size={17} color={colors.textSecondary} />}

        <Text
          style={[styles.valor, !valor && styles.placeholder]}
          numberOfLines={1}
        >
          {valor || placeholder}
        </Text>

        <Feather name="chevron-down" size={17} color={colors.textSecondary} />
      </TouchableOpacity>

      {erro ? (
        <Text style={styles.erroTexto}>{erro}</Text>
      ) : dica ? (
        <View style={styles.dicaRow}>
          <Feather name="info" size={11} color={colors.textMuted} />
          <Text style={styles.dicaTexto}>{dica}</Text>
        </View>
      ) : null}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    campo: { marginBottom: 16 },

    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 7 },

    obrigatorio: { color: colors.danger },

    botao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 13,
    },

    desabilitado: { backgroundColor: colors.surfaceSubtle, opacity: 0.7 },

    erro: { borderColor: colors.danger },

    valor: { flex: 1, fontSize: 15, color: colors.inputText },

    placeholder: { color: colors.inputPlaceholder },

    erroTexto: { fontSize: 12, color: colors.danger, marginTop: 4 },

    dicaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },

    dicaTexto: { fontSize: 11.5, color: colors.textMuted },
  });
