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

    title: "Professores",

    description: "Visualize e gerencie todos os professores registrados.",

    label: "Ver professores",

    path: "/(secretary)/professor",
  },

  {
    key: "secretarios",

    icon: "user",

    title: "Secretárias",

    description: "Visualize e gerencie todas as secretárias registradas.",

    label: "Ver secretárias",

    path: "/(secretary)/secretaria",
  },
];

export default function Colaboradores() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

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
            <Feather name="arrow-left" size={22} color="#0f172a" />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>Colaboradores</Text>
        </View>

        <Text style={styles.pageSubtitle}>
          Selecione qual lista deseja visualizar
        </Text>
      </View>

      {cards.map((card) => (
        <View key={card.key} style={styles.card}>
          <View style={styles.iconWrap}>
            <Feather name={card.icon} size={26} color="#f77433" />
          </View>

          <Text style={styles.cardTitle}>{card.title}</Text>

          <Text style={styles.cardDescription}>{card.description}</Text>

          <TouchableOpacity
            style={styles.cardButton}
            onPress={() => router.push(card.path)}
          >
            <Text style={styles.cardButtonText}>{card.label}</Text>

            <Feather name="arrow-right" size={16} color="#fff" />
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { paddingHorizontal: 16, paddingBottom: 40 },
  header: { marginBottom: 16 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 4 },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  pageTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  pageSubtitle: { fontSize: 13, color: "#64748b" },

  card: {
    backgroundColor: "#fff",

    borderRadius: 16,

    padding: 22,

    marginBottom: 16,

    borderWidth: 1,

    borderColor: "#f1f5f9",

    shadowColor: "#000",

    shadowOffset: { width: 0, height: 2 },

    shadowOpacity: 0.04,

    shadowRadius: 8,

    elevation: 2,
  },

  iconWrap: {
    width: 56,

    height: 56,

    borderRadius: 16,

    backgroundColor: "#fff3eb",

    justifyContent: "center",

    alignItems: "center",

    marginBottom: 16,
  },

  cardTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#0f172a",
    marginBottom: 6,
  },

  cardDescription: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 18,
    lineHeight: 20,
  },

  cardButton: {
    flexDirection: "row",

    alignItems: "center",

    justifyContent: "center",

    gap: 8,

    backgroundColor: "#f77433",

    paddingVertical: 13,

    borderRadius: 12,
  },

  cardButtonText: { color: "#fff", fontWeight: "bold", fontSize: 15 },
});
