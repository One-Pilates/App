import { useCallback, useEffect, useRef, useState, useMemo } from "react";

import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "@/services/api";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

import { notify } from "@/utils/notify";

import { formatarTelefone, getColorForEspecialidade } from "@/utils/utils";

interface Professor {
  id: number;
  nome: string;
  email: string;
  cargo?: string;
  telefone?: string;
  status: boolean;
  foto?: string | null;
  especialidades?: { id: number; nome: string }[];
}

const PAGE_SIZE = 5;

export default function GerenciamentoProfessor() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isAdmin = (user?.role || "").toUpperCase() === "ADMINISTRADOR";

  const [professores, setProfessores] = useState<Professor[]>([]);

  const [page, setPage] = useState(1);

  const [hasMore, setHasMore] = useState(true);

  const [loading, setLoading] = useState(true);

  const [loadingMore, setLoadingMore] = useState(false);

  const [busca, setBusca] = useState("");

  const [nameFilter, setNameFilter] = useState("");

  const [token, setToken] = useState<string | null>(null);

  const mountTs = useRef(Date.now()).current;

  useEffect(() => {
    AsyncStorage.getItem("token").then((t) =>
      setToken(t ? t.replace(/^"|"$/g, "") : null),
    );
  }, []);

  const fetchProfessores = useCallback(
    async (pageToLoad: number, append: boolean, nome: string) => {
      if (append) setLoadingMore(true);
      else setLoading(true);

      try {
        const params: Record<string, unknown> = {
          page: Math.max(0, pageToLoad - 1),

          size: PAGE_SIZE,

          sort: "id,asc",
        };

        if (nome.trim()) params.nome = nome.trim();

        const response = await api.get("api/professores/paginacao", { params });

        const data = response.data || {};

        const lista: Professor[] = data.professores || [];

        setProfessores((prev) => (append ? [...prev, ...lista] : lista));

        setPage(pageToLoad);

        setHasMore((data.totalPaginas || 1) > pageToLoad);
      } catch (error) {
        console.error("Erro ao buscar professores:", error);

        notify.error("Não foi possível carregar os professores.");
      } finally {
        setLoading(false);

        setLoadingMore(false);
      }
    },
    [],
  );

  // Debounce da busca

  useEffect(() => {
    const t = setTimeout(() => setNameFilter(busca), 300);

    return () => clearTimeout(t);
  }, [busca]);

  useEffect(() => {
    setHasMore(true);

    fetchProfessores(1, false, nameFilter);
  }, [nameFilter, fetchProfessores]);

  // Recarrega ao voltar para a tela (ex.: após cadastrar professor).

  const primeiroFoco = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;

        return;
      }

      setHasMore(true);

      fetchProfessores(1, false, nameFilter);
    }, [nameFilter, fetchProfessores]),
  );

  function loadMore() {
    if (loadingMore || loading || !hasMore) return;

    fetchProfessores(page + 1, true, nameFilter);
  }

  function deletarProfessor(prof: Professor) {
    Alert.alert(
      "Excluir professor",

      `Ao excluir "${prof.nome}", todos os agendamentos vinculados também serão removidos. Essa ação não pode ser desfeita.`,

      [
        { text: "Cancelar", style: "cancel" },

        {
          text: "Excluir",

          style: "destructive",

          onPress: async () => {
            try {
              await api.delete(`api/professores/${prof.id}`);

              setProfessores((prev) => prev.filter((p) => p.id !== prof.id));

              notify.success("Professor deletado com sucesso.");
            } catch (error) {
              console.error("Erro ao deletar professor:", error);

              notify.error("Não foi possível deletar o professor.");
            }
          },
        },
      ],
    );
  }

  function alterarStatus(prof: Professor) {
    const novoStatus = !prof.status;

    const acao = novoStatus ? "ativar" : "desativar";

    Alert.alert("Alterar status", `Deseja realmente ${acao} este professor?`, [
      { text: "Cancelar", style: "cancel" },

      {
        text: `Sim, ${acao}`,

        onPress: async () => {
          try {
            await api.patch(`api/professores/${prof.id}`, {
              status: novoStatus,
            });

            setProfessores((prev) =>
              prev.map((p) =>
                p.id === prof.id ? { ...p, status: novoStatus } : p,
              ),
            );

            notify.success(
              `Professor ${novoStatus ? "ativado" : "desativado"} com sucesso.`,
            );
          } catch (error) {
            console.error("Erro ao alterar status:", error);

            notify.error("Não foi possível alterar o status do professor.");
          }
        },
      },
    ]);
  }

  const renderItem = ({ item }: { item: Professor }) => {
    const fotoUri = item.foto
      ? `${api.defaults.baseURL}/api/imagens/funcionarios/${item.id}?t=${mountTs}`
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardTop}>
          {fotoUri ? (
            <Image
              source={{
                uri: fotoUri,

                headers: token
                  ? { Authorization: `Bearer ${token}` }
                  : undefined,
              }}
              style={styles.avatarImg}
            />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {item.nome?.charAt(0)?.toUpperCase()}
              </Text>
            </View>
          )}

          <View style={styles.headInfo}>
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(secretary)/perfilView/[tipo]/[id]",

                  params: { tipo: "professor", id: String(item.id) },
                })
              }
            >
              <Text style={styles.name} numberOfLines={1}>
                {item.nome}
              </Text>
            </TouchableOpacity>

            <Text style={styles.cargo}>
              {item.cargo || "Professor Especialista"}
            </Text>

            <View
              style={[
                styles.statusBadge,
                item.status ? styles.statusActive : styles.statusInactive,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  item.status
                    ? styles.statusTextActive
                    : styles.statusTextInactive,
                ]}
              >
                {item.status ? "Ativo" : "Inativo"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.contactRow}>
          <Feather name="phone" size={14} color="#f77433" />

          <Text style={styles.contactText}>
            {formatarTelefone(item.telefone) || "Sem telefone"}
          </Text>
        </View>

        <View style={styles.contactRow}>
          <Feather name="mail" size={14} color="#2563eb" />

          <Text style={styles.contactText} numberOfLines={1}>
            {item.email}
          </Text>
        </View>

        <View style={styles.chipsWrap}>
          {item.especialidades && item.especialidades.length > 0 ? (
            item.especialidades.map((esp) => {
              const { backgroundColor } = getColorForEspecialidade(esp.nome);

              return (
                <View
                  key={esp.id}
                  style={[styles.espChip, { backgroundColor }]}
                >
                  <Text style={styles.espChipText}>{esp.nome}</Text>
                </View>
              );
            })
          ) : (
            <Text style={styles.noEsp}>Nenhuma especialidade</Text>
          )}
        </View>

        <View style={styles.footerRow}>
          <TouchableOpacity
            style={styles.agendaBtn}
            onPress={() => router.push("/(secretary)/agenda")}
          >
            <Feather name="calendar" size={16} color="#fff" />

            <Text style={styles.agendaBtnText}>Ver agenda</Text>
          </TouchableOpacity>

          {isAdmin && (
            <View style={styles.adminActions}>
              <TouchableOpacity
                style={[
                  styles.actionBtn,
                  item.status ? styles.actionActive : styles.actionInactive,
                ]}
                onPress={() => alterarStatus(item)}
              >
                <Feather
                  name={item.status ? "user-check" : "user-x"}
                  size={18}
                  color={item.status ? "#059669" : "#e11d48"}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => deletarProfessor(item)}
              >
                <Feather name="trash-2" size={18} color="#e11d48" />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>

          <Text style={styles.title}>Professores</Text>

          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/(secretary)/colaborador/cadastrar/[role]",
                  params: { role: "PROFESSOR" },
                })
              }
            >
              <Feather name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textSecondary} />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor={colors.inputPlaceholder}
            value={busca}
            onChangeText={setBusca}
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={professores}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum professor encontrado.</Text>
          }
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator
                color={colors.primary}
                style={{ marginVertical: 20 }}
              />
            ) : null
          }
        />
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background },

    header: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: colors.surfaceCard,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },

    headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 10 },

    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    title: { fontSize: 22, fontWeight: "800", color: colors.text, flex: 1 },

    addButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: colors.primary,
      justifyContent: "center",
      alignItems: "center",
    },

    searchContainer: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.inputBg,
      borderRadius: 10,
      paddingHorizontal: 14,
      height: 44,
      borderWidth: 1,
      borderColor: colors.inputBorder,
    },

    searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: colors.inputText },

    listContent: { padding: 20 },

    empty: {
      textAlign: "center",
      color: colors.textMuted,
      fontWeight: "500",
      marginTop: 40,
    },

    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 18,
      padding: 18,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.04,
      shadowRadius: 8,
      elevation: 2,
    },

    cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },

    avatar: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },

    avatarImg: {
      width: 64,
      height: 64,
      borderRadius: 16,
      marginRight: 16,
      backgroundColor: colors.primaryLight,
    },

    avatarText: { fontSize: 26, fontWeight: "bold", color: colors.primary },

    headInfo: { flex: 1, gap: 3 },

    name: { fontSize: 18, fontWeight: "bold", color: colors.text },

    cargo: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    statusBadge: {
      alignSelf: "flex-start",
      paddingHorizontal: 10,
      paddingVertical: 3,
      borderRadius: 12,
      borderWidth: 1,
      marginTop: 4,
    },

    statusActive: {
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#ecfdf5",
      borderColor: isDark ? "rgba(34, 197, 94, 0.3)" : "#d1fae5",
    },

    statusInactive: {
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fff1f2",
      borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#ffe4e6",
    },

    statusText: {
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    statusTextActive: { color: isDark ? "#4ade80" : "#047857" },

    statusTextInactive: { color: isDark ? "#f87171" : "#be123c" },

    contactRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },

    contactText: { fontSize: 14, color: colors.textSecondary, fontWeight: "500", flex: 1 },

    chipsWrap: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 8,
      marginBottom: 4,
    },

    espChip: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 10 },

    espChipText: {
      color: "#fff",
      fontSize: 10,
      fontWeight: "bold",
      textTransform: "uppercase",
    },

    noEsp: { color: colors.textMuted, fontStyle: "italic", fontSize: 13 },

    footerRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 14,
      paddingTop: 14,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },

    agendaBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingHorizontal: 16,
      paddingVertical: 10,
      borderRadius: 12,
    },

    agendaBtnText: { color: "#fff", fontWeight: "bold", fontSize: 14 },

    adminActions: { flexDirection: "row", gap: 10 },

    actionBtn: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    actionActive: {
      backgroundColor: isDark ? "rgba(34, 197, 94, 0.15)" : "#ecfdf5",
      borderColor: isDark ? "rgba(34, 197, 94, 0.3)" : "#d1fae5",
    },

    actionInactive: {
      backgroundColor: isDark ? "rgba(239, 68, 68, 0.15)" : "#fff1f2",
      borderColor: isDark ? "rgba(239, 68, 68, 0.3)" : "#ffe4e6",
    },
  });

