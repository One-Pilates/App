import { useEffect, useState, useMemo } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import api from "@/services/api";
import { notify } from "@/utils/notify";
import { Ausencia, ProfessorResumo } from "@/types/agenda";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import SelectSheet, { Opcao } from "./SelectSheet";
import {
  dataHoraParaData,
  dataParaIso,
  diaSemanaApi,
  formatarDataBr,
  horariosDisponiveis,
  isoParaData,
  HORA_FIM,
} from "@/utils/utils";

interface Props {
  visible: boolean;
  professores: ProfessorResumo[];
  professorFixo?: number;
  onFechar: () => void;
  onCriada: (professorId: string) => void;
}

const HORARIOS = [...horariosDisponiveis(), `${HORA_FIM}:00`];

type CampoAberto = "professor" | "horaInicio" | "horaFim" | null;
type DataAberta = "inicio" | "fim" | null;

export default function DefinirAusenciaSheet({
  visible,
  professores,
  professorFixo,
  onFechar,
  onCriada,
}: Props) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const ehSecretaria = professorFixo === undefined;
  const [professorId, setProfessorId] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [horaFim, setHoraFim] = useState("");
  const [motivo, setMotivo] = useState("");
  const [campoAberto, setCampoAberto] = useState<CampoAberto>(null);
  const [dataAberta, setDataAberta] = useState<DataAberta>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setProfessorId(ehSecretaria ? "" : String(professorFixo));
    setDataInicio("");
    setHoraInicio("");
    setDataFim("");
    setHoraFim("");
    setMotivo("");
  }, [visible, ehSecretaria, professorFixo]);

  function onChangeData(_event: any, selecionada?: Date) {
    const alvo = dataAberta;
    if (Platform.OS !== "ios") setDataAberta(null);
    if (!selecionada || !alvo) return;

    const iso = dataParaIso(selecionada);
    if (alvo === "inicio") {
      setDataInicio(iso);
      if (!dataFim || dataFim < iso) setDataFim(iso);
    } else {
      setDataFim(iso);
    }
  }

  async function salvar() {
    if (ehSecretaria && !professorId) {
      notify.warning(
        "Por favor selecione um professor.",
        "Professor obrigatório",
      );
      return;
    }

    if (!motivo.trim()) {
      notify.warning(
        "Por favor informe o motivo da ausência.",
        "Motivo obrigatório",
      );
      return;
    }

    if (!dataInicio || !horaInicio || !dataFim || !horaFim) {
      notify.warning(
        "Preencha data e hora de início e fim.",
        "Datas inválidas",
      );
      return;
    }

    const inicioStr = `${dataInicio}T${horaInicio}:00`;
    const fimStr = `${dataFim}T${horaFim}:00`;

    if (dataHoraParaData(fimStr) <= dataHoraParaData(inicioStr)) {
      notify.warning(
        "O fim da ausência deve ser depois do início.",
        "Período inválido",
      );
      return;
    }

    setSalvando(true);

    try {
      try {
        const resp = await api.get(`api/ausencias/professor/${professorId}`);
        const existentes: Ausencia[] = Array.isArray(resp.data)
          ? resp.data
          : [];

        const novoInicio = dataHoraParaData(inicioStr);
        const novoFim = dataHoraParaData(fimStr);

        const sobrepoe = existentes.some((ex) => {
          const exInicio = dataHoraParaData(ex.dataInicio);
          const exFim = dataHoraParaData(ex.dataFim);
          return !(novoFim <= exInicio || novoInicio >= exFim);
        });

        if (sobrepoe) {
          setSalvando(false);
          notify.warning(
            "Já existe uma ausência registrada que sobrepõe esse período. Ajuste as datas.",
            "Conflito de ausência",
          );
          return;
        }
      } catch (err) {
        console.warn("Não foi possível verificar ausências existentes:", err);
      }

      Alert.alert("Tem certeza?", "Deseja realmente definir essa ausência?", [
        {
          text: "Cancelar",
          style: "cancel",
          onPress: () => setSalvando(false),
        },
        {
          text: "Sim, confirmar",
          onPress: async () => {
            try {
              await api.post("api/ausencias", {
                professorId: Number(professorId),
                dataInicio: inicioStr,
                dataFim: fimStr,
                diaSemanaInicio: diaSemanaApi(isoParaData(dataInicio)),
                diaSemanaFim: diaSemanaApi(isoParaData(dataFim)),
                motivo,
              });

              notify.success("Ausência definida com sucesso!");
              onFechar();
              onCriada(professorId);
            } catch (error: any) {
              console.error("Erro ao salvar ausência:", error?.response?.data);
              const data = error?.response?.data;
              notify.error(
                (typeof data === "string"
                  ? data
                  : data?.message || data?.erro) ||
                  "Erro ao salvar ausência. Verifique os dados e tente novamente.",
              );
            } finally {
              setSalvando(false);
            }
          },
        },
      ]);
    } catch (error) {
      console.error("Erro ao definir ausência:", error);
      notify.error("Erro ao salvar ausência. Tente novamente.");
      setSalvando(false);
    }
  }

  const opcoesProfessor: Opcao[] = professores.map((p) => ({
    label: p.nome,
    value: String(p.id),
  }));

  const opcoesHorario: Opcao[] = HORARIOS.map((h) => ({
    label: `${h}h`,
    value: h,
  }));

  const nomeProfessor = opcoesProfessor.find(
    (o) => o.value === professorId,
  )?.label;

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
            <Text style={styles.titulo}>Definir ausência</Text>

            <TouchableOpacity style={styles.iconBtn} onPress={onFechar}>
              <Feather name="x" size={20} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {ehSecretaria && (
              <View style={styles.campo}>
                <Text style={styles.label}>
                  Professor<Text style={styles.obrigatorio}> *</Text>
                </Text>

                <TouchableOpacity
                  style={styles.campoBotao}
                  onPress={() => setCampoAberto("professor")}
                >
                  <Feather name="user" size={17} color={colors.textSecondary} />

                  <Text
                    style={[
                      styles.campoValor,
                      !professorId && styles.placeholder,
                    ]}
                  >
                    {nomeProfessor || "Selecione um professor"}
                  </Text>

                  <Feather name="chevron-down" size={17} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.linha}>
              <View style={styles.flex1}>
                <Text style={styles.label}>
                  Data de início<Text style={styles.obrigatorio}> *</Text>
                </Text>

                <TouchableOpacity
                  style={styles.campoBotao}
                  onPress={() => setDataAberta("inicio")}
                >
                  <Feather name="calendar" size={16} color={colors.textSecondary} />

                  <Text
                    style={[
                      styles.campoValor,
                      !dataInicio && styles.placeholder,
                    ]}
                  >
                    {formatarDataBr(dataInicio) || "dd/mm/aaaa"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.horaBox}>
                <Text style={styles.label}>Hora</Text>

                <TouchableOpacity
                  style={styles.campoBotao}
                  onPress={() => setCampoAberto("horaInicio")}
                >
                  <Text
                    style={[
                      styles.campoValor,
                      !horaInicio && styles.placeholder,
                    ]}
                  >
                    {horaInicio || "--:--"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.linha}>
              <View style={styles.flex1}>
                <Text style={styles.label}>
                  Data de fim<Text style={styles.obrigatorio}> *</Text>
                </Text>

                <TouchableOpacity
                  style={styles.campoBotao}
                  onPress={() => setDataAberta("fim")}
                >
                  <Feather name="calendar" size={16} color={colors.textSecondary} />

                  <Text
                    style={[styles.campoValor, !dataFim && styles.placeholder]}
                  >
                    {formatarDataBr(dataFim) || "dd/mm/aaaa"}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.horaBox}>
                <Text style={styles.label}>Hora</Text>

                <TouchableOpacity
                  style={styles.campoBotao}
                  onPress={() => setCampoAberto("horaFim")}
                >
                  <Text
                    style={[styles.campoValor, !horaFim && styles.placeholder]}
                  >
                    {horaFim || "--:--"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <Text style={styles.aviso}>
              Ausências podem ser definidas entre 07:00 e 22:00.
            </Text>

            <View style={styles.campo}>
              <Text style={styles.label}>
                Motivo<Text style={styles.obrigatorio}> *</Text>
              </Text>

              <TextInput
                style={styles.textarea}
                value={motivo}
                onChangeText={setMotivo}
                placeholder="Descreva o motivo da ausência..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                textAlignVertical="top"
              />
            </View>

            <TouchableOpacity
              style={[styles.btnSalvar, salvando && styles.btnDesabilitado]}
              onPress={salvar}
              disabled={salvando}
            >
              {salvando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={17} color="#fff" />
                  <Text style={styles.btnSalvarTexto}>Definir ausência</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>

      {dataAberta && (
        <DateTimePicker
          value={
            dataAberta === "inicio"
              ? isoParaData(dataInicio || undefined)
              : isoParaData(dataFim || dataInicio || undefined)
          }
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          minimumDate={
            dataAberta === "fim" && dataInicio
              ? isoParaData(dataInicio)
              : undefined
          }
          onValueChange={onChangeData}
          onDismiss={() => setDataAberta(null)}
        />
      )}

      <SelectSheet
        visible={campoAberto === "professor"}
        titulo="Professor"
        opcoes={opcoesProfessor}
        valor={professorId}
        onSelecionar={setProfessorId}
        onFechar={() => setCampoAberto(null)}
      />

      <SelectSheet
        visible={campoAberto === "horaInicio"}
        titulo="Hora de início"
        opcoes={opcoesHorario}
        valor={horaInicio}
        onSelecionar={setHoraInicio}
        onFechar={() => setCampoAberto(null)}
      />

      <SelectSheet
        visible={campoAberto === "horaFim"}
        titulo="Hora de fim"
        opcoes={opcoesHorario}
        valor={horaFim}
        onSelecionar={setHoraFim}
        onFechar={() => setCampoAberto(null)}
      />
    </Modal>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: isDark ? "rgba(0,0,0,0.68)" : "rgba(0,0,0,0.4)",
    },

    overlayTop: { flex: 1 },

    sheet: {
      backgroundColor: colors.surfaceCard,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderTopWidth: isDark ? 1 : 0,
      borderTopColor: colors.border,
      maxHeight: "88%",
      paddingBottom: 24,
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
      paddingTop: 14,
      paddingBottom: 10,
    },

    titulo: { fontSize: 18, fontWeight: "bold", color: colors.text },

    iconBtn: { padding: 7 },

    body: { paddingHorizontal: 20, paddingTop: 6 },

    campo: { marginBottom: 14 },

    flex1: { flex: 1 },

    linha: { flexDirection: "row", gap: 10, marginBottom: 14 },

    horaBox: { width: 108 },

    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 7 },

    obrigatorio: { color: colors.danger },

    campoBotao: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      paddingHorizontal: 13,
      paddingVertical: 13,
    },

    campoValor: { flex: 1, fontSize: 14.5, color: colors.inputText },

    placeholder: { color: colors.inputPlaceholder },

    aviso: { fontSize: 12, color: colors.textMuted, marginBottom: 16, marginTop: -4 },

    textarea: {
      backgroundColor: colors.inputBg,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      borderRadius: 12,
      padding: 13,
      fontSize: 14.5,
      color: colors.inputText,
      minHeight: 90,
    },

    btnSalvar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 15,
      marginTop: 4,
    },

    btnDesabilitado: { opacity: 0.6 },

    btnSalvarTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },
  });
