import { useEffect, useState } from "react";

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import api from "@/services/api";

import { notify } from "@/utils/notify";

import { Agendamento, AlunoAgendamento } from "@/types/agenda";

import {
  getColorForEspecialidade,
  horaDeDataHora,
  somarHoras,
  formatarDataExtensa,
  diaDeDataHora,
} from "@/utils/utils";

interface Props {
  visible: boolean;

  agendamento: Agendamento | null;

  podeEditar: boolean;

  onFechar: () => void;

  onEditar: () => void;

  onAlterado: () => void;
}

const CORES_AVATAR = [
  "#f77433",
  "#3b82f6",
  "#10b981",
  "#ef4444",
  "#8b5cf6",
  "#f59e0b",
];

function iniciais(nome?: string): string {
  if (!nome) return "UA";

  const partes = nome.trim().split(" ");

  if (partes.length === 1) return partes[0].substring(0, 2).toUpperCase();

  return (partes[0][0] + partes[partes.length - 1][0]).toUpperCase();
}

function corAvatar(nome?: string): string {
  return CORES_AVATAR[(nome ? nome.charCodeAt(0) : 0) % CORES_AVATAR.length];
}

export default function AulaSheet({
  visible,

  agendamento,

  podeEditar,

  onFechar,

  onEditar,

  onAlterado,
}: Props) {
  const [aba, setAba] = useState<"informacoes" | "alunos">("informacoes");

  const [observacoes, setObservacoes] = useState<Record<number, string>>({});

  const [expandido, setExpandido] = useState<Record<number, boolean>>({});

  const [editandoObs, setEditandoObs] = useState<Record<number, string>>({});

  const [salvandoObs, setSalvandoObs] = useState<number | null>(null);

  useEffect(() => {
    if (!agendamento?.alunos) return;

    const mapa: Record<number, string> = {};

    agendamento.alunos.forEach((a) => {
      mapa[a.id] = a.observacao || "";
    });

    setObservacoes(mapa);

    setExpandido({});

    setEditandoObs({});
  }, [agendamento]);

  useEffect(() => {
    if (visible) setAba("informacoes");
  }, [visible]);

  if (!agendamento) return null;

  const { backgroundColor } = getColorForEspecialidade(
    agendamento.especialidade,
  );

  const inicio = horaDeDataHora(agendamento.dataHora);

  const alunos: AlunoAgendamento[] = agendamento.alunos || [];

  async function salvarObservacao(alunoId: number) {
    const texto = editandoObs[alunoId] ?? "";

    setSalvandoObs(alunoId);

    try {
      await api.patch(
        `api/agendamentos/${agendamento!.id}/alunos/${alunoId}/observacao`,
        {
          observacao: texto || null,
        },
      );

      setObservacoes((prev) => ({ ...prev, [alunoId]: texto }));

      setEditandoObs((prev) => {
        const next = { ...prev };

        delete next[alunoId];

        return next;
      });

      notify.success("Observação salva!");
    } catch (error) {
      console.error("Erro ao salvar observação:", error);

      notify.error("Erro ao salvar observação.");
    } finally {
      setSalvandoObs(null);
    }
  }

  function excluirAula() {
    Alert.alert(
      "Deletar aula?",

      "Tem certeza que deseja deletar esta aula? Esta ação não pode ser desfeita.",

      [
        { text: "Cancelar", style: "cancel" },

        {
          text: "Sim, deletar",

          style: "destructive",

          onPress: async () => {
            try {
              await api.delete(`api/agendamentos/${agendamento!.id}`);

              notify.success("Aula deletada com sucesso.");

              onFechar();

              onAlterado();
            } catch (error) {
              console.error("Erro ao deletar aula:", error);

              notify.error("Não foi possível deletar a aula. Tente novamente.");
            }
          },
        },
      ],
    );
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
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
              <View style={[styles.especialidadeDot, { backgroundColor }]} />

              <View style={styles.flex1}>
                <Text
                  style={[styles.titulo, { color: backgroundColor }]}
                  numberOfLines={1}
                >
                  {agendamento.especialidade}
                </Text>

                <Text style={styles.subtitulo}>
                  {formatarDataExtensa(diaDeDataHora(agendamento.dataHora))} ·{" "}
                  {inicio}h
                </Text>
              </View>
            </View>

            <View style={styles.headerAcoes}>
              {podeEditar && (
                <TouchableOpacity
                  style={styles.iconBtnPerigo}
                  onPress={excluirAula}
                >
                  <Feather name="trash-2" size={18} color="#e11d48" />
                </TouchableOpacity>
              )}

              <TouchableOpacity style={styles.iconBtn} onPress={onFechar}>
                <Feather name="x" size={20} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.abas}>
            <TouchableOpacity
              style={[styles.aba, aba === "informacoes" && styles.abaAtiva]}
              onPress={() => setAba("informacoes")}
            >
              <Text
                style={[
                  styles.abaTexto,
                  aba === "informacoes" && styles.abaTextoAtivo,
                ]}
              >
                Informações
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.aba, aba === "alunos" && styles.abaAtiva]}
              onPress={() => setAba("alunos")}
            >
              <Text
                style={[
                  styles.abaTexto,
                  aba === "alunos" && styles.abaTextoAtivo,
                ]}
              >
                Alunos ({alunos.length})
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
            {aba === "informacoes" ? (
              <>
                <Linha
                  icone="user"
                  rotulo="Professor"
                  valor={
                    agendamento.professorNome ||
                    agendamento.professor ||
                    "Não informado"
                  }
                />

                <Linha
                  icone="clock"
                  rotulo="Horário"
                  valor={`${inicio}h às ${somarHoras(inicio, 1)}h`}
                />

                <Linha
                  icone="map-pin"
                  rotulo="Sala"
                  valor={
                    agendamento.salaNome || agendamento.sala || "Não informada"
                  }
                />

                <Linha
                  icone="hash"
                  rotulo="Especialidade"
                  valor={agendamento.especialidade}
                />

                {podeEditar && (
                  <TouchableOpacity
                    style={[styles.btnEditar, { backgroundColor }]}
                    onPress={onEditar}
                  >
                    <Feather name="edit-2" size={16} color="#fff" />

                    <Text style={styles.btnEditarTexto}>Editar aula</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : alunos.length === 0 ? (
              <View style={styles.vazio}>
                <Feather name="users" size={28} color="#cbd5e1" />

                <Text style={styles.vazioTexto}>Nenhum aluno nesta aula.</Text>
              </View>
            ) : (
              alunos.map((aluno) => {
                const aberto = expandido[aluno.id];

                const editando = editandoObs[aluno.id] !== undefined;

                const obs = observacoes[aluno.id] || "";

                return (
                  <View key={aluno.id} style={styles.alunoWrapper}>
                    <View style={styles.alunoCard}>
                      <View
                        style={[
                          styles.avatar,
                          { backgroundColor: corAvatar(aluno.nome) },
                        ]}
                      >
                        <Text style={styles.avatarTexto}>
                          {iniciais(aluno.nome)}
                        </Text>
                      </View>

                      <View style={styles.flex1}>
                        <Text style={styles.alunoNome} numberOfLines={1}>
                          {aluno.nome}
                        </Text>

                        {aluno.alunoComLimitacoesFisicas && (
                          <View style={styles.tagPcd}>
                            <Feather
                              name="alert-triangle"
                              size={10}
                              color="#b45309"
                            />

                            <Text style={styles.tagPcdTexto}>PCD</Text>
                          </View>
                        )}
                      </View>

                      <TouchableOpacity
                        style={styles.iconBtn}
                        onPress={() =>
                          setExpandido((prev) => ({
                            ...prev,
                            [aluno.id]: !aberto,
                          }))
                        }
                      >
                        <Feather
                          name={aberto ? "eye-off" : "eye"}
                          size={17}
                          color="#64748b"
                        />
                      </TouchableOpacity>
                    </View>

                    {aberto && (
                      <View style={styles.obsBox}>
                        {editando ? (
                          <>
                            <TextInput
                              style={styles.obsInput}
                              value={editandoObs[aluno.id]}
                              onChangeText={(v) =>
                                setEditandoObs((prev) => ({
                                  ...prev,
                                  [aluno.id]: v,
                                }))
                              }
                              placeholder="Observação sobre o aluno..."
                              placeholderTextColor="#94a3b8"
                              multiline
                              textAlignVertical="top"
                            />

                            <View style={styles.obsAcoes}>
                              <TouchableOpacity
                                style={styles.obsBtnCancelar}
                                onPress={() =>
                                  setEditandoObs((prev) => {
                                    const next = { ...prev };

                                    delete next[aluno.id];

                                    return next;
                                  })
                                }
                              >
                                <Text style={styles.obsBtnCancelarTexto}>
                                  Cancelar
                                </Text>
                              </TouchableOpacity>

                              <TouchableOpacity
                                style={[
                                  styles.obsBtnSalvar,
                                  { backgroundColor },
                                ]}
                                onPress={() => salvarObservacao(aluno.id)}
                                disabled={salvandoObs === aluno.id}
                              >
                                {salvandoObs === aluno.id ? (
                                  <ActivityIndicator
                                    color="#fff"
                                    size="small"
                                  />
                                ) : (
                                  <Text style={styles.obsBtnSalvarTexto}>
                                    Salvar
                                  </Text>
                                )}
                              </TouchableOpacity>
                            </View>
                          </>
                        ) : (
                          <View style={styles.obsLeitura}>
                            <Text style={styles.obsTexto}>
                              {obs || "Sem observações."}
                            </Text>

                            <TouchableOpacity
                              style={styles.iconBtn}
                              onPress={() =>
                                setEditandoObs((prev) => ({
                                  ...prev,
                                  [aluno.id]: obs,
                                }))
                              }
                            >
                              <Feather
                                name="edit-2"
                                size={15}
                                color={backgroundColor}
                              />
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function Linha({
  icone,

  rotulo,

  valor,
}: {
  icone: keyof typeof Feather.glyphMap;

  rotulo: string;

  valor: string;
}) {
  return (
    <View style={styles.linha}>
      <View style={styles.linhaRotulo}>
        <Feather name={icone} size={14} color="#94a3b8" />

        <Text style={styles.linhaRotuloTexto}>{rotulo}</Text>
      </View>

      <Text style={styles.linhaValor} numberOfLines={2}>
        {valor}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },

  overlayTop: { flex: 1 },

  sheet: {
    backgroundColor: "#fff",

    borderTopLeftRadius: 24,

    borderTopRightRadius: 24,

    maxHeight: "85%",

    paddingBottom: 24,
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

    paddingHorizontal: 20,

    paddingTop: 14,

    paddingBottom: 12,
  },

  headerTitulo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  especialidadeDot: { width: 10, height: 36, borderRadius: 5 },

  flex1: { flex: 1 },

  titulo: { fontSize: 18, fontWeight: "bold" },

  subtitulo: { fontSize: 12.5, color: "#94a3b8", marginTop: 2 },

  headerAcoes: { flexDirection: "row", alignItems: "center", gap: 6 },

  iconBtn: { padding: 7 },

  iconBtnPerigo: { padding: 7, borderRadius: 10, backgroundColor: "#fef2f2" },

  abas: {
    flexDirection: "row",

    paddingHorizontal: 20,

    borderBottomWidth: 1,

    borderBottomColor: "#f1f5f9",
  },

  aba: {
    paddingVertical: 11,
    paddingHorizontal: 4,
    marginRight: 22,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },

  abaAtiva: { borderBottomColor: "#f77433" },

  abaTexto: { fontSize: 14, color: "#94a3b8", fontWeight: "600" },

  abaTextoAtivo: { color: "#f77433" },

  body: { paddingHorizontal: 20, paddingTop: 16 },

  linha: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    paddingVertical: 12,

    borderBottomWidth: 1,

    borderBottomColor: "#f8fafc",

    gap: 12,
  },

  linhaRotulo: { flexDirection: "row", alignItems: "center", gap: 6 },

  linhaRotuloTexto: { fontSize: 13, color: "#94a3b8", fontWeight: "600" },

  linhaValor: {
    flex: 1,
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    textAlign: "right",
  },

  btnEditar: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    borderRadius: 12,

    paddingVertical: 14,

    marginTop: 20,
  },

  btnEditarTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  vazio: { alignItems: "center", paddingVertical: 40, gap: 10 },

  vazioTexto: { color: "#94a3b8", fontSize: 14 },

  alunoWrapper: { marginBottom: 10 },

  alunoCard: {
    flexDirection: "row",

    alignItems: "center",

    gap: 12,

    backgroundColor: "#f8fafc",

    borderRadius: 14,

    padding: 12,
  },

  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  avatarTexto: { color: "#fff", fontWeight: "bold", fontSize: 14 },

  alunoNome: { fontSize: 14.5, fontWeight: "600", color: "#0f172a" },

  tagPcd: {
    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    gap: 3,

    backgroundColor: "#fef3c7",

    paddingHorizontal: 7,

    paddingVertical: 2,

    borderRadius: 7,

    marginTop: 4,
  },

  tagPcdTexto: { fontSize: 10, color: "#b45309", fontWeight: "bold" },

  obsBox: {
    backgroundColor: "#fff",

    borderWidth: 1,

    borderColor: "#f1f5f9",

    borderRadius: 12,

    padding: 12,

    marginTop: 6,

    marginHorizontal: 6,
  },

  obsLeitura: { flexDirection: "row", alignItems: "flex-start", gap: 8 },

  obsTexto: { flex: 1, fontSize: 13.5, color: "#64748b", lineHeight: 19 },

  obsInput: {
    borderWidth: 1.5,

    borderColor: "#f1f5f9",

    borderRadius: 10,

    padding: 10,

    fontSize: 14,

    color: "#0f172a",

    minHeight: 70,

    backgroundColor: "#f8fafc",
  },

  obsAcoes: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 8,
  },

  obsBtnCancelar: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 9,
    backgroundColor: "#f1f5f9",
  },

  obsBtnCancelarTexto: { color: "#475569", fontWeight: "600", fontSize: 13 },

  obsBtnSalvar: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 9,
    minWidth: 74,
    alignItems: "center",
  },

  obsBtnSalvarTexto: { color: "#fff", fontWeight: "bold", fontSize: 13 },
});
