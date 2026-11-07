import React, { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, type RelativePathString } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import type { TipoNotificacao } from "@/utils/studentUtils";
import { Cabecalho, Carregando, Vazio } from "@/components/aluno/ui";

const ICONES: Record<TipoNotificacao, keyof typeof Feather.glyphMap> = {
  lembrete: "bell",
  confirmada: "check-circle",
  cancelamento: "x-circle",
  pacote: "package",
};

/** Notificações derivadas da agenda e do pacote (o backend não guarda notificações). */
export default function NotificationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { itens, naoLidas, carregando, recarregar, marcarComoLida, marcarTodasComoLidas } = useNotificacoes(user?.id);

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Notificações" voltar />
      {naoLidas > 0 ? (
        <TouchableOpacity style={styles.marcarTodas} onPress={marcarTodasComoLidas}>
          <Feather name="check-square" size={15} color={colors.primary} />
          <Text style={styles.marcarTodasTexto}>Marcar todas como lidas ({naoLidas})</Text>
        </TouchableOpacity>
      ) : null}
      <ScrollView
        contentContainerStyle={styles.lista}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={recarregar} tintColor={colors.primary} />}
      >
        {carregando && itens.length === 0 ? (
          <Carregando />
        ) : itens.length === 0 ? (
          <Vazio icone="bell-off" titulo="Nenhuma notificação" texto="Avisos de aulas e do seu pacote aparecem aqui." />
        ) : (
          itens.map((n) => (
            <TouchableOpacity
              key={n.id}
              style={styles.cartao}
              activeOpacity={0.8}
              onPress={() => {
                marcarComoLida(n.id);
                if (n.agendamentoId) {
                  router.push({
                    pathname: "/(aluno)/agenda/detalhes/[id]" as RelativePathString,
                    params: { id: String(n.agendamentoId) },
                  });
                }
              }}
            >
              <View style={[styles.icone, { backgroundColor: n.lida ? colors.surfaceSubtle : colors.primaryLight }]}>
                <Feather name={ICONES[n.tipo]} size={17} color={n.lida ? colors.textMuted : colors.primary} />
              </View>
              <View style={styles.textos}>
                <Text style={styles.titulo}>{n.titulo}</Text>
                <Text style={styles.mensagem}>{n.texto}</Text>
                <Text style={styles.meta}>{n.meta}</Text>
              </View>
              {!n.lida ? <View style={styles.ponto} accessibilityLabel="Não lida" /> : null}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    marcarTodas: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "flex-end",
      gap: 7,
      paddingHorizontal: 16,
      paddingTop: 12,
    },
    marcarTodasTexto: { color: colors.primary, fontSize: 13, fontWeight: "700" },
    lista: { padding: 16, flexGrow: 1 },
    cartao: {
      minHeight: 88,
      padding: 12,
      marginBottom: 10,
      flexDirection: "row",
      alignItems: "flex-start",
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    icone: { width: 40, height: 40, borderRadius: 11, alignItems: "center", justifyContent: "center" },
    textos: { flex: 1, marginLeft: 11, paddingRight: 8 },
    titulo: { color: colors.text, fontSize: 13, fontWeight: "800" },
    mensagem: { color: colors.textSecondary, fontSize: 12, lineHeight: 16, marginTop: 4 },
    meta: { color: colors.textMuted, fontSize: 11, marginTop: 3 },
    ponto: { width: 8, height: 8, borderRadius: 4, marginTop: 5, backgroundColor: colors.primary },
  });
