import { Alert } from "react-native";

// Feedback ao usuário. Encapsula Alert nativo; trocar por lib de toast depois é só mudar aqui.

export const notify = {
  success(message: string, title = "Sucesso") {
    Alert.alert(title, message);
  },

  error(message: string, title = "Erro") {
    Alert.alert(title, message);
  },

  warning(message: string, title = "Atenção") {
    Alert.alert(title, message);
  },

  info(message: string, title = "Aviso") {
    Alert.alert(title, message);
  },
};
