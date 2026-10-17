import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const STORAGE_KEY_THEME = '@onepilates_theme';

export interface ThemeColors {
  isDark: boolean;
  background: string;
  surface: string;
  surfaceCard: string;
  surfaceSubtle: string;
  border: string;
  borderSubtle: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  inputBg: string;
  inputBorder: string;
  inputText: string;
  inputPlaceholder: string;
  tabBg: string;
  tabBorder: string;
  tabInactive: string;
  topBarHeader: string;
  danger: string;
  dangerBg: string;
  dangerBorder: string;
}

const lightColors: ThemeColors = {
  isDark: false,
  background: '#f8fafc',
  surface: '#ffffff',
  surfaceCard: '#ffffff',
  surfaceSubtle: '#f1f5f9',
  border: '#f1f5f9',
  borderSubtle: '#e2e8f0',
  text: '#0f172a',
  textSecondary: '#64748b',
  textMuted: '#94a3b8',
  primary: '#ea601e',
  primaryLight: '#fff3eb',
  inputBg: '#ffffff',
  inputBorder: '#e2e8f0',
  inputText: '#0f172a',
  inputPlaceholder: '#94a3b8',
  tabBg: '#ffffff',
  tabBorder: '#f1f5f9',
  tabInactive: '#94a3b8',
  topBarHeader: '#ea601e',
  danger: '#ef4444',
  dangerBg: '#fef2f2',
  dangerBorder: '#fecaca',
};

const darkColors: ThemeColors = {
  isDark: true,
  background: '#0f0f13',
  surface: '#18181c',
  surfaceCard: '#18181c',
  surfaceSubtle: '#222228',
  border: '#27272f',
  borderSubtle: '#32323d',
  text: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  primary: '#ea601e',
  primaryLight: 'rgba(234, 96, 30, 0.18)',
  inputBg: '#131317',
  inputBorder: '#2e2e38',
  inputText: '#f8fafc',
  inputPlaceholder: '#64748b',
  tabBg: '#131317',
  tabBorder: '#222228',
  tabInactive: '#71717a',
  topBarHeader: '#ea601e',
  danger: '#f87171',
  dangerBg: 'rgba(239, 68, 68, 0.15)',
  dangerBorder: 'rgba(239, 68, 68, 0.3)',
};

interface ThemeContextData {
  theme: 'light' | 'dark';
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (mode: 'light' | 'dark') => void;
}

const ThemeContext = createContext<ThemeContextData>({} as ThemeContextData);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    async function loadSavedTheme() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY_THEME);
        if (saved === 'dark' || saved === 'light') {
          setThemeState(saved);
        }
      } catch (err) {
        console.warn('Erro ao carregar tema:', err);
      }
    }
    loadSavedTheme();
  }, []);

  const setTheme = (mode: 'light' | 'dark') => {
    setThemeState(mode);
    AsyncStorage.setItem(STORAGE_KEY_THEME, mode).catch(() => {});
  };

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
  };

  const isDark = theme === 'dark';
  const colors = isDark ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, isDark, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme deve ser usado dentro de um ThemeProvider');
  }
  return context;
}
