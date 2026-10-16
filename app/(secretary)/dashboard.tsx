import React from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/contexts/AuthContext';
import { Feather } from '@expo/vector-icons';
import { BarChart } from 'react-native-chart-kit';

export default function DashboardScreen() {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  
  const screenWidth = Dimensions.get('window').width;

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
      {/* Top Brand Bar Laranja com Logo Branca Centralizada (sem gradient, sem arredondamento) */}
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
              <View style={[styles.iconWrapper, { backgroundColor: '#d8b4fe' }]}>
                <Feather name="activity" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>112</Text>
            </View>
            <Text style={styles.kpiLabel}>Sessões Realizadas</Text>
          </View>

          {/* Card 2: Alunos Atendidos */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#fdba74' }]}>
                <Feather name="users" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>68</Text>
            </View>
            <Text style={styles.kpiLabel}>Alunos Atendidos</Text>
          </View>

          {/* Card 3: Dia com Maior Atendimento */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#93c5fd' }]}>
                <Feather name="calendar" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>Terça</Text>
            </View>
            <Text style={styles.kpiLabel}>Dia c/ Maior Atendimento</Text>
          </View>

          {/* Card 4: Novos Alunos */}
          <View style={styles.kpiCard}>
            <View style={styles.kpiHeader}>
              <View style={[styles.iconWrapper, { backgroundColor: '#a7f3d0' }]}>
                <Feather name="trending-up" size={18} color="#fff" />
              </View>
              <Text style={styles.kpiValue}>+12</Text>
            </View>
            <Text style={styles.kpiLabel}>Novos Alunos</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Sessões Agendadas na Semana</Text>
        <View style={styles.chartPlaceholder}>
          <BarChart
            data={chartData}
            width={screenWidth - 64} // 16px lateral container + 16px lateral card
            height={200}
            yAxisLabel=""
            yAxisSuffix=""
            fromZero={true}
            showValuesOnTopOfBars={true}
            withHorizontalLabels={false}
            chartConfig={{
              backgroundColor: '#fff',
              backgroundGradientFrom: '#fff',
              backgroundGradientTo: '#fff',
              fillShadowGradient: '#f77433',
              fillShadowGradientOpacity: 0.8,
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(247, 116, 51, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
              style: {
                borderRadius: 16,
              },
              propsForBackgroundLines: {
                strokeWidth: 1,
                stroke: '#f1f5f9',
                strokeDasharray: '0',
              },
              barPercentage: 0.6,
            }}
            style={{
              marginVertical: 4,
              borderRadius: 16,
              paddingRight: 0,
              paddingLeft: 0,
            }}
          />
          <Text style={styles.chartSubtitle}>Seg - Sex (Semanal)</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  topBarHeader: {
    backgroundColor: '#ea601e',
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
    color: '#0f172a',
    marginBottom: 14,
  },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  kpiCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 14,
    borderRadius: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
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
    color: '#0f172a',
  },
  kpiLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    marginTop: 8,
  },
  chartPlaceholder: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  barContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    height: 120,
    marginBottom: 16,
  },
  bar: {
    width: 30,
    backgroundColor: '#f77433',
    borderRadius: 6,
    opacity: 0.8,
  },
  chartSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    fontWeight: '600',
  }
});
