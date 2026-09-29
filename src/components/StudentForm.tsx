import { useEffect, useState } from "react";

import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Switch,
  Modal,
  FlatList,
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
  formatarTelefone,
  formatarCep,
  formatarCpf,
  somenteDigitos,
  validarEmail,
  validarCpf,
  getEstadoNome,
  dataParaIso,
  isoParaData,
} from "@/utils/utils";

interface DadosPessoais {
  nomeCompleto: string;

  email: string;

  cpf: string;

  dataNascimento: string;

  telefone: string;
}

interface EnderecoForm {
  cep: string;

  logradouro: string;

  numero: string;

  bairro: string;

  cidade: string;

  estado: string;

  uf: string;
}

interface InformacoesAluno {
  problemasMobilidade: boolean;

  notificacaoAtiva: boolean;

  observacao: string;
}

type Erros = Record<string, string>;

const UFS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",

  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

const ETAPAS = [
  { label: "Dados Pessoais" },

  { label: "Endereço" },

  { label: "Informações" },

  { label: "Confirmação" },
];

function formatarDataBr(iso?: string): string {
  if (!iso) return "";

  const [ano, mes, dia] = iso.split("-");

  if (!ano || !mes || !dia) return iso;

  return `${dia}/${mes}/${ano}`;
}

