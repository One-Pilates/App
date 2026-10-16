import { useCallback, useEffect, useRef, useState } from "react";

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
          style={styles.avatar}
          onPress={() =>
            router.push({
              pathname: "/(secretary)/perfilView/[tipo]/[id]",

              params: { tipo: "aluno", id: String(item.id) },
            })
          }
        >
          <Text style={styles.avatarText}>
            {item.nome?.charAt(0)?.toUpperCase()}
          </Text>
        </TouchableOpacity>

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
              <Feather name="alert-triangle" size={11} color="#b45309" />

              <Text style={styles.limitBadgeText}>Limitações físicas</Text>
            </View>
          ) : null}
        </View>

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
          <Text style={styles.title}>Alunos</Text>

          <TouchableOpacity
            style={styles.addButton}
            onPress={() => router.push("/(secretary)/aluno/cadastrar")}
          >
            <Text style={styles.addButtonText}>+ Novo Aluno</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color="#94a3b8" />

          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nome..."
            placeholderTextColor="#94a3b8"
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
          <ActivityIndicator size="large" color="#f77433" />
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
              tintColor="#f77433"
            />
          }
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhum aluno encontrado.</Text>
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
                color={page === 1 ? "#cbd5e1" : "#f77433"}
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
                color={page >= totalPaginas ? "#cbd5e1" : "#f77433"}
              />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  title: { fontSize: 20, fontWeight: "800", color: "#0f172a" },

  addButton: {
    backgroundColor: "#f77433",

    paddingHorizontal: 16,

    paddingVertical: 10,

    borderRadius: 10,

    shadowColor: "#f77433",

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.3,

    shadowRadius: 8,

    elevation: 4,
  },

  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 13 },

  searchContainer: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: "#fff",

    borderRadius: 10,

    paddingHorizontal: 14,

    height: 44,

    borderWidth: 1,

    borderColor: "#e2e8f0",
  },

  searchInput: { flex: 1, marginLeft: 10, fontSize: 15, color: "#0f172a" },

  filterRow: { flexDirection: "row", gap: 8, marginTop: 12 },

  filterChip: {
    paddingHorizontal: 14,

    paddingVertical: 7,

    borderRadius: 999,

    backgroundColor: "#f1f5f9",

    borderWidth: 1,

    borderColor: "#e2e8f0",
  },

  filterChipActive: { backgroundColor: "#f77433", borderColor: "#f77433" },

  filterChipText: { fontSize: 12, fontWeight: "700", color: "#64748b" },

  filterChipTextActive: { color: "#fff" },

  listContent: { padding: 16, paddingBottom: 24 },

  empty: {
    textAlign: "center",
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 40,
  },

  studentCard: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 16,

    flexDirection: "row",

    alignItems: "center",

    marginBottom: 16,

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.04,

    shadowRadius: 8,

    elevation: 2,

    borderWidth: 1,

    borderColor: "#f1f5f9",
  },

  avatar: {
    width: 48,

    height: 48,

    borderRadius: 24,

    backgroundColor: "#fff3eb",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 16,
  },

  avatarText: { fontSize: 20, fontWeight: "bold", color: "#f77433" },

  infoContainer: { flex: 1 },

  studentName: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 4,
  },

  studentSub: { fontSize: 13, color: "#64748b", fontWeight: "500" },

  limitBadge: {
    flexDirection: "row",

    alignItems: "center",

    alignSelf: "flex-start",

    gap: 4,

    marginTop: 6,

    paddingHorizontal: 8,

    paddingVertical: 3,

    borderRadius: 8,

    backgroundColor: "#fffbeb",

    borderWidth: 1,

    borderColor: "#fde68a",
  },

  limitBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#b45309",
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

  statusActive: { backgroundColor: "#ecfdf5", borderColor: "#d1fae5" },

  statusInactive: { backgroundColor: "#fff1f2", borderColor: "#ffe4e6" },

  statusText: {
    fontSize: 11,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statusTextActive: { color: "#047857" },

  statusTextInactive: { color: "#be123c" },

  actions: { flexDirection: "row", gap: 6 },

  actionBtn: {
    width: 32,

    height: 32,

    borderRadius: 8,

    backgroundColor: "#f8fafc",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 1,

    borderColor: "#f1f5f9",
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
    color: "#64748b",
    fontWeight: "500",
  },

  paginationHighlight: {
    color: "#0f172a",
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
    color: "#f77433",
  },

  pageLabelDivider: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
  },

  pageLabelTotal: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
});
