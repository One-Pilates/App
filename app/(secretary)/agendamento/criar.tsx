import { useLocalSearchParams } from "expo-router";

import AulaForm from "@/components/AulaForm";

export default function CriarAgendamento() {
  const { data, horario } = useLocalSearchParams<{
    data?: string;
    horario?: string;
  }>();

  return <AulaForm dataInicial={data} horarioInicial={horario} />;
}
