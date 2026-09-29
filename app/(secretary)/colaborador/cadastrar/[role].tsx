import { useLocalSearchParams } from "expo-router";

import CollaboratorForm from "@/components/CollaboratorForm";

export default function CadastrarColaborador() {
  const { role } = useLocalSearchParams<{ role: string }>();

  return <CollaboratorForm role={role} />;
}
