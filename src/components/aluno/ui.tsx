import React, { useMemo } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewStyle,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import type { AulaAluno } from "@/services/aluno";
import {
  descricaoCancelamento,
  formatarHora,
  situacaoDaAula,
  type TomSelo,
} from "@/utils/studentUtils";

/** Cabeçalho laranja das telas do aluno, com botão de voltar opcional e ação à direita. */
export function Cabecalho({
  titulo,
  voltar = false,
  direita,
}: {
  titulo: string;
  voltar?: boolean;
  direita?: React.ReactNode;
}) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  return (
    <View
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 14,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: colors.topBarHeader,
      }}
    >
      <View style={{ width: 40, alignItems: "flex-start" }}>
        {voltar ? (
          <TouchableOpacity onPress={() => router.back()} accessibilityLabel="Voltar" hitSlop={10}>
            <Feather name="arrow-left" size={21} color="#fff" />
          </TouchableOpacity>
        ) : null}
      </View>
      <Text style={{ color: "#fff", fontSize: 16, fontWeight: "800" }}>{titulo}</Text>
      <View style={{ width: 40, alignItems: "flex-end" }}>{direita}</View>
    </View>
  );
}

export function Carregando() {
  const { colors } = useTheme();
  return (
    <View style={{ minHeight: 260, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

export function Erro({ mensagem, onTentar }: { mensagem: string; onTentar: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ minHeight: 260, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
      <Feather name="wifi-off" size={30} color={colors.textMuted} />
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800", textAlign: "center", marginTop: 12 }}>
        {mensagem}
      </Text>
      <TouchableOpacity
        onPress={onTentar}
        style={{ marginTop: 16, paddingHorizontal: 18, paddingVertical: 11, borderRadius: 11, backgroundColor: colors.primary }}
      >
        <Text style={{ color: "#fff", fontWeight: "800" }}>Tentar novamente</Text>
      </TouchableOpacity>
    </View>
  );
}

export function Vazio({
  icone = "calendar",
  titulo,
  texto,
}: {
  icone?: keyof typeof Feather.glyphMap;
  titulo: string;
  texto?: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ minHeight: 260, alignItems: "center", justifyContent: "center", paddingHorizontal: 28 }}>
      <Feather name={icone} size={30} color={colors.textMuted} />
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800", textAlign: "center", marginTop: 12 }}>
        {titulo}
      </Text>
      {texto ? (
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 18, textAlign: "center", marginTop: 7 }}>
          {texto}
        </Text>
      ) : null}
    </View>
  );
}

export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors, isDark } = useTheme();
  return (
    <View
      style={[
        {
          padding: 16,
          marginBottom: 14,
          borderRadius: 17,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surfaceCard,
          shadowColor: "#000",
          shadowOpacity: isDark ? 0.18 : 0.05,
          shadowRadius: 8,
          shadowOffset: { width: 0, height: 3 },
          elevation: 2,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function coresDoSelo(tom: TomSelo, colors: ThemeColors, isDark: boolean) {
  switch (tom) {
    case "verde":
      return { color: isDark ? "#6ee7b7" : "#059669", backgroundColor: isDark ? "rgba(16,185,129,.2)" : "#dcfce7" };
    case "vermelho":
      return { color: colors.danger, backgroundColor: colors.dangerBg };
    case "cinza":
      return { color: colors.textSecondary, backgroundColor: colors.surfaceSubtle };
    default:
      return { color: colors.primary, backgroundColor: colors.primaryLight };
  }
}

export function Selo({ rotulo, tom }: { rotulo: string; tom: TomSelo }) {
  const { colors, isDark } = useTheme();
  const cores = coresDoSelo(tom, colors, isDark);
  return (
    <Text
      style={{
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 14,
        overflow: "hidden",
        fontSize: 11,
        fontWeight: "800",
        color: cores.color,
        backgroundColor: cores.backgroundColor,
      }}
    >
      {rotulo}
    </Text>
  );
}

/** Cartão de uma aula, usado na Agenda e no Histórico. */
export function CartaoAula({ aula, onPress }: { aula: AulaAluno; onPress?: () => void }) {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const selo = situacaoDaAula(aula);
  const cancelada = aula.situacao === "CANCELADA";
  return (
    <TouchableOpacity
      style={styles.cartao}
      activeOpacity={onPress ? 0.78 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.colunaHora}>
        <Text style={[styles.hora, cancelada && { color: colors.textMuted }]}>{formatarHora(aula.dataHora)}</Text>
        <View style={styles.linhaTempo} />
      </View>
      <View style={styles.info}>
        <View style={styles.titulo}>
          <Text style={styles.nome}>{aula.especialidade || "Aula"}</Text>
          <Selo rotulo={selo.rotulo} tom={selo.tom} />
        </View>
        <View style={styles.linha}>
          <Feather name="user" size={14} color={colors.textSecondary} />
          <Text style={styles.detalhe}>Professor: {aula.professor || "Não informado"}</Text>
        </View>
        <View style={styles.linha}>
          <Feather name="map-pin" size={14} color={colors.textSecondary} />
          <Text style={styles.detalhe}>Sala: {aula.sala || "Não informada"}</Text>
        </View>
        {cancelada ? <Text style={styles.nota}>{descricaoCancelamento(aula)}</Text> : null}
        {onPress ? <Text style={styles.ver}>Ver detalhes</Text> : null}
      </View>
    </TouchableOpacity>
  );
}

/** Atalhos de período (7/30/90 dias). */
export function ChipsPeriodo({
  opcoes,
  valor,
  onChange,
}: {
  opcoes: { valor: number; rotulo: string }[];
  valor: number;
  onChange: (valor: number) => void;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: 8 }}>
      {opcoes.map((o) => {
        const ativo = o.valor === valor;
        return (
          <TouchableOpacity
            key={o.valor}
            onPress={() => onChange(o.valor)}
            style={{
              paddingHorizontal: 15,
              paddingVertical: 8,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: ativo ? colors.primary : colors.borderSubtle,
              backgroundColor: ativo ? colors.primary : colors.surfaceCard,
            }}
          >
            <Text style={{ color: ativo ? "#fff" : colors.textSecondary, fontSize: 12.5, fontWeight: "700" }}>
              {o.rotulo}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    cartao: {
      padding: 14,
      marginBottom: 13,
      flexDirection: "row",
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.18 : 0.05,
      shadowRadius: 8,
      shadowOffset: { width: 0, height: 3 },
      elevation: 2,
    },
    colunaHora: { width: 55, alignItems: "center" },
    hora: { color: colors.primary, fontSize: 15, fontWeight: "800" },
    linhaTempo: { width: 3, flex: 1, marginTop: 9, backgroundColor: colors.primaryLight, borderRadius: 2 },
    info: { flex: 1, paddingLeft: 9 },
    titulo: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 7 },
    nome: { flex: 1, color: colors.text, fontSize: 17, fontWeight: "800" },
    linha: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 8 },
    detalhe: { flex: 1, color: colors.textSecondary, fontSize: 13 },
    nota: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, marginTop: 10 },
    ver: { color: colors.primary, fontSize: 14, fontWeight: "800", marginTop: 12 },
  });
