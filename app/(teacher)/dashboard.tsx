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
  getTeacherDashboard,
  mapTeacherDashboard,
} from '@/services/dashboard';

type Kpis = {
  sessoes: string;
  alunos: string;
  diaMaior: string;
  especialidade: string;
};

type TopItem = { name: string; percent: number };

const PALETTE = ['#FF6B35', '#FF8C42', '#FFA94D', '#FFB74D'];
const EMPTY_KPIS: Kpis = { sessoes: '0', alunos: '0', diaMaior: '-', especialidade: '-' };
const ERROR_KPIS: Kpis = { sessoes: '-', alunos: '-', diaMaior: '-', especialidade: '-' };

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const primeiroNome = user?.nome ? user.nome.split(' ')[0] : 'Instrutor';

  const dataExtensa = useMemo(() => {
    try {
      const data = new Date();
      const formatada = data.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
      });
      return formatada.charAt(0).toUpperCase() + formatada.slice(1);
    } catch {
      return 'Visão Geral';
    }
  }, []);

  const [period, setPeriod] = useState(30);
  const [kpis, setKpis] = useState<Kpis>(EMPTY_KPIS);
  const [weekly, setWeekly] = useState<number[]>(WEEKDAY_SHORT_LABELS.map(() => 0));
  const [top, setTop] = useState<TopItem[]>([]);
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
      const data = await getTeacherDashboard(user.id, period || 30);
      const view = mapTeacherDashboard(data);
      setKpis(view.kpis);
      setWeekly(view.weekly);
      setTop(view.top);
      setHasData(view.hasData);
    } catch (err) {
      console.error('Erro ao buscar dados do professor:', err);
      const message = dashboardErrorMessage(
        err,
        'Não foi possível carregar o dashboard do professor.',
      );
      setError(message);
      setKpis(ERROR_KPIS);
      setWeekly(WEEKDAY_SHORT_LABELS.map(() => 0));
      setTop([]);
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
    {
      label: 'Sessões Realizadas',
      value: kpis.sessoes,
      icon: 'activity' as const,
      color: '#a855f7',
      bg: isDark ? 'rgba(168, 85, 247, 0.2)' : '#faf5ff',
    },
    {
      label: 'Alunos Atendidos',
      value: kpis.alunos,
      icon: 'users' as const,
      color: '#f97316',
      bg: isDark ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed',
    },
    {
      label: 'Dia c/ Maior Atendimento',
      value: kpis.diaMaior,
      icon: 'calendar' as const,
      color: '#3b82f6',
      bg: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff',
    },
    {
      label: 'Especialidade Mais Requisitada',
      value: kpis.especialidade,
      icon: 'star' as const,
      color: '#eab308',
      bg: isDark ? 'rgba(234, 179, 8, 0.2)' : '#fefce8',
    },
  ];

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
        {/* Saudação e Data */}
        <View style={styles.greetingHeader}>
          <Text style={styles.dateText}>{dataExtensa}</Text>
          <Text style={styles.greetingTitle}>Olá, {primeiroNome}</Text>
          <Text style={styles.greetingSubtitle}>
            Acompanhe suas aulas ministradas e a presença dos alunos
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Métricas do Período</Text>
        </View>

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
                  <Feather name={c.icon} size={18} color={c.color} />
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
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Frequência por Dia da Semana</Text>
          <Text style={styles.sectionSubtitle}>Distribuição de sessões de segunda a sexta</Text>
        </View>
        <View style={styles.chartCard}>
          <WeeklyBarChart data={chartData} height={190} />
          <View style={styles.chartFooter}>
            <Feather name="bar-chart-2" size={14} color={colors.textMuted} />
            <Text style={styles.chartSubtitle}>Agendamentos ({periodText})</Text>
          </View>
        </View>

        {/* TOP 3 aulas mais realizadas */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TOP 3 Aulas mais Realizadas</Text>
        </View>
        <View style={[styles.chartCard, { alignItems: 'stretch' }]}>
          {top.length === 0 ? (
            <Text style={styles.chartSubtitle}>Sem dados para exibir.</Text>
          ) : (
            top.map((t, i) => (
              <View key={t.name} style={styles.topRow}>
                <View style={styles.topHeader}>
                  <View style={styles.topNameWrap}>
                    <View style={[styles.dot, { backgroundColor: PALETTE[i % PALETTE.length] }]} />
                    <Text style={styles.topName} numberOfLines={1}>
                      {t.name}
                    </Text>
                  </View>
                  <Text style={styles.topPercent}>{t.percent.toFixed(1)}%</Text>
                </View>
                <View style={styles.barTrack}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${Math.min(t.percent, 100)}%`,
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

const getStyles = (colors: ThemeColors, isDark: boolean) =>
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
    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 40,
    },
    greetingHeader: {
      marginBottom: 16,
    },
    dateText: {
      fontSize: 12,
      fontWeight: '700',
      color: colors.primary,
      textTransform: 'capitalize',
      marginBottom: 4,
      letterSpacing: 0.3,
    },
    greetingTitle: {
      fontSize: 24,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.5,
      marginBottom: 4,
    },
    greetingSubtitle: {
      fontSize: 13,
      color: colors.textSecondary,
      lineHeight: 18,
    },
    sectionHeader: {
      marginBottom: 12,
      marginTop: 4,
    },
    sectionTitle: {
      fontSize: 16,
      fontWeight: '800',
      color: colors.text,
      letterSpacing: -0.2,
    },
    sectionSubtitle: {
      fontSize: 12,
      color: colors.textSecondary,
      marginTop: 2,
    },

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
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
    chipTextActive: { color: '#fff' },

    // Sem dados / Erro
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
      padding: 15,
      borderRadius: 16,
      marginBottom: 12,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 6,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    kpiHeader: { flexDirection: 'column', alignItems: 'flex-start', marginBottom: 8 },
    iconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    kpiValue: { fontSize: 26, fontWeight: '800', color: colors.text },
    kpiValueText: { fontSize: 16, lineHeight: 20 },
    kpiLabel: { fontSize: 12.5, color: colors.textSecondary, fontWeight: '600' },

    chartCard: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      marginBottom: 20,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    chartSubtitle: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },

    // TOP 3
    topRow: { marginBottom: 14 },
    topHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 6,
    },
    topNameWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 8 },
    dot: { width: 10, height: 10, borderRadius: 5 },
    topName: { color: colors.text, fontSize: 13, fontWeight: '600', flexShrink: 1 },
    topPercent: { color: colors.textSecondary, fontSize: 12, fontWeight: '600' },
    barTrack: {
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    barFill: { height: '100%', borderRadius: 4 },
  });
