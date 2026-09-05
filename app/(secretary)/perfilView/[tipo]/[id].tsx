import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function PerfilView() {
  // TODO: migrar de Frontend/src/pages/Secretary/ProfileView
  const { tipo, id } = useLocalSearchParams<{ tipo: string; id: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Perfil {tipo} #{id}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 18, fontWeight: '600', color: '#334155' },
});
