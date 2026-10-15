import { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";

import { Feather } from "@expo/vector-icons";

import { useRouter } from "expo-router";

import DateTimePicker from "@react-native-community/datetimepicker";

import api from "@/services/api";

import { notify } from "@/utils/notify";

import {
  AlunoAgendamento,
  Especialidade,
  ProfessorResumo,
  Sala,
} from "@/types/agenda";

import StepIndicator from "@/components/form/StepIndicator";

import CampoSelecao from "@/components/form/CampoSelecao";

import SelectSheet, { Opcao } from "@/components/agenda/SelectSheet";

import {
  dataParaIso,
  ehFimDeSemana,
  formatarDataExtensa,
  horariosDisponiveis,
  isoParaData,
  somarHoras,
} from "@/utils/utils";

const ETAPAS = [
  { label: "Data e Hora" },

  { label: "Turma" },

  { label: "Alunos" },

  { label: "Confirmação" },
];

type CampoAberto =
  | "horario"
  | "especialidade"
  | "sala"
  | "professor"
  | "aluno"
  | null;

type Erros = Record<string, string>;

function extrairLista<T>(payload: any, chave?: string): T[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (chave && Array.isArray(payload[chave])) return payload[chave];

  if (Array.isArray(payload.content)) return payload.content;

  if (Array.isArray(payload.data)) return payload.data;

  return [];
}

export default function AulaForm({
  dataInicial,

  horarioInicial,
}: {
  dataInicial?: string;

  horarioInicial?: string;
}) {
  const router = useRouter();

  const [etapaAtual, setEtapaAtual] = useState(1);

  const [erros, setErros] = useState<Erros>({});

  const [carregando, setCarregando] = useState(false);

  const [conflitos, setConflitos] = useState<string[] | null>(null);

  const [data, setData] = useState(() =>
    dataInicial && !ehFimDeSemana(isoParaData(dataInicial)) ? dataInicial : "",
  );

  const [horario, setHorario] = useState(horarioInicial || "");

  const [especialidadeId, setEspecialidadeId] = useState("");

  const [salaId, setSalaId] = useState("");

  const [professorId, setProfessorId] = useState("");

  const [alunos, setAlunos] = useState<AlunoAgendamento[]>([]);

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  const [salas, setSalas] = useState<Sala[]>([]);

  const [professores, setProfessores] = useState<ProfessorResumo[]>([]);

  const [todosAlunos, setTodosAlunos] = useState<AlunoAgendamento[]>([]);

  const [campoAberto, setCampoAberto] = useState<CampoAberto>(null);

  const [dataAberta, setDataAberta] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get("api/especialidades").catch(() => ({ data: [] })),

      api.get("api/alunos").catch(() => ({ data: [] })),
    ])

      .then(([espRes, alunoRes]) => {
        setEspecialidades(
          extrairLista<Especialidade>(espRes.data, "especialidades"),
        );

        setTodosAlunos(
          extrairLista<AlunoAgendamento>(alunoRes.data, "alunos").filter(
            (a) => a.id && a.nome,
          ),
        );
      })

      .catch((error) => {
        console.error("Erro ao carregar dados:", error);

        notify.error("Não foi possível carregar os dados. Tente novamente.");
      });
  }, []);

  // Salas dependem da especialidade escolhida.

  useEffect(() => {
    setSalaId("");

    setProfessorId("");

    if (!especialidadeId) {
      setSalas([]);

      return;
    }

    api

      .get(`api/especialidades/salas/${especialidadeId}`)

      .then((res) => setSalas(extrairLista<Sala>(res.data, "salas")))

      .catch((err) => {
        console.error("Erro ao carregar salas:", err);

        setSalas([]);
      });
  }, [especialidadeId]);

  // Professores dependem da especialidade e só ficam disponíveis após escolher a sala.

  useEffect(() => {
    setProfessorId("");

    if (!especialidadeId || !salaId) {
      setProfessores([]);

      return;
    }

    api

      .get(`api/especialidades/professores/${especialidadeId}`)

      .then((res) =>
        setProfessores(extrairLista<ProfessorResumo>(res.data, "professores")),
      )

      .catch((err) => {
        console.error("Erro ao carregar professores:", err);

        setProfessores([]);
      });
  }, [salaId, especialidadeId]);

  function onChangeData(_event: any, selecionada?: Date) {
    if (Platform.OS !== "ios") setDataAberta(false);

    if (!selecionada) return;

    if (ehFimDeSemana(selecionada)) {
      notify.warning("Aulas não podem ser agendadas aos sábados e domingos.");

      return;
    }

    setData(dataParaIso(selecionada));

    setErros((prev) => ({ ...prev, data: "" }));
  }

  function validarEtapa(): boolean {
    const novos: Erros = {};

    if (etapaAtual === 1) {
      if (!data) novos.data = "Data é obrigatória";

      if (!horario) novos.horario = "Horário é obrigatório";
    }

    if (etapaAtual === 2) {
      if (!especialidadeId) novos.especialidade = "Especialidade é obrigatória";

      if (!salaId) novos.sala = "Sala é obrigatória";

      if (!professorId) novos.professor = "Professor é obrigatório";
    }

    if (etapaAtual === 3) {
      if (alunos.length === 0) novos.alunos = "Selecione pelo menos um aluno";
    }

    setErros(novos);

    return Object.keys(novos).length === 0;
  }

  function proximaEtapa() {
    if (!validarEtapa()) {
      notify.warning("Preencha todos os campos obrigatórios.");

      return;
    }

    if (etapaAtual < 4) setEtapaAtual(etapaAtual + 1);
  }

  // A tela permanece montada no navegador de tabs, então limpamos ao sair para não reabrir preenchida.

  function resetar() {
    setEtapaAtual(1);

    setErros({});

    setConflitos(null);

    setData(
      dataInicial && !ehFimDeSemana(isoParaData(dataInicial))
        ? dataInicial
        : "",
    );

    setHorario(horarioInicial || "");

    setEspecialidadeId("");

    setSalaId("");

    setProfessorId("");

    setAlunos([]);
  }

  function cancelar() {
    Alert.alert(
      "Cancelar cadastro?",
      "Tem certeza? Todos os dados serão perdidos.",
      [
        { text: "Não, continuar", style: "cancel" },

        {
          text: "Sim, cancelar",

          style: "destructive",

          onPress: () => {
            resetar();

            router.back();
          },
        },
      ],
    );
  }

  async function criarAula(usarAbsoluto = false) {
    setCarregando(true);

    try {
      const payload = {
        dataHora: `${data}T${horario}:00`,

        professorId: Number(professorId),

        salaId: Number(salaId),

        especialidadeId: Number(especialidadeId),

        alunoIds: alunos
          .map((a) => Number(a.id))
          .filter((id) => Number.isFinite(id) && id > 0),
      };

      await api.post(
        usarAbsoluto ? "api/agendamentos/absoluto" : "api/agendamentos",
        payload,
      );

      notify.success("Aula criada com sucesso!");

      const destino = {
        idProfessor: String(professorId),
        idSala: String(salaId),
      };

      resetar();

      // Volta para a agenda já filtrada na turma criada (mesmo comportamento do web).

      router.replace({ pathname: "/(secretary)/agenda", params: destino });
    } catch (error: any) {
      const resposta = error?.response?.data;

      const listaConflitos = Array.isArray(resposta?.erros)
        ? resposta.erros
        : [];

      if (listaConflitos.length) {
        setConflitos(listaConflitos.map(String));

        return;
      }

      console.error("Erro ao criar aula:", resposta);

      notify.error(
        (typeof resposta === "string"
          ? resposta
          : resposta?.erro || resposta?.message) ||
          "Erro ao criar aula. Tente novamente.",
      );
    } finally {
      setCarregando(false);
    }
  }

  const alunosDisponiveis = todosAlunos

    .filter((a) => !alunos.find((s) => s.id === a.id))

    .sort((a, b) =>
      a.nome.localeCompare(b.nome, "pt-BR", { sensitivity: "base" }),
    );

  const opcoesHorario: Opcao[] = horariosDisponiveis().map((h) => ({
    label: `${h}h`,
    value: h,
  }));

  const opcoesEspecialidade: Opcao[] = especialidades.map((e) => ({
    label: e.nome,

    value: String(e.id),
  }));

  const opcoesSala: Opcao[] = salas.map((s) => ({
    label: s.nome,
    value: String(s.id),
  }));

  const opcoesProfessor: Opcao[] = professores.map((p) => ({
    label: p.nome,
    value: String(p.id),
  }));

  const opcoesAluno: Opcao[] = alunosDisponiveis.map((a) => ({
    label: `${a.nome}${a.alunoComLimitacoesFisicas ? " (PCD)" : ""}`,

    value: String(a.id),
  }));

  const nomeDe = (lista: Opcao[], valor: string) =>
    lista.find((o) => o.value === valor)?.label;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={cancelar}>
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.title}>Criar aula</Text>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Etapa {etapaAtual} de {ETAPAS.length}
            </Text>
          </View>
        </View>

        <StepIndicator
          etapas={ETAPAS}
          etapaAtual={etapaAtual}
          onIrParaEtapa={setEtapaAtual}
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {etapaAtual === 1 && (
          <EtapaCard
            icone="calendar"
            titulo="Quando será a aula?"
            subtitulo="Selecione a data e o horário de início"
          >
            <View style={styles.campo}>
              <Text style={styles.label}>
                Data<Text style={styles.obrigatorio}> *</Text>
              </Text>

              <TouchableOpacity
                style={[styles.campoBotao, !!erros.data && styles.campoErro]}
                onPress={() => setDataAberta(true)}
                activeOpacity={0.7}
              >
                <Feather name="calendar" size={17} color="#94a3b8" />

                <Text style={[styles.campoValor, !data && styles.placeholder]}>
                  {data ? formatarDataExtensa(data) : "Selecione a data"}
                </Text>
              </TouchableOpacity>

              {erros.data ? (
                <Text style={styles.erroTexto}>{erros.data}</Text>
              ) : null}
            </View>

            <CampoSelecao
              label="Horário"
              icone="clock"
              obrigatorio
              valor={horario ? `${horario}h` : ""}
              placeholder="Selecione um horário"
              erro={erros.horario}
              dica={
                horario
                  ? `Duração de 1 hora — término às ${somarHoras(horario, 1)}h`
                  : "As aulas duram 1 hora"
              }
              onPress={() => setCampoAberto("horario")}
            />
          </EtapaCard>
        )}

        {etapaAtual === 2 && (
          <EtapaCard
            icone="users"
            titulo="Qual é a turma?"
            subtitulo="Defina especialidade, sala e professor responsável"
          >
            <CampoSelecao
              label="Especialidade"
              icone="hash"
              obrigatorio
              valor={nomeDe(opcoesEspecialidade, especialidadeId)}
              placeholder="Selecione uma especialidade"
              erro={erros.especialidade}
              onPress={() => setCampoAberto("especialidade")}
            />

            <CampoSelecao
              label="Sala"
              icone="map-pin"
              obrigatorio
              valor={nomeDe(opcoesSala, salaId)}
              placeholder={
                especialidadeId
                  ? "Selecione uma sala"
                  : "Selecione a especialidade primeiro"
              }
              desabilitado={!especialidadeId}
              erro={erros.sala}
              dica={
                !especialidadeId
                  ? "Selecione a especialidade primeiro"
                  : undefined
              }
              onPress={() => setCampoAberto("sala")}
            />

            <CampoSelecao
              label="Professor"
              icone="user"
              obrigatorio
              valor={nomeDe(opcoesProfessor, professorId)}
              placeholder={
                salaId ? "Selecione um professor" : "Selecione a sala primeiro"
              }
              desabilitado={!especialidadeId || !salaId}
              erro={erros.professor}
              dica={
                especialidadeId && !salaId
                  ? "Selecione a sala primeiro"
                  : undefined
              }
              onPress={() => setCampoAberto("professor")}
            />
          </EtapaCard>
        )}

        {etapaAtual === 3 && (
          <EtapaCard
            icone="user-plus"
            titulo="Quais alunos participarão?"
            subtitulo="Selecione os alunos da turma"
          >
            <TouchableOpacity
              style={styles.btnAdicionar}
              onPress={() => setCampoAberto("aluno")}
              activeOpacity={0.8}
            >
              <Feather name="user-plus" size={16} color="#f77433" />

              <Text style={styles.btnAdicionarTexto}>Adicionar aluno</Text>
            </TouchableOpacity>

            {erros.alunos ? (
              <Text style={styles.erroTexto}>{erros.alunos}</Text>
            ) : null}

            <View style={styles.alunosHeader}>
              <Text style={styles.label}>Alunos selecionados</Text>

              {alunos.length > 0 && (
                <View style={styles.contador}>
                  <Text style={styles.contadorTexto}>{alunos.length}</Text>
                </View>
              )}
            </View>

            {alunos.length === 0 ? (
              <Text style={styles.semAlunos}>
                Nenhum aluno adicionado ainda
              </Text>
            ) : (
              alunos.map((aluno) => (
                <View key={aluno.id} style={styles.alunoChip}>
                  <Text style={styles.alunoNome} numberOfLines={1}>
                    {aluno.nome}

                    {aluno.alunoComLimitacoesFisicas ? " · PCD" : ""}
                  </Text>

                  <TouchableOpacity
                    style={styles.iconBtn}
                    onPress={() =>
                      setAlunos((prev) => prev.filter((a) => a.id !== aluno.id))
                    }
                  >
                    <Feather name="trash-2" size={15} color="#e11d48" />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </EtapaCard>
        )}

        {etapaAtual === 4 && (
          <EtapaCard
            icone="check-circle"
            titulo="Confirme os dados"
            subtitulo="Revise as informações antes de criar a aula"
          >
            <View style={styles.resumo}>
              <Text style={styles.resumoTitulo}>
                {nomeDe(opcoesEspecialidade, especialidadeId) || "—"} —{" "}
                {horario}h
              </Text>

              <Text style={styles.resumoSub}>
                {formatarDataExtensa(data)} ·{" "}
                {nomeDe(opcoesSala, salaId) || "—"} · Prof.{" "}
                {nomeDe(opcoesProfessor, professorId) || "—"}
              </Text>
            </View>

            <Secao titulo="Data e Hora" onEditar={() => setEtapaAtual(1)}>
              <Linha rotulo="Data" valor={formatarDataExtensa(data)} />

              <Linha
                rotulo="Horário"
                valor={`${horario}h às ${somarHoras(horario, 1)}h`}
              />
            </Secao>

            <Secao titulo="Turma" onEditar={() => setEtapaAtual(2)}>
              <Linha
                rotulo="Especialidade"
                valor={nomeDe(opcoesEspecialidade, especialidadeId)}
              />

              <Linha rotulo="Sala" valor={nomeDe(opcoesSala, salaId)} />

              <Linha
                rotulo="Professor"
                valor={nomeDe(opcoesProfessor, professorId)}
              />
            </Secao>

            <Secao
              titulo={`Alunos (${alunos.length})`}
              onEditar={() => setEtapaAtual(3)}
            >
              {alunos.map((a) => (
                <Linha
                  key={a.id}
                  rotulo={a.nome}
                  valor={a.alunoComLimitacoesFisicas ? "PCD" : "—"}
                />
              ))}
            </Secao>
          </EtapaCard>
        )}

        <View style={styles.acoes}>
          {etapaAtual > 1 && (
            <TouchableOpacity
              style={styles.btnVoltar}
              onPress={() => setEtapaAtual(etapaAtual - 1)}
              disabled={carregando}
            >
              <Feather name="arrow-left" size={16} color="#475569" />

              <Text style={styles.btnVoltarTexto}>Voltar</Text>
            </TouchableOpacity>
          )}

          {etapaAtual < 4 ? (
            <TouchableOpacity style={styles.btnProximo} onPress={proximaEtapa}>
              <Text style={styles.btnProximoTexto}>Próximo</Text>

              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnCriar, carregando && styles.btnDesabilitado]}
              onPress={() => criarAula(false)}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={17} color="#fff" />

                  <Text style={styles.btnCriarTexto}>Confirmar e criar</Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {dataAberta && (
        <DateTimePicker
          value={isoParaData(data)}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onValueChange={onChangeData}
          onDismiss={() => setDataAberta(false)}
        />
      )}

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

          if (aluno) {
            setAlunos((prev) => [...prev, aluno]);

            setErros((prev) => ({ ...prev, alunos: "" }));
          }
        }}
        onFechar={() => setCampoAberto(null)}
      />

      <ModalConflitos
        conflitos={conflitos}
        carregando={carregando}
        onCancelar={() => setConflitos(null)}
        onConfirmar={() => {
          setConflitos(null);

          criarAula(true);
        }}
      />
    </KeyboardAvoidingView>
  );
}

