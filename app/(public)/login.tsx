import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  Image,
  ScrollView,
  Dimensions,
  Easing,
  Modal,
  TouchableWithoutFeedback,
  StatusBar as RNStatusBar,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StatusBar } from "expo-status-bar";
import { useAuth } from "@/contexts/AuthContext";
import AmbientBackground from "@/components/AmbientBackground";
import PrimaryButton from "@/components/PrimaryButton";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const STORAGE_KEY_EMAIL = "@onepilates_saved_email";
const STORAGE_KEY_REMEMBER = "@onepilates_remember_password";

// Altura segura para a câmera frontal (evita furos na tela como S24+, Pixel, etc.)
const ANDROID_STATUS_BAR = RNStatusBar.currentHeight || 40;
const HEADER_SAFE_TOP = Platform.OS === "ios" ? 58 : ANDROID_STATUS_BAR + 22;

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  // Modo da tela: 'welcome' (1ª tela) ou 'login' (2ª tela)
  const [screenMode, setScreenMode] = useState<"welcome" | "login">("welcome");

  // Modal de ajuda de acesso bonito
  const [isHelpModalVisible, setIsHelpModalVisible] = useState(false);

  // Formulário
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberPassword, setRememberPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState<"email" | "password" | null>(null);

  // Refs diretos para foco garantido ao tocar no container do input
  const emailInputRef = useRef<TextInput>(null);
  const passwordInputRef = useRef<TextInput>(null);

  // Transições entre telas
  const welcomeFade = useRef(new Animated.Value(1)).current;
  const welcomeSlide = useRef(new Animated.Value(0)).current;

  const loginFade = useRef(new Animated.Value(0)).current;
  const loginSlide = useRef(new Animated.Value(40)).current;

  // Animação profissional da logo na 1ª tela (APENAS ENTRADA INICIAL)
  const logoEntryOpacity = useRef(new Animated.Value(0)).current;
  const logoEntryScale = useRef(new Animated.Value(0.92)).current;
  const logoEntryTranslateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    // Animação única de entrada suave da logo ao iniciar
    Animated.parallel([
      Animated.timing(logoEntryOpacity, {
        toValue: 1,
        duration: 800,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(logoEntryScale, {
        toValue: 1,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
      Animated.spring(logoEntryTranslateY, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Carrega credenciais salvas se "Lembrar senha" estiver ativo
    async function loadSavedCredentials() {
      try {
        const savedRemember = await AsyncStorage.getItem(STORAGE_KEY_REMEMBER);
        if (savedRemember === "true") {
          setRememberPassword(true);
          const savedEmail = await AsyncStorage.getItem(STORAGE_KEY_EMAIL);
          if (savedEmail) {
            setEmail(savedEmail);
          }
        }
      } catch (err) {
        console.warn("Erro ao carregar dados salvos:", err);
      }
    }
    loadSavedCredentials();
  }, [logoEntryOpacity, logoEntryScale, logoEntryTranslateY]);

  // Transição para a tela de Login
  const goToLogin = () => {
    Animated.parallel([
      Animated.timing(welcomeFade, {
        toValue: 0,
        duration: 280,
        useNativeDriver: true,
      }),
      Animated.timing(welcomeSlide, {
        toValue: -SCREEN_WIDTH * 0.25,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setScreenMode("login");
      loginSlide.setValue(40);
      Animated.parallel([
        Animated.timing(loginFade, {
          toValue: 1,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.spring(loginSlide, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  // Voltar para a tela de Boas-vindas
  const goToWelcome = () => {
    Animated.parallel([
      Animated.timing(loginFade, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(loginSlide, {
        toValue: 40,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setScreenMode("welcome");
      welcomeSlide.setValue(-SCREEN_WIDTH * 0.2);
      Animated.parallel([
        Animated.timing(welcomeFade, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(welcomeSlide, {
          toValue: 0,
          tension: 70,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const handleLogin = async () => {
    if (!email.trim()) {
      Alert.alert("Atenção", "Por favor, digite seu e-mail.");
      return;
    }

    if (!password) {
      Alert.alert("Atenção", "Por favor, digite sua senha.");
      return;
    }

    setIsLoading(true);

    try {
      if (rememberPassword) {
        await AsyncStorage.setItem(STORAGE_KEY_REMEMBER, "true");
        await AsyncStorage.setItem(STORAGE_KEY_EMAIL, email.trim());
      } else {
        await AsyncStorage.removeItem(STORAGE_KEY_REMEMBER);
        await AsyncStorage.removeItem(STORAGE_KEY_EMAIL);
      }
    } catch (err) {
      console.warn("Falha ao salvar preferência:", err);
    }

    const result = await login(email.trim(), password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert(
        "Erro ao entrar",
        result.message || "E-mail ou senha incorretos. Verifique suas credenciais."
      );
      return;
    }

    if (result.primeiroAcesso) {
      router.replace({
        pathname: "/(public)/nova-senha",
        params: { email: email.trim(), primeiroAcesso: "1" },
      });
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
          {/* ============================================================== */}
          {/* TELA 1: BEM-VINDO (WELCOME SCREEN)                             */}
          {/* ============================================================== */}
          {screenMode === "welcome" && (
            <Animated.View
              style={[
                styles.welcomeContainer,
                {
                  opacity: welcomeFade,
                  transform: [{ translateX: welcomeSlide }],
                },
              ]}
            >
              {/* Hero / Logo Branca com Animação Única de Entrada (Sem bola atrás) */}
              <View style={styles.welcomeHeroArea}>
                <Animated.View
                  style={[
                    styles.logoContainer,
                    {
                      opacity: logoEntryOpacity,
                      transform: [
                        { scale: logoEntryScale },
                        { translateY: logoEntryTranslateY },
                      ],
                    },
                  ]}
                >
                  <Image
                    source={require("../../assets/logoBranca.png")}
                    style={styles.welcomeBrandLogo}
                    resizeMode="contain"
                  />
                </Animated.View>
              </View>

              {/* Conteúdo Inferior e Botões */}
              <View style={styles.welcomeFooterArea}>
                <Text style={styles.welcomeTitle}>
                  Bem-vindo ao{"\n"}
                  <Text style={styles.welcomeTitleHighlight}>OnePilates</Text>
                </Text>

                {/* Slogan e Descrição Personalizados */}
                <View style={styles.taglineContainer}>
                  <Text style={styles.welcomeSlogan}>"Porque seu corpo é único."</Text>
                  <Text style={styles.welcomeSubtitle}>
                    Seu parceiro no agendamento e controle de aulas do estúdio.
                  </Text>
                </View>

                {/* Indicadores de Página */}
                <View style={styles.paginationRow}>
                  <View style={styles.paginationPillActive} />
                  <View style={styles.paginationDot} />
                  <View style={styles.paginationDot} />
                </View>

                {/* Botão Primário Profissional */}
                <PrimaryButton
                  title="Já tenho uma conta"
                  onPress={goToLogin}
                  style={styles.actionBtnMargin}
                />

                {/* Botão Secundário / Primeiro Acesso */}
                <TouchableOpacity
                  activeOpacity={0.7}
                  onPress={() => setIsHelpModalVisible(true)}
                  style={styles.ghostSecondaryButton}
                >
                  <Text style={styles.ghostSecondaryText}>
                    Como funciona o acesso?
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          )}

          {/* ============================================================== */}
          {/* TELA 2: LOGIN (SEM CONTAINER BOX - DESIGN FLUTUANTE)           */}
          {/* ============================================================== */}
          {screenMode === "login" && (
            <Animated.View
              style={[
                styles.loginContainer,
                {
                  opacity: loginFade,
                  transform: [{ translateY: loginSlide }],
                },
              ]}
            >
              {/* TOPO FIXO E POSICIONADO COM FOLGA DA CÂMERA (S24+ / IPHONE / PIXEL) */}
              <View style={[styles.topPinnedHeader, { paddingTop: HEADER_SAFE_TOP }]}>
                <TouchableOpacity
                  onPress={goToWelcome}
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

                {/* Espaçador para simetria perfeita da logo no centro */}
                <View style={styles.headerSpacer} />
              </View>

              {/* Conteúdo do Formulário Rolável com Toque 100% Livre */}
              <ScrollView
                contentContainerStyle={styles.loginScrollContent}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
              >
                {/* Títulos do Formulário */}
                <View style={styles.loginTitlesBox}>
                  <Text style={styles.loginTitle}>Bem-vindo de volta!</Text>
                  <Text style={styles.loginSubtitle}>
                    Entre com seus dados para continuar no OnePilates
                  </Text>
                </View>

                {/* Campos Diretamente no Fundo Escuro (Sem Container Box) */}
                <View style={styles.formContainer}>
                  {/* Campo E-mail com clique na caixa inteira */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>E-mail</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => emailInputRef.current?.focus()}
                      style={[
                        styles.inputFieldBox,
                        focusedInput === "email" && styles.inputFieldBoxFocused,
                      ]}
                    >
                      <Feather
                        name="mail"
                        size={18}
                        color={focusedInput === "email" ? "#f77433" : "#71717a"}
                        style={styles.fieldIcon}
                      />
                      <TextInput
                        ref={emailInputRef}
                        style={styles.textInput}
                        placeholder="Digite seu e-mail"
                        placeholderTextColor="#52525b"
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        value={email}
                        onChangeText={setEmail}
                        onFocus={() => setFocusedInput("email")}
                        onBlur={() => setFocusedInput(null)}
                        returnKeyType="next"
                        onSubmitEditing={() => passwordInputRef.current?.focus()}
                      />
                    </TouchableOpacity>
                  </View>

                  {/* Campo Senha com clique na caixa inteira */}
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Senha</Text>
                    <TouchableOpacity
                      activeOpacity={1}
                      onPress={() => passwordInputRef.current?.focus()}
                      style={[
                        styles.inputFieldBox,
                        focusedInput === "password" && styles.inputFieldBoxFocused,
                      ]}
                    >
                      <Feather
                        name="lock"
                        size={18}
                        color={focusedInput === "password" ? "#f77433" : "#71717a"}
                        style={styles.fieldIcon}
                      />
                      <TextInput
                        ref={passwordInputRef}
                        style={styles.textInput}
                        placeholder="Digite sua senha"
                        placeholderTextColor="#52525b"
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                        value={password}
                        onChangeText={setPassword}
                        onFocus={() => setFocusedInput("password")}
                        onBlur={() => setFocusedInput(null)}
                        returnKeyType="done"
                        onSubmitEditing={handleLogin}
                      />
                      <TouchableOpacity
                        onPress={() => setShowPassword(!showPassword)}
                        style={styles.eyeToggleBtn}
                        activeOpacity={0.7}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Feather
                          name={showPassword ? "eye" : "eye-off"}
                          size={18}
                          color={showPassword ? "#f77433" : "#71717a"}
                        />
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>

                  {/* Lembrar Senha e Esqueceu a Senha */}
                  <View style={styles.optionsRow}>
                    <TouchableOpacity
                      style={styles.rememberRow}
                      onPress={() => setRememberPassword(!rememberPassword)}
                      activeOpacity={0.8}
                    >
                      <View
                        style={[
                          styles.checkboxBox,
                          rememberPassword && styles.checkboxBoxChecked,
                        ]}
                      >
                        {rememberPassword && (
                          <Feather name="check" size={12} color="#ffffff" />
                        )}
                      </View>
                      <Text style={styles.rememberLabel}>Lembrar senha</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => router.push("/(public)/esqueci-senha")}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.forgotPasswordText}>
                        Esqueceu a senha?
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Botão de Entrar Profissional */}
                  <PrimaryButton
                    title="Entrar"
                    onPress={handleLogin}
                    loading={isLoading}
                    style={styles.actionBtnMargin}
                  />

                  {/* Link: Ainda não tem acesso? */}
                  <View style={styles.bottomAccessSection}>
                    <Text style={styles.accessPromptText}>
                      Ainda não tem acesso?{" "}
                      <Text
                        style={styles.accessPromptHighlight}
                        onPress={() => setIsHelpModalVisible(true)}
                      >
                        Saiba como funciona
                      </Text>
                    </Text>
                  </View>
                </View>
              </ScrollView>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>

      {/* ============================================================== */}
      {/* BOTTOM SHEET DE ACESSO DA EQUIPE (DESIGN NATIVO PROFISSIONAL)  */}
      {/* ============================================================== */}
      <Modal
        visible={isHelpModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsHelpModalVisible(false)}
      >
        <View style={styles.sheetOverlay}>
          <TouchableWithoutFeedback onPress={() => setIsHelpModalVisible(false)}>
            <View style={styles.sheetBackdropTap} />
          </TouchableWithoutFeedback>

          <View style={styles.sheetCard}>
            {/* Indicador de arrasto (Grabber Handle) */}
            <View style={styles.sheetHandle} />

            {/* Cabeçalho */}
            <View style={styles.sheetHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.sheetTitle}>Acesso da Equipe</Text>
                <Text style={styles.sheetSubtitle}>
                  Contas criadas diretamente pela gestão do estúdio
                </Text>
              </View>

              <TouchableOpacity
                onPress={() => setIsHelpModalVisible(false)}
                style={styles.sheetCloseBtn}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                activeOpacity={0.7}
              >
                <Feather name="x" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>

            {/* Informações de Acesso da Equipe */}
            <View style={styles.roleCardList}>
              <View style={styles.roleCardItem}>
                <View style={styles.roleIconBadge}>
                  <Feather name="user-check" size={18} color="#f77433" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleName}>Professores(as)</Text>
                  <Text style={styles.roleDescription}>
                    Cadastrados no sistema pela secretaria do estúdio
                  </Text>
                </View>
              </View>

              <View style={styles.roleCardItem}>
                <View style={styles.roleIconBadge}>
                  <Feather name="shield" size={18} color="#f77433" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleName}>Secretaria</Text>
                  <Text style={styles.roleDescription}>
                    Cadastrada no sistema pela administração geral
                  </Text>
                </View>
              </View>

              <View style={styles.roleCardItem}>
                <View style={styles.roleIconBadge}>
                  <Feather name="key" size={18} color="#f77433" />
                </View>
                <View style={styles.roleTextContainer}>
                  <Text style={styles.roleName}>Senha temporária</Text>
                  <Text style={styles.roleDescription}>
                    Enviada para seu primeiro login. Ao entrar, você definirá sua senha definitiva.
                  </Text>
                </View>
              </View>
            </View>

            {/* Botão Fechar */}
            <TouchableOpacity
              onPress={() => setIsHelpModalVisible(false)}
              style={styles.sheetConfirmButton}
              activeOpacity={0.88}
            >
              <Text style={styles.sheetConfirmButtonText}>Entendido</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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

  /* ==================== TELA 1: WELCOME ==================== */
  welcomeContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 26,
    paddingTop: Platform.OS === "ios" ? 64 : 44,
    paddingBottom: Platform.OS === "ios" ? 44 : 30,
  },
  welcomeHeroArea: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  logoContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  welcomeBrandLogo: {
    width: 280,
    height: 110,
  },
  welcomeFooterArea: {
    paddingBottom: 6,
  },
  welcomeTitle: {
    fontSize: 32,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.4,
    lineHeight: 38,
    marginBottom: 10,
  },
  welcomeTitleHighlight: {
    color: "#f77433",
  },
  taglineContainer: {
    marginBottom: 24,
  },
  welcomeSlogan: {
    fontSize: 15,
    fontWeight: "600",
    color: "#f77433",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  welcomeSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    lineHeight: 21,
    fontWeight: "400",
  },
  paginationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 24,
  },
  paginationPillActive: {
    width: 26,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#f77433",
    marginRight: 6,
  },
  paginationDot: {
    width: 5,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#27272a",
    marginRight: 6,
  },
  actionBtnMargin: {
    marginBottom: 14,
  },
  ghostSecondaryButton: {
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  ghostSecondaryText: {
    color: "#94a3b8",
    fontSize: 13,
    fontWeight: "500",
  },

  /* ==================== TELA 2: LOGIN ==================== */
  loginContainer: {
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
  loginScrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
    justifyContent: "center",
  },
  loginTitlesBox: {
    alignItems: "center",
    marginBottom: 30,
  },
  loginTitle: {
    fontSize: 26,
    fontWeight: "700",
    color: "#ffffff",
    letterSpacing: -0.3,
    marginBottom: 6,
    textAlign: "center",
  },
  loginSubtitle: {
    fontSize: 14,
    color: "#94a3b8",
    textAlign: "center",
    lineHeight: 20,
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
  optionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 2,
    marginBottom: 24,
  },
  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkboxBox: {
    width: 18,
    height: 18,
    borderRadius: 5,
    borderWidth: 1.4,
    borderColor: "#475569",
    backgroundColor: "rgba(255, 255, 255, 0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  checkboxBoxChecked: {
    backgroundColor: "#f77433",
    borderColor: "#f77433",
  },
  rememberLabel: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#f77433",
    fontWeight: "600",
  },
  bottomAccessSection: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
  },
  accessPromptText: {
    fontSize: 13,
    color: "#64748b",
    textAlign: "center",
  },
  accessPromptHighlight: {
    color: "#f77433",
    fontWeight: "600",
  },

  /* ==================== BOTTOM SHEET DE ACESSO DA EQUIPE ==================== */
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.55)",
    justifyContent: "flex-end",
  },
  sheetBackdropTap: {
    ...StyleSheet.absoluteFill,
  },
  sheetCard: {
    width: "100%",
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 10,
    paddingBottom: Platform.OS === "ios" ? 38 : 26,
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 16,
  },
  sheetHandle: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#e2e8f0",
    alignSelf: "center",
    marginBottom: 16,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  sheetTitle: {
    fontSize: 21,
    fontWeight: "700",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  sheetSubtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  sheetCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
  },
  roleCardList: {
    gap: 10,
    marginBottom: 22,
  },
  roleCardItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  roleIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#fed7aa",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  roleTextContainer: {
    flex: 1,
  },
  roleName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#0f172a",
    marginBottom: 2,
  },
  roleDescription: {
    fontSize: 12,
    color: "#64748b",
    lineHeight: 16,
  },
  sheetConfirmButton: {
    width: "100%",
    height: 48,
    borderRadius: 14,
    backgroundColor: "#f77433",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f77433",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  sheetConfirmButtonText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
