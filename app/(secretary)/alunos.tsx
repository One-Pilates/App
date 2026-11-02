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
  RefreshControl,
} from "react-native";

import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useFocusEffect, useRouter } from "expo-router";

import api from "@/services/api";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

interface Aluno {
  id: number;

  nome: string;

  email: string;

  dataNascimento?: string;

  status: boolean;

  notificacaoAtiva?: boolean;

  alunoComLimitacoesFisicas?: boolean;
}

type StatusFilter = "todos" | "ativo" | "inativo";

const PAGE_SIZE = 10;

function calcularIdade(dataNascimento?: string): number | null {
  if (!dataNascimento) return null;

  const hoje = new Date();

  const nasc = new Date(dataNascimento);

  if (Number.isNaN(nasc.getTime())) return null;

  let idade = hoje.getFullYear() - nasc.getFullYear();

  const m = hoje.getMonth() - nasc.getMonth();

  if (m < 0 || (m === 0 && hoje.getDate() < nasc.getDate())) idade--;

  return idade;
}

export default function AlunosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [alunos, setAlunos] = useState<Aluno[]>([]);

  const [totalPaginas, setTotalPaginas] = useState(1);

  const [totalRegistros, setTotalRegistros] = useState(0);

  const [page, setPage] = useState(1);

  const [busca, setBusca] = useState("");

  const [nameFilter, setNameFilter] = useState("");

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("todos");

  const [loading, setLoading] = useState(false);

  const [refreshing, setRefreshing] = useState(false);

  const fetchAlunos = useCallback(
    async (pageToLoad: number, nome: string, status: StatusFilter) => {
      setLoading(true);

      try {
        const params: Record<string, unknown> = {
          page: Math.max(0, pageToLoad - 1),

          size: PAGE_SIZE,

          sort: "id,asc",
        };

        if (nome.trim()) params.nome = nome.trim();

        if (status !== "todos") params.status = status === "ativo";

        const response = await api.get("api/alunos/paginacao", { params });

        const data = response.data || {};

        setAlunos(data.alunos || []);

        setTotalPaginas(data.totalPaginas || 1);

        setTotalRegistros(
          data.totalRegistros ?? (data.alunos ? data.alunos.length : 0),
        );
      } catch (error) {
        console.error("Erro ao buscar alunos:", error);

        Alert.alert("Erro", "Não foi possível carregar os alunos.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },

    [],
  );

  // Debounce da busca por nome

  useEffect(() => {
    const t = setTimeout(() => setNameFilter(busca), 400);

    return () => clearTimeout(t);
  }, [busca]);

  // Reseta para a página 1 quando filtros mudam

  useEffect(() => {
    setPage(1);
  }, [nameFilter, statusFilter]);

  useEffect(() => {
    fetchAlunos(page, nameFilter, statusFilter);
  }, [page, nameFilter, statusFilter, fetchAlunos]);

  // Recarrega ao voltar para a tela (ex.: após cadastrar/editar aluno).

  const primeiroFoco = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;

        return;
      }

      fetchAlunos(page, nameFilter, statusFilter);
    }, [page, nameFilter, statusFilter, fetchAlunos]),
  );

  const onRefresh = () => {
    setRefreshing(true);

    fetchAlunos(page, nameFilter, statusFilter);
  };

  const excluirAluno = (aluno: Aluno) => {
    Alert.alert(
      "Excluir aluno",
      `Deseja excluir "${aluno.nome}"? Essa ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },

        {
          text: "Excluir",

          style: "destructive",

          onPress: async () => {
            try {
              await api.delete(`api/alunos/${aluno.id}`);

              const nextPage =
                alunos.length === 1 && page > 1 ? page - 1 : page;

              setPage(nextPage);

              await fetchAlunos(nextPage, nameFilter, statusFilter);
            } catch (error) {
              console.error("Erro ao deletar aluno:", error);

              Alert.alert("Erro", "Não foi possível excluir o aluno.");
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }: { item: Aluno }) => {
    const idade = calcularIdade(item.dataNascimento);

    return (
      <View style={styles.studentCard}>
        <TouchableOpacity
          style={styles.cardMainPressable}
          activeOpacity={0.7}
          onPress={() =>
            router.push({
              pathname: "/(secretary)/perfilView/[tipo]/[id]",
              params: { tipo: "aluno", id: String(item.id) },
            })
          }
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {item.nome?.charAt(0)?.toUpperCase()}
            </Text>
          </View>

          <View style={styles.infoContainer}>
            <Text style={styles.studentName} numberOfLines={1}>
              {item.nome}
            </Text>

            <Text style={styles.studentSub} numberOfLines={1}>
              {item.email}
              {idade != null ? ` • ${idade} anos` : ""}
            </Text>

            {item.alunoComLimitacoesFisicas ? (
              <View style={styles.limitBadge}>
                <Feather name="alert-triangle" size={11} color={colors.isDark ? "#fbbf24" : "#b45309"} />
                <Text style={styles.limitBadgeText}>Limitações físicas</Text>
              </View>
            ) : null}
          </View>
        </TouchableOpacity>

        <View style={styles.rightSide}>
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

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() =>
                router.push({
                  pathname: "/(secretary)/aluno/editar/[id]",
                  params: { id: String(item.id) },
                })
              }
            >
              <Feather name="edit-2" size={16} color="#2563eb" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => excluirAluno(item)}
            >
              <Feather name="trash-2" size={16} color="#e11d48" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  const startIndex = totalRegistros === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;

  const endIndex = (page - 1) * PAGE_SIZE + alunos.length;

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.title}>Alunos</Text>
            <Text style={styles.subtitle}>Gestão de matrículas e cadastros</Text>
          </View>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/(secretary)/aluno/cadastrar")}
            activeOpacity={0.8}
          >
            <Feather name="user-plus" size={15} color="#fff" />
            <Text style={styles.addButtonText}>Novo Aluno</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={colors.textMuted} />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor={colors.inputPlaceholder}
            value={busca}
            onChangeText={setBusca}
          />
        </View>

        <View style={styles.filterRow}>
          {(["todos", "ativo", "inativo"] as StatusFilter[]).map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterChip,
                statusFilter === f && styles.filterChipActive,
              ]}
              onPress={() => setStatusFilter(f)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  statusFilter === f && styles.filterChipTextActive,
                ]}
              >
                {f === "todos"
                  ? "Todos"
                  : f === "ativo"
                    ? "Ativos"
                    : "Inativos"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <FlatList
          data={alunos}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Feather name="users" size={28} color={colors.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
              <Text style={styles.emptySubtitle}>
                {busca.trim()
                  ? `Nenhum resultado para "${busca}". Verifique o nome ou ajuste os filtros.`
                  : "Não há alunos cadastrados nesta categoria."}
              </Text>
            </View>
          }
        />
      )}

      {/* Barra de Paginação Fixa na Base da Tela (Acima das Tabs) */}
      {!loading && totalRegistros > 0 && (
        <View style={styles.bottomPaginationBar}>
          <Text style={styles.paginationInfo}>
            {startIndex}–{endIndex} de <Text style={styles.paginationHighlight}>{totalRegistros}</Text> alunos
          </Text>

          <View style={styles.paginationControls}>
            <TouchableOpacity
              style={[
                styles.pageBtn,
                page === 1 && styles.pageBtnDisabled,
              ]}
              disabled={page === 1}
              onPress={() => setPage((p) => Math.max(1, p - 1))}
              activeOpacity={0.7}
            >
              <Feather
                name="chevron-left"
                size={18}
                color={page === 1 ? colors.borderSubtle : colors.primary}
              />
            </TouchableOpacity>

            <View style={styles.pageLabelPill}>
              <Text style={styles.pageLabelCurrent}>{page}</Text>
              <Text style={styles.pageLabelDivider}>/</Text>
              <Text style={styles.pageLabelTotal}>{totalPaginas}</Text>
            </View>

            <TouchableOpacity
              style={[
                styles.pageBtn,
                page >= totalPaginas && styles.pageBtnDisabled,
              ]}
              disabled={page >= totalPaginas}
              onPress={() => setPage((p) => Math.min(totalPaginas, p + 1))}
              activeOpacity={0.7}
            >
              <Feather
                name="chevron-right"
                size={18}
                color={page >= totalPaginas ? colors.borderSubtle : colors.primary}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    center: { flex: 1, justifyContent: "center", alignItems: "center" },

    header: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: colors.surfaceCard,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },

    headerTop: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 10,
    },

    title: { fontSize: 20, fontWeight: "800", color: colors.text },
    subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },

    addButton: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.primary,
      paddingHorizontal: 14,
      paddingVertical: 9,
      borderRadius: 10,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 4,
    },

    addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

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

    filterRow: { flexDirection: "row", gap: 8, marginTop: 12 },

    filterChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 999,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },

    filterChipText: { fontSize: 12, fontWeight: "700", color: colors.textSecondary },

    filterChipTextActive: { color: "#fff" },

    listContent: { padding: 16, paddingBottom: 24 },

    emptyContainer: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 60,
      paddingHorizontal: 24,
    },

    emptyIconCircle: {
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginBottom: 14,
    },

    emptyTitle: {
      fontSize: 16,
      fontWeight: "700",
      color: colors.text,
      marginBottom: 6,
      textAlign: "center",
    },

    emptySubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      textAlign: "center",
      lineHeight: 18,
    },

    empty: {
      textAlign: "center",
      color: colors.textMuted,
      fontWeight: "500",
      marginTop: 40,
    },

    studentCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 16,
      flexDirection: "row",
      alignItems: "center",
      marginBottom: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: colors.isDark ? 0.2 : 0.08,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },

    cardMainPressable: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      marginRight: 10,
    },

    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
      marginRight: 16,
    },

    avatarText: { fontSize: 20, fontWeight: "bold", color: colors.primary },

    infoContainer: { flex: 1 },

    studentName: {
      fontSize: 16,
      fontWeight: "bold",
      color: colors.text,
      marginBottom: 4,
    },

    studentSub: { fontSize: 13, color: colors.textSecondary, fontWeight: "500" },

    limitBadge: {
      flexDirection: "row",
      alignItems: "center",
      alignSelf: "flex-start",
      gap: 4,
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 8,
      backgroundColor: colors.isDark ? "rgba(245, 158, 11, 0.2)" : "#fffbeb",
      borderWidth: 1,
      borderColor: colors.isDark ? "rgba(245, 158, 11, 0.4)" : "#fde68a",
    },

    limitBadgeText: {
      fontSize: 10,
      fontWeight: "700",
      color: colors.isDark ? "#fbbf24" : "#b45309",
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },

    rightSide: { alignItems: "flex-end", gap: 8 },

    statusBadge: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 16,
      borderWidth: 1,
    },

    statusActive: {
      backgroundColor: colors.isDark ? "rgba(16, 185, 129, 0.15)" : "#ecfdf5",
      borderColor: colors.isDark ? "rgba(16, 185, 129, 0.3)" : "#d1fae5",
    },

    statusInactive: {
      backgroundColor: colors.isDark ? "rgba(244, 63, 94, 0.15)" : "#fff1f2",
      borderColor: colors.isDark ? "rgba(244, 63, 94, 0.3)" : "#ffe4e6",
    },

    statusText: {
      fontSize: 11,
      fontWeight: "bold",
      textTransform: "uppercase",
      letterSpacing: 0.5,
    },

    statusTextActive: { color: colors.isDark ? "#34d399" : "#047857" },

    statusTextInactive: { color: colors.isDark ? "#fb7185" : "#be123c" },

    actions: { flexDirection: "row", gap: 6 },

    actionBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    bottomPaginationBar: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingVertical: 10,
      backgroundColor: "transparent",
    },

    paginationInfo: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: "500",
    },

    paginationHighlight: {
      color: colors.text,
      fontWeight: "700",
    },

    paginationControls: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
    },

    pageBtn: {
      width: 32,
      height: 32,
      justifyContent: "center",
      alignItems: "center",
    },

    pageBtnDisabled: {
      opacity: 0.3,
    },

    pageLabelPill: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: 6,
      paddingVertical: 4,
      gap: 4,
    },

    pageLabelCurrent: {
      fontSize: 14,
      fontWeight: "800",
      color: colors.primary,
    },

    pageLabelDivider: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.textMuted,
    },

    pageLabelTotal: {
      fontSize: 13,
      fontWeight: "700",
      color: colors.textSecondary,
    },
  });
