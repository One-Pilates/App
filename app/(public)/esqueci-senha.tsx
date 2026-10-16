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
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import api from "@/services/api";
import AmbientBackground from "@/components/AmbientBackground";
import PrimaryButton from "@/components/PrimaryButton";

const ANDROID_STATUS_BAR = RNStatusBar.currentHeight || 40;
const HEADER_SAFE_TOP = Platform.OS === "ios" ? 58 : ANDROID_STATUS_BAR + 22;

export default function EsqueciSenha() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const emailInputRef = useRef<TextInput>(null);

  const handleEnviar = async () => {
    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      Alert.alert("Atenção", "Por favor, insira seu e-mail cadastrado.");
      return;
    }

    setLoading(true);
    try {
      await api.post("auth/criarCodigoVerificacao", { email: emailTrimmed });
      router.push({
        pathname: "/(public)/codigo-verificacao",
        params: { email: emailTrimmed },
      });
    } catch (error: any) {
      console.error("Erro ao enviar código:", error);
      Alert.alert(
        "Erro",
        error?.response?.data?.message ||
          "Não foi possível enviar o código. Verifique se o e-mail está correto e tente novamente."
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
          {/* Topo Elevado Seguro da Câmera: Botão Voltar + Logo Minimalista Centralizada */}
          <View style={[styles.topPinnedHeader, { paddingTop: HEADER_SAFE_TOP }]}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backIconButton}
              activeOpacity={0.75}
              hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            >
              <Feather name="arrow-left" size={20} color="#ffffff" />
            </TouchableOpacity>

            <Image
              source={require("../../assets/logoMinimalistaBranca.png")}
              style={styles.topHeaderLogo}
              resizeMode="contain"
            />

            <View style={styles.headerSpacer} />
          </View>

          {/* Conteúdo Central */}
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
          >
            <View style={styles.titlesBox}>
              <Text style={styles.pageTitle}>Esqueceu a senha?</Text>
              <Text style={styles.pageSubtitle}>
                Informe seu e-mail cadastrado para receber o código de
                recuperação de acesso.
              </Text>
            </View>

            {/* Formulário Flutuante Direto no Fundo */}
            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>E-mail cadastrado</Text>
                <TouchableOpacity
                  activeOpacity={1}
                  onPress={() => emailInputRef.current?.focus()}
                  style={[
                    styles.inputFieldBox,
                    isFocused && styles.inputFieldBoxFocused,
                  ]}
                >
                  <Feather
                    name="mail"
                    size={18}
                    color={isFocused ? "#f77433" : "#71717a"}
                    style={styles.fieldIcon}
                  />
                  <TextInput
                    ref={emailInputRef}
                    style={styles.textInput}
                    placeholder="seu@email.com"
                    placeholderTextColor="#52525b"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    returnKeyType="send"
                    onSubmitEditing={handleEnviar}
                  />
                </TouchableOpacity>
              </View>

              {/* Botão de Enviar Código */}
              <PrimaryButton
                title="Enviar código"
                onPress={handleEnviar}
                loading={loading}
                style={styles.actionBtnMargin}
              />

              {/* Link Voltar ao Login */}
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backToLoginButton}
                activeOpacity={0.75}
              >
                <Text style={styles.backToLoginText}>
                  Lembrou a senha?{" "}
                  <Text style={styles.backToLoginHighlight}>Voltar ao login</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </AmbientBackground>
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
    paddingTop: 24,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    justifyContent: "center",
  },
  titlesBox: {
    alignItems: "center",
    marginBottom: 32,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
    marginBottom: 8,
    textAlign: "center",
  },
  pageSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 21,
    paddingHorizontal: 12,
  },
  formContainer: {
    width: "100%",
  },
  inputGroup: {
    marginBottom: 20,
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
  actionBtnMargin: {
    marginBottom: 20,
  },
  backToLoginButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  backToLoginText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  backToLoginHighlight: {
    color: "#f77433",
    fontWeight: "600",
  },
});
