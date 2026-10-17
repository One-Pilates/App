import React, { useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Image,
  Switch,
  Platform,
  ActivityIndicator,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth, Especialidade } from "@/contexts/AuthContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

import api from "@/services/api";

import {
  formatarTelefone,
  formatarCep,
  somenteDigitos,
  getEstadoNome,
  dataParaIso,
  isoParaData,
} from "@/utils/utils";

import { notify } from "@/utils/notify";

interface EnderecoForm {
  rua: string;

  numero: string;

  bairro: string;

  cidade: string;

  estado: string;

  uf: string;

  cep: string;
}

interface UserForm {
  nome: string;

  cargo: string;

  role: string;

  email: string;

  dataNascimento: string;

  telefone: string;

  receberNotificacao: boolean;

  endereco: EnderecoForm;
}

const emptyForm: UserForm = {
  nome: "",

  cargo: "",

  role: "",

  email: "",

  dataNascimento: "",

  telefone: "",

  receberNotificacao: false,

  endereco: {
    rua: "",
    numero: "",
    bairro: "",
    cidade: "",
    estado: "",
    uf: "",
    cep: "",
  },
};

function buildForm(user: any): UserForm {
  return {
    nome: user?.nome || "",

    cargo: user?.cargo || "",

    role: user?.role || "",

    email: user?.email || "",

    dataNascimento: user?.idade || user?.dataNascimento || "",

    telefone: formatarTelefone(user?.telefone) || "",

    receberNotificacao:
      user?.notificacaoAtiva ?? user?.receberNotificacao ?? false,

    endereco: {
      rua: user?.endereco?.rua || "",

      numero: user?.endereco?.numero || "",

      bairro: user?.endereco?.bairro || "",

      cidade: user?.endereco?.cidade || "",

      estado: user?.endereco?.estado || "",

      uf: user?.endereco?.uf || "",

      cep: user?.endereco?.cep || "",
    },
  };
}

function formatarDataBr(iso?: string): string {
  if (!iso) return "";

  const [ano, mes, dia] = iso.split("-");

  if (!ano || !mes || !dia) return iso;

  return `${dia}/${mes}/${ano}`;
}

