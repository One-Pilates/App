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
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";
import StepIndicator from "@/components/form/StepIndicator";

import * as ImagePicker from "expo-image-picker";

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

interface Especialidade {
  id: number;

  nome: string;
}

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

interface InformacoesProfissionais {
  cargo: string;

  especialidades: number[];

  notificacaoAtiva: boolean;

  observacoes: string;
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

function formatarDataBr(iso?: string): string {
  if (!iso) return "";

  const [ano, mes, dia] = iso.split("-");

  if (!ano || !mes || !dia) return iso;

  return `${dia}/${mes}/${ano}`;
}

export default function CollaboratorForm({
  role: roleParam,
}: {
  role?: string;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const roleNormalizado = (roleParam || "").toUpperCase();

  const isValidRole = ["PROFESSOR", "SECRETARIA"].includes(roleNormalizado);

  const role = isValidRole ? roleNormalizado : "PROFESSOR";

  const isProfessor = role === "PROFESSOR";

  const ETAPAS = [
    { label: "Dados Pessoais" },

    { label: "Endereço" },

    { label: "Informações" },

    { label: "Confirmação" },
  ];

  const [etapaAtual, setEtapaAtual] = useState(1);

  const [cadastrando, setCadastrando] = useState(false);

  const [erros, setErros] = useState<Erros>({});

  const [especialidades, setEspecialidades] = useState<Especialidade[]>([]);

  const [pickedImage, setPickedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

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

  const [informacoes, setInformacoes] = useState<InformacoesProfissionais>({
    cargo: "",

    especialidades: [],

    notificacaoAtiva: true,

    observacoes: "",
  });

  const [semNumero, setSemNumero] = useState(false);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [showUfModal, setShowUfModal] = useState(false);

  // Redireciona se a role da rota for inválida.

  useEffect(() => {
    if (!isValidRole) router.back();
  }, [isValidRole]);

  // Carrega especialidades (somente professor).

  useEffect(() => {
    if (!isProfessor) return;

    api

      .get("api/especialidades")

      .then((res) => setEspecialidades(res.data || []))

      .catch((err) => {
        console.error("Erro ao buscar especialidades:", err);

        notify.error("Não foi possível carregar as especialidades.");
      });
  }, [isProfessor]);

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

  function atualizarInformacoes(novos: Partial<InformacoesProfissionais>) {
    setInformacoes((prev) => ({ ...prev, ...novos }));

    limparErros(Object.keys(novos));
  }

  function toggleSemNumero(checked: boolean) {
    setSemNumero(checked);

    atualizarEndereco({ numero: checked ? "0" : "" });
  }

  function toggleEspecialidade(id: number) {
    setInformacoes((prev) => {
      const atuais = prev.especialidades || [];

      const novas = atuais.includes(id)
        ? atuais.filter((x) => x !== id)
        : [...atuais, id];

      return { ...prev, especialidades: novas };
    });

    limparErros(["especialidades"]);
  }

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      notify.warning("Precisamos de acesso à galeria para escolher a foto.");

      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],

      allowsEditing: true,

      aspect: [1, 1],

      quality: 0.8,
    });

    if (result.canceled) return;

    const asset = result.assets[0];

    if (asset.fileSize && asset.fileSize > 10 * 1024 * 1024) {
      notify.warning(
        "A imagem deve ter no máximo 10MB. Selecione uma imagem menor.",
      );

      return;
    }

