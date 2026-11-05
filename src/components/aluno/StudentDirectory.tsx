import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/services/api";
import { ThemeColors, useTheme } from "@/contexts/ThemeContext";

export interface Student {
  id: number;
  nome: string;
  email?: string;
  telefone?: string;
  dataNascimento?: string;
  idade?: string;
  status?: boolean;
  alunoComLimitacoesFisicas?: boolean;
}

interface StudentDirectoryProps {
  title: string;
  subtitle: string;
}

function getAge(student: Student): string {
  if (student.idade) return student.idade;
  if (!student.dataNascimento) return "";
  const birthDate = new Date(student.dataNascimento);
  if (Number.isNaN(birthDate.getTime())) return "";
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  if (
    today.getMonth() < birthDate.getMonth() ||
    (today.getMonth() === birthDate.getMonth() &&
      today.getDate() < birthDate.getDate())
  ) {
    age -= 1;
  }
  return age > 0 ? `${age} anos` : "";
}

export default function StudentDirectory({
  title,
  subtitle,
}: StudentDirectoryProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [students, setStudents] = useState<Student[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const loadStudents = useCallback(async () => {
    try {
      setError(false);
      const response = await api.get("api/alunos/paginacao", {
        params: { page: 0, size: 100, sort: "nome,asc" },
      });
      const data = response.data || {};
      setStudents(Array.isArray(data.alunos) ? data.alunos : []);
    } catch (requestError) {
      console.error("Erro ao carregar alunos:", requestError);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return students;
    return students.filter((student) =>
      `${student.nome} ${student.email || ""}`.toLocaleLowerCase().includes(query),
    );
  }, [search, students]);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
        <View style={styles.searchBox}>
          <Feather name="search" size={18} color={colors.textMuted} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar aluno"
            placeholderTextColor={colors.inputPlaceholder}
            style={styles.searchInput}
            accessibilityLabel="Buscar aluno por nome ou e-mail"
          />
        </View>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Feather name="wifi-off" size={28} color={colors.primary} />
          <Text style={styles.emptyTitle}>Não foi possível carregar os alunos</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadStudents}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredStudents}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadStudents();
              }}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="users" size={28} color={colors.primary} />
              <Text style={styles.emptyTitle}>Nenhum aluno encontrado</Text>
              <Text style={styles.emptySubtitle}>
                Ajuste a busca para encontrar outro cadastro.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/(aluno)/perfil/[id]",
                  params: { id: String(item.id) },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${item.nome}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(item.nome || "A").charAt(0).toUpperCase()}
                </Text>
              </View>
              <View style={styles.cardInfo}>
                <Text style={styles.name} numberOfLines={1}>
                  {item.nome}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
                  {item.email || "E-mail não informado"}
                  {getAge(item) ? `  ·  ${getAge(item)}` : ""}
                </Text>
                {item.alunoComLimitacoesFisicas ? (
                  <View style={styles.healthLabel}>
                    <Feather name="heart" size={11} color={colors.primary} />
                    <Text style={styles.healthText}>Atenção especial</Text>
                  </View>
                ) : null}
              </View>
              <Feather name="chevron-right" size={19} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 14,
      backgroundColor: colors.surfaceCard,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    title: { fontSize: 24, fontWeight: "800", color: colors.text },
    subtitle: { marginTop: 4, fontSize: 13, color: colors.textSecondary },
    searchBox: {
      height: 44,
      marginTop: 16,
      paddingHorizontal: 13,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
    },
    searchInput: { flex: 1, marginLeft: 9, color: colors.inputText, fontSize: 14 },
    list: { padding: 16, paddingBottom: 28 },
    card: {
      minHeight: 76,
      marginBottom: 10,
      padding: 13,
      flexDirection: "row",
      alignItems: "center",
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    avatar: {
      width: 48,
      height: 48,
      borderRadius: 24,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
    },
    avatarText: { color: colors.primary, fontSize: 20, fontWeight: "800" },
    cardInfo: { flex: 1, marginHorizontal: 12 },
    name: { color: colors.text, fontSize: 15, fontWeight: "700" },
    meta: { marginTop: 4, color: colors.textSecondary, fontSize: 12 },
    healthLabel: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 5 },
    healthText: { color: colors.primary, fontSize: 11, fontWeight: "600" },
    center: { flex: 1, alignItems: "center", justifyContent: "center" },
    empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 28 },
    emptyTitle: { marginTop: 12, color: colors.text, fontSize: 16, fontWeight: "700", textAlign: "center" },
    emptySubtitle: { marginTop: 6, color: colors.textSecondary, fontSize: 13, textAlign: "center" },
    retryButton: {
      marginTop: 18,
      paddingHorizontal: 18,
      paddingVertical: 11,
      borderRadius: 11,
      backgroundColor: colors.primary,
    },
    retryText: { color: "#fff", fontWeight: "700" },
  });
