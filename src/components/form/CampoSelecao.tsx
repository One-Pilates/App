import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { Feather } from "@expo/vector-icons";

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
        {icone && <Feather name={icone} size={17} color="#94a3b8" />}

        <Text
          style={[styles.valor, !valor && styles.placeholder]}
          numberOfLines={1}
        >
          {valor || placeholder}
        </Text>

        <Feather name="chevron-down" size={17} color="#94a3b8" />
      </TouchableOpacity>

      {erro ? (
        <Text style={styles.erroTexto}>{erro}</Text>
      ) : dica ? (
        <View style={styles.dicaRow}>
          <Feather name="info" size={11} color="#94a3b8" />

          <Text style={styles.dicaTexto}>{dica}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  campo: { marginBottom: 16 },

  label: { fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 7 },

  obrigatorio: { color: "#ef4444" },

  botao: {
    flexDirection: "row",

    alignItems: "center",

    gap: 10,

    backgroundColor: "#f8fafc",

    borderWidth: 2,

    borderColor: "#f1f5f9",

    borderRadius: 12,

    paddingHorizontal: 14,

    paddingVertical: 13,
  },

  desabilitado: { backgroundColor: "#f1f5f9", opacity: 0.7 },

  erro: { borderColor: "#fca5a5" },

  valor: { flex: 1, fontSize: 15, color: "#0f172a" },

  placeholder: { color: "#94a3b8" },

  erroTexto: { fontSize: 12, color: "#ef4444", marginTop: 4 },

  dicaRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },

  dicaTexto: { fontSize: 11.5, color: "#94a3b8" },
});
