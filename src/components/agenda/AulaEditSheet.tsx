import { useEffect, useState } from "react";

import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import api from "@/services/api";

import { notify } from "@/utils/notify";

import {
  Agendamento,
  AlunoAgendamento,
  Especialidade,
  ProfessorResumo,
  Sala,
} from "@/types/agenda";

import SelectSheet, { Opcao } from "./SelectSheet";

import {
  diaDeDataHora,
  horaDeDataHora,
  horariosDisponiveis,
} from "@/utils/utils";

interface Props {
  visible: boolean;

  agendamento: Agendamento | null;

  onFechar: () => void;

  onSalvo: () => void;
}

type CampoSelect =
  | "horario"
  | "professor"
  | "sala"
  | "especialidade"
  | "aluno"
  | null;

function extrairLista<T>(payload: any, chave?: string): T[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (chave && Array.isArray(payload[chave])) return payload[chave];

  if (Array.isArray(payload.content)) return payload.content;

  if (Array.isArray(payload.data)) return payload.data;

  return [];
}

export default function AulaEditSheet({
  visible,
  agendamento,
  onFechar,
  onSalvo,
}: Props) {
  const [professores, setProfessores] = useState<ProfessorResumo[]>([]);

  const [salas, setSalas] = useState<Sala[]>([]);

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  const [todosAlunos, setTodosAlunos] = useState<AlunoAgendamento[]>([]);

  const [horario, setHorario] = useState("");

  const [professorId, setProfessorId] = useState("");

  const [salaId, setSalaId] = useState("");

  const [especialidadeId, setEspecialidadeId] = useState("");

  const [alunos, setAlunos] = useState<AlunoAgendamento[]>([]);

  const [carregando, setCarregando] = useState(false);

  const [salvando, setSalvando] = useState(false);

  const [campoAberto, setCampoAberto] = useState<CampoSelect>(null);

  useEffect(() => {
    if (!visible || !agendamento) return;

    setHorario(horaDeDataHora(agendamento.dataHora));

    setProfessorId(
      String(agendamento.professorId ?? agendamento.idProfessor ?? ""),
    );

    setSalaId(String(agendamento.salaId ?? ""));

    setEspecialidadeId(String(agendamento.especialidadeId ?? ""));

    setAlunos(agendamento.alunos || []);

    setCarregando(true);

    Promise.all([
      api.get("api/professores").catch(() => ({ data: [] })),

      api.get("api/salas").catch(() => ({ data: [] })),

      api.get("api/especialidades").catch(() => ({ data: [] })),

      api.get("api/alunos").catch(() => ({ data: [] })),
    ])

      .then(([profRes, salaRes, espRes, alunoRes]) => {
        setProfessores(
          extrairLista<ProfessorResumo>(profRes.data, "professores"),
        );

        setSalas(extrairLista<Sala>(salaRes.data, "salas"));

        setEspecialidades(
          extrairLista<Especialidade>(espRes.data, "especialidades"),
        );

        setTodosAlunos(extrairLista<AlunoAgendamento>(alunoRes.data, "alunos"));
      })

      .catch((err) => {
        console.error("Erro ao carregar dados da edição:", err);

        notify.error(
          "Erro ao carregar dados. Algumas opções podem estar indisponíveis.",
        );
      })

      .finally(() => setCarregando(false));
  }, [visible, agendamento]);

  if (!agendamento) return null;

  const alunosDisponiveis = todosAlunos

    .filter((a) => a.id && a.nome && !alunos.find((s) => s.id === a.id))

    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    );

  async function salvar() {
    setSalvando(true);

    try {
      const payload = {
        dataHora: `${diaDeDataHora(agendamento!.dataHora)}T${horario}:00`,

        professorId: Number(professorId),

        salaId: Number(salaId),

        especialidadeId: Number(especialidadeId),

        alunoIds: alunos.map((a) => a.id),
      };

      await api.patch(`api/agendamentos/${agendamento!.id}`, payload);

      notify.success("Aula atualizada com sucesso!");

      onSalvo();
    } catch (error: any) {
      console.error("Erro ao salvar aula:", error?.response?.data);

      const data = error?.response?.data;

      notify.error(
        (typeof data === "string" ? data : data?.message || data?.erro) ||
          "Erro ao salvar alterações.",
      );
    } finally {
      setSalvando(false);
    }
  }

  const opcoesHorario: Opcao[] = horariosDisponiveis().map((h) => ({
    label: `${h}h`,
    value: h,
  }));

  const opcoesProfessor: Opcao[] = professores.map((p) => ({
    label: p.nome,
    value: String(p.id),
  }));

  const opcoesSala: Opcao[] = salas.map((s) => ({
    label: s.nome,
    value: String(s.id),
  }));

  const opcoesEspecialidade: Opcao[] = especialidades.map((e) => ({
    label: e.nome,

    value: String(e.id),
  }));

  const opcoesAluno: Opcao[] = alunosDisponiveis.map((a) => ({
    label: `${a.nome}${a.alunoComLimitacoesFisicas ? " (PCD)" : ""}`,

    value: String(a.id),
  }));

  const nomeDe = (lista: Opcao[], valor: string, vazio: string) =>
    lista.find((o) => o.value === valor)?.label || vazio;

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
            <Text style={styles.titulo}>Editar aula</Text>

            <TouchableOpacity style={styles.iconBtn} onPress={onFechar}>
              <Feather name="x" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          {carregando ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#f77433" />
            </View>
          ) : (
            <ScrollView style={styles.body} keyboardShouldPersistTaps="handled">
              <CampoSelecao
                rotulo="Horário"
                icone="clock"
                valor={horario ? `${horario}h` : "Selecione"}
                onPress={() => setCampoAberto("horario")}
              />

              <CampoSelecao
                rotulo="Especialidade"
                icone="hash"
                valor={nomeDe(
                  opcoesEspecialidade,
                  especialidadeId,
                  "Selecione",
                )}
                onPress={() => setCampoAberto("especialidade")}
              />

              <CampoSelecao
                rotulo="Sala"
                icone="map-pin"
                valor={nomeDe(opcoesSala, salaId, "Selecione")}
                onPress={() => setCampoAberto("sala")}
              />

              <CampoSelecao
                rotulo="Professor"
                icone="user"
                valor={nomeDe(opcoesProfessor, professorId, "Selecione")}
                onPress={() => setCampoAberto("professor")}
              />

              <View style={styles.alunosHeader}>
                <Text style={styles.label}>Alunos ({alunos.length})</Text>

                <TouchableOpacity
                  style={styles.btnAdicionar}
                  onPress={() => setCampoAberto("aluno")}
                >
                  <Feather name="user-plus" size={14} color="#f77433" />

                  <Text style={styles.btnAdicionarTexto}>Adicionar</Text>
                </TouchableOpacity>
              </View>

              {alunos.length === 0 ? (
                <Text style={styles.semAlunos}>Nenhum aluno na aula.</Text>
              ) : (
                alunos.map((aluno) => (
                  <View key={aluno.id} style={styles.alunoChip}>
                    <Text style={styles.alunoNome} numberOfLines={1}>
                      {aluno.nome}

                      {aluno.alunoComLimitacoesFisicas ? " · PCD" : ""}
                    </Text>

                    <TouchableOpacity
                      onPress={() =>
                        setAlunos((prev) =>
                          prev.filter((a) => a.id !== aluno.id),
                        )
                      }
                      style={styles.iconBtn}
                    >
                      <Feather name="trash-2" size={15} color="#e11d48" />
                    </TouchableOpacity>
                  </View>
                ))
              )}

              <TouchableOpacity
                style={[styles.btnSalvar, salvando && styles.btnDesabilitado]}
                onPress={salvar}
                disabled={salvando}
              >
                {salvando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="save" size={17} color="#fff" />

                    <Text style={styles.btnSalvarTexto}>Salvar alterações</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </View>

      <SelectSheet
        visible={campoAberto === "horario"}
        titulo="Horário"
        opcoes={opcoesHorario}
        valor={horario}
        onSelecionar={setHorario}
        onFechar={() => setCampoAberto(null)}
      />

      <SelectSheet
        visible={campoAberto === "especialidade"}
        titulo="Especialidade"
        opcoes={opcoesEspecialidade}
        valor={especialidadeId}
        onSelecionar={setEspecialidadeId}
        onFechar={() => setCampoAberto(null)}
      />

      <SelectSheet
        visible={campoAberto === "sala"}
        titulo="Sala"
        opcoes={opcoesSala}
        valor={salaId}
        onSelecionar={setSalaId}
        onFechar={() => setCampoAberto(null)}
      />

      <SelectSheet
        visible={campoAberto === "professor"}
        titulo="Professor"
        opcoes={opcoesProfessor}
        valor={professorId}
        onSelecionar={setProfessorId}
        onFechar={() => setCampoAberto(null)}
      />

      <SelectSheet
        visible={campoAberto === "aluno"}
        titulo="Adicionar aluno"
        opcoes={opcoesAluno}
        valor=""
        onSelecionar={(valor) => {
          const aluno = todosAlunos.find((a) => String(a.id) === valor);

          if (aluno) setAlunos((prev) => [...prev, aluno]);
        }}
        onFechar={() => setCampoAberto(null)}
      />
    </Modal>
  );
}

