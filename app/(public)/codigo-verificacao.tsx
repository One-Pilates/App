import React, { useRef, useState } from "react";
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
import AmbientBackground from "@/components/AmbientBackground";
import PrimaryButton from "@/components/PrimaryButton";

const ANDROID_STATUS_BAR = RNStatusBar.currentHeight || 40;
const HEADER_SAFE_TOP = Platform.OS === "ios" ? 58 : ANDROID_STATUS_BAR + 22;

export default function CodigoVerificacao() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const [codigo, setCodigo] = useState(["", "", "", "", ""]);
  const [confirming, setConfirming] = useState(false);
  const [resending, setResending] = useState(false);
  const inputs = useRef<(React.ComponentRef<typeof TextInput> | null)[]>([]);

  const handleChange = (index: number, value: string) => {
    if (!/^[A-Za-z0-9]?$/.test(value)) return;
    const novo = [...codigo];
    novo[index] = value.toUpperCase();
    setCodigo(novo);
    if (value && index < 4) inputs.current[index + 1]?.focus();
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === "Backspace" && !codigo[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const confirmarCodigo = async () => {
    const codigoFinal = codigo.join("");
    if (codigoFinal.length < 5) {
      Alert.alert("Atenção", "Por favor, insira o código de 5 dígitos completo.");
      return;
    }
    setConfirming(true);
    try {
      await api.post("auth/validarCodigo", { email, codigo: codigoFinal });
      router.push({ pathname: "/(public)/nova-senha", params: { email } });
    } catch (error) {
      console.error("Erro ao validar código:", error);
      Alert.alert("Erro", "Código incorreto ou expirado. Tente novamente.");
    } finally {
      setConfirming(false);
    }
  };

  const reenviarCodigo = async () => {
    if (!email) {
      Alert.alert("Erro", "E-mail não encontrado. Por favor, reinicie o processo.");
      return;
    }
    setResending(true);
    try {
      await api.post("auth/criarCodigoVerificacao", { email });
      setCodigo(["", "", "", "", ""]);
      inputs.current[0]?.focus();
      Alert.alert("Sucesso", "Código reenviado! Verifique sua caixa de entrada.");
    } catch (error) {
      console.error("Erro ao reenviar código:", error);
      Alert.alert("Erro", "Não foi possível reenviar o código. Tente novamente.");
    } finally {
      setResending(false);
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
          {/* Topo Elevado Seguro para Câmera */}
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
              <Text style={styles.pageTitle}>Código de verificação</Text>
              <Text style={styles.pageSubtitle}>
                Enviamos um código de segurança para o e-mail:{"\n"}
                <Text style={styles.emailHighlight}>{email || "seu e-mail"}</Text>
              </Text>
            </View>

            {/* Inputs de Código */}
            <View style={styles.formContainer}>
              <View style={styles.codeRow}>
                {codigo.map((valor, index) => (
                  <View
                    key={index}
                    style={[
                      styles.codeBoxWrapper,
                      !!valor && styles.codeBoxWrapperFilled,
                    ]}
                  >
                    <TextInput
                      ref={(el) => {
                        inputs.current[index] = el;
                      }}
                      style={styles.codeBox}
                      value={valor}
                      maxLength={1}
                      autoCapitalize="characters"
                      keyboardType="default"
                      placeholderTextColor="#52525b"
                      onChangeText={(text) => handleChange(index, text)}
                      onKeyPress={({ nativeEvent }) =>
                        handleKeyPress(index, nativeEvent.key)
                      }
                    />
                  </View>
                ))}
              </View>

              {/* Botão de Confirmação */}
              <PrimaryButton
                title="Confirmar código"
                onPress={confirmarCodigo}
                loading={confirming}
                style={styles.actionBtnMargin}
              />

              {/* Reenviar Código */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={reenviarCodigo}
                disabled={resending}
                activeOpacity={0.75}
              >
                <Text style={styles.resendText}>
                  Não recebeu?{" "}
                  <Text style={styles.resendTextHighlight}>
                    {resending ? "Reenviando..." : "Reenviar código"}
                  </Text>
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
    paddingBottom: Platform.OS === "ios" ? 40 : 28,
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
  emailHighlight: {
    color: "#f77433",
    fontWeight: "600",
  },
  formContainer: {
    width: "100%",
  },
  codeRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
    marginTop: 8,
  },
  codeBoxWrapper: {
    width: 54,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1.4,
    borderColor: "rgba(255, 255, 255, 0.12)",
    justifyContent: "center",
    alignItems: "center",
  },
  codeBoxWrapperFilled: {
    borderColor: "#f77433",
    backgroundColor: "rgba(247, 116, 51, 0.08)",
  },
  codeBox: {
    width: "100%",
    height: "100%",
    textAlign: "center",
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
  },
  actionBtnMargin: {
    marginBottom: 20,
  },
  resendButton: {
    alignItems: "center",
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 13,
    color: "#94a3b8",
  },
  resendTextHighlight: {
    color: "#f77433",
    fontWeight: "600",
  },
});
