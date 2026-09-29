import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

import { useFocusEffect, useRouter } from "expo-router";

import AsyncStorage from "@react-native-async-storage/async-storage";

import api from "@/services/api";

import { useAuth } from "@/contexts/AuthContext";

import { notify } from "@/utils/notify";

import { formatarTelefone } from "@/utils/utils";

interface Secretaria {
  id: number;

  nome: string;

  email: string;

  cargo?: string;

  telefone?: string;

  status: boolean;

  foto?: string | null;
}

export default function GerenciamentoSecretaria() {
  const router = useRouter();

  const { user } = useAuth();

  const isAdmin = (user?.role || "").toUpperCase() === "ADMINISTRADOR";

  const [secretarias, setSecretarias] = useState<Secretaria[]>([]);

  const [loading, setLoading] = useState(true);

  const [busca, setBusca] = useState("");

  const [token, setToken] = useState<string | null>(null);

  const mountTs = useRef(Date.now()).current;

  useEffect(() => {
    AsyncStorage.getItem("token").then((t) =>
      setToken(t ? t.replace(/^"|"$/g, "") : null),
    );
  }, []);

  const fetchSecretarias = useCallback(async () => {
    setLoading(true);

    try {
      const response = await api.get("api/secretarias");

      const data = response.data || [];

      const lista: Secretaria[] = Array.isArray(data)
        ? data
        : data.secretarias || [];

      setSecretarias(lista);
    } catch (error) {
      console.error("Erro ao buscar secretarias:", error);

      notify.error("Não foi possível carregar as secretárias.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecretarias();
  }, [fetchSecretarias]);

  // Recarrega ao voltar para a tela (ex.: após cadastrar secretária).

  const primeiroFoco = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;

        return;
      }

      fetchSecretarias();
    }, [fetchSecretarias]),
  );

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase();

    if (!termo) return secretarias;

    return secretarias.filter((s) =>
      (s.nome || "").toLowerCase().includes(termo),
    );
  }, [secretarias, busca]);

  function deletarSecretaria(sec: Secretaria) {
    Alert.alert(
      "Excluir secretária",

      `Deseja excluir "${sec.nome}"? Ela será removida permanentemente. Essa ação não pode ser desfeita.`,

      [
        { text: "Cancelar", style: "cancel" },

        {
          text: "Excluir",

          style: "destructive",

          onPress: async () => {
            try {
              await api.delete(`api/secretarias/${sec.id}`);

              setSecretarias((prev) => prev.filter((s) => s.id !== sec.id));

              notify.success("Secretária deletada com sucesso.");
            } catch (error) {
              console.error("Erro ao deletar secretaria:", error);

              notify.error("Não foi possível deletar a secretária.");
            }
          },
        },
      ],
    );
  }

  function alterarStatus(sec: Secretaria) {
    const novoStatus = !sec.status;

    const acao = novoStatus ? "ativar" : "desativar";

    Alert.alert("Alterar status", `Deseja realmente ${acao} esta secretária?`, [
      { text: "Cancelar", style: "cancel" },

      {
        text: `Sim, ${acao}`,

        onPress: async () => {
          try {
            await api.patch(`api/secretarias/${sec.id}`, {
              status: novoStatus,
            });

            setSecretarias((prev) =>
              prev.map((s) =>
                s.id === sec.id ? { ...s, status: novoStatus } : s,
              ),
            );

            notify.success(
              `Secretária ${novoStatus ? "ativada" : "desativada"} com sucesso.`,
            );
          } catch (error) {
            console.error("Erro ao alterar status:", error);

            notify.error("Não foi possível alterar o status da secretária.");
          }
        },
      },
    ]);
  }

  const renderItem = ({ item }: { item: Secretaria }) => {
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

                  params: { tipo: "secretaria", id: String(item.id) },
                })
              }
            >
              <Text style={styles.name} numberOfLines={1}>
                {item.nome}
              </Text>
            </TouchableOpacity>

            <Text style={styles.cargo}>{item.cargo || "Secretária"}</Text>

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

        {isAdmin && (
          <View style={styles.footerRow}>
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
              onPress={() => deletarSecretaria(item)}
            >
              <Feather name="trash-2" size={18} color="#e11d48" />
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>

          <Text style={styles.title}>Secretárias</Text>

          {isAdmin && (
            <TouchableOpacity
              style={styles.addButton}
              onPress={() =>
                router.push({
                  pathname: "/(secretary)/colaborador/cadastrar/[role]",

                  params: { role: "SECRETARIA" },
                })
              }
            >
              <Feather name="plus" size={16} color="#fff" />
            </TouchableOpacity>
          )}
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
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#f77433" />
        </View>
      ) : (
        <FlatList
          data={filtradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.empty}>Nenhuma secretária encontrada.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },

  header: {
    padding: 20,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e5e7eb",
  },

  headerTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },

  backButton: {
    width: 40,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#f8fafc",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 12,

    borderWidth: 1,

    borderColor: "#f1f5f9",
  },

  title: { fontSize: 22, fontWeight: "800", color: "#0f172a", flex: 1 },

  addButton: {
    width: 40,

    height: 40,

    borderRadius: 12,

    backgroundColor: "#f77433",

    justifyContent: "center",

    alignItems: "center",
  },

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

  listContent: { padding: 20 },

  empty: {
    textAlign: "center",
    color: "#94a3b8",
    fontWeight: "500",
    marginTop: 40,
  },

  card: {
    backgroundColor: "#fff",

    borderRadius: 18,

    padding: 18,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: "#f1f5f9",

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.04,

    shadowRadius: 8,

    elevation: 2,
  },

  cardTop: { flexDirection: "row", alignItems: "center", marginBottom: 14 },

  avatar: {
    width: 64,

    height: 64,

    borderRadius: 16,

    backgroundColor: "#fff3eb",

    justifyContent: "center",

    alignItems: "center",

    marginRight: 16,
  },

  avatarImg: {
    width: 64,
    height: 64,
    borderRadius: 16,
    marginRight: 16,
    backgroundColor: "#fff3eb",
  },

  avatarText: { fontSize: 26, fontWeight: "bold", color: "#f77433" },

  headInfo: { flex: 1, gap: 3 },

  name: { fontSize: 18, fontWeight: "bold", color: "#0f172a" },

  cargo: {
    fontSize: 12,
    fontWeight: "600",
    color: "#94a3b8",
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

  statusActive: { backgroundColor: "#ecfdf5", borderColor: "#d1fae5" },

  statusInactive: { backgroundColor: "#fff1f2", borderColor: "#ffe4e6" },

  statusText: {
    fontSize: 10,
    fontWeight: "bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },

  statusTextActive: { color: "#047857" },

  statusTextInactive: { color: "#be123c" },

  contactRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },

  contactText: { fontSize: 14, color: "#475569", fontWeight: "500", flex: 1 },

  footerRow: {
    flexDirection: "row",

    justifyContent: "flex-end",

    gap: 10,

    marginTop: 14,

    paddingTop: 14,

    borderTopWidth: 1,

    borderTopColor: "#f1f5f9",
  },

  actionBtn: {
    width: 40,

    height: 40,

    borderRadius: 10,

    backgroundColor: "#f8fafc",

    justifyContent: "center",

    alignItems: "center",

    borderWidth: 1,

    borderColor: "#f1f5f9",
  },

  actionActive: { backgroundColor: "#ecfdf5", borderColor: "#d1fae5" },

  actionInactive: { backgroundColor: "#fff1f2", borderColor: "#ffe4e6" },
});
