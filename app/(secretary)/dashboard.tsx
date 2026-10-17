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
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);

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
        <Text style={styles.pageTitle}>Visão Geral</Text>

        <View style={styles.kpiGrid}>
          {/* Card 1: Sessões Realizadas */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#a855f7' }]}>
                <Feather name="activity" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>112</Text>
            </View>
            <Text style={styles.kpiLabel}>Sessões Realizadas</Text>
          </View>

          {/* Card 2: Alunos Atendidos */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#f97316' }]}>
                <Feather name="users" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>68</Text>
            </View>
            <Text style={styles.kpiLabel}>Alunos Atendidos</Text>
          </View>

          {/* Card 3: Dia com Maior Atendimento */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#3b82f6' }]}>
                <Feather name="calendar" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>Terça</Text>
            </View>
            <Text style={styles.kpiLabel}>Dia c/ Maior Atendimento</Text>
          </View>

          {/* Card 4: Novos Alunos */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#10b981' }]}>
                <Feather name="trending-up" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>+12</Text>
            </View>
            <Text style={styles.kpiLabel}>Novos Alunos</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sessões Agendadas na Semana</Text>
        <View style={styles.chartPlaceholder}>
          <WeeklyBarChart data={chartData} height={190} />
          <Text style={styles.chartSubtitle}>Seg - Sex (Semanal)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const getStyles = (colors: ThemeColors) =>
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
      paddingTop: 16,
      paddingBottom: 40,
    },
    pageTitle: {
      fontSize: 20,
      fontWeight: '800',
      color: colors.text,
      marginBottom: 14,
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
    kpiHeader: {
      flexDirection: 'column',
      alignItems: 'flex-start',
      marginBottom: 8,
    },
    iconWrapper: {
      width: 40,
      height: 40,
      borderRadius: 12,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: 12,
    },
    kpiValue: {
      fontSize: 26,
      fontWeight: '800',
      color: colors.text,
    },
    kpiLabel: {
      fontSize: 13,
      color: colors.textSecondary,
      fontWeight: '500',
    },
    sectionTitle: {
      fontSize: 18,
      fontWeight: 'bold',
      color: colors.text,
      marginBottom: 16,
      marginTop: 8,
    },
    chartPlaceholder: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 16,
      padding: 24,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
    },
    chartSubtitle: {
      color: colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
  });
