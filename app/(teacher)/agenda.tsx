import { useCallback, useEffect, useRef, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { Calendar, LocaleConfig } from "react-native-calendars";

import { useFocusEffect, useNavigation } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

import { useAgenda } from "@/hooks/useAgenda";

import { useAgendaDias } from "@/hooks/useAgendaDias";

import WeekStrip from "@/components/agenda/WeekStrip";

import { AulaCard, AusenciaCard } from "@/components/agenda/AgendaCards";

import AulaSheet from "@/components/agenda/AulaSheet";

import AusenciaSheet from "@/components/agenda/AusenciaSheet";

import DefinirAusenciaSheet from "@/components/agenda/DefinirAusenciaSheet";

import { Agendamento, Ausencia } from "@/types/agenda";

import { formatarDataExtensa } from "@/utils/utils";

LocaleConfig.locales["pt-br"] = {
  monthNames: [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ],

  monthNamesShort: [
    "Jan",
    "Fev",
    "Mar",
    "Abr",
    "Mai",
    "Jun",
    "Jul",
    "Ago",
    "Set",
    "Out",
    "Nov",
    "Dez",
  ],

  dayNames: [
    "Domingo",
    "Segunda",
    "Terça",
    "Quarta",
    "Quinta",
    "Sexta",
    "Sábado",
  ],

  dayNamesShort: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],

  today: "Hoje",
};

LocaleConfig.defaultLocale = "pt-br";

