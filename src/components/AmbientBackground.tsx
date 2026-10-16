import React, { useEffect, useRef } from "react";
import { StyleSheet, View, Animated, Easing, Dimensions } from "react-native";
import Svg, { Defs, RadialGradient, Stop, Rect } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface AmbientBackgroundProps {
  children?: React.ReactNode;
}

export default function AmbientBackground({ children }: AmbientBackgroundProps) {
  // Animação da aura principal (topo central)
  const pulseMain = useRef(new Animated.Value(0)).current;
  // Animação da aura secundária (lateral / profundidade)
  const pulseSecondary = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Loop de respiração suave da aura principal (~4.5s)
    const mainLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseMain, {
          toValue: 1,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseMain, {
          toValue: 0,
          duration: 4500,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    // Loop da aura secundária (~5.8s)
    const secondaryLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseSecondary, {
          toValue: 1,
          duration: 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(pulseSecondary, {
          toValue: 0,
          duration: 5800,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );

    mainLoop.start();
    secondaryLoop.start();

    return () => {
      mainLoop.stop();
      secondaryLoop.stop();
    };
  }, [pulseMain, pulseSecondary]);

  // Interpolações de escala, opacidade e translação suave da aura principal
  const mainScale = pulseMain.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  const mainOpacity = pulseMain.interpolate({
    inputRange: [0, 1],
    outputRange: [0.38, 0.62],
  });

  const mainTranslateY = pulseMain.interpolate({
    inputRange: [0, 1],
    outputRange: [-12, 14],
  });

  // Interpolações da aura secundária
  const secScale = pulseSecondary.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.25],
  });

  const secOpacity = pulseSecondary.interpolate({
    inputRange: [0, 1],
    outputRange: [0.22, 0.45],
  });

  const secTranslateX = pulseSecondary.interpolate({
    inputRange: [0, 1],
    outputRange: [-10, 12],
  });

  return (
    <View style={styles.container}>
      {/* Camada de fundo decorativa com pointerEvents="none" explícito em cada elemento */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.solidBase} pointerEvents="none" />

        {/* Aura Secundária Laranja (Superior Esquerda) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.secondaryGlowWrapper,
            {
              opacity: secOpacity,
              transform: [{ scale: secScale }, { translateX: secTranslateX }],
            },
          ]}
        >
          <Svg height={340} width={SCREEN_WIDTH * 1.2} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient
                id="secGlow"
                cx="30%"
                cy="25%"
                rx="50%"
                ry="50%"
                fx="30%"
                fy="25%"
              >
                <Stop offset="0%" stopColor="#ff8533" stopOpacity="0.45" />
                <Stop offset="50%" stopColor="#f77433" stopOpacity="0.15" />
                <Stop offset="100%" stopColor="#09090d" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#secGlow)" pointerEvents="none" />
          </Svg>
        </Animated.View>

        {/* Aura Principal Laranja Pulsante (Topo Centro) */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.mainGlowWrapper,
            {
              opacity: mainOpacity,
              transform: [{ scale: mainScale }, { translateY: mainTranslateY }],
            },
          ]}
        >
          <Svg height={440} width={SCREEN_WIDTH * 1.3} style={StyleSheet.absoluteFill} pointerEvents="none">
            <Defs>
              <RadialGradient
                id="mainGlow"
                cx="50%"
                cy="0%"
                rx="65%"
                ry="65%"
                fx="50%"
                fy="0%"
              >
                <Stop offset="0%" stopColor="#f77433" stopOpacity="0.55" />
                <Stop offset="30%" stopColor="#f77433" stopOpacity="0.28" />
                <Stop offset="65%" stopColor="#ff8a48" stopOpacity="0.08" />
                <Stop offset="100%" stopColor="#09090d" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#mainGlow)" pointerEvents="none" />
          </Svg>
        </Animated.View>
      </View>

      {/* Camada de conteúdo ativo com prioridade máxima de toque */}
      <View style={styles.contentLayer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#09090d",
  },
  solidBase: {
    ...StyleSheet.absoluteFill,
    backgroundColor: "#09090d",
  },
  mainGlowWrapper: {
    position: "absolute",
    top: -60,
    left: -SCREEN_WIDTH * 0.15,
    width: SCREEN_WIDTH * 1.3,
    height: 440,
  },
  secondaryGlowWrapper: {
    position: "absolute",
    top: -40,
    left: -SCREEN_WIDTH * 0.1,
    width: SCREEN_WIDTH * 1.2,
    height: 340,
  },
  contentLayer: {
    flex: 1,
    zIndex: 10,
  },
});