export default function ProfileScreen() {
  const { user, updateUser, logout } = useAuth();
  const { isDark, toggleTheme, colors } = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [userData, setUserData] = useState<UserForm>(emptyForm);

  const [originalData, setOriginalData] = useState<UserForm>(emptyForm);

  const [hasChanged, setHasChanged] = useState(false);

  const [pickedImage, setPickedImage] =
    useState<ImagePicker.ImagePickerAsset | null>(null);

  const [token, setToken] = useState<string | null>(null);

  const [specialtiesMap, setSpecialtiesMap] = useState<Especialidade[]>([]);

  const [selectedSpecialties, setSelectedSpecialties] = useState<number[]>([]);

  const [originalSpecialties, setOriginalSpecialties] = useState<number[]>([]);

  const [showDatePicker, setShowDatePicker] = useState(false);

  const [saving, setSaving] = useState(false);

  // Último CEP consultado, para não repetir a busca no ViaCEP.

  const lastCepRef = useRef<string>("");

  // Cache-buster da foto: muda a cada launch e a cada save para o Image não servir versão antiga do cache.

  const mountTs = useRef(Date.now()).current;

  const [photoSavedAt, setPhotoSavedAt] = useState(0);

  // Carrega token para autenticar o carregamento da imagem.

  useEffect(() => {
    AsyncStorage.getItem("token").then((t) => {
      setToken(t ? t.replace(/^"|"$/g, "") : null);
    });
  }, []);

  // Popula o formulário a partir do usuário do contexto.

  useEffect(() => {
    const form = buildForm(user);

    setUserData(form);

    setOriginalData(form);
  }, [user]);

  // Busca especialidades (apenas professor).

  useEffect(() => {
    async function fetchEspecialidades() {
      if (!user || user.role !== "PROFESSOR") return;

      try {
        const { data } = await api.get("api/especialidades");

        setSpecialtiesMap(Array.isArray(data) ? data : []);

        if (Array.isArray(user.especialidades)) {
          const ids = user.especialidades.map((e) => e.id);

          setSelectedSpecialties(ids);

          setOriginalSpecialties(ids);
        }
      } catch (err) {
        console.error("Erro ao carregar especialidades:", err);
      }
    }

    fetchEspecialidades();
  }, [user]);

  // Detecta alterações não salvas.

  useEffect(() => {
    const dataChanged =
      JSON.stringify(userData) !== JSON.stringify(originalData);

    const specialtiesChanged =
      userData.role === "PROFESSOR" &&
      (selectedSpecialties.length !== originalSpecialties.length ||
        !selectedSpecialties.every((id) => originalSpecialties.includes(id)));

    setHasChanged(dataChanged || specialtiesChanged || !!pickedImage);
  }, [
    userData,
    originalData,
    selectedSpecialties,
    originalSpecialties,
    pickedImage,
  ]);

  const fotoUri =
    pickedImage?.uri ||
    (user?.foto
      ? `${api.defaults.baseURL}/api/imagens/funcionarios/${user.id}?t=${photoSavedAt || mountTs}`
      : null);

  async function handlePickImage() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!perm.granted) {
      notify.warning("Precisamos de acesso à galeria para alterar a foto.");

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

  function cancelChanges() {
    setUserData(originalData);

    setSelectedSpecialties(originalSpecialties);

    setPickedImage(null);

    setHasChanged(false);
  }

  function toggleSpecialty(id: number) {
    setSelectedSpecialties((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function handleTelefoneChange(value: string) {
    setUserData((prev) => ({ ...prev, telefone: formatarTelefone(value) }));
  }

  function handleCepChange(value: string) {
    const formatado = formatarCep(value);

    setUserData((prev) => ({
      ...prev,

      endereco: { ...prev.endereco, cep: formatado },
    }));

    // Busca automaticamente ao completar os 8 dígitos.

    const digitos = somenteDigitos(formatado);

    if (digitos.length === 8) buscarCep(digitos);
  }

  function handleCepBlur() {
    buscarCep(somenteDigitos(userData.endereco.cep));
  }

  async function buscarCep(cep: string) {
    if (cep.length !== 8 || cep === lastCepRef.current) return;

    lastCepRef.current = cep;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

      const data = await response.json();

      if (data.erro) {
        notify.error("CEP não encontrado.");

        return;
      }

      setUserData((prev) => ({
        ...prev,

        endereco: {
          ...prev.endereco,

          rua: data.logradouro || prev.endereco.rua,

          bairro: data.bairro || prev.endereco.bairro,

          cidade: data.localidade || prev.endereco.cidade,

          estado: data.estado || getEstadoNome(data.uf) || prev.endereco.estado,

          uf: data.uf || prev.endereco.uf,
        },
      }));

      notify.success("Endereço preenchido automaticamente!");
    } catch (error) {
      console.error("Erro ao buscar CEP:", error);

      notify.error("Erro ao buscar informações do CEP.");
    }
  }

  function onChangeDate(_event: any, selected?: Date) {
    if (Platform.OS !== "ios") setShowDatePicker(false);

    if (!selected) return;

    setUserData((prev) => ({ ...prev, dataNascimento: dataParaIso(selected) }));
  }

  async function saveChanges() {
    if (!hasChanged || !user) return;

    setSaving(true);

    const emailChanged = userData.email !== originalData.email;

    try {
      let endpoint = "";

      let endpointImg = "";

      switch (user.role) {
        case "PROFESSOR":
          endpoint = `api/professores/${user.id}`;

          endpointImg = `api/professores/${user.id}/uploadFoto`;

          break;

        case "ADMINISTRADOR":
          endpoint = `api/administradores/${user.id}`;

          endpointImg = `api/administradores/${user.id}/uploadFoto`;

          break;

        case "SECRETARIA":
          endpoint = `api/secretarias/${user.id}`;

          endpointImg = `api/secretarias/${user.id}/uploadFoto`;

          break;

        default:
          notify.error("Função não reconhecida.");

          setSaving(false);

          return;
      }

      let imageName = user.foto;

      if (pickedImage) {
        try {
          const formData = new FormData();

          formData.append("file", {
            uri: pickedImage.uri,

            name: pickedImage.fileName || `foto_${user.id}.jpg`,

            type: pickedImage.mimeType || "image/jpeg",
          } as any);

          const fotoResponse = await api.post(endpointImg, formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          let nomeArquivo = fotoResponse.data;

          if (
            typeof nomeArquivo === "string" &&
            nomeArquivo.startsWith("imagens/")
          ) {
            nomeArquivo = nomeArquivo.replace("imagens/", "");
          }

          imageName = nomeArquivo;
        } catch (err) {
          console.error("Erro ao fazer upload da foto:", err);

          notify.error(
            "Não foi possível enviar a imagem. Os outros dados serão salvos.",
          );
        }
      }

      const userDTO: any = {
        nome: userData.nome.trim(),

        email: userData.email,

        idade: userData.dataNascimento,

        telefone: somenteDigitos(userData.telefone),

        notificacaoAtiva: userData.receberNotificacao,

        endereco: {
          rua: userData.endereco.rua.trim(),

          numero: userData.endereco.numero.trim(),

          bairro: userData.endereco.bairro.trim(),

          cidade: userData.endereco.cidade.trim(),

          estado: userData.endereco.estado.trim(),

          uf: userData.endereco.uf.trim(),

          cep: userData.endereco.cep.trim(),
        },
      };

      if (user.role === "PROFESSOR") {
        userDTO.especialidadeIds = selectedSpecialties;
      }

      const response = await api.patch(endpoint, userDTO);

      const data = response.data || {};

      const mergedUser = {
        ...user,

        ...data,

        nome: userDTO.nome,

        email: userDTO.email,

        telefone: userDTO.telefone,

        dataNascimento: userData.dataNascimento,

        notificacaoAtiva: userData.receberNotificacao,

        foto: imageName,

        endereco: {
          ...(user.endereco || {}),
          ...(data.endereco || {}),
          ...userDTO.endereco,
        },

        especialidades:
          user.role === "PROFESSOR"
            ? specialtiesMap.filter((e) => selectedSpecialties.includes(e.id))
            : user.especialidades,
      };

      await updateUser(mergedUser);

      setOriginalData(userData);

      setOriginalSpecialties(selectedSpecialties);

      setPickedImage(null);

      setPhotoSavedAt(Date.now());

      setHasChanged(false);

      if (emailChanged) {
        notify.info(
          "Seu email foi alterado. Por segurança, faça login novamente.",

          "Perfil atualizado",
        );

        await logout();

        return;
      }

      notify.success(
        "Seus dados foram salvos com sucesso!",
        "Perfil atualizado",
      );
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);

      notify.error("Erro ao atualizar perfil. Por favor, tente novamente.");
    } finally {
      setSaving(false);
    }
  }

  const isProfessor = userData.role === "PROFESSOR";

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.header}>
        <Text style={styles.pageTitle}>Editar Perfil</Text>

        <Text style={styles.pageSubtitle}>
          Gerencie suas informações pessoais e preferências
        </Text>
      </View>

      {/* Header card */}

      <View style={styles.card}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            {fotoUri ? (
              <Image
                source={{
                  uri: fotoUri,

                  headers: token
                    ? { Authorization: `Bearer ${token}` }
                    : undefined,
                }}
                style={styles.avatarImage}
              />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(userData.nome || "U").charAt(0)}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.cameraButton}
              onPress={handlePickImage}
            >
              <Feather name="camera" size={14} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>
              {userData.nome || "Nome do Usuário"}
            </Text>

            <Text style={styles.profileRole}>
              {userData.cargo || userData.role || "Usuário"}
            </Text>

            {hasChanged && (
              <View style={styles.badge}>
                <Feather name="edit-3" size={12} color="#f77433" />

                <Text style={styles.badgeText}>Alterações não salvas</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Personal info */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="user" size={20} color="#f77433" />

          <Text style={styles.cardTitle}>Informações Pessoais</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nome Completo</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="user"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.nome}
              onChangeText={(v) => setUserData((p) => ({ ...p, nome: v }))}
              placeholder="Digite seu nome completo"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="mail"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.email}
              onChangeText={(v) => setUserData((p) => ({ ...p, email: v }))}
              placeholder="seu@email.com"
              placeholderTextColor="#94a3b8"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Data de Nascimento</Text>

          <TouchableOpacity
            style={styles.inputContainer}
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
                !userData.dataNascimento && styles.placeholderText,
              ]}
            >
              {formatarDataBr(userData.dataNascimento) || "Selecione a data"}
            </Text>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={isoParaData(userData.dataNascimento)}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              maximumDate={new Date()}
              onValueChange={onChangeDate}
              onDismiss={() => setShowDatePicker(false)}
            />
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Telefone</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="phone"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.telefone}
              onChangeText={handleTelefoneChange}
              placeholder="(00) 00000-0000"
              placeholderTextColor="#94a3b8"
              keyboardType="phone-pad"
              maxLength={16}
            />
          </View>
        </View>
      </View>

      {/* Endereço */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="home" size={20} color="#f77433" />

          <Text style={styles.cardTitle}>Endereço</Text>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>CEP</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="map-pin"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.endereco.cep}
              onChangeText={handleCepChange}
              onBlur={handleCepBlur}
              placeholder="00000-000"
              placeholderTextColor="#94a3b8"
              keyboardType="number-pad"
              maxLength={9}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Rua</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="map-pin"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.endereco.rua}
              onChangeText={(v) =>
                setUserData((p) => ({
                  ...p,
                  endereco: { ...p.endereco, rua: v },
                }))
              }
              placeholder="Digite o nome da rua"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Número</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="map-pin"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={
                userData.endereco.numero === "0"
                  ? "S/N"
                  : userData.endereco.numero
              }
              onChangeText={(v) =>
                setUserData((p) => ({
                  ...p,
                  endereco: { ...p.endereco, numero: v },
                }))
              }
              placeholder="Número da residência"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Bairro</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="map-pin"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.endereco.bairro}
              onChangeText={(v) =>
                setUserData((p) => ({
                  ...p,
                  endereco: { ...p.endereco, bairro: v },
                }))
              }
              placeholder="Digite o nome do bairro"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Cidade</Text>

          <View style={styles.inputContainer}>
            <Feather
              name="map-pin"
              size={18}
              color="#94a3b8"
              style={styles.inputIcon}
            />

            <TextInput
              style={styles.input}
              value={userData.endereco.cidade}
              onChangeText={(v) =>
                setUserData((p) => ({
                  ...p,
                  endereco: { ...p.endereco, cidade: v },
                }))
              }
              placeholder="Digite o nome da cidade"
              placeholderTextColor="#94a3b8"
            />
          </View>
        </View>

        <View style={styles.rowGroup}>
          <View style={[styles.inputGroup, styles.flex2]}>
            <Text style={styles.label}>Estado</Text>

            <View style={styles.inputContainer}>
              <Feather
                name="map-pin"
                size={18}
                color="#94a3b8"
                style={styles.inputIcon}
              />

              <TextInput
                style={styles.input}
                value={userData.endereco.estado}
                onChangeText={(v) =>
                  setUserData((p) => ({
                    ...p,
                    endereco: { ...p.endereco, estado: v },
                  }))
                }
                placeholder="Estado"
                placeholderTextColor="#94a3b8"
              />
            </View>
          </View>

          <View style={[styles.inputGroup, styles.flex1]}>
            <Text style={styles.label}>UF</Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, styles.inputNoIcon]}
                value={userData.endereco.uf}
                onChangeText={(v) =>
                  setUserData((p) => ({
                    ...p,
                    endereco: { ...p.endereco, uf: v.toUpperCase() },
                  }))
                }
                placeholder="UF"
                placeholderTextColor="#94a3b8"
                maxLength={2}
                autoCapitalize="characters"
              />
            </View>
          </View>
        </View>
      </View>

      {/* Preferências (Modo Escuro e Notificações) */}

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="settings" size={20} color={colors.primary} />

          <Text style={styles.cardTitle}>Preferências</Text>
        </View>

        {/* Modo Escuro */}
        <View style={[styles.switchRow, { marginBottom: 12 }]}>
          <View style={styles.switchTextWrap}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Feather name={isDark ? "moon" : "sun"} size={16} color={colors.primary} />
              <Text style={styles.switchTitle}>Modo Escuro</Text>
            </View>

            <Text style={styles.switchSubtitle}>
              {isDark ? "Tema escuro ativo em todo o aplicativo" : "Ative o tema escuro em todo o aplicativo"}
            </Text>
          </View>

          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: "#cbd5e1", true: "#f77433" }}
            thumbColor="#fff"
          />
        </View>

        {/* Notificações */}
        <View style={styles.switchRow}>
          <View style={styles.switchTextWrap}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <Feather name="bell" size={16} color={colors.primary} />
              <Text style={styles.switchTitle}>Receber Notificações</Text>
            </View>

            <Text style={styles.switchSubtitle}>
              Receba atualizações sobre suas aulas e lembretes
            </Text>
          </View>

          <Switch
            value={userData.receberNotificacao}
            onValueChange={(v) =>
              setUserData((p) => ({ ...p, receberNotificacao: v }))
            }
            trackColor={{ false: "#cbd5e1", true: "#f77433" }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Especialidades (professor) */}

      {isProfessor && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="award" size={20} color="#f77433" />

            <Text style={styles.cardTitle}>Especialidades</Text>
          </View>

          <View style={styles.chipsWrap}>
            {specialtiesMap.map((esp) => {
              const selected = selectedSpecialties.includes(esp.id);

              return (
                <TouchableOpacity
                  key={esp.id}
                  onPress={() => toggleSpecialty(esp.id)}
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

                  {selected && <Feather name="check" size={14} color="#fff" />}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Ações */}

      <TouchableOpacity
        style={[
          styles.saveButton,
          (!hasChanged || saving) && styles.saveButtonDisabled,
        ]}
        onPress={saveChanges}
        disabled={!hasChanged || saving}
      >
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Feather name="save" size={20} color="#fff" />

            <Text style={styles.saveButtonText}>Salvar Alterações</Text>
          </>
        )}
      </TouchableOpacity>

      {hasChanged && (
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={cancelChanges}
          disabled={saving}
        >
          <Feather name="x" size={20} color="#475569" />

          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={styles.changePasswordButton}
        onPress={() => router.push("/(public)/redefinir-senha")}
      >
        <Feather name="lock" size={18} color="#475569" />

        <Text style={styles.changePasswordText}>Alterar Senha</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Feather name="log-out" size={18} color="#ef4444" />

        <Text style={styles.logoutButtonText}>Sair da Conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    header: { marginBottom: 16 },
    pageTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
    pageSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors.isDark ? 0.25 : 0.04,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    profileHeader: { flexDirection: "row", alignItems: "center" },
    avatarContainer: { position: "relative", marginRight: 16 },

    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.isDark ? "#222228" : "#fff3eb",
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 3,
      borderColor: colors.primary,
    },

    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: colors.primary,
      backgroundColor: colors.isDark ? "#222228" : "#fff3eb",
    },

    avatarText: { fontSize: 32, fontWeight: "bold", color: colors.primary },

    cameraButton: {
      position: "absolute",
      bottom: 0,
      right: 0,
      backgroundColor: colors.primary,
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 2,
      borderColor: colors.surfaceCard,
    },

    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: "bold", color: colors.text },
    profileRole: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },

    badge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      backgroundColor: colors.isDark ? "rgba(234, 96, 30, 0.2)" : "#fff3eb",
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 4,
      marginTop: 8,
      gap: 4,
    },

    badgeText: { fontSize: 12, color: colors.primary, fontWeight: "600" },

    cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },

    cardTitle: {
      fontSize: 18,
      fontWeight: "bold",
      color: colors.text,
      marginLeft: 8,
    },

    inputGroup: { marginBottom: 16 },
    rowGroup: { flexDirection: "row", gap: 12 },
    flex1: { flex: 1 },
    flex2: { flex: 2 },
    label: { fontSize: 13, fontWeight: "600", color: colors.text, marginBottom: 8 },

    inputContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 12,
      borderWidth: 1.5,
      borderColor: colors.inputBorder,
      paddingHorizontal: 14,
    },

    inputIcon: { marginRight: 10 },

    input: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 15,
      color: colors.inputText,
    },

    inputNoIcon: { paddingLeft: 2 },
    placeholderText: { color: colors.inputPlaceholder },

    switchRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      padding: 16,
    },

    switchTextWrap: { flex: 1, paddingRight: 12 },

    switchTitle: {
      fontSize: 15,
      fontWeight: "600",
      color: colors.text,
      marginBottom: 2,
    },

    switchSubtitle: { fontSize: 13, color: colors.textSecondary },

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

    saveButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      borderRadius: 12,
      paddingVertical: 15,
      marginTop: 4,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 3,
    },

    saveButtonDisabled: { backgroundColor: colors.primary + "80", shadowOpacity: 0 },
    saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },

    cancelButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.isDark ? "#27272f" : "#e2e8f0",
      borderRadius: 12,
      paddingVertical: 15,
      marginTop: 12,
    },

    cancelButtonText: { color: colors.isDark ? "#cbd5e1" : "#475569", fontSize: 16, fontWeight: "bold" },

    changePasswordButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.surfaceCard,
      borderRadius: 12,
      paddingVertical: 15,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },

    changePasswordText: { color: colors.textSecondary, fontSize: 15, fontWeight: "600" },

    logoutButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      borderRadius: 12,
      paddingVertical: 15,
      marginTop: 12,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerBg,
    },

    logoutButtonText: { color: colors.danger, fontSize: 15, fontWeight: "600" },
  });
