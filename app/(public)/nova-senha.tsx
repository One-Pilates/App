import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import api from '@/services/api';
import AuthScreen from '@/components/AuthScreen';
import { authStyles as s } from '@/components/authStyles';

function validatePassword(password: string) {
  return {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

function Rule({ ok, children }: { ok: boolean; children: string }) {
  return <Text style={[s.ruleItem, ok ? s.ruleOk : s.ruleBad]}>{ok ? '✓' : '•'} {children}</Text>;
}

export default function NovaSenha() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [password1, setPassword1] = useState('');
  const [password2, setPassword2] = useState('');
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);

  const rules = validatePassword(password1);

  const handleSubmit = async () => {
    if (!Object.values(rules).every(Boolean)) {
      Alert.alert('Atenção', 'A senha não atende aos requisitos mínimos.');
      return;
    }
    if (password1 !== password2) {
      Alert.alert('Atenção', 'As senhas devem ser iguais.');
      return;
    }
    setLoading(true);
    try {
      await api.post('auth/alterarSenha', { senha: password1, email });
      Alert.alert('Sucesso', 'Nova senha cadastrada com sucesso!');
      router.replace('/(public)/login');
    } catch (error) {
      console.error('Erro ao redefinir senha:', error);
      Alert.alert('Erro', 'Não foi possível atualizar sua senha. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthScreen title="Criar Nova Senha" subtitle="Por favor, crie uma nova senha para sua conta.">
      <View style={s.inputGroup}>
        <Text style={s.label}>Senha</Text>
        <View style={s.inputWrapper}>
          <Feather name="lock" size={20} color="#f77433" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="********"
            placeholderTextColor="#aaa"
            secureTextEntry={!show1}
            value={password1}
            onChangeText={setPassword1}
          />
          <TouchableOpacity onPress={() => setShow1(!show1)} style={s.eyeBtn}>
            <Feather name={show1 ? 'eye-off' : 'eye'} size={20} color="#757575" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={s.inputGroup}>
        <Text style={s.label}>Repetir Senha</Text>
        <View style={s.inputWrapper}>
          <Feather name="lock" size={20} color="#f77433" style={s.inputIcon} />
          <TextInput
            style={s.input}
            placeholder="********"
            placeholderTextColor="#aaa"
            secureTextEntry={!show2}
            value={password2}
            onChangeText={setPassword2}
          />
          <TouchableOpacity onPress={() => setShow2(!show2)} style={s.eyeBtn}>
            <Feather name={show2 ? 'eye-off' : 'eye'} size={20} color="#757575" />
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.rulesTitle}>A senha deve conter:</Text>
      <Rule ok={rules.length}>10 caracteres</Rule>
      <Rule ok={rules.uppercase}>Uma letra maiúscula</Rule>
      <Rule ok={rules.lowercase}>Uma letra minúscula</Rule>
      <Rule ok={rules.number}>Um número</Rule>
      <Rule ok={rules.special}>Um caractere especial (!@#$%^&*)</Rule>

      <TouchableOpacity
        style={[s.button, loading && s.buttonDisabled]}
        onPress={handleSubmit}
        disabled={loading}
        activeOpacity={0.85}
      >
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Redefinir Senha</Text>}
      </TouchableOpacity>
    </AuthScreen>
  );
}
