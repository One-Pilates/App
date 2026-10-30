import { Alert, AlertButton, AlertOptions } from "react-native";

export interface CustomAlertButton {
  text?: string;
  onPress?: () => void;
  style?: "default" | "cancel" | "destructive";
}

export interface CustomAlertData {
  visible: boolean;
  title: string;
  message?: string;
  type?: "warning" | "error" | "success" | "info";
  buttons?: CustomAlertButton[];
}

type Listener = (data: CustomAlertData) => void;
let currentListener: Listener | null = null;

export function setAlertListener(listener: Listener | null) {
  currentListener = listener;
}

export function triggerAlert(data: Omit<CustomAlertData, "visible">) {
  if (currentListener) {
    currentListener({ ...data, visible: true });
  } else {
    // Fallback para alerta nativo caso o listener ainda não esteja pronto
    const original = (Alert as any)._originalAlert || Alert.alert;
    original(data.title, data.message, data.buttons as any);
  }
}

export function dismissAlert() {
  if (currentListener) {
    currentListener({ visible: false, title: "" });
  }
}

// Configura o interceptador global para que qualquer Alert.alert(...) no app
// use automaticamente o modal visual branco e laranja padrão do OnePilates.
export function setupGlobalAlertInterceptor() {
  if (!(Alert as any)._isCustomIntercepted) {
    const original = Alert.alert.bind(Alert);
    (Alert as any)._originalAlert = original;
    (Alert as any)._isCustomIntercepted = true;

    Alert.alert = (
      title: string,
      message?: string,
      buttons?: AlertButton[],
      _options?: AlertOptions
    ) => {
      let type: "warning" | "error" | "success" | "info" = "info";
      const lowerTitle = (title || "").toLowerCase();
      const lowerMsg = (message || "").toLowerCase();

      if (
        lowerTitle.includes("atenção") ||
        lowerTitle.includes("aviso") ||
        lowerTitle.includes("certeza") ||
        lowerTitle.includes("excluir") ||
        lowerTitle.includes("remover") ||
        lowerTitle.includes("alterar status")
      ) {
        type = "warning";
      } else if (
        lowerTitle.includes("erro") ||
        lowerTitle.includes("falha") ||
        lowerMsg.includes("erro") ||
        lowerMsg.includes("não foi possível") ||
        lowerMsg.includes("incorret")
      ) {
        type = "error";
      } else if (
        lowerTitle.includes("sucesso") ||
        lowerTitle.includes("salvo") ||
        lowerTitle.includes("concluído") ||
        lowerTitle.includes("atualizado") ||
        lowerMsg.includes("sucesso")
      ) {
        type = "success";
      }

      triggerAlert({
        title: title || "",
        message,
        type,
        buttons: buttons?.map((b) => ({
          text: b.text,
          onPress: b.onPress ? () => b.onPress?.() : undefined,
          style: b.style,
        })),
      });
    };
  }
}
