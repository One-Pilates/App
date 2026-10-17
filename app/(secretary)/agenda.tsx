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

import { useFocusEffect, useLocalSearchParams, useRouter, useNavigation } from "expo-router";

import { useAuth } from "@/contexts/AuthContext";
import { useTheme, ThemeColors } from "@/contexts/ThemeContext";

import { useAgenda } from "@/hooks/useAgenda";

import { useAgendaDias } from "@/hooks/useAgendaDias";

import WeekStrip from "@/components/agenda/WeekStrip";

import { AulaCard, AusenciaCard } from "@/components/agenda/AgendaCards";

import SelectSheet, { Opcao } from "@/components/agenda/SelectSheet";

import AulaSheet from "@/components/agenda/AulaSheet";

import AulaEditSheet from "@/components/agenda/AulaEditSheet";

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

export default function AgendaSecretariaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const params = useLocalSearchParams<{
    idProfessor?: string;
    idSala?: string;
  }>();

  const {
    salas,

    professores,

    idSala,

    setIdSala,

    idProfessor,

    setIdProfessor,

    agendamentos,

    ausencias,

    loading,

    erro,

    recarregar,
  } = useAgenda({
    professorInicial: params.idProfessor,
    salaInicial: params.idSala,
  });

  const [mesAberto, setMesAberto] = useState(false);

  const [aulaSelecionada, setAulaSelecionada] = useState<Agendamento | null>(
    null,
  );

  const [editandoAula, setEditandoAula] = useState(false);

  const [ausenciaSelecionada, setAusenciaSelecionada] =
    useState<Ausencia | null>(null);

  const [definindoAusencia, setDefinindoAusencia] = useState(false);

  const [acoesAbertas, setAcoesAbertas] = useState(false);

  const [filtroAberto, setFiltroAberto] = useState<"sala" | "professor" | null>(
    null,
  );

  const navigation = useNavigation();

  const sheetAberto = Boolean(
    aulaSelecionada ||
    editandoAula ||
    ausenciaSelecionada ||
    definindoAusencia ||
    acoesAbertas ||
    filtroAberto
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

  // Recarrega ao voltar para a tela (ex.: após criar uma aula).

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

  // Filtros vindos de outra tela ("Ver agenda" / recém-criada), equivalente ao location.state do web.

  useEffect(() => {
    if (params.idProfessor) setIdProfessor(String(params.idProfessor));
  }, [params.idProfessor, setIdProfessor]);

  useEffect(() => {
    if (params.idSala) setIdSala(String(params.idSala));
  }, [params.idSala, setIdSala]);

  const nomeSalaSelecionada = salas.find((s) => String(s.id) === idSala)?.nome;

  const nomeProfessorSelecionado = professores.find(
    (p) => String(p.id) === idProfessor,
  )?.nome;

  const opcoesSala: Opcao[] = [
    { label: "Todas as salas", value: "" },

    ...salas.map((s) => ({ label: s.nome, value: String(s.id) })),
  ];

  const opcoesProfessor: Opcao[] = [
    { label: "Todos os professores", value: "0" },

    ...professores.map((p) => ({ label: p.nome, value: String(p.id) })),
  ];

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

        <View style={styles.filtros}>
          <TouchableOpacity
            style={[styles.chip, !!idSala && styles.chipAtivo]}
            onPress={() => setFiltroAberto("sala")}
          >
            <Feather
              name="map-pin"
              size={13}
              color={idSala ? colors.primary : colors.textSecondary}
            />

            <Text
              style={[styles.chipText, !!idSala && styles.chipTextAtivo]}
              numberOfLines={1}
            >
              {nomeSalaSelecionada || "Todas as salas"}
            </Text>

            <Feather
              name="chevron-down"
              size={14}
              color={idSala ? colors.primary : colors.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.chip, idProfessor !== "0" && styles.chipAtivo]}
            onPress={() => setFiltroAberto("professor")}
          >
            <Feather
              name="user"
              size={13}
              color={idProfessor !== "0" ? colors.primary : colors.textSecondary}
            />

            <Text
              style={[
                styles.chipText,
                idProfessor !== "0" && styles.chipTextAtivo,
              ]}
              numberOfLines={1}
            >
              {nomeProfessorSelecionado || "Todos"}
            </Text>

            <Feather
              name="chevron-down"
              size={14}
              color={idProfessor !== "0" ? colors.primary : colors.textMuted}
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
        onPress={() => setAcoesAbertas(true)}
        activeOpacity={0.85}
      >
        <Feather name="plus" size={24} color="#fff" />
      </TouchableOpacity>

      <SelectSheet
        visible={filtroAberto === "sala"}
        titulo="Filtrar por sala"
        opcoes={opcoesSala}
        valor={idSala}
        onSelecionar={setIdSala}
        onFechar={() => setFiltroAberto(null)}
      />

      <SelectSheet
        visible={filtroAberto === "professor"}
        titulo="Filtrar por professor"
        opcoes={opcoesProfessor}
        valor={idProfessor}
        onSelecionar={setIdProfessor}
        onFechar={() => setFiltroAberto(null)}
      />

      <AulaSheet
        visible={!!aulaSelecionada && !editandoAula}
        agendamento={aulaSelecionada}
        podeEditar
        onFechar={() => setAulaSelecionada(null)}
        onEditar={() => setEditandoAula(true)}
        onAlterado={recarregar}
      />

      <AulaEditSheet
        visible={editandoAula}
        agendamento={aulaSelecionada}
        onFechar={() => setEditandoAula(false)}
        onSalvo={() => {
          setEditandoAula(false);

          setAulaSelecionada(null);

          recarregar();
        }}
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
        professores={professores}
        onFechar={() => setDefinindoAusencia(false)}
        onCriada={(prof) => {
          // Ausências só aparecem com um professor específico filtrado.

          if (prof !== idProfessor) setIdProfessor(prof);
          else recarregar();
        }}
      />

      <SelectSheet
        visible={acoesAbertas}
        titulo="O que deseja criar?"
        opcoes={[
          { label: "Nova aula", value: "aula" },

          { label: "Definir ausência", value: "ausencia" },
        ]}
        valor=""
        onSelecionar={(valor) => {
          if (valor === "aula") {
            router.push({
              pathname: "/(secretary)/agendamento/criar",

              params: { data: diaSelecionado },
            });
          } else {
            setDefinindoAusencia(true);
          }
        }}
        onFechar={() => setAcoesAbertas(false)}
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

    filtros: { flexDirection: "row", gap: 10, marginBottom: 14 },

    chip: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: colors.surfaceSubtle,
      borderWidth: 1.5,
      borderColor: colors.borderSubtle,
      paddingHorizontal: 12,
      paddingVertical: 9,
      borderRadius: 12,
    },

    chipAtivo: { backgroundColor: colors.primaryLight, borderColor: colors.primary },

    chipText: { flex: 1, fontSize: 12.5, color: colors.textSecondary, fontWeight: "600" },

    chipTextAtivo: { color: colors.primary },

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
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.4,
      shadowRadius: 10,
      elevation: 6,
    },
  });