export default function StudentForm({ alunoId }: { alunoId?: string }) {
  const router = useRouter();

  const isEditMode = !!alunoId;

  const [etapaAtual, setEtapaAtual] = useState(1);

  const [carregando, setCarregando] = useState(false);

  const [carregandoDados, setCarregandoDados] = useState(isEditMode);

  const [erros, setErros] = useState<Erros>({});

  const [dadosPessoais, setDadosPessoais] = useState<DadosPessoais>({
    nomeCompleto: "",

    email: "",

    cpf: "",

    dataNascimento: "",

    telefone: "",
  });

  const [endereco, setEndereco] = useState<EnderecoForm>({
    cep: "",

    logradouro: "",

    numero: "",

    bairro: "",

    cidade: "",

    estado: "",

    uf: "",
  });

  const [informacoesAluno, setInformacoesAluno] = useState<InformacoesAluno>({
    problemasMobilidade: false,

    notificacaoAtiva: true,

    observacao: "",
  });

  const [semNumero, setSemNumero] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showUfModal, setShowUfModal] = useState(false);

  // Carrega o aluno no modo edição.

  useEffect(() => {
    if (!isEditMode) return;

    api

      .get(`api/alunos/${alunoId}`)

      .then((res) => {
        const a = res.data;

        setDadosPessoais({
          nomeCompleto: a.nome || "",

          email: a.email || "",

          cpf: formatarCpf(a.cpf) || "",

          dataNascimento: a.dataNascimento
            ? a.dataNascimento.substring(0, 10)
            : "",

          telefone: formatarTelefone(a.telefone) || "",
        });

        setEndereco({
          cep: formatarCep(a.endereco?.cep) || "",

          logradouro: a.endereco?.rua || "",

          numero: a.endereco?.numero || "",

          bairro: a.endereco?.bairro || "",

          cidade: a.endereco?.cidade || "",

          estado: a.endereco?.estado || "",

          uf: a.endereco?.uf || "",
        });

        setInformacoesAluno({
          problemasMobilidade: a.alunoComLimitacoesFisicas ?? false,

          notificacaoAtiva: a.notificacaoAtiva ?? true,

          observacao: a.observacao || "",
        });
      })

      .catch((err) => {
        console.error("Erro ao carregar aluno para edição:", err);

        notify.error("Não foi possível carregar os dados do aluno.");

        router.back();
      })

      .finally(() => setCarregandoDados(false));
  }, [alunoId]);

  useEffect(() => {
    if (endereco.numero === "0" || endereco.numero.toUpperCase() === "S/N") {
      setSemNumero(true);
    }
  }, [endereco.numero]);

  function limparErros(campos: string[]) {
    setErros((prev) => {
      if (!campos.some((c) => prev[c])) return prev;

      const novos = { ...prev };

      campos.forEach((c) => delete novos[c]);

      return novos;
    });
  }

  function atualizarDadosPessoais(novos: Partial<DadosPessoais>) {
    setDadosPessoais((prev) => ({ ...prev, ...novos }));

    limparErros(Object.keys(novos));
  }

  function atualizarEndereco(novos: Partial<EnderecoForm>) {
    setEndereco((prev) => ({ ...prev, ...novos }));

    limparErros(Object.keys(novos));
  }

  function atualizarInformacoes(novos: Partial<InformacoesAluno>) {
    setInformacoesAluno((prev) => ({ ...prev, ...novos }));
  }

  function toggleSemNumero(checked: boolean) {
    setSemNumero(checked);

    atualizarEndereco({ numero: checked ? "0" : "" });
  }

  // Busca CEP no ViaCEP quando completa 8 dígitos.

  async function buscarCep(valor: string) {
    const cepLimpo = valor.replace(/\D/g, "");

    if (cepLimpo.length !== 8) return;

    try {
      const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);

      const data = await res.json();

      if (!data.erro) {
        atualizarEndereco({
          logradouro: data.logradouro || "",

          bairro: data.bairro || "",

          cidade: data.localidade || "",

          uf: data.uf || "",

          estado: data.estado || getEstadoNome(data.uf) || "",
        });
      } else {
        notify.warning("CEP não encontrado. Verifique o CEP digitado.");
      }
    } catch (err) {
      console.error("Erro ao buscar CEP:", err);

      notify.error("Erro ao buscar CEP. Tente novamente.");
    }
  }

  function manipularCep(valor: string) {
    const formatado = formatarCep(valor);

    atualizarEndereco({ cep: formatado });

    if (somenteDigitos(formatado).length === 8) buscarCep(formatado);
  }

  function onChangeDate(_event: any, selected?: Date) {
    if (Platform.OS !== "ios") setShowDatePicker(false);

    if (!selected) return;

    atualizarDadosPessoais({ dataNascimento: dataParaIso(selected) });
  }

  function validarEtapa(): boolean {
    const novosErros: Erros = {};

    if (etapaAtual === 1) {
      if (!dadosPessoais.nomeCompleto.trim()) {
        novosErros.nomeCompleto = "Nome completo é obrigatório";
      }

      if (!dadosPessoais.email.trim()) {
        novosErros.email = "Email é obrigatório";
      } else if (!validarEmail(dadosPessoais.email)) {
        novosErros.email = "Email inválido";
      }

      if (!dadosPessoais.cpf.trim()) {
        novosErros.cpf = "CPF é obrigatório";
      } else if (!validarCpf(dadosPessoais.cpf)) {
        novosErros.cpf = "CPF inválido";
      }

      if (!dadosPessoais.dataNascimento) {
        novosErros.dataNascimento = "Data de nascimento é obrigatória";
      } else {
        const hoje = new Date();

        hoje.setHours(0, 0, 0, 0);

        const nascimento = new Date(dadosPessoais.dataNascimento);

        if (nascimento >= hoje) {
          novosErros.dataNascimento =
            "Data de nascimento não pode ser hoje ou no futuro";
        } else {
          const anos =
            (hoje.getTime() - nascimento.getTime()) /
            (1000 * 60 * 60 * 24 * 365.25);

          if (anos > 120)
            novosErros.dataNascimento = "Data de nascimento inválida";
        }
      }

      if (!dadosPessoais.telefone.trim()) {
        novosErros.telefone = "Telefone é obrigatório";
      } else if (somenteDigitos(dadosPessoais.telefone).length < 10) {
        novosErros.telefone = "Telefone inválido (mínimo 10 dígitos)";
      }
    }

    if (etapaAtual === 2) {
      const cepLimpo = somenteDigitos(endereco.cep);

      if (!endereco.cep.trim()) {
        novosErros.cep = "CEP é obrigatório";
      } else if (cepLimpo.length !== 8) {
        novosErros.cep = "CEP inválido (deve ter 8 dígitos)";
      }

      if (!endereco.logradouro.trim())
        novosErros.logradouro = "Logradouro é obrigatório";

      if (!semNumero && !endereco.numero.trim())
        novosErros.numero = "Número é obrigatório";

      if (!endereco.bairro.trim()) novosErros.bairro = "Bairro é obrigatório";

      if (!endereco.cidade.trim()) novosErros.cidade = "Cidade é obrigatória";

      if (!endereco.estado) novosErros.estado = "Estado é obrigatório";

      if (!endereco.uf) novosErros.uf = "UF é obrigatória";
    }

    setErros(novosErros);

    return Object.keys(novosErros).length === 0;
  }

  function proximaEtapa() {
    if (validarEtapa()) {
      if (etapaAtual < 4) setEtapaAtual(etapaAtual + 1);
    } else {
      notify.warning("Preencha todos os campos obrigatórios corretamente.");
    }
  }

  function etapaAnterior() {
    if (etapaAtual > 1) setEtapaAtual(etapaAtual - 1);
  }

  function irParaEtapa(numero: number) {
    if (numero <= etapaAtual && numero >= 1) setEtapaAtual(numero);
  }

  async function salvarAluno() {
    setCarregando(true);

    const payload = {
      nome: dadosPessoais.nomeCompleto || "",

      email: dadosPessoais.email || "",

      cpf: somenteDigitos(dadosPessoais.cpf),

      dataNascimento: dadosPessoais.dataNascimento || "",

      status: true,

      alunoComLimitacoesFisicas: !!informacoesAluno.problemasMobilidade,

      observacao: informacoesAluno.observacao || "",

      telefone: somenteDigitos(dadosPessoais.telefone),

      notificacaoAtiva: !!informacoesAluno.notificacaoAtiva,

      endereco: {
        rua: endereco.logradouro || "",

        numero: endereco.numero || "",

        bairro: endereco.bairro || "",

        cidade: endereco.cidade || "",

        estado: endereco.estado || "",

        cep: somenteDigitos(endereco.cep),

        uf: endereco.uf || "",
      },
    };

    try {
      if (isEditMode) {
        await api.patch(`api/alunos/${alunoId}`, payload);

        notify.success("Aluno atualizado com sucesso!");
      } else {
        await api.post("api/alunos", payload);

        notify.success("Aluno cadastrado com sucesso!");
      }

      router.back();
    } catch (error) {
      console.error("Erro ao salvar aluno:", error);

      notify.error(
        isEditMode
          ? "Não foi possível atualizar o aluno."
          : "Não foi possível cadastrar o aluno.",
      );
    } finally {
      setCarregando(false);
    }
  }

  if (carregandoDados) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f77433" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}

      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.title}>
            {isEditMode ? "Editar Aluno" : "Cadastrar Aluno"}
          </Text>

          <View style={styles.stepBadge}>
            <Text style={styles.stepBadgeText}>
              Etapa {etapaAtual} de {ETAPAS.length}
            </Text>
          </View>
        </View>

        <StepIndicator currentStep={etapaAtual} onStepClick={irParaEtapa} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {etapaAtual === 1 && (
          <EtapaCard
            icone="user"
            titulo="Dados Pessoais"
            subtitulo="Informações básicas do aluno"
          >
            <Campo
              label="Nome completo"
              obrigatorio
              erro={erros.nomeCompleto}
              icone="user"
              value={dadosPessoais.nomeCompleto}
              onChangeText={(v) => atualizarDadosPessoais({ nomeCompleto: v })}
              placeholder="Digite o nome completo"
            />

            <Campo
              label="Email"
              obrigatorio
              erro={erros.email}
              icone="mail"
              value={dadosPessoais.email}
              onChangeText={(v) => atualizarDadosPessoais({ email: v })}
              placeholder="Digite o e-mail"
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Campo
              label="CPF"
              obrigatorio
              erro={erros.cpf}
              icone="credit-card"
              value={dadosPessoais.cpf}
              onChangeText={(v) =>
                atualizarDadosPessoais({ cpf: formatarCpf(v) })
              }
              placeholder="000.000.000-00"
              keyboardType="number-pad"
              maxLength={14}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Data de nascimento<Text style={styles.required}> *</Text>
              </Text>

              <TouchableOpacity
                style={[
                  styles.inputContainer,
                  erros.dataNascimento && styles.inputError,
                ]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Feather
                  name="calendar"
                  size={18}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />

                <Text
                  style={[
                    styles.input,
                    !dadosPessoais.dataNascimento && styles.placeholderText,
                  ]}
                >
                  {formatarDataBr(dadosPessoais.dataNascimento) || "dd/mm/aaaa"}
                </Text>
              </TouchableOpacity>

              {erros.dataNascimento ? (
                <Text style={styles.errorText}>{erros.dataNascimento}</Text>
              ) : null}

              {showDatePicker && (
                <DateTimePicker
                  value={isoParaData(dadosPessoais.dataNascimento)}
                  mode="date"
                  display={Platform.OS === "ios" ? "spinner" : "default"}
                  maximumDate={new Date()}
                  onValueChange={onChangeDate}
                  onDismiss={() => setShowDatePicker(false)}
                />
              )}
            </View>

            <Campo
              label="Telefone"
              obrigatorio
              erro={erros.telefone}
              icone="phone"
              value={dadosPessoais.telefone}
              onChangeText={(v) =>
                atualizarDadosPessoais({ telefone: formatarTelefone(v) })
              }
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              maxLength={16}
            />
          </EtapaCard>
        )}

        {etapaAtual === 2 && (
          <EtapaCard
            icone="map-pin"
            titulo="Endereço"
            subtitulo="Local de residência do aluno"
          >
            <Campo
              label="CEP"
              obrigatorio
              erro={erros.cep}
              icone="map-pin"
              value={endereco.cep}
              onChangeText={manipularCep}
              placeholder="00000-000"
              keyboardType="number-pad"
              maxLength={9}
            />

            <Campo
              label="Logradouro"
              obrigatorio
              erro={erros.logradouro}
              icone="map-pin"
              value={endereco.logradouro}
              onChangeText={(v) => atualizarEndereco({ logradouro: v })}
              placeholder="Rua Antônio Candido de Alvarenga"
            />

            <Campo
              label="Número"
              obrigatorio={!semNumero}
              erro={erros.numero}
              icone="hash"
              value={semNumero ? "S/N" : endereco.numero}
              onChangeText={(v) => atualizarEndereco({ numero: v })}
              placeholder="539"
              keyboardType="number-pad"
              editable={!semNumero}
            />

            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => toggleSemNumero(!semNumero)}
              activeOpacity={0.7}
            >
              <View
                style={[styles.checkbox, semNumero && styles.checkboxChecked]}
              >
                {semNumero && <Feather name="check" size={14} color="#fff" />}
              </View>

              <Text style={styles.checkboxLabel}>Sem número</Text>
            </TouchableOpacity>

            <Campo
              label="Bairro"
              obrigatorio
              erro={erros.bairro}
              icone="map-pin"
              value={endereco.bairro}
              onChangeText={(v) => atualizarEndereco({ bairro: v })}
              placeholder="Perus"
            />

            <Campo
              label="Cidade"
              obrigatorio
              erro={erros.cidade}
              icone="map-pin"
              value={endereco.cidade}
              onChangeText={(v) => atualizarEndereco({ cidade: v })}
              placeholder="São Paulo"
            />

            <Campo
              label="Estado"
              obrigatorio
              erro={erros.estado}
              icone="map"
              value={endereco.estado}
              onChangeText={(v) => atualizarEndereco({ estado: v })}
              placeholder="São Paulo"
              editable={false}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                UF<Text style={styles.required}> *</Text>
              </Text>

              <TouchableOpacity
                style={[styles.inputContainer, erros.uf && styles.inputError]}
                onPress={() => setShowUfModal(true)}
                activeOpacity={0.7}
              >
                <Feather
                  name="flag"
                  size={18}
                  color="#94a3b8"
                  style={styles.inputIcon}
                />

                <Text
                  style={[styles.input, !endereco.uf && styles.placeholderText]}
                >
                  {endereco.uf || "Selecione"}
                </Text>

                <Feather name="chevron-down" size={18} color="#94a3b8" />
              </TouchableOpacity>

              {erros.uf ? (
                <Text style={styles.errorText}>{erros.uf}</Text>
              ) : null}
            </View>
          </EtapaCard>
        )}

        {etapaAtual === 3 && (
          <EtapaCard
            icone="clipboard"
            titulo="Informações do Aluno"
            subtitulo="Dados de saúde e observações"
          >
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Problema de mobilidade</Text>

              <Switch
                value={informacoesAluno.problemasMobilidade}
                onValueChange={(v) =>
                  atualizarInformacoes({ problemasMobilidade: v })
                }
                trackColor={{ false: "#cbd5e1", true: "#f77433" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Ativar notificações por e-mail
              </Text>

              <Switch
                value={informacoesAluno.notificacaoAtiva}
                onValueChange={(v) =>
                  atualizarInformacoes({ notificacaoAtiva: v })
                }
                trackColor={{ false: "#cbd5e1", true: "#f77433" }}
                thumbColor="#fff"
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observações</Text>

              <TextInput
                style={styles.textarea}
                value={informacoesAluno.observacao}
                onChangeText={(v) => atualizarInformacoes({ observacao: v })}
                placeholder="Digite observações sobre o aluno..."
                placeholderTextColor="#94a3b8"
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>
          </EtapaCard>
        )}

        {etapaAtual === 4 && (
          <EtapaCard
            icone="check-circle"
            titulo="Revisão e Confirmação"
            subtitulo="Verifique se tudo está correto antes de salvar"
          >
            <SecaoRevisao titulo="Dados Pessoais">
              <LinhaInfo label="Nome" valor={dadosPessoais.nomeCompleto} />

              <LinhaInfo label="Email" valor={dadosPessoais.email} />

              <LinhaInfo label="CPF" valor={dadosPessoais.cpf} />

              <LinhaInfo
                label="Data de Nascimento"
                valor={formatarDataBr(dadosPessoais.dataNascimento)}
              />

              <LinhaInfo label="Telefone" valor={dadosPessoais.telefone} />
            </SecaoRevisao>

            <SecaoRevisao titulo="Endereço">
              <LinhaInfo label="CEP" valor={endereco.cep} />

              <LinhaInfo label="Logradouro" valor={endereco.logradouro} />

              <LinhaInfo label="Número" valor={endereco.numero} />

              <LinhaInfo label="Bairro" valor={endereco.bairro} />

              <LinhaInfo label="Cidade" valor={endereco.cidade} />

              <LinhaInfo label="Estado" valor={endereco.estado} />

              <LinhaInfo label="UF" valor={endereco.uf} />
            </SecaoRevisao>

            <SecaoRevisao titulo="Informações do Aluno">
              <LinhaInfo
                label="Problema de Mobilidade"
                valor={informacoesAluno.problemasMobilidade ? "Sim" : "Não"}
              />

              <LinhaInfo
                label="Notificações por E-mail"
                valor={
                  informacoesAluno.notificacaoAtiva ? "Ativado" : "Desativado"
                }
              />

              <LinhaInfo
                label="Observações"
                valor={
                  informacoesAluno.observacao || "Nenhuma observação registrada"
                }
              />
            </SecaoRevisao>
          </EtapaCard>
        )}

        {/* Ações */}

        <View style={styles.actions}>
          {etapaAtual > 1 && (
            <TouchableOpacity
              style={styles.btnBack}
              onPress={etapaAnterior}
              disabled={carregando}
            >
              <Feather name="arrow-left" size={16} color="#475569" />

              <Text style={styles.btnBackText}>Voltar</Text>
            </TouchableOpacity>
          )}

          {etapaAtual < 4 ? (
            <TouchableOpacity
              style={[styles.btnNext, etapaAtual === 1 && styles.btnFull]}
              onPress={proximaEtapa}
            >
              <Text style={styles.btnNextText}>Próximo</Text>

              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnFinish, carregando && styles.btnDisabled]}
              onPress={salvarAluno}
              disabled={carregando}
            >
              {carregando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />

                  <Text style={styles.btnFinishText}>
                    Confirmar e {isEditMode ? "Salvar" : "Cadastrar"}
                  </Text>
                </>
              )}
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      {/* Modal de seleção de UF */}

      <Modal
        visible={showUfModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUfModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowUfModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Selecione a UF</Text>

            <FlatList
              data={UFS}
              keyExtractor={(item) => item}
              numColumns={4}
              columnWrapperStyle={styles.ufRow}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.ufChip,
                    endereco.uf === item && styles.ufChipSelected,
                  ]}
                  onPress={() => {
                    atualizarEndereco({
                      uf: item,
                      estado: getEstadoNome(item),
                    });

                    setShowUfModal(false);
                  }}
                >
                  <Text
                    style={[
                      styles.ufChipText,
                      endereco.uf === item && styles.ufChipTextSelected,
                    ]}
                  >
                    {item}
                  </Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

