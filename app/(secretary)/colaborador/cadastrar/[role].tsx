import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function CadastrarColaborador() {
  // TODO: migrar de Frontend/src/pages/Secretary/RegisterCollaborator
  const { role } = useLocalSearchParams<{ role: string }>();
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar colaborador ({role})</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 18, fontWeight: '600', color: '#334155' },
});
