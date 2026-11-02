import React, { useEffect, useRef, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '@/services/api';
import { formatarTelefone } from '@/utils/utils';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

type Tipo = 'aluno' | 'professor' | 'secretaria';

interface DadosUser {
  id: number;
  nome?: string;
  email?: string;
  cargo?: string;
  telefone?: string;
  tipoContato?: string;
  dataNascimento?: string;
  idade?: string;
  notificacaoAtiva?: boolean;
  alunoComLimitacoesFisicas?: boolean;
  observacao?: string;
  endereco?: {
    rua?: string;
    numero?: string;
    bairro?: string;
    cidade?: string;
    estado?: string;
    uf?: string;
    cep?: string;
  };
  especialidades?: { id: number; nome: string }[];
}

function formatarDataBr(iso?: string): string {
  if (!iso) return '';
  const [ano, mes, dia] = iso.split('-');
  if (!ano || !mes || !dia) return iso;
  return `${dia}/${mes}/${ano}`;
}

function Campo({
  icon,
  label,
  value,
  styles,
  colors,
}: {
  icon: any;
  label: string;
  value?: string;
  styles: any;
  colors: ThemeColors;
}) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.readonlyBox}>
        <Feather name={icon} size={18} color={colors.textMuted} style={styles.fieldIcon} />
        <Text style={styles.readonlyText}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export default function PerfilView() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const { tipo: tipoParam, id } = useLocalSearchParams<{ tipo: string; id: string }>();
  const tipo = (tipoParam as Tipo) || 'aluno';

  const [dados, setDados] = useState<DadosUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const mountTs = useRef(Date.now()).current;

  useEffect(() => {
    AsyncStorage.getItem('token').then((t) => setToken(t ? t.replace(/^"|"$/g, '') : null));
  }, []);

  useEffect(() => {
    async function fetchUser() {
      if (!id) return;
      setLoading(true);
      try {
        const endpoint =
          tipo === 'professor'
            ? `api/professores/${id}`
            : tipo === 'secretaria'
            ? `api/secretarias/${id}`
            : `api/alunos/${id}`;
        const response = await api.get(endpoint);
        setDados(response.data);
      } catch (error) {
        console.error(`Erro ao buscar ${tipo}:`, error);
        setDados(null);
      } finally {
        setLoading(false);
      }
    }
    fetchUser();
  }, [id, tipo]);

  const titulo =
    tipo === 'professor'
      ? 'Perfil do Professor'
      : tipo === 'secretaria'
      ? 'Perfil da Secretária'
      : 'Perfil do Aluno';

  const cargoLabel =
    tipo === 'professor'
      ? dados?.cargo || 'Professor'
      : tipo === 'secretaria'
      ? dados?.cargo || 'Secretária'
      : 'Aluno';

  const fotoUri =
    tipo !== 'aluno' && dados?.id
      ? `${api.defaults.baseURL}/api/imagens/funcionarios/${dados.id}?t=${mountTs}`
      : null;

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f77433" />
      </View>
    );
  }

  if (!dados) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Perfil não encontrado</Text>
        <TouchableOpacity style={styles.backLink} onPress={() => router.back()}>
          <Feather name="arrow-left" size={18} color="#f77433" />
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const endereco = dados.endereco || {};
  const numeroVisivel = endereco.numero && endereco.numero !== '0' ? endereco.numero : '';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTexts}>
          <Text style={styles.pageTitle}>{titulo}</Text>
          <Text style={styles.pageSubtitle}>Visualização dos dados cadastrados</Text>
        </View>
      </View>

      {/* Header card */}
      <View style={styles.card}>
        <View style={styles.profileHeader}>
          {fotoUri ? (
            <Image
              source={{
                uri: fotoUri,
                headers: token ? { Authorization: `Bearer ${token}` } : undefined,
              }}
              style={styles.avatarImage}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{(dados.nome || 'U').charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{dados.nome}</Text>
            <Text style={styles.profileRole}>{cargoLabel}</Text>
          </View>
        </View>
      </View>

      {/* Informações pessoais */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="user" size={20} color="#f77433" />
          <Text style={styles.cardTitle}>Informações Pessoais</Text>
        </View>
        <Campo icon="user" label="Nome Completo" value={dados.nome} styles={styles} colors={colors} />
        <Campo icon="mail" label="Email" value={dados.email} styles={styles} colors={colors} />
        <Campo
          icon="calendar"
          label="Data de Nascimento"
          value={formatarDataBr(dados.dataNascimento || dados.idade)}
          styles={styles}
          colors={colors}
        />
        <Campo
          icon="phone"
          label="Telefone"
          value={formatarTelefone(dados.tipoContato || dados.telefone)}
          styles={styles}
          colors={colors}
        />
      </View>

      {/* Endereço */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="home" size={20} color="#f77433" />
          <Text style={styles.cardTitle}>Endereço</Text>
        </View>
        <Campo icon="map-pin" label="Rua" value={endereco.rua} styles={styles} colors={colors} />
        {numeroVisivel ? (
          <Campo icon="map-pin" label="Número" value={numeroVisivel} styles={styles} colors={colors} />
        ) : null}
        <Campo icon="map-pin" label="Bairro" value={endereco.bairro} styles={styles} colors={colors} />
        <Campo icon="map-pin" label="Cidade" value={endereco.cidade} styles={styles} colors={colors} />
        <Campo icon="map-pin" label="Estado" value={endereco.estado} styles={styles} colors={colors} />
        <Campo icon="map-pin" label="UF" value={endereco.uf} styles={styles} colors={colors} />
        <Campo icon="map-pin" label="CEP" value={endereco.cep} styles={styles} colors={colors} />
      </View>

      {/* Notificações / Saúde */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name={tipo !== 'aluno' ? 'bell' : 'alert-circle'} size={20} color="#f77433" />
          <Text style={styles.cardTitle}>
            {tipo !== 'aluno' ? 'Preferências de Notificação' : 'Informações de Saúde'}
          </Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>
              {tipo !== 'aluno' ? 'Recebe Notificações' : 'Problema de Mobilidade'}
            </Text>
            <Text style={styles.statusSubtitle}>
              {tipo !== 'aluno'
                ? 'Recebe atualizações sobre suas aulas e lembretes'
                : 'Aluno possui limitações físicas ou de mobilidade'}
            </Text>
          </View>
          <View
            style={[
              styles.boolBadge,
              (tipo !== 'aluno' ? dados.notificacaoAtiva : dados.alunoComLimitacoesFisicas)
                ? styles.boolBadgeYes
                : styles.boolBadgeNo,
            ]}
          >
            <Text
              style={[
                styles.boolBadgeText,
                (tipo !== 'aluno' ? dados.notificacaoAtiva : dados.alunoComLimitacoesFisicas)
                  ? styles.boolBadgeTextYes
                  : styles.boolBadgeTextNo,
              ]}
            >
              {(tipo !== 'aluno' ? dados.notificacaoAtiva : dados.alunoComLimitacoesFisicas)
                ? 'Sim'
                : 'Não'}
            </Text>
          </View>
        </View>
      </View>

      {/* Observações */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Feather name="file-text" size={20} color="#f77433" />
          <Text style={styles.cardTitle}>Observações</Text>
        </View>

        <View style={styles.textArea}>
          <Text style={styles.readonlyText}>
            {dados.observacao || 'Nenhuma observação registrada'}
          </Text>
        </View>
      </View>

      {/* Especialidades (professor) */}
      {tipo === 'professor' && (dados.especialidades?.length ?? 0) > 0 && (
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Feather name="award" size={20} color="#f77433" />
            <Text style={styles.cardTitle}>Especialidades</Text>
          </View>
          <View style={styles.chipsWrap}>
            {dados.especialidades?.map((esp) => (
              <View key={esp.id} style={styles.chip}>
                <Feather name="check" size={14} color="#fff" />
                <Text style={styles.chipText}>{esp.nome}</Text>
              </View>
            ))}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
    notFound: { fontSize: 16, fontWeight: '600', color: '#e11d48', marginBottom: 12 },
    backLink: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    backLinkText: { color: '#f77433', fontWeight: '600' },
    headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    headerTexts: { flex: 1 },
    pageTitle: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    pageSubtitle: { fontSize: 13, color: colors.textMuted, marginTop: 2 },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 20,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    profileHeader: { flexDirection: 'row', alignItems: 'center' },
    avatar: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: isDark ? 'rgba(247, 116, 51, 0.2)' : '#fff3eb',
      justifyContent: 'center',
      alignItems: 'center',
      borderWidth: 3,
      borderColor: '#f77433',
      marginRight: 16,
    },
    avatarImage: {
      width: 80,
      height: 80,
      borderRadius: 40,
      borderWidth: 3,
      borderColor: '#f77433',
      backgroundColor: isDark ? 'rgba(247, 116, 51, 0.2)' : '#fff3eb',
      marginRight: 16,
    },
    avatarText: { fontSize: 32, fontWeight: 'bold', color: '#f77433' },
    profileInfo: { flex: 1 },
    profileName: { fontSize: 20, fontWeight: 'bold', color: colors.text },
    profileRole: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    cardTitle: { fontSize: 18, fontWeight: 'bold', color: colors.text, marginLeft: 8 },
    fieldGroup: { marginBottom: 16 },
    label: { fontSize: 13, fontWeight: '600', color: colors.text, marginBottom: 8 },
    readonlyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 14,
      paddingVertical: 12,
    },
    fieldIcon: { marginRight: 10 },
    readonlyText: { flex: 1, fontSize: 15, color: colors.text },
    textArea: {
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      padding: 14,
      minHeight: 90,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.surfaceSubtle,
      borderRadius: 12,
      padding: 16,
    },
    statusTextWrap: { flex: 1, paddingRight: 12 },
    statusTitle: { fontSize: 15, fontWeight: '600', color: colors.text, marginBottom: 2 },
    statusSubtitle: { fontSize: 13, color: colors.textMuted },
    boolBadge: { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16, borderWidth: 1 },
    boolBadgeYes: {
      backgroundColor: isDark ? 'rgba(4, 120, 87, 0.2)' : '#ecfdf5',
      borderColor: isDark ? 'rgba(4, 120, 87, 0.4)' : '#d1fae5',
    },
    boolBadgeNo: {
      backgroundColor: colors.surfaceSubtle,
      borderColor: colors.borderSubtle,
    },
    boolBadgeText: { fontSize: 13, fontWeight: 'bold' },
    boolBadgeTextYes: { color: isDark ? '#34d399' : '#047857' },
    boolBadgeTextNo: { color: colors.textMuted },
    chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: '#f77433',
    },
    chipText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  });