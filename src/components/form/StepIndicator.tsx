import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

import { Feather } from "@expo/vector-icons";

interface Props {
  etapas: { label: string }[];

  etapaAtual: number;

  onIrParaEtapa?: (etapa: number) => void;
}

export default function StepIndicator({
  etapas,
  etapaAtual,
  onIrParaEtapa,
}: Props) {
  return (
    <View style={styles.stepper}>
      {etapas.map((etapa, index) => {
        const numero = index + 1;

        const ativo = numero === etapaAtual;

        const concluido = numero < etapaAtual;

        const clicavel = numero <= etapaAtual;

        return (
          <View key={etapa.label} style={styles.wrapper}>
            <TouchableOpacity
              style={[
                styles.circle,
                ativo && styles.circleActive,
                concluido && styles.circleDone,
              ]}
              onPress={() => clicavel && onIrParaEtapa?.(numero)}
              disabled={!clicavel || !onIrParaEtapa}
            >
              {concluido ? (
                <Feather name="check" size={14} color="#fff" />
              ) : (
                <Text style={[styles.number, ativo && styles.numberActive]}>
                  {numero}
                </Text>
              )}
            </TouchableOpacity>

            {numero < etapas.length && (
              <View style={[styles.line, concluido && styles.lineDone]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: { flexDirection: "row", alignItems: "center" },

  wrapper: { flexDirection: "row", alignItems: "center", flex: 1 },

  circle: {
    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: "#f1f5f9",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 2,

    borderColor: "#e2e8f0",
  },

  circleActive: { backgroundColor: "#fff", borderColor: "#f77433" },

  circleDone: { backgroundColor: "#f77433", borderColor: "#f77433" },

  number: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },

  numberActive: { color: "#f77433" },

  line: { flex: 1, height: 2, backgroundColor: "#e2e8f0", marginHorizontal: 4 },

  lineDone: { backgroundColor: "#f77433" },
});
