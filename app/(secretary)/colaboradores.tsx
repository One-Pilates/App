import { View, Text, StyleSheet } from 'react-native';

export default function Colaboradores() {
  // TODO: migrar de Frontend/src/pages/Secretary/GerenciamentoColaboradores
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Colaboradores</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  title: { fontSize: 18, fontWeight: '600', color: '#334155' },
});
