import { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

interface CardItem {
  key: string;
  icon: keyof typeof Feather.glyphMap;
  title: string;
  description: string;
  label: string;
  path: "/(secretary)/professor" | "/(secretary)/secretaria";
}

const cards: CardItem[] = [
  {
    key: "professores",
    icon: "activity",
    title: "Professores & Instrutores",
    description: "Controle as permissões, dados cadastrais e especialidades da equipe técnica.",
    label: "Acessar Professores",
    path: "/(secretary)/professor",
  },
  {
    key: "secretarios",
    icon: "user",
    title: "Equipe de Recepção",
    description: "Gerencie os dados das secretárias e dos administradores do estúdio.",
    label: "Acessar Secretárias",
    path: "/(secretary)/secretaria",
  },
];

export default function Colaboradores() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Feather name="arrow-left" size={22} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.pageTitle}>Equipe do Studio</Text>
            <Text style={styles.pageSubtitle}>
              Gestão de instrutores e equipe de atendimento
            </Text>
          </View>
        </View>
      </View>

      {cards.map((card) => (
        <TouchableOpacity
          key={card.key}
          style={styles.card}
          onPress={() => router.push(card.path)}
          activeOpacity={0.8}
        >
          <View style={styles.cardTopRow}>
            <View style={styles.iconWrap}>
              <Feather name={card.icon} size={24} color={colors.primary} />
            </View>
            <View style={styles.arrowCircle}>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </View>
          </View>

          <Text style={styles.cardTitle}>{card.title}</Text>
          <Text style={styles.cardDescription}>{card.description}</Text>

          <View style={styles.cardButton}>
            <Text style={styles.cardButtonText}>{card.label}</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingHorizontal: 16, paddingBottom: 40 },
    header: { marginBottom: 16 },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
    backButton: {
      width: 38,
      height: 38,
      borderRadius: 10,
      backgroundColor: colors.surfaceCard,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },
    pageTitle: { fontSize: 20, fontWeight: "800", color: colors.text },
    pageSubtitle: { fontSize: 13, color: colors.textSecondary },

    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 18,
      padding: 20,
      marginBottom: 16,
      borderWidth: 1,
      borderColor: colors.border,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.25 : 0.05,
      shadowRadius: 8,
      elevation: 2,
    },

    cardTopRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 14,
    },

    iconWrap: {
      width: 48,
      height: 48,
      borderRadius: 14,
      backgroundColor: colors.primaryLight,
      justifyContent: "center",
      alignItems: "center",
    },

    arrowCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: colors.surfaceSubtle,
      justifyContent: "center",
      alignItems: "center",
      borderWidth: 1,
      borderColor: colors.borderSubtle,
    },

    cardTitle: {
      fontSize: 18,
      fontWeight: "800",
      color: colors.text,
      marginBottom: 6,
    },

    cardDescription: {
      fontSize: 13,
      color: colors.textSecondary,
      marginBottom: 18,
      lineHeight: 18,
    },

    cardButton: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      backgroundColor: colors.primary,
      paddingVertical: 12,
      borderRadius: 12,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.25,
      shadowRadius: 5,
      elevation: 2,
    },

    cardButtonText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  });