    setPickedImage(asset);
  }

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

      notify.error("Não foi possível consultar o CEP. Tente novamente.");
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
      if (!dadosPessoais.nomeCompleto.trim())
        novosErros.nomeCompleto = "Nome obrigatório";

      if (!dadosPessoais.email.trim()) {
        novosErros.email = "Email obrigatório";
      } else if (!validarEmail(dadosPessoais.email)) {
        novosErros.email = "Email inválido";
      }

      if (!dadosPessoais.cpf.trim()) {
        novosErros.cpf = "CPF obrigatório";
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
        novosErros.logradouro = "Logradouro obrigatório";

      if (!semNumero && !endereco.numero.trim()) {
        novosErros.numero = "Número obrigatório (ou marque 'Sem número')";
      }

      if (!endereco.bairro.trim()) novosErros.bairro = "Bairro obrigatório";

      if (!endereco.cidade.trim()) novosErros.cidade = "Cidade obrigatória";

      if (!endereco.estado.trim()) novosErros.estado = "Estado obrigatório";

      if (!endereco.uf) novosErros.uf = "UF obrigatória";
    }

    if (etapaAtual === 3) {
      if (!informacoes.cargo.trim()) novosErros.cargo = "Cargo obrigatório";

      if (isProfessor && !informacoes.especialidades?.length) {
        novosErros.especialidades = "Selecione ao menos uma especialidade";
      }
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

  async function uploadFoto(colaboradorId: number) {
    if (!pickedImage) return;

    const formData = new FormData();

    formData.append("file", {
      uri: pickedImage.uri,

      name: pickedImage.fileName || `foto_${colaboradorId}.jpg`,

      type: pickedImage.mimeType || "image/jpeg",
    } as any);

    const endpoint = isProfessor
      ? `api/professores/${colaboradorId}/uploadFoto`
      : `api/secretarias/${colaboradorId}/uploadFoto`;

    await api.post(endpoint, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }

  async function cadastrarColaborador() {
    setCadastrando(true);

    const senhaGerada = Math.floor(100000 + Math.random() * 900000).toString();

    const payload: any = {
      nome: dadosPessoais.nomeCompleto.trim(),

      email: dadosPessoais.email.trim().toLowerCase(),

      cpf: somenteDigitos(dadosPessoais.cpf),

      idade: dadosPessoais.dataNascimento,

      status: true,

      foto: null,

      observacoes: informacoes.observacoes?.trim() || "",

      notificacaoAtiva: informacoes.notificacaoAtiva,

      senha: senhaGerada,

      cargo: informacoes.cargo.trim(),

      endereco: {
        rua: endereco.logradouro.trim(),

        numero: endereco.numero === "S/N" ? "0" : endereco.numero.trim(),

        bairro: endereco.bairro.trim(),

        cidade: endereco.cidade.trim(),

        estado: endereco.estado.trim(),

        cep: somenteDigitos(endereco.cep),

        uf: endereco.uf,
      },

      role,

      telefone: somenteDigitos(dadosPessoais.telefone),

      ...(isProfessor ? { especialidadeIds: informacoes.especialidades } : {}),
    };

    const url = role === "SECRETARIA" ? "api/secretarias" : "api/professores";

    try {
      const response = await api.post(url, payload);

      if (pickedImage && response.data?.id) {
        try {
          await uploadFoto(response.data.id);
        } catch (fotoError) {
          console.error("Erro ao enviar foto (não crítico):", fotoError);
        }
      }

      Alert.alert(
        "Colaborador cadastrado com sucesso!",

        `Nome: ${dadosPessoais.nomeCompleto}\nEmail: ${dadosPessoais.email}\n\n` +
          `Senha gerada: ${senhaGerada}\nGuarde esta senha para o primeiro acesso.`,

        [{ text: "OK, entendi!", onPress: () => router.back() }],
      );
    } catch (error: any) {
      console.error("Erro no cadastro:", error);

      const status = error.response?.status;

      let mensagem = "Erro ao cadastrar colaborador";

      if (status === 409) {
        mensagem = "CPF ou Email já cadastrado no sistema.";
      } else if (status === 400) {
        mensagem = "Dados inválidos. Verifique os campos e tente novamente.";
      } else if (status === 401) {
        mensagem = "Sessão expirada. Faça login novamente.";
      }

      notify.error(mensagem);
    } finally {
      setCadastrando(false);
    }
  }

  const nomeEspecialidades =
    informacoes.especialidades

      .map((id) => especialidades.find((e) => e.id === id)?.nome)

      .filter(Boolean)

      .join(", ") || "Nenhuma";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>
            Cadastrar {isProfessor ? "Professor" : "Secretária"}
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
            subtitulo="Informações básicas do colaborador"
          >
            <View style={styles.photoSection}>
              <TouchableOpacity
                style={styles.photoContainer}
                onPress={handlePickImage}
                activeOpacity={0.8}
              >
                {pickedImage ? (
                  <Image
                    source={{ uri: pickedImage.uri }}
                    style={styles.photo}
                  />
                ) : (
                  <Feather name="camera" size={30} color={colors.textMuted} />
                )}
              </TouchableOpacity>

              <TouchableOpacity onPress={handlePickImage}>
                <Text style={styles.photoButtonText}>
                  Selecione a foto de perfil
                </Text>
              </TouchableOpacity>
            </View>

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
            subtitulo="Local de residência do colaborador"
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
            icone="briefcase"
            titulo="Informações Profissionais"
            subtitulo={`Cargo${isProfessor ? ", especialidades" : ""} e configurações`}
          >
            <Campo
              label="Cargo"
              obrigatorio
              erro={erros.cargo}
              icone="briefcase"
              value={informacoes.cargo}
              onChangeText={(v) => atualizarInformacoes({ cargo: v })}
              placeholder="Ex: Fisioterapeuta, Professor de Pilates, Secretária..."
            />

            {isProfessor && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>
                  Especialidades<Text style={styles.required}> *</Text>
                </Text>

                {especialidades.length === 0 ? (
                  <Text style={styles.loadingText}>
                    Carregando especialidades...
                  </Text>
                ) : (
                  <View style={styles.chipsWrap}>
                    {especialidades.map((esp) => {
                      const selected = informacoes.especialidades.includes(
                        esp.id,
                      );

                      return (
                        <TouchableOpacity
                          key={esp.id}
                          onPress={() => toggleEspecialidade(esp.id)}
                          style={[styles.chip, selected && styles.chipSelected]}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.chipText,
                              selected && styles.chipTextSelected,
                            ]}
                          >
                            {esp.nome}
                          </Text>

                          {selected && (
                            <Feather name="check" size={14} color="#fff" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {erros.especialidades ? (
                  <Text style={styles.errorText}>{erros.especialidades}</Text>
                ) : null}
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Observações</Text>

              <TextInput
                style={styles.textarea}
                value={informacoes.observacoes}
                onChangeText={(v) => atualizarInformacoes({ observacoes: v })}
                placeholder="Informações adicionais sobre o colaborador..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>
                Ativar notificações por e-mail
              </Text>

              <Switch
                value={informacoes.notificacaoAtiva}
                onValueChange={(v) =>
                  atualizarInformacoes({ notificacaoAtiva: v })
                }
                trackColor={{ false: isDark ? "#334155" : "#cbd5e1", true: "#f77433" }}
                thumbColor="#fff"
              />
            </View>
          </EtapaCard>
        )}

        {etapaAtual === 4 && (
          <EtapaCard
            icone="check-circle"
            titulo="Revisão e Confirmação"
            subtitulo="Verifique se tudo está correto antes de cadastrar"
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

            <SecaoRevisao titulo="Informações Profissionais">
              <LinhaInfo label="Cargo" valor={informacoes.cargo} />

              {isProfessor && (
                <LinhaInfo label="Especialidades" valor={nomeEspecialidades} />
              )}

              <LinhaInfo
                label="Notificações"
                valor={
                  informacoes.notificacaoAtiva ? "Ativadas" : "Desativadas"
                }
              />

              <LinhaInfo
                label="Observações"
                valor={informacoes.observacoes || "Nenhuma"}
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
              disabled={cadastrando}
            >
              <Feather name="arrow-left" size={16} color={colors.textSecondary} />

              <Text style={styles.btnBackText}>Voltar</Text>
            </TouchableOpacity>
          )}

          {etapaAtual < 4 ? (
            <TouchableOpacity style={styles.btnNext} onPress={proximaEtapa}>
              <Text style={styles.btnNextText}>Próximo</Text>

              <Feather name="arrow-right" size={16} color="#fff" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.btnFinish, cadastrando && styles.btnDisabled]}
              onPress={cadastrarColaborador}
              disabled={cadastrando}
            >
              {cadastrando ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Feather name="check" size={18} color="#fff" />

                  <Text style={styles.btnFinishText}>
                    Confirmar e Cadastrar
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
    photoSection: { alignItems: "center", marginBottom: 20 },
    photoContainer: {
      width: 96,
      height: 96,
      borderRadius: 48,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 2,
      borderColor: colors.borderSubtle,
      justifyContent: "center",
      alignItems: "center",
      overflow: "hidden",
      marginBottom: 10,
    },
    photo: { width: "100%", height: "100%" },
    photoButtonText: { fontSize: 14, color: colors.primary, fontWeight: "600" },
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
    loadingText: { fontSize: 13, color: colors.textMuted, fontStyle: "italic" },
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
    chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500" },
    chipTextSelected: { color: "#fff" },
    textarea: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: 14,
      fontSize: 15,
      color: colors.text,
      minHeight: 100,
    },
    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      padding: 16,
    },
    switchLabel: {
      flex: 1,
      fontSize: 15,
      fontWeight: "500",
      color: colors.text,
      paddingRight: 12,
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
