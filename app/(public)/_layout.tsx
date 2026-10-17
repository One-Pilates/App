import { Redirect, Stack, useSegments } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

const PERMTIDAS_LOGADO = ['nova-senha', 'redefinir-senha']

// Bloqueia acesso às telas públicas quando já autenticado.
export default function PublicLayout() {
  const { signed, loading } = useAuth();
  const segments = useSegments();
  const rotaAtual = segments[segments.length - 1] || '';

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
        <ActivityIndicator size="large" color="#f77433" />
      </View>
    );
  }

  if (signed && !PERMTIDAS_LOGADO.includes(rotaAtual)) {
    return <Redirect href="/" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        animationDuration: 240,
        gestureEnabled: true,
        fullScreenGestureEnabled: true,
      }}
    />
  );
}
