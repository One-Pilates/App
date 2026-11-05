import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import api from "@/services/api";
import { ThemeColors, useTheme } from "@/contexts/ThemeContext";

interface StudentProfile {
  id: number;
  nome?: string;
  email?: string;
  telefone?: string;
  tipoContato?: string;
  dataNascimento?: string;
  idade?: string;
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
}

function formatDate(value?: string) {
  if (!value) return "Não informado";
  const parts = value.split("-");
  return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : value;
}

function formatPhone(value?: string) {
  if (!value) return "Não informado";
  const digits = value.replace(/\D/g, "");
  if (digits.length === 11) return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  return value;
}

export default function StudentProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [student, setStudent] = useState<StudentProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      return;
    }
    api
      .get(`api/alunos/${id}`)
      .then((response) => setStudent(response.data))
      .catch((error) => console.error("Erro ao carregar perfil do aluno:", error))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!student) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Perfil não encontrado</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Feather name="arrow-left" size={18} color={colors.primary} />
          <Text style={styles.backLinkText}>Voltar</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const address = student.endereco || {};
  const fields = [
    { icon: "user" as const, label: "Nome completo", value: student.nome },
    { icon: "mail" as const, label: "E-mail", value: student.email },
    {
      icon: "calendar" as const,
      label: "Data de nascimento",
      value: formatDate(student.dataNascimento || student.idade),
    },
    {
      icon: "phone" as const,
      label: "Telefone",
      value: formatPhone(student.tipoContato || student.telefone),
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Feather name="arrow-left" size={21} color={colors.text} />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Perfil do aluno</Text>
          <Text style={styles.subtitle}>Dados cadastrados</Text>
        </View>
      </View>

      <View style={styles.card}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{(student.nome || "A").charAt(0).toUpperCase()}</Text>
        </View>
        <Text style={styles.profileName}>{student.nome || "Aluno"}</Text>
        <Text style={styles.profileRole}>Aluno One Pilates</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.sectionTitle}>
          <Feather name="user" size={19} color={colors.primary} />
          <Text style={styles.sectionTitleText}>Informações pessoais</Text>
        </View>
        {fields.map((field) => (
          <View key={field.label} style={styles.field}>
            <Text style={styles.label}>{field.label}</Text>
            <View style={styles.valueBox}>
              <Feather name={field.icon} size={17} color={colors.textMuted} />
              <Text style={styles.value}>{field.value || "Não informado"}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionTitle}>
          <Feather name="home" size={19} color={colors.primary} />
          <Text style={styles.sectionTitleText}>Endereço</Text>
        </View>
        {[
          ["Rua", address.rua],
          ["Número", address.numero],
          ["Bairro", address.bairro],
          ["Cidade", address.cidade],
          ["Estado", address.estado || address.uf],
          ["CEP", address.cep],
        ].map(([label, value]) => (
          <View key={label} style={styles.addressRow}>
            <Text style={styles.label}>{label}</Text>
            <Text style={styles.value}>{value || "Não informado"}</Text>
          </View>
        ))}
      </View>

      <View style={styles.card}>
        <View style={styles.sectionTitle}>
          <Feather name="heart" size={19} color={colors.primary} />
          <Text style={styles.sectionTitleText}>Informações de saúde</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.statusTitle}>Limitações físicas ou de mobilidade</Text>
            <Text style={styles.statusSubtitle}>
              {student.alunoComLimitacoesFisicas ? "Registradas no cadastro" : "Nenhuma registrada"}
            </Text>
          </View>
          <Text style={[styles.status, student.alunoComLimitacoesFisicas ? styles.statusAttention : styles.statusOk]}>
            {student.alunoComLimitacoesFisicas ? "Atenção" : "Normal"}
          </Text>
        </View>
        <Text style={styles.observation}>{student.observacao || "Nenhuma observação registrada."}</Text>
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background, paddingHorizontal: 16 },
    center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
    notFound: { color: colors.text, fontSize: 16, fontWeight: "700" },
    backLink: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 14 },
    backLinkText: { color: colors.primary, fontWeight: "700" },
    header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
    backButton: {
      width: 40,
      height: 40,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginRight: 12,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    title: { color: colors.text, fontSize: 21, fontWeight: "800" },
    subtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 3 },
    card: {
      padding: 18,
      marginBottom: 14,
      borderRadius: 17,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.18 : 0.04,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    avatar: {
      width: 78,
      height: 78,
      borderRadius: 39,
      alignSelf: "center",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
      borderWidth: 2,
      borderColor: colors.primary,
    },
    avatarText: { color: colors.primary, fontSize: 32, fontWeight: "800" },
    profileName: { color: colors.text, fontSize: 20, fontWeight: "800", textAlign: "center", marginTop: 12 },
    profileRole: { color: colors.textSecondary, fontSize: 13, textAlign: "center", marginTop: 3 },
    sectionTitle: { flexDirection: "row", alignItems: "center", marginBottom: 16, gap: 8 },
    sectionTitleText: { color: colors.text, fontSize: 17, fontWeight: "800" },
    field: { marginBottom: 13 },
    label: { color: colors.text, fontSize: 12, fontWeight: "700", marginBottom: 6 },
    valueBox: {
      minHeight: 44,
      paddingHorizontal: 12,
      flexDirection: "row",
      alignItems: "center",
      gap: 9,
      borderRadius: 11,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.surfaceSubtle,
    },
    value: { flex: 1, color: colors.text, fontSize: 14 },
    addressRow: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
    statusRow: { flexDirection: "row", alignItems: "center", padding: 13, borderRadius: 12, backgroundColor: colors.surfaceSubtle },
    statusTitle: { color: colors.text, fontSize: 13, fontWeight: "700" },
    statusSubtitle: { color: colors.textSecondary, fontSize: 12, marginTop: 4 },
    status: { marginLeft: 10, fontSize: 12, fontWeight: "800" },
    statusAttention: { color: colors.primary },
    statusOk: { color: isDark ? "#34d399" : "#047857" },
    observation: { color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 14 },
  });
