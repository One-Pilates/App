import { useCallback, useEffect, useMemo, useState } from "react";
import { AppState } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { alunoApi, type AulaAluno, type PacoteAluno } from "@/services/aluno";
import {
  derivarNotificacoes,
  paraISODate,
  somarDias,
  type NotificacaoAluno,
} from "@/utils/studentUtils";

const CINCO_MINUTOS = 5 * 60 * 1000;

const chaveDeLidas = (usuarioId?: number | null) => `@onepilates_notificacoes_lidas:${usuarioId ?? "aluno"}`;

async function lerLidas(usuarioId?: number | null): Promise<Set<string>> {
  try {
    const bruto = await AsyncStorage.getItem(chaveDeLidas(usuarioId));
    return new Set<string>(bruto ? JSON.parse(bruto) : []);
  } catch {
    return new Set<string>();
  }
}

async function gravarLidas(usuarioId: number | null | undefined, lidas: Set<string>) {
  try {
    // guarda só os últimos 200 ids para a lista não crescer para sempre
    await AsyncStorage.setItem(chaveDeLidas(usuarioId), JSON.stringify([...lidas].slice(-200)));
  } catch {
    // sem armazenamento: as notificações só voltam a aparecer como não lidas
  }
}

export type NotificacaoComLeitura = NotificacaoAluno & { lida: boolean };

/**
 * Notificações do aluno, calculadas a partir da agenda e do pacote (o backend ainda não guarda
 * notificações). O que já foi lido fica no aparelho.
 */
export function useNotificacoes(usuarioId?: number | null) {
  const [fonte, setFonte] = useState<{ aulas: AulaAluno[]; pacotes: PacoteAluno[] }>({
    aulas: [],
    pacotes: [],
  });
  const [lidas, setLidas] = useState<Set<string>>(new Set());
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    lerLidas(usuarioId).then(setLidas);
  }, [usuarioId]);

  const recarregar = useCallback(async () => {
    const hoje = new Date();
    try {
      const [aulas, pacotes] = await Promise.all([
        alunoApi.aulas(paraISODate(somarDias(hoje, -14)), paraISODate(somarDias(hoje, 14))),
        alunoApi.pacotes(),
      ]);
      setFonte({ aulas, pacotes });
    } catch {
      // sem conexão ou sessão expirada: mantém o que já tinha
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
    const intervalo = setInterval(recarregar, CINCO_MINUTOS);
    const assinatura = AppState.addEventListener("change", (estado) => {
      if (estado === "active") recarregar();
    });
    return () => {
      clearInterval(intervalo);
      assinatura.remove();
    };
  }, [recarregar]);

  const itens: NotificacaoComLeitura[] = useMemo(
    () =>
      derivarNotificacoes({ aulas: fonte.aulas, pacotes: fonte.pacotes, agora: new Date() }).map((n) => ({
        ...n,
        lida: lidas.has(n.id),
      })),
    [fonte, lidas],
  );

  const marcarComoLida = useCallback(
    (id: string) =>
      setLidas((anterior) => {
        if (anterior.has(id)) return anterior;
        const novo = new Set(anterior).add(id);
        gravarLidas(usuarioId, novo);
        return novo;
      }),
    [usuarioId],
  );

  const marcarTodasComoLidas = useCallback(
    () =>
      setLidas((anterior) => {
        const novo = new Set(anterior);
        itens.forEach((n) => novo.add(n.id));
        gravarLidas(usuarioId, novo);
        return novo;
      }),
    [itens, usuarioId],
  );

  return {
    itens,
    naoLidas: itens.filter((n) => !n.lida).length,
    carregando,
    recarregar,
    marcarComoLida,
    marcarTodasComoLidas,
  };
}
