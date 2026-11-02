import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, ThemeColors } from '@/contexts/ThemeContext';

interface MenuItem {
  key: string;
  label: string;
  description: string;
  icon: keyof typeof Feather.glyphMap;
  onPress: () => void;
}

export default function MaisScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);

  const isAdmin = (user?.role || '').toUpperCase() === 'ADMINISTRADOR';

  const items: MenuItem[] = [
    {
      key: 'colaboradores',
      label: 'Equipe de Colaboradores',
      description: 'Professores, instrutores e secretárias',
      icon: 'briefcase',
      onPress: () => router.push('/(secretary)/colaboradores'),
    },
    ...(isAdmin
      ? [
        {
          key: 'studio',
          label: 'Configurações do Studio',
          description: 'Salas de aula, aparelhos e especialidades',
          icon: 'sliders' as keyof typeof Feather.glyphMap,
          onPress: () => router.push('/(secretary)/studio'),
        },
      ]
      : []),
    {
      key: 'perfil',
      label: 'Meu Perfil',
      description: 'Dados cadastrais, senha e preferências do app',
      icon: 'user',
      onPress: () => router.push('/(secretary)/perfil'),
    },
  ];

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingTop: insets.top > 0 ? insets.top + 10 : 20 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.pageTitle}>Mais Opções</Text>
          <Text style={styles.pageSubtitle}>Gestão do estúdio e configurações da conta</Text>
        </View>

        <View style={styles.card}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={item.key}
              style={[styles.row, index < items.length - 1 && styles.rowBorderBottom]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.iconWrap}>
                <Feather name={item.icon} size={20} color={colors.primary} />
              </View>
              <View style={styles.rowTexts}>
                <Text style={styles.rowLabel}>{item.label}</Text>
                <Text style={styles.rowDescription}>{item.description}</Text>
              </View>
              <Feather name="chevron-right" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.7}>
          <Feather name="log-out" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Encerrar Sessão</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    scroll: { flex: 1 },
    content: { paddingHorizontal: 16, paddingBottom: 24 },
    header: { marginBottom: 20 },
    pageTitle: { fontSize: 24, fontWeight: '800', color: colors.text, letterSpacing: -0.5 },
    pageSubtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
    card: {
      backgroundColor: colors.surfaceCard,
      borderRadius: 18,
      marginBottom: 16,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: isDark ? 0.2 : 0.05,
      shadowRadius: 8,
      elevation: 2,
      borderWidth: 1,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 16,
    },
    rowBorderBottom: { borderBottomWidth: 1, borderBottomColor: colors.borderSubtle },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: 13,
      backgroundColor: colors.primaryLight,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 14,
    },
    rowTexts: { flex: 1 },
    rowLabel: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 2 },
    rowDescription: { fontSize: 12, color: colors.textSecondary, lineHeight: 16 },
    bottomContainer: {
      paddingHorizontal: 16,
      paddingBottom: 20,
      paddingTop: 8,
      backgroundColor: colors.background,
    },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      borderRadius: 14,
      paddingVertical: 14,
      borderWidth: 1,
      borderColor: colors.dangerBorder,
      backgroundColor: colors.dangerBg,
    },
    logoutText: { color: colors.danger, fontSize: 15, fontWeight: '700' },
  });



