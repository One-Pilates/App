import { View, Text, StyleSheet } from 'react-native';

export default function RedefinirSenha() {
  // TODO: migrar de Frontend/src/components/Password.jsx
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Redefinir senha</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  title: { fontSize: 18, fontWeight: '600', color: '#334155' },
});
