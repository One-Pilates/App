import { useRef, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import AuthScreen from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';

export default function CodigoVerificacao() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codigo, setCodigo] = useState(['', '', '', '', '']);
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(TextInput | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;
    const novo = [...codigo];
    novo[index] = value.toUpperCase();
    setCodigo(novo);
    if (value && index < 4) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !codigo[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const confirmarCodigo = async () => {
    const codigoFinal = codigo.join('');
    if (codigoFinal.length < 5) {
      Alert.alert('Atenção', 'Por favor, insira o código completo.');
      return;
    }
    setConfirming(true);
    try {
      await api.post('auth/validarCodigo', { email, codigo: codigoFinal });
      router.push({ pathname: '/(public)/nova-senha', params: { email } });
    } catch (error) {
      console.error('Erro ao validar código:', error);
      Alert.alert('Erro', 'Código incorreto ou expirado. Tente novamente.');
    } finally {
      setConfirming(false);
    }
  };

  const reenviarCodigo = async () => {
    if (!email) {
      Alert.alert('Erro', 'Email não encontrado. Por favor, reinicie o processo.');
      return;
    }
    setResending(true);
    try {
      await api.post('auth/criarCodigoVerificacao', { email });
      setCodigo(['', '', '', '', '']);
      inputs.current[0]?.focus();
      Alert.alert('Sucesso', 'Código reenviado! Verifique seu e-mail novamente.');
    } catch (error) {
      console.error('Erro ao reenviar código:', error);
      Alert.alert('Erro', 'Não foi possível reenviar o código. Tente novamente.');
    } finally {
      setResending(false);
    }
  };

  return (
    <AuthScreen
      title="Código de verificação"
      subtitle="Confira sua caixa de entrada e informe o código recebido."
    >
      <Text style={s.successText}>O e-mail foi enviado com sucesso</Text>

      <View style={s.codeRow}>
        {codigo.map((valor, index) => (
          <TextInput
            key={index}
            ref={(el) => {
              inputs.current[index] = el;
            }}
            style={s.codeBox}
            value={valor}
            maxLength={1}
            autoCapitalize="characters"
            keyboardType="default"
            onChangeText={(text) => handleChange(index, text)}
            onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
          />
        ))}
      </View>

      <TouchableOpacity
        style={[s.button, confirming && s.buttonDisabled]}
        onPress={confirmarCodigo}
        disabled={confirming}
        activeOpacity={0.85}
      >
        {confirming ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Confirmar código</Text>}
      </TouchableOpacity>

      <TouchableOpacity style={s.linkBtn} onPress={reenviarCodigo} disabled={resending}>
        <Text style={s.linkText}>{resending ? 'Reenviando...' : 'Reenviar código'}</Text>
      </TouchableOpacity>
    </AuthScreen>
  );
}
