import { Redirect } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";

export default function OwnProfileRoute() {
  const { user } = useAuth();
  if (!user?.id) return <Redirect href="/(aluno)/index" />;
  return <Redirect href={{ pathname: "/(aluno)/perfil/[id]", params: { id: String(user.id) } }} />;
}