export default function AgendaProfessorScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const { agendamentos, ausencias, loading, erro, recarregar } = useAgenda({
    professorFixo: user?.id,
  });

  const {
    diaSelecionado,

    setDiaSelecionado,

    semana,

    setSemana,

    selecionarDia,

    diasComAula,

    itensDoDia,

    markedDates,

    mesAtual,

    totalAulas,
  } = useAgendaDias(agendamentos, ausencias);

  const [mesAberto, setMesAberto] = useState(false);

  const [aulaSelecionada, setAulaSelecionada] = useState<Agendamento | null>(
    null,
  );

  const [ausenciaSelecionada, setAusenciaSelecionada] =
    useState<Ausencia | null>(null);

  const [definindoAusencia, setDefinindoAusencia] = useState(false);

  const navigation = useNavigation();

  const sheetAberto = Boolean(
    aulaSelecionada ||
    ausenciaSelecionada ||
    definindoAusencia
  );

  useEffect(() => {
    const parent = navigation.getParent();
    if (sheetAberto) {
      parent?.setOptions({ tabBarStyle: { display: "none" } });
      navigation.setOptions({ tabBarStyle: { display: "none" } });
    } else {
      const defaultStyle = {
        backgroundColor: colors.tabBg,
        borderTopWidth: 1,
        borderTopColor: colors.tabBorder,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      };
      parent?.setOptions({ tabBarStyle: defaultStyle });
      navigation.setOptions({ tabBarStyle: defaultStyle });
    }

    return () => {
      const defaultStyle = {
        backgroundColor: colors.tabBg,
        borderTopWidth: 1,
        borderTopColor: colors.tabBorder,
        height: 60,
        paddingBottom: 8,
        paddingTop: 8,
      };
      parent?.setOptions({ tabBarStyle: defaultStyle });
      navigation.setOptions({ tabBarStyle: defaultStyle });
    };
  }, [sheetAberto, navigation, colors.tabBg, colors.tabBorder]);

  const primeiroFoco = useRef(true);

  useFocusEffect(
    useCallback(() => {
      if (primeiroFoco.current) {
        primeiroFoco.current = false;

        return;
      }

      recarregar();
    }, [recarregar]),
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top > 0 ? insets.top + 6 : 14 }]}>
        <View style={styles.headerTop}>
          <Text style={styles.title}>Agenda</Text>

          <TouchableOpacity
            style={styles.monthButton}
            onPress={() => setMesAberto(!mesAberto)}
          >
            <Text style={styles.monthButtonText}>{mesAtual}</Text>

            <Feather
              name={mesAberto ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.primary}
            />
          </TouchableOpacity>
        </View>

        {mesAberto ? (
          <Calendar
            current={diaSelecionado}
            markedDates={markedDates}
            markingType="multi-dot"
            firstDay={1}
            hideExtraDays
            theme={{
              backgroundColor: colors.surfaceCard,
              calendarBackground: colors.surfaceCard,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: '#ffffff',
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.textMuted,
              dotColor: colors.primary,
              selectedDotColor: '#ffffff',
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              indicatorColor: colors.primary,
            }}
            onDayPress={(day: { dateString: string }) => {
              selecionarDia(day.dateString);

              setMesAberto(false);
            }}
            style={styles.fullCalendar}
          />
        ) : (
          <WeekStrip
            semana={semana}
            diaSelecionado={diaSelecionado}
            diasComAula={diasComAula}
            onSelecionarDia={setDiaSelecionado}
            onMudarSemana={setSemana}
          />
        )}
      </View>

      <View style={styles.listaHeader}>
        <Text style={styles.listaTitulo}>
          {formatarDataExtensa(diaSelecionado)}
        </Text>

        <Text style={styles.listaContagem}>
          {totalAulas} {totalAulas === 1 ? "aula" : "aulas"}
        </Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : erro ? (
        <View style={styles.center}>
          <Feather name="wifi-off" size={32} color={colors.textMuted} />

          <Text style={styles.vazioTexto}>{erro}</Text>

          <TouchableOpacity style={styles.retryBtn} onPress={recarregar}>
            <Text style={styles.retryText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={itensDoDia}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) =>
            item.tipo === "aula" ? (
              <AulaCard
                agendamento={item.agendamento}
                onPress={() => setAulaSelecionada(item.agendamento)}
              />
            ) : (
              <AusenciaCard
                ausencia={item.ausencia}
                onPress={() => setAusenciaSelecionada(item.ausencia)}
              />
            )
          }
          ListEmptyComponent={
            <View style={styles.center}>
              <Feather name="calendar" size={32} color={colors.textMuted} />

              <Text style={styles.vazioTexto}>Nenhuma aula neste dia.</Text>
            </View>
          }
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setDefinindoAusencia(true)}
        activeOpacity={0.85}
      >
        <Feather name="slash" size={20} color="#fff" />

        <Text style={styles.fabTexto}>Ausência</Text>
      </TouchableOpacity>

      {/* Professor não edita nem exclui aula: só consulta e registra observações. */}

      <AulaSheet
        visible={!!aulaSelecionada}
        agendamento={aulaSelecionada}
        podeEditar={false}
        onFechar={() => setAulaSelecionada(null)}
        onEditar={() => {}}
        onAlterado={recarregar}
      />

      <AusenciaSheet
        visible={!!ausenciaSelecionada}
        ausencia={ausenciaSelecionada}
        podeExcluir
        onFechar={() => setAusenciaSelecionada(null)}
        onExcluida={recarregar}
      />

      <DefinirAusenciaSheet
        visible={definindoAusencia}
        professores={[]}
        professorFixo={user?.id}
        onFechar={() => setDefinindoAusencia(false)}
        onCriada={recarregar}
      />
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },

    header: {
      paddingHorizontal: 16,
      paddingBottom: 10,
      backgroundColor: colors.surfaceCard,
      borderBottomWidth: 1,
      borderColor: colors.border,
    },

    headerTop: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },

    title: { fontSize: 20, fontWeight: "800", color: colors.text },

    monthButton: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.primaryLight,
      paddingHorizontal: 12,
      paddingVertical: 7,
      borderRadius: 10,
      gap: 4,
    },

    monthButtonText: { color: colors.primary, fontWeight: "bold", fontSize: 13.5 },

    fullCalendar: { borderRadius: 12 },

    listaHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingHorizontal: 20,
      paddingTop: 18,
      paddingBottom: 10,
    },

    listaTitulo: { fontSize: 15, fontWeight: "700", color: colors.text },

    listaContagem: { fontSize: 12.5, color: colors.textMuted, fontWeight: "600" },

    listContent: { paddingHorizontal: 20, paddingBottom: 100 },

    center: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: 48,
      gap: 10,
    },

    vazioTexto: { fontSize: 14, color: colors.textMuted, textAlign: "center" },

    retryBtn: {
      marginTop: 4,
      paddingHorizontal: 16,
      paddingVertical: 9,
      borderRadius: 10,
      backgroundColor: colors.primaryLight,
    },

    retryText: { color: colors.primary, fontWeight: "700", fontSize: 13 },

    fab: {
      position: "absolute",
      right: 20,
      bottom: 24,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      paddingHorizontal: 18,
      height: 52,
      borderRadius: 26,
      backgroundColor: colors.primary,
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },

    fabTexto: { color: "#fff", fontWeight: "bold", fontSize: 14.5 },
  });
