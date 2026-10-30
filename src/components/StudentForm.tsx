import { useEffect, useState, useMemo } from "react";

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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import StepIndicator from "@/components/form/StepIndicator";

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
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
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

  // A tela segue montada no navegador de tabs; limpamos ao sair para não reabrir preenchida.

  function sair() {
    if (!isEditMode) {
      setEtapaAtual(1);

      setErros({});

      setSemNumero(false);

      setDadosPessoais({
        nomeCompleto: "",
        email: "",
        cpf: "",
        dataNascimento: "",
        telefone: "",
      });

      setEndereco({
        cep: "",

        logradouro: "",

        numero: "",

        bairro: "",

        cidade: "",

        estado: "",

        uf: "",
      });

      setInformacoesAluno({
        problemasMobilidade: false,
        notificacaoAtiva: true,
        observacao: "",
      });
    }

    router.back();
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

      sair();
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
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity style={styles.backButton} onPress={sair}>
            <Feather name="arrow-left" size={22} color={colors.text} />
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

        <StepIndicator
          etapas={ETAPAS}
          etapaAtual={etapaAtual}
          onIrParaEtapa={irParaEtapa}
        />
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
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />

                <Text
                  style={[styles.input, !endereco.uf && styles.placeholderText]}
                >
                  {endereco.uf || "Selecione"}
                </Text>

                <Feather name="chevron-down" size={18} color={colors.textMuted} />
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
                trackColor={{ false: isDark ? "#334155" : "#cbd5e1", true: "#f77433" }}
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
                trackColor={{ false: isDark ? "#334155" : "#cbd5e1", true: "#f77433" }}
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
                placeholderTextColor={colors.textMuted}
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
              <Feather name="arrow-left" size={16} color={colors.textSecondary} />

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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

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
          color={colors.textMuted}
          style={styles.inputIcon}
        />

        <TextInput
          style={styles.input}
          placeholderTextColor={colors.textMuted}
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
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.secaoRevisao}>
      <Text style={styles.secaoTitulo}>{titulo}</Text>
      {children}
    </View>
  );
}

function LinhaInfo({ label, valor }: { label: string; valor?: string }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <View style={styles.linhaInfo}>
      <Text style={styles.linhaLabel}>{label}</Text>
      <Text style={styles.linhaValor}>{valor || "---"}</Text>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: {
      flex: 1,
      justifyContent: "center",
      alignItems: "center",
      backgroundColor: colors.background,
    },
    header: {
      backgroundColor: colors.surfaceCard,
      paddingHorizontal: 16,
      paddingTop: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    title: {
      flex: 1,
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 12,
    },
    stepBadge: {
      backgroundColor: isDark ? "rgba(247, 116, 51, 0.15)" : "#fff3eb",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 5,
    },
    stepBadgeText: { fontSize: 12, color: colors.primary, fontWeight: "600" },
    stepper: { flexDirection: "row", alignItems: "center" },
    stepWrapper: { flexDirection: "row", alignItems: "center", flex: 1 },
    stepCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.borderSubtle,
    },
    stepCircleActive: { backgroundColor: colors.surfaceCard, borderColor: colors.primary },
    stepCircleCompleted: { backgroundColor: colors.primary, borderColor: colors.primary },
    stepNumber: { fontSize: 14, fontWeight: "700", color: colors.textMuted },
    stepNumberActive: { color: colors.primary },
    stepLine: {
      flex: 1,
      height: 2,
      backgroundColor: colors.borderSubtle,
      marginHorizontal: 4,
    },
    stepLineCompleted: { backgroundColor: colors.primary },
    scroll: { flex: 1 },
    scrollContent: { padding: 16, paddingBottom: 48 },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 8,
      elevation: 2,
    },
    etapaHeader: { flexDirection: "row", alignItems: "center", marginBottom: 20 },
    etapaIcon: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: isDark ? "rgba(247, 116, 51, 0.15)" : "#fff3eb",
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
    },
    etapaTitleGroup: { flex: 1 },
    etapaTitle: { fontSize: 18, fontWeight: "bold", color: colors.text },
    etapaSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    inputGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 },
    required: { color: "#ef4444" },
    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 14,
    },
    inputDisabled: { backgroundColor: isDark ? colors.surfaceCard : "#f1f5f9" },
    inputError: { borderColor: "#ef4444" },
    inputIcon: { marginRight: 10 },
    input: { flex: 1, paddingVertical: 12, fontSize: 15, color: colors.text },
    placeholderText: { color: colors.textMuted },
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
      borderColor: colors.borderSubtle,
      justifyContent: "center",
      alignItems: "center",
    },
    checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
    checkboxLabel: { fontSize: 14, color: colors.text, fontWeight: "500" },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      padding: 16,
      marginBottom: 12,
    },
    switchLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
      paddingRight: 12,
    },
    textarea: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      minHeight: 120,
    },
    secaoRevisao: { marginBottom: 20 },
    secaoTitulo: {
      fontSize: 15,
      fontWeight: "bold",
      color: colors.primary,
      marginBottom: 10,
      paddingBottom: 6,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    linhaInfo: {
      flexDirection: "row",
      justifyContent: "space-between",
      paddingVertical: 8,
      gap: 12,
    },
    linhaLabel: { fontSize: 13, color: colors.textMuted, fontWeight: "500" },
    linhaValor: {
      fontSize: 14,
      color: colors.text,
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
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      paddingVertical: 15,
      paddingHorizontal: 20,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    btnBackText: { color: colors.text, fontSize: 15, fontWeight: "bold" },
    btnNext: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 6,
      backgroundColor: colors.primary,
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
      backgroundColor: "rgba(0,0,0,0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 24,
    },
    modalContent: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 20,
      width: "100%",
      maxHeight: "70%",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 16,
    },
    ufRow: { gap: 8, marginBottom: 8 },
    ufChip: {
      flex: 1,
      paddingVertical: 12,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    ufChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    ufChipText: { fontSize: 14, fontWeight: "600", color: colors.textSecondary },
    ufChipTextSelected: { color: "#fff" },
  });
