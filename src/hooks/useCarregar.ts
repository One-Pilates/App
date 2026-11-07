import { useCallback, useEffect, useRef, useState } from "react";
import { mensagemDeErro } from "@/services/aluno";

/**
 * Carrega dados assíncronos com estados de carregando/erro. Recarrega quando `deps` mudam e
 * ignora respostas atrasadas (quando o usuário já trocou o filtro).
 */
export function useCarregar<T>(buscar: () => Promise<T>, deps: unknown[] = []) {
  const [dados, setDados] = useState<T | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const versao = useRef(0);
  const buscarRef = useRef(buscar);
  buscarRef.current = buscar;

  const recarregar = useCallback(async () => {
    const minha = ++versao.current;
    setCarregando(true);
    setErro("");
    try {
      const resultado = await buscarRef.current();
      if (minha === versao.current) setDados(resultado);
    } catch (e) {
      if (minha === versao.current) {
        setErro(mensagemDeErro(e, "Não foi possível carregar. Verifique sua conexão."));
      }
    } finally {
      if (minha === versao.current) setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { dados, carregando, erro, recarregar };
}
