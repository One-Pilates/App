import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface Props {
  etapas?: { label: string }[];
  totalSteps?: number;
  etapaAtual?: number;
  currentStep?: number;
  onIrParaEtapa?: (etapa: number) => void;
  onStepClick?: (etapa: number) => void;
}

export default function StepIndicator({
  etapas,
  totalSteps = 4,
  etapaAtual,
  currentStep,
  onIrParaEtapa,
  onStepClick,
}: Props) {
  const { colors } = useTheme();

  const activeStep = etapaAtual ?? currentStep ?? 1;
  const count = etapas ? etapas.length : totalSteps;
  const handlePress = onIrParaEtapa ?? onStepClick;

  const stepsArray = Array.from({ length: count }, (_, i) => i + 1);

  return (
    <View style={styles.stepper}>
      {stepsArray.map((numero) => {
        const ativo = numero === activeStep;
        const concluido = numero < activeStep;
        const clicavel = numero <= activeStep;

        return (
          <React.Fragment key={numero}>
            <TouchableOpacity
              style={[
                styles.circle,
                {
                  backgroundColor: concluido
                    ? colors.primary
                    : ativo
                    ? colors.surfaceCard
                    : colors.surfaceSubtle,
                  borderColor:
                    concluido || ativo ? colors.primary : colors.borderSubtle,
                },
              ]}
              onPress={() => clicavel && handlePress?.(numero)}
              disabled={!clicavel || !handlePress}
              activeOpacity={0.7}
            >
              {concluido ? (
                <Feather name="check" size={14} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.number,
                    { color: ativo ? colors.primary : colors.textMuted },
                  ]}
                >
                  {numero}
                </Text>
              )}
            </TouchableOpacity>

            {numero < count && (
              <View
                style={[
                  styles.line,
                  {
                    backgroundColor: concluido
                      ? colors.primary
                      : colors.borderSubtle,
                  },
                ]}
              />
            )}
          </React.Fragment>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 8,
    marginVertical: 4,
  },
  circle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
  },
  number: {
    fontSize: 14,
    fontWeight: "700",
    textAlign: "center",
    textAlignVertical: "center",
    includeFontPadding: false,
  },
  line: {
    flex: 1,
    height: 2,
    marginHorizontal: 8,
  },
});