function ModalConflitos({
  conflitos,

  carregando,

  onCancelar,

  onConfirmar,
}: {
  conflitos: string[] | null;

  carregando: boolean;

  onCancelar: () => void;

  onConfirmar: () => void;
}) {
  return (
    <Modal
      visible={!!conflitos}
      transparent
      animationType="fade"
      onRequestClose={onCancelar}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <View style={styles.modalIcone}>
              <Feather name="alert-triangle" size={22} color="#c94d0e" />
            </View>

            <View style={styles.flex1}>
              <Text style={styles.modalTitulo}>Conflito de agendamento</Text>

              <Text style={styles.modalSubtitulo}>
                Foram encontrados conflitos. Deseja continuar mesmo assim?
              </Text>
            </View>
          </View>

          <ScrollView style={styles.modalLista}>
            {(conflitos || []).map((erro, i) => (
              <View key={`${i}-${erro}`} style={styles.conflitoItem}>
                <Text style={styles.conflitoBullet}>•</Text>

                <Text style={styles.conflitoTexto}>{erro}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.modalAcoes}>
            <TouchableOpacity
              style={styles.modalBtnCancelar}
              onPress={onCancelar}
            >
              <Text style={styles.modalBtnCancelarTexto}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalBtnConfirmar}
              onPress={onConfirmar}
              disabled={carregando}
            >
              <Text style={styles.modalBtnConfirmarTexto}>
                Criar mesmo assim
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

function EtapaCard({
  icone,

  titulo,

  subtitulo,

  children,
}: {
  icone: keyof typeof Feather.glyphMap;

  titulo: string;

  subtitulo: string;

  children: React.ReactNode;
}) {
  return (
    <View style={styles.card}>
      <View style={styles.etapaHeader}>
        <View style={styles.etapaIcon}>
          <Feather name={icone} size={18} color="#f77433" />
        </View>

        <View style={styles.flex1}>
          <Text style={styles.etapaTitle}>{titulo}</Text>

          <Text style={styles.etapaSubtitle}>{subtitulo}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

function Secao({
  titulo,

  onEditar,

  children,
}: {
  titulo: string;

  onEditar: () => void;

  children: React.ReactNode;
}) {
  return (
    <View style={styles.secao}>
      <View style={styles.secaoHeader}>
        <Text style={styles.secaoTitulo}>{titulo}</Text>

        <TouchableOpacity style={styles.btnEditarMini} onPress={onEditar}>
          <Feather name="edit-2" size={12} color="#f77433" />

          <Text style={styles.btnEditarMiniTexto}>Editar</Text>
        </TouchableOpacity>
      </View>

      {children}
    </View>
  );
}

function Linha({ rotulo, valor }: { rotulo: string; valor?: string }) {
  return (
    <View style={styles.linha}>
      <Text style={styles.linhaRotulo}>{rotulo}</Text>

      <Text style={styles.linhaValor}>{valor || "—"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    backgroundColor: "#fff",

    paddingHorizontal: 16,

    paddingTop: 16,

    paddingBottom: 12,

    borderBottomWidth: 1,

    borderBottomColor: "#f1f5f9",
  },

  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },

  backButton: {
    width: 40,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#f8fafc",

    justifyContent: "center",

    alignItems: "center",
  },

  title: {
    flex: 1,
    fontSize: 18,
    fontWeight: "bold",
    color: "#0f172a",
    marginLeft: 12,
  },

  stepBadge: {
    backgroundColor: "#fff3eb",

    borderRadius: 12,

    paddingHorizontal: 10,

    paddingVertical: 5,
  },

  stepBadgeText: { fontSize: 12, color: "#f77433", fontWeight: "600" },

  scroll: { flex: 1 },

  scrollContent: { padding: 16, paddingBottom: 48 },

  card: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 20,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: "#f1f5f9",
  },

  etapaHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    gap: 12,
  },

  etapaIcon: {
    width: 40,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#fff3eb",

    justifyContent: "center",

    alignItems: "center",
  },

  flex1: { flex: 1 },

  etapaTitle: { fontSize: 17, fontWeight: "bold", color: "#0f172a" },

  etapaSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },

  campo: { marginBottom: 16 },

  label: { fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 7 },

  obrigatorio: { color: "#ef4444" },

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

  campoErro: { borderColor: "#fca5a5" },

  campoValor: { flex: 1, fontSize: 15, color: "#0f172a" },

  placeholder: { color: "#94a3b8" },

  erroTexto: { fontSize: 12, color: "#ef4444", marginTop: 4 },

  btnAdicionar: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 7,

    backgroundColor: "#fff3eb",

    borderRadius: 12,

    paddingVertical: 13,

    borderWidth: 1.5,

    borderColor: "#ffd9c2",
  },

  btnAdicionarTexto: { color: "#f77433", fontWeight: "700", fontSize: 14 },

  alunosHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginTop: 20,

    marginBottom: 10,
  },

  contador: {
    backgroundColor: "#f77433",

    minWidth: 24,

    height: 24,

    borderRadius: 12,

    alignItems: "center",

    justifyContent: "center",

    paddingHorizontal: 7,
  },

  contadorTexto: { color: "#fff", fontWeight: "bold", fontSize: 12 },

  semAlunos: { fontSize: 13.5, color: "#94a3b8", fontStyle: "italic" },

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

  iconBtn: { padding: 7 },

  resumo: {
    backgroundColor: "#fff3eb",

    borderRadius: 12,

    padding: 14,

    marginBottom: 18,
  },

  resumoTitulo: { fontSize: 15.5, fontWeight: "bold", color: "#c2410c" },

  resumoSub: { fontSize: 12.5, color: "#9a3412", marginTop: 4, lineHeight: 18 },

  secao: { marginBottom: 18 },

  secaoHeader: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    marginBottom: 8,

    paddingBottom: 6,

    borderBottomWidth: 1,

    borderBottomColor: "#f1f5f9",
  },

  secaoTitulo: { fontSize: 14, fontWeight: "bold", color: "#f77433" },

  btnEditarMini: { flexDirection: "row", alignItems: "center", gap: 4 },

  btnEditarMiniTexto: { fontSize: 12, color: "#f77433", fontWeight: "600" },

  linha: {
    flexDirection: "row",

    justifyContent: "space-between",

    paddingVertical: 6,

    gap: 12,
  },

  linhaRotulo: { fontSize: 13, color: "#64748b", flex: 1 },

  linhaValor: {
    fontSize: 13.5,
    color: "#0f172a",
    fontWeight: "600",
    textAlign: "right",
  },

  acoes: { flexDirection: "row", gap: 12 },

  btnVoltar: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    backgroundColor: "#e2e8f0",

    borderRadius: 12,

    paddingVertical: 15,

    paddingHorizontal: 20,
  },

  btnVoltarTexto: { color: "#475569", fontSize: 15, fontWeight: "bold" },

  btnProximo: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    backgroundColor: "#f77433",

    borderRadius: 12,

    paddingVertical: 15,
  },

  btnProximoTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  btnCriar: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: "#16a34a",

    borderRadius: 12,

    paddingVertical: 15,
  },

  btnDesabilitado: { opacity: 0.6 },

  btnCriarTexto: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(15,23,42,0.45)",

    justifyContent: "center",

    padding: 24,
  },

  modalContent: {
    backgroundColor: "#fff",

    borderRadius: 20,

    overflow: "hidden",

    maxHeight: "75%",
  },

  modalHeader: {
    flexDirection: "row",

    gap: 14,

    padding: 20,

    borderBottomWidth: 1,

    borderBottomColor: "#f1f5f9",
  },

  modalIcone: {
    width: 48,

    height: 48,

    borderRadius: 14,

    backgroundColor: "#fff4ee",

    alignItems: "center",

    justifyContent: "center",
  },

  modalTitulo: { fontSize: 16, fontWeight: "bold", color: "#0f172a" },

  modalSubtitulo: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 3,
    lineHeight: 18,
  },

  modalLista: { paddingHorizontal: 20, paddingTop: 16 },

  conflitoItem: {
    flexDirection: "row",

    gap: 10,

    backgroundColor: "#fff7ed",

    borderWidth: 1,

    borderColor: "#ffedd5",

    borderRadius: 12,

    padding: 12,

    marginBottom: 10,
  },

  conflitoBullet: { color: "#f77433", fontWeight: "bold", fontSize: 15 },

  conflitoTexto: { flex: 1, fontSize: 13, color: "#475569", lineHeight: 19 },

  modalAcoes: {
    flexDirection: "row",

    justifyContent: "flex-end",

    gap: 10,

    padding: 16,

    borderTopWidth: 1,

    borderTopColor: "#f1f5f9",
  },

  modalBtnCancelar: {
    paddingHorizontal: 18,

    paddingVertical: 11,

    borderRadius: 12,

    borderWidth: 1,

    borderColor: "#e2e8f0",
  },

  modalBtnCancelarTexto: { color: "#475569", fontWeight: "600", fontSize: 14 },

  modalBtnConfirmar: {
    paddingHorizontal: 18,

    paddingVertical: 11,

    borderRadius: 12,

    backgroundColor: "#f77433",
  },

  modalBtnConfirmarTexto: { color: "#fff", fontWeight: "bold", fontSize: 14 },
});
