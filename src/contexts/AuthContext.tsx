import React, {
  createContext,
  useState,
  useEffect,
  useContext,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Alert } from "react-native";
import api from "../services/api";
export interface Endereco {
  rua?: string;
  numero?: string;
  bairro?: string;
  cidade?: string;
  estado?: string;
  uf?: string;
  cep?: string;
}
export interface Especialidade {
  id: number;
  nome: string;
}
export interface User {
  id: number;
  nome: string;
  email: string;
  role: string;
  cargo: string;
  cpf: string | null;
  telefone: string | null;
  dataNascimento: string | null;
  idade?: string | null;
  endereco: Endereco | null;
  especialidades: Especialidade[] | null;
  foto: string | null;
  observacoes: string | null;
  notificacaoAtiva: boolean;
  primeiroAcesso: boolean;
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
  setUser: (user: User | null) => void;
  updateUser: (user: User) => Promise<void>;
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

      return { success: false, message: "Erro ao fazer login simulado." };
    } finally {
      setLoading(false);
    }
  }

  async function updateUser(updated: User) {
    setUser(updated);

    await AsyncStorage.setItem("user", JSON.stringify(updated));
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
      value={{
        signed: !!user,
        user,
        setUser,
        updateUser,
        login,
        logout,
        loading,
      }}
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
