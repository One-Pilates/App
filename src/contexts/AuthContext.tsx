import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
// import { router } from 'expo-router';
import api from "../services/api";

export interface User {
  id: number;
  nome: string;
  email: string;
  tipo: string;
  status: boolean;
}

interface LoginResult {
  success: boolean;
  message?: string;
}

interface AuthContextData {
  signed: boolean;
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<LoginResult>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStorageData() {
      try {
        const storedToken = await AsyncStorage.getItem("token");
        const storedUser = await AsyncStorage.getItem("user");
        if (storedToken && storedUser) {
          setUser(JSON.parse(storedUser) as User);
        }
      } catch (error) {
        console.error("Falha ao carregar dados do armazenamento", error);
      } finally {
        setLoading(false);
      }
    }
    loadStorageData();
  }, []);

  async function login(email: string, senha: string): Promise<LoginResult> {
    setLoading(true);
    try {
      console.log("Iniciando login com email e senha:", email, senha);
      const response = await api.post("/auth/login", { email, senha });
      const data = response.data;

      console.log("Resposta do login:", data);
      const tokenCandidate =
        data?.token ||
        data?.accessToken ||
        data?.jwt ||
        data?.bearerToken ||
        data?.funcionario?.token ||
        "";

      const tokenRaw = tokenCandidate.toString().trim();
      const token = tokenRaw.toLowerCase().startsWith("bearer ")
        ? tokenRaw.substring(7).trim()
        : tokenRaw;

      if (!token) {
        console.error("Token não encontrado na resposta do login:", data);
        return {
          success: false,
          message: "Token não encontrado na resposta do login.",
        };
      }
      console.log("Token obtido:", token);
      console.log("funcionario:", data?.funcionario);
      const userData: User = data?.funcionario;

      await AsyncStorage.setItem("token", JSON.stringify(token));
      await AsyncStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);

      return { success: true };
    } catch (error: any) {
      console.error("Erro no login:", error);
      console.log("STATUS:", error.response?.status);
      console.log("DATA:", error.response?.data);
      console.log("HEADERS:", error.response?.headers);
      return { success: false, message: "Erro ao fazer login." };
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    try {
      await AsyncStorage.removeItem("token");
      await AsyncStorage.removeItem("user");
      setUser(null);
      
    } catch (error) {
      console.error("Erro no logout:", error);
      Alert.alert("Erro", "Não foi possível fazer logout.");
    }
  }

  return (
    <AuthContext.Provider
      value={{ signed: !!user, user, login, logout, loading }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }
  return context;
}
