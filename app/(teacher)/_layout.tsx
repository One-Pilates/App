import { Redirect, Tabs } from 'expo-router';
import { View, ActivityIndicator, Image } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

// Fluxo de Professor.
export default function TeacherLayout() {
  const { signed, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f4ff' }}>
        <ActivityIndicator size="large" color="#f77433" />
      </View>
    );
  }

  const role = (user?.role || '').toUpperCase();
  if (!signed) return <Redirect href="/(public)/login" />;
  if (role !== 'PROFESSOR') return <Redirect href="/(secretary)/dashboard" />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#f77433',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: { fontSize: 12, fontWeight: '600' },
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{ title: 'Início', tabBarIcon: ({ color, size }) => <Feather name="pie-chart" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="agenda"
        options={{ title: 'Agenda', tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} /> }}
      />
      <Tabs.Screen
        name="perfil"
        options={{ title: 'Perfil', tabBarIcon: ({ color, size }) => <Feather name="user" size={size} color={color} /> }}
      />
    </Tabs>
  );
}
