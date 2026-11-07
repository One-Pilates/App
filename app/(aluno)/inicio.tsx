import React, { useMemo, useState } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, type RelativePathString } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useCarregar } from "@/hooks/useCarregar";
import { useNotificacoes } from "@/hooks/useNotificacoes";
import { alunoApi } from "@/services/aluno";
import { Card, Carregando, ChipsPeriodo, Erro, Selo } from "@/components/aluno/ui";
import {
  formatarHora,
  paraISODate,
  primeiroNome,
  rotuloDia,
  situacaoDaAula,
  somarDias,
  textoSaldo,
} from "@/utils/studentUtils";

const PERIODOS = [
  { valor: 7, rotulo: "7 dias" },
  { valor: 30, rotulo: "30 dias" },
  { valor: 90, rotulo: "90 dias" },
];

export default function StudentHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [dias, setDias] = useState(30);
  const { naoLidas } = useNotificacoes(user?.id);

  const { dados, carregando, erro, recarregar } = useCarregar(() => {
    const hoje = new Date();
    return alunoApi.dashboard(paraISODate(somarDias(hoje, -(dias - 1))), paraISODate(hoje));
  }, [dias]);

  const pacotesComSaldo = (dados?.pacotes || []).filter((p) => p.saldo !== 0);
  const excedido = (dados?.saldoTotal ?? 0) < 0;
  const maximo = Math.max(...(dados?.aulasPorEspecialidade || []).map((i) => i.quantidade), 1);

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <Text style={styles.marca}>onepilates</Text>
        <TouchableOpacity
          onPress={() => router.push("/(aluno)/notificacoes" as RelativePathString)}
          accessibilityLabel="Abrir notificações"
          hitSlop={10}
        >
          <Feather name="bell" size={21} color="#fff" />
          {naoLidas > 0 ? <View style={styles.pontoNotificacao} /> : null}
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={carregando && !!dados} onRefresh={recarregar} tintColor={colors.primary} />}
      >
        <Text style={styles.saudacao}>Olá, {primeiroNome(user?.nome) || "aluno"}!</Text>
        <Text style={styles.subtitulo}>Veja como estão o seu pacote e as suas aulas</Text>

        {carregando && !dados ? (
          <Carregando />
        ) : erro && !dados ? (
          <Erro mensagem={erro} onTentar={recarregar} />
        ) : dados ? (
          <>
            <Card style={{ marginTop: 20 }}>
              <Text style={styles.rotuloPequeno}>Aulas no pacote</Text>
              <Text style={[styles.saldo, excedido && { color: colors.danger }]}>
                {dados.saldoTotal}
              </Text>
              {excedido ? (
                <Text style={[styles.aviso, { color: colors.danger }]}>
                  Você está com {textoSaldo(dados.saldoTotal)}. Fale com a secretaria para renovar.
                </Text>
              ) : null}
              {pacotesComSaldo.length > 0 ? (
                <View style={styles.pacotes}>
                  {pacotesComSaldo.map((p) => (
                    <View key={p.especialidadeId} style={styles.pacoteLinha}>
                      <Text style={styles.pacoteNome}>{p.especialidade}</Text>
                      <Text style={[styles.pacoteSaldo, p.saldo < 0 && { color: colors.danger }]}>
                        {textoSaldo(p.saldo)}
                      </Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.aviso}>Você ainda não tem aulas no pacote.</Text>
              )}
            </Card>

            <Text style={styles.secao}>Próxima aula</Text>
            {dados.proximaAula ? (
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: "/(aluno)/agenda/detalhes/[id]" as RelativePathString,
                    params: { id: String(dados.proximaAula!.agendamentoId) },
                  })
                }
              >
                <Card>
                  <View style={styles.linhaEntre}>
                    <Text style={styles.proximaTitulo}>{dados.proximaAula.especialidade}</Text>
                    <Selo {...situacaoDaAula(dados.proximaAula)} />
                  </View>
                  <Text style={styles.proximaHora}>
                    {rotuloDia(dados.proximaAula.dataHora)} · {formatarHora(dados.proximaAula.dataHora)}
                  </Text>
                  <Text style={styles.aviso}>
                    {dados.proximaAula.professor || "Professor não informado"}
                    {dados.proximaAula.sala ? ` · ${dados.proximaAula.sala}` : ""}
                  </Text>
                </Card>
              </TouchableOpacity>
            ) : (
              <Card>
                <Text style={styles.aviso}>Você não tem aulas agendadas.</Text>
              </Card>
            )}

            <View style={[styles.linhaEntre, { marginTop: 8, marginBottom: 12 }]}>
              <Text style={[styles.secao, { marginTop: 0, marginBottom: 0 }]}>Resumo do período</Text>
            </View>
            <ChipsPeriodo opcoes={PERIODOS} valor={dias} onChange={setDias} />

            <View style={styles.grade}>
              <Kpi valor={dados.aulasRealizadas} rotulo="Aulas realizadas" styles={styles} />
              <Kpi valor={dados.aulasAgendadas} rotulo="Agendadas" styles={styles} />
              <Kpi valor={dados.aulasCanceladas} rotulo="Canceladas" styles={styles} />
              <Kpi
                valor={dados.aulasPerdidas}
                rotulo="Descontadas"
                dica="canceladas com menos de 24h"
                styles={styles}
              />
            </View>

            {dados.aulasRealizadas > 0 ? (
              <Card>
                <Text style={styles.cardTitulo}>Principais especialidades</Text>
                {dados.aulasPorEspecialidade.map((i) => (
                  <View key={i.nome} style={{ marginTop: 12 }}>
                    <View style={styles.linhaEntre}>
                      <Text style={styles.pacoteNome}>{i.nome}</Text>
                      <Text style={styles.aviso}>{i.quantidade}</Text>
                    </View>
                    <View style={styles.trilho}>
                      <View style={[styles.barra, { width: `${(i.quantidade / maximo) * 100}%` }]} />
                    </View>
                  </View>
                ))}
                {dados.diaSemanaMaisFrequente ? (
                  <Text style={[styles.aviso, { marginTop: 14 }]}>
                    Dia em que você mais treina: {dados.diaSemanaMaisFrequente}
                  </Text>
                ) : null}
              </Card>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Kpi({
  valor,
  rotulo,
  dica,
  styles,
}: {
  valor: number;
  rotulo: string;
  dica?: string;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValor}>{valor}</Text>
      <Text style={styles.kpiRotulo}>{rotulo}</Text>
      {dica ? <Text style={styles.kpiDica}>{dica}</Text> : null}
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      paddingHorizontal: 18,
      paddingBottom: 17,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.topBarHeader,
    },
    marca: { color: "#fff", fontSize: 16, fontWeight: "500" },
    pontoNotificacao: {
      position: "absolute",
      top: -2,
      right: -2,
      width: 9,
      height: 9,
      borderRadius: 5,
      backgroundColor: "#fde047",
      borderWidth: 1.5,
      borderColor: colors.topBarHeader,
    },
    conteudo: { padding: 18, paddingBottom: 32 },
    saudacao: { color: colors.text, fontSize: 25, fontWeight: "800", marginTop: 4 },
    subtitulo: { color: colors.textSecondary, fontSize: 13, marginTop: 5 },
    rotuloPequeno: { color: colors.textSecondary, fontSize: 12.5, fontWeight: "600" },
    saldo: { color: colors.primary, fontSize: 44, fontWeight: "800", marginTop: 2 },
    aviso: { color: colors.textSecondary, fontSize: 13, lineHeight: 18, marginTop: 6 },
    pacotes: { marginTop: 10, borderTopWidth: 1, borderTopColor: colors.borderSubtle },
    pacoteLinha: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 9,
      borderBottomWidth: 1,
      borderBottomColor: colors.borderSubtle,
    },
    pacoteNome: { color: colors.text, fontSize: 14, fontWeight: "600" },
    pacoteSaldo: { color: colors.text, fontSize: 14, fontWeight: "800" },
    secao: { color: colors.text, fontSize: 17, fontWeight: "800", marginTop: 8, marginBottom: 10 },
    linhaEntre: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
    proximaTitulo: { flex: 1, color: colors.text, fontSize: 19, fontWeight: "800" },
    proximaHora: { color: colors.primary, fontSize: 15, fontWeight: "800", marginTop: 8 },
    grade: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 14, marginBottom: 14 },
    kpi: {
      width: "48%",
      flexGrow: 1,
      padding: 14,
      borderRadius: 15,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    kpiValor: { color: colors.primary, fontSize: 26, fontWeight: "800" },
    kpiRotulo: { color: colors.text, fontSize: 12.5, fontWeight: "700", marginTop: 2 },
    kpiDica: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
    cardTitulo: { color: colors.text, fontSize: 15, fontWeight: "800" },
    trilho: { height: 8, borderRadius: 4, marginTop: 6, backgroundColor: isDark ? "#27272a" : "#e2e8f0" },
    barra: { height: 8, borderRadius: 4, backgroundColor: colors.primary },
  });
