import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
  ScrollView,
  StatusBar as RNStatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { StatusBar } from "expo-status-bar";
import api from "@/services/api";
import { useAuth } from "@/contexts/AuthContext";
import AmbientBackground from "@/components/AmbientBackground";
import PrimaryButton from "@/components/PrimaryButton";

const ANDROID_STATUS_BAR = RNStatusBar.currentHeight || 40;
const HEADER_SAFE_TOP = Platform.OS === "ios" ? 58 : ANDROID_STATUS_BAR + 22;

function validatePassword(password: string) {
  return {
    length: password.length >= 10,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[!@#$%^&*]/.test(password),
  };
}

export default function NovaSenha() {
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const params = useLocalSearchParams<{
    email: string;
    primeiroAcesso?: string;
  }>();

  const isPrimeiroAcesso =
    params.primeiroAcesso === "1" || !!user?.primeiroAcesso;
  const email = params.email || user?.email || "";

  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [show1, setShow1] = useState(false);
  const [show2, setShow2] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"pass1" | "pass2" | null>(null);

  const pass1Ref = useRef<TextInput>(null);
  const pass2Ref = useRef<TextInput>(null);

  const rules = validatePassword(password1);
  const allRulesOk = Object.values(rules).every(Boolean);

  const handleSubmit = async () => {
    if (!allRulesOk) {
      Alert.alert("Atenção", "A senha não atende aos requisitos mínimos de segurança.");
      return;
    }

    if (password1 !== password2) {
      Alert.alert("Atenção", "As duas senhas digitadas devem ser iguais.");
      return;
    }

    setLoading(true);

    try {
      await api.post("auth/alterarSenha", { senha: password1, email });

      if (isPrimeiroAcesso && user) {
        await updateUser({ ...user, primeiroAcesso: false });
        Alert.alert("Sucesso", "Senha definitiva cadastrada com sucesso!");
        router.replace("/");
      } else {
        Alert.alert("Sucesso", "Nova senha cadastrada com sucesso!");
        router.replace("/(public)/login");
      }
    } catch (error: any) {
      console.error("Erro ao redefinir senha:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message ||
          "Não foi possível atualizar sua senha. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AmbientBackground>
      <StatusBar style="light" />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <View style={styles.mainWrapper}>
          {/* Topo Elevado com Espaço para Câmera */}
          <View style={[styles.topPinnedHeader, { paddingTop: HEADER_SAFE_TOP }]}>
            {!isPrimeiroAcesso ? (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backIconButton}
                activeOpacity={0.75}
                hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
              >
                <Feather name="arrow-left" size={20} color="#ffffff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.headerSpacer} />
            )}

            <Image
              source={require("../../assets/logoMinimalistaBranca.png")}
              style={styles.topHeaderLogo}
              resizeMode="contain"
            />

            <View style={styles.headerSpacer} />
          </View>

          {/* Conteúdo Rolável sem Container Box */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            {/* Títulos da Página */}
            <View style={styles.titlesBox}>
              <Text style={styles.pageTitle}>
                {isPrimeiroAcesso ? "Primeiro Acesso" : "Criar Nova Senha"}
              </Text>
              <Text style={styles.pageSubtitle}>
                {isPrimeiroAcesso
                  ? "Defina sua senha definitiva para começar a usar o OnePilates no dia a dia."
                  : "Crie uma nova senha segura para acessar sua conta."}
              </Text>
            </View>

            {/* Formulário Flutuante Direto no Fundo */}
            <View style={styles.formContainer}>
              {/* Campo Nova Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Nova senha</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => pass1Ref.current?.focus()}
                  style={[
                    styles.inputFieldBox,
                    focusedInput === "pass1" && styles.inputFieldBoxFocused,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={focusedInput === "pass1" ? "#f77433" : "#71717a"}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    ref={pass1Ref}
                    style={styles.textInput}
                    placeholder="Digite sua nova senha"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!show1}
                    autoCapitalize="none"
                    value={password1}
                    onChangeText={setPassword1}
                    onFocus={() => setFocusedInput("pass1")}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="next"
                    onSubmitEditing={() => pass2Ref.current?.focus()}
                  />
                  <TouchableOpacity
                    onPress={() => setShow1(!show1)}
                    style={styles.eyeToggleBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather
                      name={show1 ? "eye" : "eye-off"}
                      size={18}
                      color={show1 ? "#f77433" : "#71717a"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              {/* Campo Confirmar Nova Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>Confirmar nova senha</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => pass2Ref.current?.focus()}
                  style={[
                    styles.inputFieldBox,
                    focusedInput === "pass2" && styles.inputFieldBoxFocused,
                  ]}
                >
                  <Feather
                    name="lock"
                    size={18}
                    color={focusedInput === "pass2" ? "#f77433" : "#71717a"}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    ref={pass2Ref}
                    style={styles.textInput}
                    placeholder="Repita a nova senha"
                    placeholderTextColor="#52525b"
                    secureTextEntry={!show2}
                    autoCapitalize="none"
                    value={password2}
                    onChangeText={setPassword2}
                    onFocus={() => setFocusedInput("pass2")}
                    onBlur={() => setFocusedInput(null)}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                  />
                  <TouchableOpacity
                    onPress={() => setShow2(!show2)}
                    style={styles.eyeToggleBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Feather
                      name={show2 ? "eye" : "eye-off"}
                      size={18}
                      color={show2 ? "#f77433" : "#71717a"}
                    />
                  </TouchableOpacity>
                </TouchableOpacity>
              </View>

              {/* Requisitos de Senha */}
              <View style={styles.rulesContainer}>
                <Text style={styles.rulesHeading}>A senha deve conter:</Text>
                <View style={styles.rulesList}>
                  <RuleItem ok={rules.length} label="Mínimo de 10 caracteres" />
                  <RuleItem ok={rules.uppercase} label="Uma letra maiúscula" />
                  <RuleItem ok={rules.lowercase} label="Uma letra minúscula" />
                  <RuleItem ok={rules.number} label="Pelo menos um número" />
                  <RuleItem ok={rules.special} label="Um caractere especial (!@#$%^&*)" />
                </View>
              </View>

              {/* Botão de Ação */}
              <PrimaryButton
                title={isPrimeiroAcesso ? "Definir Senha e Entrar" : "Atualizar Senha"}
                onPress={handleSubmit}
                loading={loading}
                style={styles.actionBtnMargin}
              />
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AmbientBackground>
  );
}

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.ruleItemRow}>
      <View
        style={[
          styles.ruleIconCircle,
          ok && styles.ruleIconCircleOk,
        ]}
      >
        <Feather
          name={ok ? "check" : "circle"}
          size={11}
          color={ok ? "#ffffff" : "#64748b"}
        />
      </View>
      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
  },
  mainWrapper: {
    flex: 1,
  },
  topPinnedHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    paddingBottom: 12,
  },
  backIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255, 255, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  topHeaderLogo: {
    width: 125,
    height: 34,
    opacity: 0.95,
  },
  headerSpacer: {
    width: 38,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
    justifyContent: "center",
  },
  titlesBox: {
    alignItems: "center",
    marginBottom: 28,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#cbd5e1",
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputFieldBox: {
    flexDirection: "row",
    alignItems: "center",
    height: 52,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.2,
    borderColor: "rgba(255, 255, 255, 0.11)",
    borderRadius: 14,
    paddingHorizontal: 15,
  },
  inputFieldBoxFocused: {
    borderColor: "#f77433",
    backgroundColor: "rgba(247, 116, 51, 0.07)",
    shadowColor: "#f77433",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fieldIcon: {
    marginRight: 11,
  },
  textInput: {
    flex: 1,
    height: "100%",
    fontSize: 15,
    color: "#ffffff",
    paddingVertical: 0,
  },
  eyeToggleBtn: {
    padding: 6,
    marginLeft: 4,
  },
  rulesContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.07)",
    borderRadius: 14,
    padding: 14,
    marginTop: 6,
    marginBottom: 24,
  },
  rulesHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: "#94a3b8",
    marginBottom: 10,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  rulesList: {
    gap: 8,
  },
  ruleItemRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  ruleIconCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(255, 255, 255, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 9,
  },
  ruleIconCircleOk: {
    backgroundColor: "#f77433",
    borderColor: "#f77433",
  },
  ruleText: {
    fontSize: 13,
    color: "#64748b",
  },
  ruleTextOk: {
    color: "#f1f5f9",
    fontWeight: "500",
  },
  actionBtnMargin: {
    marginBottom: 20,
  },
});
