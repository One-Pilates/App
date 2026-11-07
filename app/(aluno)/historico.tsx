import React, { useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useCarregar } from "@/hooks/useCarregar";
import { alunoApi } from "@/services/aluno";
import { agruparPorDia, isoParaBr, paraISODate, somarDias } from "@/utils/studentUtils";
import { Cabecalho, CartaoAula, Carregando, ChipsPeriodo, Erro, Vazio } from "@/components/aluno/ui";
import { isoParaData } from "@/utils/utils";

const PRESETS = [
  { valor: 7, rotulo: "7 dias" },
  { valor: 30, rotulo: "30 dias" },
  { valor: 90, rotulo: "90 dias" },
];

type Campo = "de" | "ate" | null;

/** Aulas já realizadas (e canceladas) em um intervalo de datas escolhido pelo aluno. */
export default function HistoricoScreen() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const hoje = paraISODate(new Date());
  const [de, setDe] = useState(paraISODate(somarDias(new Date(), -29)));
  const [ate, setAte] = useState(hoje);
  const [campoAberto, setCampoAberto] = useState<Campo>(null);

  const intervaloInvalido = !de || !ate || de > ate;
  const presetAtivo =
    PRESETS.find((p) => ate === hoje && de === paraISODate(somarDias(new Date(), -(p.valor - 1))))?.valor ?? 0;

  const { dados, carregando, erro, recarregar } = useCarregar(async () => {
    if (intervaloInvalido) return [];
    const aulas = await alunoApi.aulas(de, ate);
    // mais recentes primeiro; aulas futuras ficam na Agenda
    return aulas.filter((a) => a.situacao !== "AGENDADA").reverse();
  }, [de, ate]);

  const realizadas = (dados || []).filter((a) => a.situacao === "REALIZADA").length;
  const grupos = useMemo(() => agruparPorDia(dados || []), [dados]);

  function escolherPreset(dias: number) {
    setAte(paraISODate(new Date()));
    setDe(paraISODate(somarDias(new Date(), -(dias - 1))));
  }

  function aoEscolherData(_evento: unknown, escolhida?: Date) {
    const campo = campoAberto;
    if (Platform.OS !== "ios") setCampoAberto(null);
    if (!escolhida || !campo) return;
    const iso = paraISODate(escolhida);
    if (campo === "de") setDe(iso);
    else setAte(iso > hoje ? hoje : iso);
  }

  return (
    <View style={styles.container}>
      <Cabecalho titulo="Histórico" />
      <ScrollView
        contentContainerStyle={styles.conteudo}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={carregando && !!dados} onRefresh={recarregar} tintColor={colors.primary} />}
      >
        <Text style={styles.subtitulo}>Aulas que você já fez, por período</Text>

        <View style={styles.filtros}>
          <ChipsPeriodo opcoes={PRESETS} valor={presetAtivo} onChange={escolherPreset} />
          <View style={styles.datas}>
            <CampoData rotulo="De" valor={de} onPress={() => setCampoAberto("de")} styles={styles} colors={colors} />
            <CampoData rotulo="Até" valor={ate} onPress={() => setCampoAberto("ate")} styles={styles} colors={colors} />
          </View>
          {intervaloInvalido ? (
            <Text style={styles.erroData} accessibilityRole="alert">
              A data inicial precisa ser igual ou anterior à data final.
            </Text>
          ) : null}
        </View>

        {campoAberto ? (
          <DateTimePicker
            value={isoParaData(campoAberto === "de" ? de : ate)}
            mode="date"
            maximumDate={new Date()}
            onChange={aoEscolherData}
          />
        ) : null}

        {intervaloInvalido ? null : carregando && !dados ? (
          <Carregando />
        ) : erro && !dados ? (
          <Erro mensagem={erro} onTentar={recarregar} />
        ) : (
          <>
            <Text style={styles.contagem}>
              {realizadas === 1 ? "1 aula realizada" : `${realizadas} aulas realizadas`} no período
            </Text>
            {grupos.length === 0 ? (
              <Vazio icone="clock" titulo="Nenhuma aula neste período" texto="Tente um intervalo maior." />
            ) : (
              grupos.map((g) => (
                <View key={g.chave}>
                  <Text style={styles.dia}>{g.rotulo}</Text>
                  {g.aulas.map((aula) => (
                    <CartaoAula key={`${aula.agendamentoId}-${aula.situacao}`} aula={aula} />
                  ))}
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

function CampoData({
  rotulo,
  valor,
  onPress,
  styles,
  colors,
}: {
  rotulo: string;
  valor: string;
  onPress: () => void;
  styles: ReturnType<typeof getStyles>;
  colors: ThemeColors;
}) {
  return (
    <TouchableOpacity style={styles.campoData} onPress={onPress} accessibilityLabel={`${rotulo}: ${isoParaBr(valor)}`}>
      <Text style={styles.campoRotulo}>{rotulo}</Text>
      <View style={styles.campoValorLinha}>
        <Feather name="calendar" size={15} color={colors.primary} />
        <Text style={styles.campoValor}>{isoParaBr(valor)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    conteudo: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 30, flexGrow: 1 },
    subtitulo: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
    filtros: {
      padding: 14,
      marginBottom: 14,
      gap: 12,
      borderRadius: 17,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    datas: { flexDirection: "row", gap: 10 },
    campoData: {
      flex: 1,
      padding: 10,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.borderSubtle,
      backgroundColor: colors.background,
    },
    campoRotulo: { color: colors.textSecondary, fontSize: 11, fontWeight: "700" },
    campoValorLinha: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 5 },
    campoValor: { color: colors.text, fontSize: 14, fontWeight: "700" },
    erroData: { color: colors.danger, fontSize: 12 },
    contagem: { color: colors.textSecondary, fontSize: 13, marginBottom: 12 },
    dia: { color: colors.textSecondary, fontSize: 15, fontWeight: "800", marginTop: 4, marginBottom: 11 },
  });