// --- Subcomponentes ---

function StepIndicator({
  currentStep,

  onStepClick,
}: {
  currentStep: number;

  onStepClick: (n: number) => void;
}) {
  return (
    <View style={styles.stepper}>
      {ETAPAS.map((step, index) => {
        const stepNumber = index + 1;

        const isActive = stepNumber === currentStep;

        const isCompleted = stepNumber < currentStep;

        const isClickable = stepNumber <= currentStep;

        return (
          <View key={step.label} style={styles.stepWrapper}>
            <TouchableOpacity
              style={[
                styles.stepCircle,

                isActive && styles.stepCircleActive,

                isCompleted && styles.stepCircleCompleted,
              ]}
              onPress={() => isClickable && onStepClick(stepNumber)}
              disabled={!isClickable}
            >
              {isCompleted ? (
                <Feather name="check" size={14} color="#fff" />
              ) : (
                <Text
                  style={[
                    styles.stepNumber,
                    isActive && styles.stepNumberActive,
                  ]}
                >
                  {stepNumber}
                </Text>
              )}
            </TouchableOpacity>

            {stepNumber < ETAPAS.length && (
              <View
                style={[
                  styles.stepLine,
                  isCompleted && styles.stepLineCompleted,
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
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

        <View style={styles.etapaTitleGroup}>
          <Text style={styles.etapaTitle}>{titulo}</Text>

          <Text style={styles.etapaSubtitle}>{subtitulo}</Text>
        </View>
      </View>

      {children}
    </View>
  );
}

function Campo({
  label,

  obrigatorio,

  erro,

  icone,

  editable = true,

  ...inputProps
}: {
  label: string;

  obrigatorio?: boolean;

  erro?: string;

  icone: keyof typeof Feather.glyphMap;

  editable?: boolean;
} & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>
        {label}

        {obrigatorio ? <Text style={styles.required}> *</Text> : null}
      </Text>

      <View
        style={[
          styles.inputContainer,
          !editable && styles.inputDisabled,
          erro && styles.inputError,
        ]}
      >
        <Feather
          name={icone}
          size={18}
          color="#94a3b8"
          style={styles.inputIcon}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor="#94a3b8"
          editable={editable}
          {...inputProps}
        />
      </View>

      {erro ? <Text style={styles.errorText}>{erro}</Text> : null}
    </View>
  );
}

function SecaoRevisao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.secaoRevisao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>

      {children}
    </View>
  );
}

function LinhaInfo({ label, valor }: { label: string; valor?: string }) {
  return (
    <View style={styles.linhaInfo}>
      <Text style={styles.linhaLabel}>{label}</Text>

      <Text style={styles.linhaValor}>{valor || "---"}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },

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

  stepper: { flexDirection: "row", alignItems: "center" },

  stepWrapper: { flexDirection: "row", alignItems: "center", flex: 1 },

  stepCircle: {
    width: 32,

    height: 32,

    borderRadius: 16,

    backgroundColor: "#f1f5f9",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 2,

    borderColor: "#e2e8f0",
  },

  stepCircleActive: { backgroundColor: "#fff", borderColor: "#f77433" },

  stepCircleCompleted: { backgroundColor: "#f77433", borderColor: "#f77433" },

  stepNumber: { fontSize: 14, fontWeight: "700", color: "#94a3b8" },

  stepNumberActive: { color: "#f77433" },

  stepLine: {
    flex: 1,
    height: 2,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 4,
  },

  stepLineCompleted: { backgroundColor: "#f77433" },

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

  etapaHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },

  etapaIcon: {
    width: 40,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#fff3eb",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 12,
  },

  etapaTitleGroup: { flex: 1 },

  etapaTitle: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },

  etapaSubtitle: { fontSize: 13, color: "#64748b", marginTop: 2 },

  inputGroup: { marginBottom: 16 },

  label: { fontSize: 13, fontWeight: "600", color: "#0f172a", marginBottom: 8 },

  required: { color: "#ef4444" },

  inputContainer: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#f8fafc",

    borderRadius: 12,

    borderWidth: 2,

    borderColor: "#f1f5f9",

    paddingHorizontal: 14,
  },

  inputDisabled: { backgroundColor: "#f1f5f9" },

  inputError: { borderColor: "#fca5a5" },

  inputIcon: { marginRight: 10 },

  input: { flex: 1, paddingVertical: 12, fontSize: 15, color: "#0f172a" },

  placeholderText: { color: "#94a3b8" },

  errorText: { fontSize: 12, color: "#ef4444", marginTop: 4 },

  checkboxRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: -6,

    marginBottom: 16,

    gap: 8,
  },

  checkbox: {
    width: 22,

    height: 22,

    borderRadius: 6,

    borderWidth: 2,

    borderColor: "#cbd5e1",

    justifyContent: "center",

    alignItems: "center",
  },

  checkboxChecked: { backgroundColor: "#f77433", borderColor: "#f77433" },

  checkboxLabel: { fontSize: 14, color: "#475569", fontWeight: "500" },

  switchRow: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "space-between",

    backgroundColor: "#f8fafc",

    borderRadius: 12,

    padding: 16,

    marginBottom: 12,
  },

  switchLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: "#0f172a",
    paddingRight: 12,
  },

  textarea: {
    backgroundColor: "#f8fafc",

    borderRadius: 12,

    borderWidth: 2,

    borderColor: "#f1f5f9",

    padding: 14,

    fontSize: 15,

    color: "#0f172a",

    minHeight: 120,
  },

  secaoRevisao: { marginBottom: 20 },

  secaoTitulo: {
    fontSize: 15,

    fontWeight: "bold",

    color: "#f77433",

    marginBottom: 10,

    paddingBottom: 6,

    borderBottomWidth: 1,

    borderBottomColor: "#f1f5f9",
  },

  linhaInfo: {
    flexDirection: "row",

    justifyContent: "space-between",

    paddingVertical: 8,

    gap: 12,
  },

  linhaLabel: { fontSize: 13, color: "#64748b", fontWeight: "500" },

  linhaValor: {
    fontSize: 14,
    color: "#0f172a",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },

  actions: { flexDirection: "row", gap: 12, marginTop: 4 },

  btnBack: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    backgroundColor: "#e2e8f0",

    borderRadius: 12,

    paddingVertical: 15,

    paddingHorizontal: 20,
  },

  btnBackText: { color: "#475569", fontSize: 15, fontWeight: "bold" },

  btnNext: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 6,

    backgroundColor: "#f77433",

    borderRadius: 12,

    paddingVertical: 15,
  },

  btnFull: { flex: 1 },

  btnNextText: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  btnFinish: {
    flex: 1,

    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: "#16a34a",

    borderRadius: 12,

    paddingVertical: 15,
  },

  btnDisabled: { opacity: 0.6 },

  btnFinishText: { color: "#fff", fontSize: 15, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,

    backgroundColor: "rgba(0,0,0,0.4)",

    justifyContent: "center",

    alignItems: "center",

    padding: 24,
  },

  modalContent: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 20,

    width: "100%",

    maxHeight: "70%",
  },

  modalTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 16,
  },

  ufRow: { gap: 8, marginBottom: 8 },

  ufChip: {
    flex: 1,

    paddingVertical: 12,

    borderRadius: 10,

    backgroundColor: "#f1f5f9",

    alignItems: "center",
  },

  ufChipSelected: { backgroundColor: "#f77433" },

  ufChipText: { fontSize: 14, fontWeight: "600", color: "#475569" },

  ufChipTextSelected: { color: "#fff" },
});