function CampoSelecao({
  rotulo,

  icone,

  valor,

  onPress,
}: {
  rotulo: string;

  icone: keyof typeof Feather.glyphMap;

  valor: string;

  onPress: () => void;
}) {
  return (
    <View style={styles.campo}>
      <Text style={styles.label}>{rotulo}</Text>

      <TouchableOpacity
        style={styles.campoBotao}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Feather name={icone} size={17} color="#94a3b8" />

        <Text style={styles.campoValor} numberOfLines={1}>
          {valor}
        </Text>

        <Feather name="chevron-down" size={17} color="#94a3b8" />
      </TouchableOpacity>
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

    maxHeight: "88%",

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

    justifyContent: "space-between",

    paddingHorizontal: 20,

    paddingTop: 14,

    paddingBottom: 10,
  },

  titulo: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },

  iconBtn: { padding: 7 },

  center: { paddingVertical: 60, alignItems: "center" },

  body: { paddingHorizontal: 20, paddingTop: 6 },

  campo: { marginBottom: 14 },

  label: { fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 7 },

  campoBotao: {
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

  campoValor: { flex: 1, fontSize: 15, color: "#0f172a" },

  alunosHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 8,

    marginBottom: 10,
  },

  btnAdicionar: {
    flexDirection: "row",

    alignItems: "center",

    gap: 5,

    backgroundColor: "#fff3eb",

    paddingHorizontal: 12,

    paddingVertical: 7,

    borderRadius: 9,
  },

  btnAdicionarTexto: { color: "#f77433", fontWeight: "700", fontSize: 12.5 },

  semAlunos: {
    fontSize: 13.5,
    color: "#94a3b8",
    fontStyle: "italic",
    marginBottom: 8,
  },

  alunoChip: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#f8fafc",

    borderRadius: 11,

    paddingLeft: 14,

    paddingRight: 4,

    paddingVertical: 9,

    marginBottom: 8,
  },

  alunoNome: { flex: 1, fontSize: 14, color: "#334155", fontWeight: "500" },

  btnSalvar: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: "#f77433",

    borderRadius: 12,

    paddingVertical: 15,

    marginTop: 18,
  },

  btnDesabilitado: { opacity: 0.6 },

  btnSalvarTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },
});
