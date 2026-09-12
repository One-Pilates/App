import { Redirect } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

// Redireciona a rota inicial de acordo com autenticação e papel do usuário.
export default function Index() {
  const { signed, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
        <ActivityIndicator size="large" color="#f77433" />
      </View>
    );
  }

  if (!signed) {
    return <Redirect href="/(public)/login" />;
  }

  const tipo = (user?.role || '').toUpperCase();
  if (tipo === 'PROFESSOR') {
    return <Redirect href="/(teacher)/dashboard" />;
  }

  // SECRETARIA e ADMINISTRADOR usam o mesmo fluxo (secretary)
  return <Redirect href="/(secretary)/dashboard" />;
}
