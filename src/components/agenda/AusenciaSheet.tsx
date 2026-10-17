import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import api from "@/services/api";

import { notify } from "@/utils/notify";

import { Ausencia } from "@/types/agenda";

import { formatarDataBr, horaDeDataHora } from "@/utils/utils";

interface Props {
  visible: boolean;

  ausencia: Ausencia | null;

  podeExcluir: boolean;

  onFechar: () => void;

  onExcluida: () => void;
}

export default function AusenciaSheet({
  visible,

  ausencia,

  podeExcluir,

  onFechar,

  onExcluida,
}: Props) {
  if (!ausencia) return null;

  function excluir() {
    Alert.alert("Excluir ausência?", "Esta ação não pode ser desfeita.", [
      { text: "Cancelar", style: "cancel" },

      {
        text: "Sim, excluir",

        style: "destructive",

        onPress: async () => {
          try {
            await api.delete(`api/ausencias/${ausencia!.id}`);

            notify.success("Ausência excluída com sucesso!");

            onFechar();

            onExcluida();
          } catch (error) {
            console.error("Erro ao excluir ausência:", error);

            notify.error("Erro ao excluir ausência. Tente novamente.");
          }
        },
      },
    ]);
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent={true}
      onRequestClose={onFechar}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTop}
          activeOpacity={1}
          onPress={onFechar}
        />

        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View style={styles.headerTitulo}>
              <View style={styles.icone}>
                <Feather name="slash" size={18} color="#475569" />
              </View>

              <Text style={styles.titulo}>Ausência do professor</Text>
            </View>

            <TouchableOpacity style={styles.iconBtn} onPress={onFechar}>
              <Feather name="x" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <View style={styles.body}>
            <View style={styles.bloco}>
              <Text style={styles.rotulo}>Motivo</Text>

              <Text style={styles.valor}>
                {ausencia.motivo || "Não informado"}
              </Text>
            </View>

            <View style={styles.linha}>
              <View style={styles.linhaRotulo}>
                <Feather name="calendar" size={14} color="#94a3b8" />

                <Text style={styles.rotulo}>Início</Text>
              </View>

              <Text style={styles.valorLinha}>
                {formatarDataBr(ausencia.dataInicio)} às{" "}
                {horaDeDataHora(ausencia.dataInicio)}
              </Text>
            </View>

            <View style={styles.linha}>
              <View style={styles.linhaRotulo}>
                <Feather name="clock" size={14} color="#94a3b8" />

                <Text style={styles.rotulo}>Fim</Text>
              </View>

              <Text style={styles.valorLinha}>
                {formatarDataBr(ausencia.dataFim)} às{" "}
                {horaDeDataHora(ausencia.dataFim)}
              </Text>
            </View>

            {podeExcluir && (
              <TouchableOpacity style={styles.btnExcluir} onPress={excluir}>
                <Feather name="trash-2" size={16} color="#fff" />

                <Text style={styles.btnExcluirTexto}>Excluir ausência</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },

  overlayTop: { flex: 1 },

  sheet: {
    backgroundColor: "#fff",

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    paddingBottom: 28,
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

    paddingTop: 14,

    paddingBottom: 10,
  },

  headerTitulo: { flexDirection: "row", alignItems: "center", gap: 10 },

  icone: {
    width: 36,

    height: 36,

    borderRadius: 11,

    backgroundColor: "#f1f5f9",

    alignItems: "center",

    justifyContent: "center",
  },

  titulo: { fontSize: 17, fontWeight: "bold", color: "#0f172a" },

  iconBtn: { padding: 7 },

  body: { paddingHorizontal: 20, paddingTop: 8 },

  bloco: { marginBottom: 14 },

  rotulo: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  valor: { fontSize: 14.5, color: "#0f172a", marginTop: 5, lineHeight: 20 },

  linha: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingVertical: 12,

    borderTopWidth: 1,

    borderTopColor: "#f8fafc",
  },

  linhaRotulo: { flexDirection: "row", alignItems: "center", gap: 6 },

  valorLinha: { fontSize: 14, color: "#0f172a", fontWeight: "600" },

  btnExcluir: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: "#e11d48",

    borderRadius: 12,

    paddingVertical: 14,

    marginTop: 20,
  },

  btnExcluirTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
