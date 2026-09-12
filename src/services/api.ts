import axios, { InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const api = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

function normalizeToken(rawToken: string | null | undefined): string {
  if (!rawToken) return '';
  const semAspas = rawToken.trim().replace(/^"|"$/g, '');
  if (!semAspas) return '';
  return semAspas.toLowerCase().startsWith('bearer ') ? semAspas.substring(7).trim() : semAspas;
}

function isAuthenticationFailure(error: AxiosError): boolean {
  const status = error?.response?.status;
  const data = error?.response?.data as any;
  const msg = typeof data === 'string' ? data : data?.message || data?.erro || '';
  if (status === 401) return true;
  if (status === 400 && /authentication failed|unauthorized|token/i.test(String(msg))) return true;
  return false;
}

async function clearSession() {
  try {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
  } catch (e) {
    console.warn('Falha ao limpar AsyncStorage:', e);
  }
}

api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const storedToken = await AsyncStorage.getItem('token');
  const token = normalizeToken(storedToken);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response: AxiosResponse) => response,
  async (error: AxiosError) => {
    if (isAuthenticationFailure(error)) {
      await clearSession();
    }
    return Promise.reject(error);
  },
);

export default api;
