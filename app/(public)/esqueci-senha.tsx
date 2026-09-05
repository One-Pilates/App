import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import api from '@/services/api';
import AuthScreen from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEnviar = async () => {
    if (!email) {
      Alert.alert('Atenção', 'Por favor, insira um email válido.');
      return;
    }
    setLoading(true);
    try {
      await api.post('auth/criarCodigoVerificacao', { email });
      router.push({ pathname: '/(public)/codigo-verificacao', params: { email } });
    } catch (error) {
      console.error('Erro ao enviar código:', error);
      Alert.alert('Erro', 'Não foi possível enviar o código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Esqueci minha senha" subtitle="Informe seu e-mail para recuperar o acesso.">
      <View style={s.inputGroup}>
        <Text style={s.label}>E-mail</Text>
        <View style={s.inputWrapper}>
          <Feather name="mail" size={20} color="#f77433" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="onepilates@onepilates.com"
            placeholderTextColor="#aaa"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            value={email}
            onChangeText={setEmail}
          />
        </View>
      </View>

      <TouchableOpacity
        style={[s.button, loading && s.buttonDisabled]}
        onPress={handleEnviar}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Enviar</Text>}
      </TouchableOpacity>
    </AuthScreen>
  );
}
