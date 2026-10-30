import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';
import { Feather } from '@expo/vector-icons';
import { WeeklyBarChart } from '@/components/dashboard/WeeklyBarChart';

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const primeiroNome = user?.nome ? user.nome.split(' ')[0] : 'Bem-vindo';

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

  const chartData = {
    labels: ['Seg', 'Ter', 'Qua', 'Qui', 'Sex'],
    datasets: [
      {
        data: [20, 45, 28, 80, 50],
      },
    ],
  };

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
      >
        {/* Saudação e Data */}
        <View style={styles.greetingHeader}>
          <Text style={styles.dateText}>{dataExtensa}</Text>
          <Text style={styles.greetingTitle}>Olá, {primeiroNome}</Text>
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Métricas da Semana</Text>
        </View>

        <View style={styles.kpiGrid}>
          {/* Card 1: Sessões Realizadas */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.2)' : '#faf5ff' }]}>
                <Feather name="activity" size={18} color="#a855f7" />
              </View>
              <Text style={styles.kpiValue}>112</Text>
            </View>
            <Text style={styles.kpiLabel}>Sessões Realizadas</Text>
          </View>

          {/* Card 2: Alunos Atendidos */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(249, 115, 22, 0.2)' : '#fff7ed' }]}>
                <Feather name="users" size={18} color="#f97316" />
              </View>
              <Text style={styles.kpiValue}>68</Text>
            </View>
            <Text style={styles.kpiLabel}>Alunos Atendidos</Text>
          </View>

          {/* Card 3: Dia com Maior Atendimento */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(59, 130, 246, 0.2)' : '#eff6ff' }]}>
                <Feather name="calendar" size={18} color="#3b82f6" />
              </View>
              <Text style={styles.kpiValue}>Terça</Text>
            </View>
            <Text style={styles.kpiLabel}>Dia c/ Maior Fluxo</Text>
          </View>

          {/* Card 4: Novos Alunos */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.2)' : '#ecfdf5' }]}>
                <Feather name="trending-up" size={18} color="#10b981" />
              </View>
              <Text style={styles.kpiValue}>+12</Text>
            </View>
            <Text style={styles.kpiLabel}>Novos Alunos</Text>
          </View>
        </View>

        {/* Gráfico de Sessões */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ocupação Semanal</Text>
          <Text style={styles.sectionSubtitle}>Distribuição de sessões de segunda a sexta</Text>
        </View>

        <View style={styles.chartPlaceholder}>
          <WeeklyBarChart data={chartData} height={190} />
          <View style={styles.chartFooter}>
            <Feather name="bar-chart-2" size={14} color={colors.textMuted} />
            <Text style={styles.chartSubtitle}>Total de sessões confirmadas</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    topBarHeader: {
      backgroundColor: colors.topBarHeader,
      width: '100%',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingBottom: 14,
      zIndex: 10,
    },
    brandLogo: {
      width: 130,
      height: 32,
    },
    scroll: {
      flex: 1,
    },
    content: {
      paddingHorizontal: 16,
      paddingTop: 18,
      paddingBottom: 40,
    },
    greetingHeader: {
      marginBottom: 20,
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
    kpiHeader: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    iconWrapper: {
      width: 38,
      height: 38,
      borderRadius: 11,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 10,
    },
    kpiValue: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    kpiLabel: {
      fontSize: 12,
      color: colors.textSecondary,
      fontWeight: '600',
    },
    chartPlaceholder: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 20,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
      marginBottom: 20,
    },
    chartFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: 10,
    },
    chartSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
  });
