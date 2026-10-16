import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  StyleSheet,
  Dimensions,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import {
  CustomAlertData,
  setAlertListener,
  dismissAlert,
} from "@/utils/alertManager";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

export default function GlobalAlertModal() {
  const [alertData, setAlertData] = useState<CustomAlertData>({
    visible: false,
    title: "",
    message: "",
    type: "info",
  });

  useEffect(() => {
    setAlertListener((data) => {
      setAlertData(data);
    });

    return () => {
      setAlertListener(null);
    };
  }, []);

  if (!alertData.visible) {
    return null;
  }

  const handleButtonPress = (onPress?: () => void) => {
    dismissAlert();
    if (onPress) {
      setTimeout(() => {
        onPress();
      }, 50);
    }
  };

  const getIconConfig = () => {
    switch (alertData.type) {
      case "warning":
        return {
          icon: "alert-circle" as const,
          color: "#f77433",
          bg: "#fff7ed",
          border: "#fed7aa",
        };
      case "error":
        return {
          icon: "alert-octagon" as const,
          color: "#ef4444",
          bg: "#fef2f2",
          border: "#fecaca",
        };
      case "success":
        return {
          icon: "check-circle" as const,
          color: "#16a34a",
          bg: "#f0fdf4",
          border: "#bbf7d0",
        };
      default:
        return {
          icon: "info" as const,
          color: "#f77433",
          bg: "#fff7ed",
          border: "#fed7aa",
        };
    }
  };

  const iconConfig = getIconConfig();
  const buttons = alertData.buttons && alertData.buttons.length > 0 ? alertData.buttons : null;

  return (
    <Modal
      visible={alertData.visible}
      transparent
      animationType="fade"
      onRequestClose={() => handleButtonPress()}
    >
      <View style={styles.overlay}>
        <TouchableWithoutFeedback onPress={() => buttons ? null : handleButtonPress()}>
          <View style={styles.backdrop} />
        </TouchableWithoutFeedback>

        <View style={styles.card}>
          {/* Badge Circular com Ícone */}
          <View
            style={[
              styles.iconBadge,
              { backgroundColor: iconConfig.bg, borderColor: iconConfig.border },
            ]}
          >
            <Feather name={iconConfig.icon} size={26} color={iconConfig.color} />
          </View>

          {/* Título */}
          {alertData.title ? (
            <Text style={styles.title}>{alertData.title}</Text>
          ) : null}

          {/* Mensagem */}
          {alertData.message ? (
            <Text style={styles.message}>{alertData.message}</Text>
          ) : null}

          {/* Ações / Botões */}
          <View style={styles.actionsContainer}>
            {buttons ? (
              <View style={styles.buttonsRow}>
                {buttons.map((btn, index) => {
                  const isCancel = btn.style === "cancel";
                  const isDestructive = btn.style === "destructive";

                  return (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.actionButton,
                        isCancel && styles.cancelButton,
                        isDestructive && styles.destructiveButton,
                        !isCancel && !isDestructive && styles.primaryButton,
                      ]}
                      onPress={() => handleButtonPress(btn.onPress)}
                      activeOpacity={0.85}
                    >
                      <Text
                        style={[
                          styles.actionButtonText,
                          isCancel && styles.cancelButtonText,
                          (isDestructive || (!isCancel && !isDestructive)) && styles.whiteButtonText,
                        ]}
                      >
                        {btn.text || "OK"}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <TouchableOpacity
                style={styles.singleConfirmButton}
                onPress={() => handleButtonPress()}
                activeOpacity={0.88}
              >
                <Text style={styles.singleConfirmText}>Entendido</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.62)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
    zIndex: 9999,
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  card: {
    width: "100%",
    maxWidth: Math.min(SCREEN_WIDTH - 48, 380),
    backgroundColor: "#ffffff",
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    paddingHorizontal: 22,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: "center",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.16,
    shadowRadius: 20,
    elevation: 10,
  },
  iconBadge: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    color: "#0f172a",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  message: {
    fontSize: 14,
    color: "#475569",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 6,
  },
  actionsContainer: {
    width: "100%",
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
  },
  actionButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  primaryButton: {
    backgroundColor: "#f77433",
  },
  cancelButton: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  destructiveButton: {
    backgroundColor: "#ef4444",
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: "700",
  },
  cancelButtonText: {
    color: "#475569",
  },
  whiteButtonText: {
    color: "#ffffff",
  },
  singleConfirmButton: {
    width: "100%",
    height: 48,
    borderRadius: 12,
    backgroundColor: "#f77433",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#f77433",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
    elevation: 3,
  },
  singleConfirmText: {
    color: "#ffffff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
