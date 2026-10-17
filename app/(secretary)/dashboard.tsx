import React, { useCallback, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { WeeklyBarChart } from '@/components/dashboard/WeeklyBarChart';
import { notify } from '@/utils/notify';
import {
  DASHBOARD_PERIODS,
  WEEKDAY_SHORT_LABELS,
  dashboardErrorMessage,
  getSecretaryDashboard,
  mapSecretaryDashboard,
} from '@/services/dashboard';

type Kpis = {
  sessoes: string;
  alunos: string;
  diaMaior: string;
  professorMaior: string;
};

type PieItem = { name: string; value: number; percent: number };

const PALETTE = ['#FF6B35', '#FF8C42', '#FFA94D', '#FFB74D', '#f97316', '#fb923c'];
const EMPTY_KPIS: Kpis = { sessoes: '', alunos: '', diaMaior: '', professorMaior: '' };
const ERROR_KPIS: Kpis = { sessoes: '-', alunos: '-', diaMaior: '-', professorMaior: '-' };

/* ------------------------------------------------------------------ */
/* Tela                                                                */

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

  const [period, setPeriod] = useState(30);
  const [kpis, setKpis] = useState<Kpis>(EMPTY_KPIS);
  const [weekly, setWeekly] = useState<number[]>(WEEKDAY_SHORT_LABELS.map(() => 0));
  const [pie, setPie] = useState<PieItem[]>([]);
  const [hasData, setHasData] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await getSecretaryDashboard(period || 30);
      const view = mapSecretaryDashboard(data);
      setKpis(view.kpis);
      setWeekly(view.weekly);
      setPie(view.pie);
      setHasData(view.hasData);
    } catch (err) {
      console.error('Erro ao buscar dados da secretaria:', err);
      const message = dashboardErrorMessage(
        err,
        'Não foi possível carregar o dashboard da secretaria.',
      );
      setError(message);
      setKpis(ERROR_KPIS);
      setWeekly(WEEKDAY_SHORT_LABELS.map(() => 0));
      setPie([]);
      setHasData(false);
      notify.error(message);
    } finally {
      setLoading(false);
    }
  }, [user?.id, period]);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [fetchDashboardData]),
  );

  const chartData = {
    labels: [...WEEKDAY_SHORT_LABELS],
    datasets: [{ data: weekly }],
  };

  const cards = [
    { label: 'Sessões Realizadas', value: kpis.sessoes, icon: 'activity', bg: '#a855f7' },
    { label: 'Alunos Atendidos', value: kpis.alunos, icon: 'users', bg: '#f97316' },
    { label: 'Dia c/ Maior Atendimento', value: kpis.diaMaior, icon: 'calendar', bg: '#3b82f6' },
    {
      label: 'Professor c/ mais atendimentos',
      value: kpis.professorMaior,
      icon: 'award',
      bg: '#eab308',
    },
  ] as const;

  const periodText = `últimos ${period} dias`;

  return (
    <View style={styles.container}>
      {/* Top Brand Bar Laranja com Logo Branca Centralizada */}
      <View style={[styles.topBarHeader, { paddingTop: insets.top > 0 ? insets.top + 8 : 16 }]}>
        <Image
          source={require('../../assets/logoBranca.png')}
          style={styles.brandLogo}
          resizeMode="contain"
        />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchDashboardData} />}
      >
        <Text style={styles.pageTitle}>Visão Geral</Text>

        {/* Filtro de período */}
        <View style={styles.filterRow}>
          {DASHBOARD_PERIODS.map((p) => {
            const active = p.value === period;
            return (
              <TouchableOpacity
                key={p.value}
                style={[styles.chip, active && styles.chipActive]}
                onPress={() => setPeriod(p.value)}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{p.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {error && !loading && (
          <View style={styles.errorBox}>
            <Feather name="alert-triangle" size={22} color="#dc2626" />
            <View style={{ flex: 1 }}>
              <Text style={styles.noDataTitle}>Não foi possível carregar os dados</Text>
              <Text style={styles.noDataText}>{error}</Text>
            </View>
          </View>
        )}

        {!error && !hasData && !loading && (
          <View style={styles.noData}>
            <Feather name="alert-circle" size={22} color="#f97316" />
            <View style={{ flex: 1 }}>
              <Text style={styles.noDataTitle}>Nenhuma aula agendada</Text>
              <Text style={styles.noDataText}>
                Você não possui aulas agendadas nos {periodText}.
              </Text>
            </View>
          </View>
        )}

        {/* KPIs */}
        <View style={styles.kpiGrid}>
          {cards.map((c) => (
            <View key={c.label} style={styles.kpiCard}>
              <View style={styles.kpiHeader}>
                <View style={[styles.iconWrapper, { backgroundColor: c.bg }]}>
                  <Feather name={c.icon} size={18} color="#fff" />
                </View>
                {loading ? (
                  <ActivityIndicator size="small" color={colors.text} />
                ) : (
                  <Text
                    style={[styles.kpiValue, c.value.length > 10 && styles.kpiValueText]}
                    numberOfLines={2}
                  >
                    {c.value || '-'}
                  </Text>
                )}
              </View>
              <Text style={styles.kpiLabel}>{c.label}</Text>
            </View>
          ))}
        </View>

        {/* Frequência por dia da semana */}
        <Text style={styles.sectionTitle}>Frequência por Dia da Semana</Text>
        <View style={styles.chartCard}>
          <WeeklyBarChart data={chartData} height={190} />
          <Text style={styles.chartSubtitle}>Agendamentos ({periodText})</Text>
        </View>

        {/* Porcentagem de aulas por professor */}
        <Text style={styles.sectionTitle}>Porcentagem de aulas por professor</Text>
        <View style={[styles.chartCard, { alignItems: 'stretch' }]}>
          {pie.length === 0 ? (
            <Text style={styles.chartSubtitle}>Sem dados para exibir.</Text>
          ) : (
            pie.map((p, i) => (
              <View key={p.name} style={styles.profRow}>
                <View style={styles.profHeader}>
                  <View style={styles.profNameWrap}>
                    <View
                      style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]}
                    />
                    <Text style={styles.profName} numberOfLines={1}>
                      {p.name}
                    </Text>
                  </View>
                  <Text style={styles.profPercent}>
                    {p.percent.toFixed(1)}% ({p.value})
                  </Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${p.percent}%`,
                        backgroundColor: PALETTE[i % PALETTE.length],
                      },
                    ]}
                  />
                </View>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

/* ------------------------------------------------------------------ */
/* Estilos                                                             */
/* ------------------------------------------------------------------ */

const getStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    topBarHeader: {
      backgroundColor: colors.topBarHeader,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingBottom: 14,
      zIndex: 10,
    },
    brandLogo: { width: 130, height: 32 },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 40 },
    pageTitle: { fontSize: 20, fontWeight: '800', color: colors.text, marginBottom: 14 },

    // Filtro
    filterRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 20,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chipActive: { backgroundColor: '#FF6B35', borderColor: '#FF6B35' },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: '#fff' },

    // Sem dados
    noData: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: '#f97316',
      marginBottom: 16,
    },
    noDataTitle: { fontWeight: '700', color: colors.text },
    noDataText: { color: colors.textSecondary, fontSize: 13 },
    errorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceCard,
      borderWidth: 1,
      borderColor: '#dc2626',
      marginBottom: 16,
    },

    // KPIs
    kpiGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
      marginBottom: 16,
    },
    kpiCard: {
      backgroundColor: colors.surfaceCard,
      width: '48%',
      padding: 14,
      borderRadius: 14,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiHeader: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    kpiValue: { fontSize: 26, fontWeight: '800', color: colors.text },
    kpiValueText: { fontSize: 16, lineHeight: 20 },
    kpiLabel: { fontSize: 13, color: colors.textSecondary, fontWeight: '500' },

    // Seções e gráficos
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    chartCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600', marginTop: 8 },

    // Professores
    profRow: { marginBottom: 14 },
    profHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    profNameWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    profName: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1 },
    profPercent: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
  });