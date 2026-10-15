import { useCallback, useEffect, useState } from "react";

import api from "@/services/api";

import { Agendamento, Ausencia, ProfessorResumo, Sala } from "@/types/agenda";

function extrairLista<T>(payload: any, chave?: string): T[] {
  if (!payload) return [];

  if (Array.isArray(payload)) return payload;

  if (chave && Array.isArray(payload[chave])) return payload[chave];

  if (Array.isArray(payload.content)) return payload.content;

  if (Array.isArray(payload.data)) return payload.data;

  return [];
}

interface Options {
  // Quando definido, a agenda fica travada neste professor (fluxo do professor logado).

  professorFixo?: number;

  professorInicial?: string;

  salaInicial?: string;
}

export function useAgenda({
  professorFixo,
  professorInicial,
  salaInicial,
}: Options = {}) {
  const travado = professorFixo !== undefined;

  const [salas, setSalas] = useState<Sala[]>([]);

  const [professores, setProfessores] = useState<ProfessorResumo[]>([]);

  const [idSala, setIdSala] = useState(salaInicial ?? "");

  const [idProfessor, setIdProfessor] = useState(
    travado ? String(professorFixo) : (professorInicial ?? "0"),
  );

  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);

  const [ausencias, setAusencias] = useState<Ausencia[]>([]);

  const [loading, setLoading] = useState(true);

  const [erro, setErro] = useState("");

  // Listas de apoio dos filtros (não usadas no fluxo do professor).

  const carregarFiltros = useCallback(async () => {
    if (travado) return;

    try {
      const [respSalas, respProfs] = await Promise.all([
        api.get("api/salas").catch(() => ({ data: [] })),

        api.get("api/professores").catch(() => ({ data: [] })),
      ]);

      setSalas(extrairLista<Sala>(respSalas.data));

      setProfessores(
        extrairLista<ProfessorResumo>(respProfs.data, "professores"),
      );
    } catch (error) {
      console.error("Erro ao carregar filtros:", error);
    }
  }, [travado]);

  const carregar = useCallback(async () => {
    const todasSalas = !idSala;

    const todosProfessores = !idProfessor || idProfessor === "0";

    setLoading(true);

    setErro("");

    try {
      let url = "api/agendamentos";

      if (!todasSalas && !todosProfessores)
        url = `api/agendamentos/${idSala}/${idProfessor}`;
      else if (!todosProfessores)
        url = `api/agendamentos/professorId/${idProfessor}`;
      else if (!todasSalas) url = `api/agendamentos/sala/${idSala}`;

      const response = await api.get(url);

      setAgendamentos(Array.isArray(response.data) ? response.data : []);

      // Ausências só fazem sentido com um professor específico selecionado.

      if (!todosProfessores) {
        try {
          const respAus = await api.get(
            `api/ausencias/professor/${idProfessor}`,
          );

          setAusencias(Array.isArray(respAus.data) ? respAus.data : []);
        } catch {
          setAusencias([]);
        }
      } else {
        setAusencias([]);
      }
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error);

      setErro("Não foi possível carregar a agenda.");

      setAgendamentos([]);

      setAusencias([]);
    } finally {
      setLoading(false);
    }
  }, [idSala, idProfessor]);

  useEffect(() => {
    carregarFiltros();
  }, [carregarFiltros]);

  // Debounce para não disparar a cada toque nos filtros.

  useEffect(() => {
    const t = setTimeout(carregar, 250);

    return () => clearTimeout(t);
  }, [carregar]);

  return {
    salas,

    professores,

    idSala,

    setIdSala,

    idProfessor,

    setIdProfessor,

    agendamentos,

    ausencias,

    loading,

    erro,

    recarregar: carregar,
  };
}
