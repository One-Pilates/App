import { useLocalSearchParams } from "expo-router";

import StudentForm from "@/components/StudentForm";

export default function EditarAluno() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return <StudentForm alunoId={id} />;
}
