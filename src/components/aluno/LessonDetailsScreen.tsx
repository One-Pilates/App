import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter, type RelativePathString } from "expo-router";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useCarregar } from "@/hooks/useCarregar";
import { alunoApi, mensagemDeErro } from "@/services/aluno";
import { notify } from "@/utils/notify";
import {
  ORIENTACAO_PADRAO,
  avisoDeCancelamento,
  descricaoCancelamento,
  formatarDataLonga,
  formatarHora,
  situacaoDaAula,
} from "@/utils/studentUtils";
import { Cabecalho, Card, Carregando, Erro, Selo } from "./ui";

/** Detalhes de uma aula do aluno, com confirmação de presença e cancelamento (regra das 24h). */
export default function LessonDetailsScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { dados: aula, carregando, erro, recarregar } = useCarregar(() => alunoApi.aula(String(id)), [id]);
  const [enviando, setEnviando] = useState(false);

  if (carregando && !aula) {
    return (
      <View style={styles.container}>
        <Cabecalho titulo="Detalhes da Aula" voltar />
        <Carregando />
      </View>
    );
  }
  if (erro || !aula) {
    return (
      <View style={styles.container}>
        <Cabecalho titulo="Detalhes da Aula" voltar />
        <Erro mensagem={erro || "Aula não encontrada"} onTentar={recarregar} />
      </View>
    );
  }

  const selo = situacaoDaAula(aula);
  const agendada = aula.situacao === "AGENDADA";

  async function confirmarPresenca() {
    setEnviando(true);
    try {
      await alunoApi.confirmarPresenca(aula!.agendamentoId);
      notify.success("Presença confirmada!");
      await recarregar();
    } catch (e) {
      notify.error(mensagemDeErro(e, "Não foi possível confirmar a presença."));
    } finally {
      setEnviando(false);
    }
  }

  function cancelarAula() {
    Alert.alert("Cancelar esta aula?", avisoDeCancelamento(aula!), [
      { text: "Manter aula", style: "cancel" },
      {
        text: "Sim, cancelar aula",
        style: "destructive",
        onPress: async () => {
          setEnviando(true);
          try {
            const resultado = await alunoApi.cancelarAula(aula!.agendamentoId);
            if (resultado.foraDoPrazo) notify.warning(resultado.mensagem);
            else notify.success(resultado.mensagem);
            router.replace("/(aluno)/agenda" as RelativePathString);
          } catch (e) {
            notify.error(mensagemDeErro(e, "Não foi possível cancelar a aula."));
            setEnviando(false);
          }
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Detalhes da Aula" voltar />
      <ScrollView contentContainerStyle={styles.conteudo} showsVerticalScrollIndicator={false}>
        <Card>
          <View style={styles.tituloLinha}>
            <Text style={styles.nome}>{aula.especialidade}</Text>
            <Selo rotulo={selo.rotulo} tom={selo.tom} />
          </View>
          <View style={styles.divisor} />
          <Info icone="calendar" rotulo="Data" valor={formatarDataLonga(aula.dataHora)} colors={colors} styles={styles} />
          <Info
            icone="clock"
            rotulo="Horário"
            valor={`${formatarHora(aula.dataHora)} • ${aula.duracaoMinutos} min`}
            colors={colors}
            styles={styles}
          />
          <Info icone="user" rotulo="Professor(a)" valor={aula.professor || "Não informado"} colors={colors} styles={styles} />
          <Info icone="map-pin" rotulo="Sala" valor={aula.sala || "Não informada"} colors={colors} styles={styles} />
        </Card>

        {aula.situacao === "CANCELADA" ? (
          <Card>
            <Text style={styles.secaoTitulo}>Cancelamento</Text>
            <Text style={styles.texto}>{descricaoCancelamento(aula)}</Text>
          </Card>
        ) : (
          <Card>
            <View style={styles.secaoLinha}>
              <Feather name="edit-3" size={17} color={colors.primary} />
              <Text style={styles.secaoTitulo}>Orientações</Text>
            </View>
            <Text style={styles.texto}>{ORIENTACAO_PADRAO}</Text>
          </Card>
        )}

        {agendada ? (
          <>
            {aula.presencaConfirmada ? (
              <View style={styles.confirmada} accessibilityRole="text">
                <Feather name="check-circle" size={18} color={isDark ? "#6ee7b7" : "#047857"} />
                <Text style={styles.confirmadaTexto}>Presença confirmada</Text>
              </View>
            ) : (
              <TouchableOpacity style={styles.btnConfirmar} onPress={confirmarPresenca} disabled={enviando}>
                {enviando ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Feather name="check" size={20} color="#fff" />
                    <Text style={styles.btnConfirmarTexto}>Confirmar Presença</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {aula.podeCancelar ? (
              <>
                <TouchableOpacity style={styles.btnCancelar} onPress={cancelarAula} disabled={enviando}>
                  <Feather name="trash-2" size={18} color={colors.danger} />
                  <Text style={styles.btnCancelarTexto}>Cancelar aula</Text>
                </TouchableOpacity>
                <Text style={styles.aviso}>
                  {aula.cancelamentoSemPerda
                    ? "Cancelando agora, a aula volta para o seu pacote."
                    : "Faltam menos de 24h: se cancelar, a aula será descontada do pacote."}
                </Text>
              </>
            ) : null}
          </>
        ) : null}
      </ScrollView>
    </View>
  );
}

function Info({
  icone,
  rotulo,
  valor,
  colors,
  styles,
}: {
  icone: keyof typeof Feather.glyphMap;
  rotulo: string;
  valor: string;
  colors: ThemeColors;
  styles: ReturnType<typeof getStyles>;
}) {
  return (
    <View style={styles.info}>
      <Feather name={icone} size={19} color={colors.primary} />
      <View style={{ flex: 1 }}>
        <Text style={styles.infoRotulo}>{rotulo}</Text>
        <Text style={styles.infoValor}>{valor}</Text>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    conteudo: { padding: 16, paddingBottom: 30 },
    tituloLinha: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 10 },
    nome: { flex: 1, color: colors.text, fontSize: 24, fontWeight: "800" },
    divisor: { height: 1, backgroundColor: colors.borderSubtle, marginVertical: 16 },
    info: { flexDirection: "row", alignItems: "center", gap: 13, marginBottom: 15 },
    infoRotulo: { color: colors.textSecondary, fontSize: 12 },
    infoValor: { color: colors.text, fontSize: 15, fontWeight: "800", marginTop: 2 },
    secaoLinha: { flexDirection: "row", alignItems: "center", gap: 8 },
    secaoTitulo: { color: colors.text, fontSize: 16, fontWeight: "800" },
    texto: { color: colors.textSecondary, fontSize: 14, lineHeight: 19, marginTop: 10 },
    btnConfirmar: {
      height: 56,
      borderRadius: 14,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      backgroundColor: colors.primary,
    },
    btnConfirmarTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
    confirmada: {
      height: 56,
      borderRadius: 14,
      marginBottom: 14,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
      borderWidth: 1,
      borderColor: isDark ? "#34d399" : "#86d3a3",
      backgroundColor: isDark ? "rgba(16,185,129,.15)" : "#e7f6ec",
    },
    confirmadaTexto: { color: isDark ? "#6ee7b7" : "#047857", fontSize: 16, fontWeight: "800" },
    btnCancelar: {
      height: 56,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.danger,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 9,
    },
    btnCancelarTexto: { color: colors.danger, fontSize: 16, fontWeight: "800" },
    aviso: { color: colors.textSecondary, fontSize: 12, lineHeight: 17, textAlign: "center", marginTop: 10 },
  });
