import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useTheme } from '@/contexts/ThemeContext';

export interface WeeklyBarChartData {
  labels: string[];
  datasets: Array<{
    data: number[];
  }>;
}

interface WeeklyBarChartProps {
  data: WeeklyBarChartData;
  height?: number;
  barColor?: string;
  activeBarColor?: string;
}

export function WeeklyBarChart({
  data,
  height = 180,
  barColor = '#f97316',
  activeBarColor = '#ea601e',
}: WeeklyBarChartProps) {
  const { colors, isDark } = useTheme();
  const rawValues = data.datasets?.[0]?.data || [];
  const labels = data.labels || [];
  
  const maxVal = Math.max(...rawValues, 1);
  // Add 15% headroom so top labels don't collide with the top edge
  const ceiling = Math.ceil(maxVal * 1.15);

  // Animated values for entrance animation
  const animProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(animProgress, {
      toValue: 1,
      duration: 650,
      useNativeDriver: false, // Required for layout/height interpolation cross-platform
    }).start();
  }, [data]);

  const maxIndex = rawValues.indexOf(maxVal);

  return (
    <View style={[styles.container, { height }]}>
      {/* Background horizontal guideline marks */}
      <View style={styles.gridLinesContainer} pointerEvents="none">
        <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
        <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
        <View style={[styles.gridLine, { backgroundColor: colors.border }]} />
      </View>

      {/* Bars row */}
      <View style={styles.barsRow}>
        {rawValues.map((val, idx) => {
          const isHighest = idx === maxIndex;
          const ratio = Math.max(val / ceiling, 0.04);
          const barHeightPercentage = `${Math.min(ratio * 100, 100)}%`;

          const animatedHeight = animProgress.interpolate({
            inputRange: [0, 1],
            outputRange: ['0%', barHeightPercentage],
          });

          return (
            <View key={idx} style={styles.columnContainer}>
              {/* Bar area (track + fill) */}
              <View style={styles.trackArea}>
                <Animated.View
                  style={[
                    styles.barFill,
                    {
                      height: animatedHeight,
                      backgroundColor: isHighest ? activeBarColor : barColor,
                    },
                  ]}
                >
                  {/* Subtle top gloss highlight */}
                  <View style={styles.barTopHighlight} />
                </Animated.View>

                {/* Top value number */}
                <View
                  style={[
                    styles.valueBadge,
                    { backgroundColor: isHighest ? (isDark ? 'rgba(234, 96, 30, 0.22)' : '#fff7ed') : colors.surfaceSubtle },
                  ]}
                >
                  <Text
                    style={[
                      styles.valueText,
                      { color: isHighest ? colors.primary : colors.textSecondary },
                    ]}
                  >
                    {val}
                  </Text>
                </View>
              </View>

              {/* Day label */}
              <View style={styles.labelWrapper}>
                <Text
                  style={[
                    styles.labelText,
                    { color: isHighest ? colors.text : colors.textMuted },
                    isHighest && { fontWeight: '700' },
                  ]}
                >
                  {labels[idx] || ''}
                </Text>
                {isHighest && <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    justifyContent: 'flex-end',
    position: 'relative',
    paddingTop: 28, // space for value badges
    paddingBottom: 4,
  },
  gridLinesContainer: {
    position: 'absolute',
    top: 28,
    left: 0,
    right: 0,
    bottom: 30,
    justifyContent: 'space-between',
  },
  gridLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
  },
  barsRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  columnContainer: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
    justifyContent: 'flex-end',
  },
  trackArea: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-end',
    position: 'relative',
  },
  valueBadge: {
    position: 'absolute',
    top: -24,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#f8fafc',
  },
  valueBadgeHighest: {
    backgroundColor: '#fff7ed',
  },
  valueText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
  },
  valueTextHighest: {
    color: '#ea601e',
    fontWeight: '800',
  },
  barFill: {
    width: Platform.OS === 'web' ? '45%' : '48%',
    maxWidth: 36,
    minWidth: 20,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  barTopHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  labelWrapper: {
    marginTop: 10,
    alignItems: 'center',
    height: 20,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
  },
  labelTextHighest: {
    color: '#0f172a',
    fontWeight: '700',
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ea601e',
    marginTop: 2,
  },
});

export default WeeklyBarChart;
