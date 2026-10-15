import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from "react-native";

import { Feather } from "@expo/vector-icons";

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
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
              <Feather name="x" size={20} color="#64748b" />
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
                    <Feather name="check" size={18} color="#f77433" />
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

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },

  sheet: {
    backgroundColor: "#fff",

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    paddingBottom: 32,

    maxHeight: "70%",
  },

  handle: {
    width: 40,

    height: 4,

    borderRadius: 2,

    backgroundColor: "#e2e8f0",

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

  titulo: { fontSize: 17, fontWeight: "bold", color: "#0f172a" },

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

  opcaoSelecionada: { backgroundColor: "#fff3eb" },

  opcaoTexto: { fontSize: 15, color: "#334155" },

  opcaoTextoSelecionado: { color: "#f77433", fontWeight: "700" },
});
