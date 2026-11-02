import { useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

export interface Opcao {
  label: string;
  value: string;
}

interface Props {
  visible: boolean;
  titulo: string;
  opcoes: Opcao[];
  valor: string;
  onSelecionar: (valor: string) => void;
  onFechar: () => void;
}

// Seletor em bottom sheet — substitui os <select> do web.
export default function SelectSheet({
  visible,
  titulo,
  opcoes,
  valor,
  onSelecionar,
  onFechar,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onFechar}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onFechar}
      >
        <TouchableOpacity style={styles.sheet} activeOpacity={1}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.titulo}>{titulo}</Text>

            <TouchableOpacity onPress={onFechar} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={opcoes}
            keyExtractor={(item) => item.value}
            style={styles.lista}
            renderItem={({ item }) => {
              const selecionado = item.value === valor;

              return (
                <TouchableOpacity
                  style={[styles.opcao, selecionado && styles.opcaoSelecionada]}
                  onPress={() => {
                    onSelecionar(item.value);
                    onFechar();
                  }}
                >
                  <Text
                    style={[
                      styles.opcaoTexto,
                      selecionado && styles.opcaoTextoSelecionado,
                    ]}
                  >
                    {item.label}
                  </Text>

                  {selecionado && (
                    <Feather name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.65)" : "rgba(0,0,0,0.4)",
      justifyContent: "flex-end",
    },

    sheet: {
      backgroundColor: colors.surfaceCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: colors.border,
      paddingBottom: 32,
      maxHeight: "70%",
    },

    handle: {
      width: 40,
      height: 4,
      borderRadius: 2,
      backgroundColor: colors.borderSubtle,
      alignSelf: "center",
      marginTop: 10,
    },

    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 16,
    },

    titulo: { fontSize: 17, fontWeight: "bold", color: colors.text },

    closeBtn: { padding: 4 },

    lista: { paddingHorizontal: 12 },

    opcao: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingVertical: 14,
      paddingHorizontal: 14,
      borderRadius: 12,
    },

    opcaoSelecionada: { backgroundColor: colors.primaryLight },

    opcaoTexto: { fontSize: 15, color: colors.textSecondary },

    opcaoTextoSelecionado: { color: colors.primary, fontWeight: "700" },
  });
