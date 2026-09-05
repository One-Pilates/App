import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Animated,
  Image,
  ImageBackground,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function LoginScreen() {
  const { login } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Estados e valores animados da Splash Screen
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const splashOpacity = useRef(new Animated.Value(1)).current;

  // Animações do card de login
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    // 1. Mantém a splash por 1.5s
    const timer = setTimeout(() => {
      // 2. Faz a splash desaparecer (fade out)
      Animated.timing(splashOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start(() => {
        // 3. Remove a splash da tela e começa a animação do login
        setIsSplashVisible(false);
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.spring(slideAnim, {
            toValue: 0,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
          }),
        ]).start();
      });
    }, 1500);

    return () => clearTimeout(timer);
  }, []);

  const handleLogin = async () => {
    setIsLoading(true);
    // if (!validacaoEmail(email)) {
    //   toast.error("Por favor, insira um email válido.");
    //   return;
    // } -- adicionar pasta utils

    if (!password) {
      console.warn("Senha não pode ser vazia.");
      return;
    }
    const result = await login(email, password);
    setIsLoading(false);

    if (!result.success) {
      Alert.alert(
        "Erro ao entrar",
        result.message || "Verifique suas credenciais.",
      );
    }
  };

  return (
    <ImageBackground
      source={require("../../assets/backgroundLogin.jpeg")}
      style={styles.backgroundImage}
      resizeMode="cover"
    >
      <View style={styles.overlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.inner}>
            <Animated.View
              style={[
                styles.card,
                { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Logo do Frontend (sem a frase de baixo) */}
              <View style={styles.header}>
                <Image
                  source={require("../../assets/logoOriginal.png")}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>

              {/* Campo E-mail */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>E-mail</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="mail"
                    size={20}
                    color="#f77433"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="seu@email.com"
                    placeholderTextColor="#aaa"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                    value={email}
                    onChangeText={setEmail}
                  />
                </View>
              </View>

              {/* Campo Senha */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Senha</Text>
                <View style={styles.inputWrapper}>
                  <Feather
                    name="lock"
                    size={20}
                    color="#f77433"
                    style={styles.inputIcon}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Sua senha"
                    placeholderTextColor="#aaa"
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeBtn}
                  >
                    <Feather
                      name={showPassword ? "eye-off" : "eye"}
                      size={20}
                      color="#757575"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Esqueceu a senha */}
              <TouchableOpacity
                style={styles.forgotBtn}
                onPress={() => router.push("/(public)/esqueci-senha")}
              >
                <Text style={styles.forgotText}>Esqueceu a senha?</Text>
              </TouchableOpacity>

              {/* Botão Entrar */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleLogin}
                disabled={isLoading}
                activeOpacity={0.85}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>Entrar</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.contactText}>
                Ainda não tem acesso? Entre em contato com seu studio.
              </Text>
            </Animated.View>
          </View>
        </TouchableWithoutFeedback>

        {/* Splash Screen (Loading Laranja) */}
        {isSplashVisible && (
          <Animated.View
            style={[styles.splashContainer, { opacity: splashOpacity }]}
          >
            <Image
              source={require("../../assets/logoBranca.png")}
              style={styles.splashLogo}
              resizeMode="contain"
            />
          </Animated.View>
        )}
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  backgroundImage: {
    flex: 1,
    width: "100%",
    height: "100%",
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Overlay escuro para a imagem não brigar com o card
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "rgba(255, 255, 255, 0.90)", // Transparência para ver o fundo levemente (Glassmorphism)
    borderRadius: 24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.4)", // Borda sutil para dar acabamento ao vidro
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoImage: {
    width: 220,
    height: 80,
  },
  inputGroup: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 6,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  eyeBtn: {
    padding: 4,
  },
  forgotBtn: {
    alignSelf: "flex-end",
    marginBottom: 22,
    marginTop: 2,
  },
  forgotText: {
    color: "#f77433", // laranja
    fontSize: 13,
    fontWeight: "600",
  },
  button: {
    backgroundColor: "#f77433", // laranja
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f77433",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  contactText: {
    textAlign: "center",
    color: "#9ca3af",
    fontSize: 12,
    marginTop: 20,
    lineHeight: 18,
  },
  splashContainer: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#f77433", // Laranja que o cliente pediu!
    justifyContent: "center",
    alignItems: "center",
    zIndex: 999, // Fica por cima de tudo
  },
  splashLogo: {
    width: 280,
    height: 120,
  },
});
