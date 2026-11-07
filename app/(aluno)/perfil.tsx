import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme, type ThemeColors } from "@/contexts/ThemeContext";
import { useCarregar } from "@/hooks/useCarregar";
import { alunoApi, mensagemDeErro } from "@/services/aluno";
import { notify } from "@/utils/notify";
import { iniciais } from "@/utils/studentUtils";
import { formatarTelefone, somenteDigitos } from "@/utils/utils";
import { Cabecalho, Carregando, Erro } from "@/components/aluno/ui";

/** Editar Perfil: nome e e-mail ficam só para leitura (a secretaria altera); telefone e avisos o aluno edita. */
export default function PerfilScreen() {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const { user, updateUser } = useAuth();
  const { dados: perfil, carregando, erro, recarregar } = useCarregar(() => alunoApi.perfil(), []);
  const [telefone, setTelefone] = useState("");
  const [notificacaoAtiva, setNotificacaoAtiva] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!perfil) return;
    setTelefone(formatarTelefone(perfil.telefone) || "");
    setNotificacaoAtiva(perfil.notificacaoAtiva);
  }, [perfil]);

  const telefoneInvalido = telefone.trim().length > 0 && somenteDigitos(telefone).length < 10;

  async function salvar() {
    if (telefoneInvalido) {
      notify.warning("Telefone inválido (mínimo 10 dígitos).");
      return;
    }
    setSalvando(true);
    try {
      const atualizado = await alunoApi.atualizarPerfil({
        telefone: somenteDigitos(telefone),
        notificacaoAtiva,
      });
      if (user) await updateUser({ ...user, telefone: atualizado.telefone, notificacaoAtiva: atualizado.notificacaoAtiva });
      notify.success("Perfil atualizado!");
    } catch (e) {
      notify.error(mensagemDeErro(e, "Não foi possível salvar o perfil."));
    } finally {
      setSalvando(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Cabecalho titulo="Editar Perfil" voltar />
      {carregando && !perfil ? (
        <Carregando />
      ) : erro && !perfil ? (
        <Erro mensagem={erro} onTentar={recarregar} />
      ) : perfil ? (
        <ScrollView contentContainerStyle={styles.conteudo} keyboardShouldPersistTaps="handled">
          <View style={styles.avatarArea}>
            <View style={styles.avatar}>
              <Text style={styles.avatarTexto}>{iniciais(perfil.nome)}</Text>
            </View>
          </View>

          <Text style={styles.rotulo}>Nome</Text>
          <Text style={styles.somenteLeitura}>{perfil.nome}</Text>

          <Text style={styles.rotulo}>E-mail (seu login)</Text>
          <Text style={styles.somenteLeitura}>{perfil.email}</Text>
          <Text style={styles.ajuda}>Para alterar nome ou e-mail, fale com a secretaria.</Text>

          <Text style={styles.rotulo}>Telefone</Text>
          <TextInput
            style={[styles.input, telefoneInvalido && { borderColor: colors.danger }]}
            value={telefone}
            onChangeText={(v) => setTelefone(formatarTelefone(v))}
            keyboardType="phone-pad"
            placeholder="(11) 90000-0000"
            placeholderTextColor={colors.textMuted}
            maxLength={15}
          />
          {telefoneInvalido ? <Text style={styles.erro}>Telefone inválido (mínimo 10 dígitos)</Text> : null}

          <View style={styles.linhaSwitch}>
            <View style={{ flex: 1 }}>
              <Text style={styles.switchTitulo}>Receber avisos por e-mail</Text>
              <Text style={styles.ajuda}>Aula marcada, cancelada e lembretes de presença.</Text>
            </View>
            <Switch
              value={notificacaoAtiva}
              onValueChange={setNotificacaoAtiva}
              trackColor={{ false: isDark ? "#334155" : "#cbd5e1", true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity style={[styles.btnSalvar, salvando && { opacity: 0.7 }]} onPress={salvar} disabled={salvando}>
            {salvando ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnSalvarTexto}>Salvar Alterações</Text>}
          </TouchableOpacity>
        </ScrollView>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const getStyles = (colors: ThemeColors, isDark: boolean) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    conteudo: { padding: 18, paddingBottom: 36 },
    avatarArea: { alignItems: "center", marginBottom: 18 },
    avatar: {
      width: 84,
      height: 84,
      borderRadius: 42,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primaryLight,
    },
    avatarTexto: { color: colors.primary, fontSize: 30, fontWeight: "800" },
    rotulo: { color: colors.text, fontSize: 13, fontWeight: "700", marginTop: 16, marginBottom: 7 },
    somenteLeitura: {
      color: colors.textSecondary,
      fontSize: 15,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      backgroundColor: colors.surfaceSubtle,
      overflow: "hidden",
    },
    ajuda: { color: colors.textMuted, fontSize: 12, lineHeight: 17, marginTop: 6 },
    input: {
      color: colors.inputText,
      fontSize: 15,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.inputBorder,
      backgroundColor: colors.inputBg,
    },
    erro: { color: colors.danger, fontSize: 12, marginTop: 6 },
    linhaSwitch: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 22,
      padding: 14,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surfaceCard,
    },
    switchTitulo: { color: colors.text, fontSize: 14, fontWeight: "700" },
    btnSalvar: {
      height: 54,
      marginTop: 26,
      borderRadius: 14,
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: colors.primary,
    },
    btnSalvarTexto: { color: "#fff", fontSize: 16, fontWeight: "800" },
  });
