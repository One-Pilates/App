import React, { ReactNode } from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authStyles as s } from './authStyles';

interface AuthScreenProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  children: ReactNode;
}

// Casca visual compartilhada pelas telas do fluxo de autenticação (fundo + card do login).
export default function AuthScreen({ title, subtitle, showBack = true, children }: AuthScreenProps) {
  const router = useRouter();

  return (
    <ImageBackground
      source={require('../../assets/backgroundLogin.jpeg')}
      style={s.backgroundImage}
      resizeMode="cover"
    >
      <View style={s.overlay} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={s.container}
      >
        <ScrollView
          contentContainerStyle={s.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={s.card}>
            {showBack && (
              <TouchableOpacity style={s.backBtn} onPress={() => router.back()}>
                <Feather name="arrow-left" size={22} color="#374151" />
              </TouchableOpacity>
            )}

            <View style={s.header}>
              <Image
                source={require('../../assets/logoOriginal.png')}
                style={s.logoImage}
                resizeMode="contain"
              />
            </View>

            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}

            {children}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
}
