import React, { useMemo } from "react";
import { RefreshControl, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter, type RelativePathString } from "expo-router";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useCarregar } from "@/hooks/useCarregar";
import { alunoApi } from "@/services/aluno";
import { agruparPorDia, paraISODate, somarDias } from "@/utils/studentUtils";
import { Cabecalho, CartaoAula, Carregando, Erro, Vazio } from "./ui";

const DIAS_A_FRENTE = 90;

/** Próximas aulas agendadas do aluno logado (as canceladas e as já realizadas ficam no Histórico). */
export default function StudentAgendaScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    const hoje = new Date();
    const aulas = await alunoApi.aulas(paraISODate(hoje), paraISODate(somarDias(hoje, DIAS_A_FRENTE)));
    const agora = Date.now();
    return aulas
      .filter((a) => a.situacao === "AGENDADA" && new Date(a.dataHora).getTime() > agora)
      .sort((a, b) => a.dataHora.localeCompare(b.dataHora));
  }, []);

  const grupos = useMemo(() => agruparPorDia(dados || []), [dados]);

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Minha Agenda" />
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={carregando && !!dados} onRefresh={recarregar} tintColor={colors.primary} />}
      >
        <Text style={styles.subtitulo}>Suas próximas aulas</Text>
        {carregando && !dados ? (
          <Carregando />
        ) : erro && !dados ? (
          <Erro mensagem={erro} onTentar={recarregar} />
        ) : grupos.length === 0 ? (
          <Vazio titulo="Nenhuma aula agendada" texto="Suas próximas aulas aparecerão aqui quando houver um agendamento." />
        ) : (
          grupos.map((g) => (
            <View key={g.chave}>
              <Text style={styles.dia}>{g.rotulo}</Text>
              {g.aulas.map((aula) => (
                <CartaoAula
                  key={aula.agendamentoId}
                  aula={aula}
                  onPress={() =>
                    router.push({
                      pathname: "/(aluno)/agenda/detalhes/[id]" as RelativePathString,
                      params: { id: String(aula.agendamentoId) },
                    })
                  }
                />
              ))}
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    conteudo: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30, flexGrow: 1 },
    subtitulo: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
    dia: { color: colors.textSecondary, fontSize: 15, fontWeight: "800", marginTop: 4, marginBottom: 11 },
  });
