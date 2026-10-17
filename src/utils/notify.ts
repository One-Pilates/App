import { triggerAlert } from "./alertManager";

// Feedback padronizado ao usuário (estilo OnePilates: branco e laranja).
export const notify = {
  success(message: string, title = "Sucesso") {
    triggerAlert({ title, message, type: "success" });
  },

  error(message: string, title = "Erro") {
    triggerAlert({ title, message, type: "error" });
  },

  warning(message: string, title = "Atenção") {
    triggerAlert({ title, message, type: "warning" });
  },

  info(message: string, title = "Aviso") {
    triggerAlert({ title, message, type: "info" });
  },
};
