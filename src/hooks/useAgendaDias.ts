import { useMemo, useState } from "react";

import { Agendamento, Ausencia, ItemAgenda } from "@/types/agenda";

import {
  dataParaIso,
  diaDeDataHora,
  ehFimDeSemana,
  getColorForEspecialidade,
  horaDeDataHora,
  inicioDaSemana,
  isoParaData,
  nomeMes,
} from "@/utils/utils";

// Fim de semana não tem aula: começa na segunda seguinte.

function diaInicial(): string {
  const hoje = new Date();

  if (!ehFimDeSemana(hoje)) return dataParaIso(hoje);

  const dias = hoje.getDay() === 6 ? 2 : 1;

  return dataParaIso(
    new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() + dias),
  );
}

function ausenciaNoDia(ausencia: Ausencia, dia: string): boolean {
  return (
    diaDeDataHora(ausencia.dataInicio) <= dia &&
    diaDeDataHora(ausencia.dataFim) >= dia
  );
}

// Organiza aulas e ausências por dia para a faixa de dias, o calendário e a lista.

export function useAgendaDias(
  agendamentos: Agendamento[],
  ausencias: Ausencia[],
) {
  const [diaSelecionado, setDiaSelecionado] = useState(diaInicial);

  const [semana, setSemana] = useState(() =>
    inicioDaSemana(isoParaData(diaInicial())),
  );

  const aulasPorDia = useMemo(() => {
    const mapa = new Map<string, Agendamento[]>();

    agendamentos.forEach((a) => {
      const dia = diaDeDataHora(a.dataHora);

      if (!mapa.has(dia)) mapa.set(dia, []);

      mapa.get(dia)!.push(a);
    });

    return mapa;
  }, [agendamentos]);

  const diasComAula = useMemo(() => new Set(aulasPorDia.keys()), [aulasPorDia]);

  const itensDoDia = useMemo<ItemAgenda[]>(() => {
    const aulas: ItemAgenda[] = (aulasPorDia.get(diaSelecionado) || []).map(
      (a) => ({
        tipo: "aula",

        id: `aula-${a.id}`,

        hora: horaDeDataHora(a.dataHora),

        agendamento: a,
      }),
    );

    const bloqueios: ItemAgenda[] = ausencias

      .filter((a) => ausenciaNoDia(a, diaSelecionado))

      .map((a) => ({
        tipo: "ausencia",

        id: `ausencia-${a.id}`,

        hora:
          diaDeDataHora(a.dataInicio) === diaSelecionado
            ? horaDeDataHora(a.dataInicio)
            : "00:00",

        ausencia: a,
      }));

    return [...aulas, ...bloqueios].sort((a, b) =>
      a.hora.localeCompare(b.hora),
    );
  }, [aulasPorDia, ausencias, diaSelecionado]);

  const markedDates = useMemo(() => {
    const marcas: Record<string, any> = {};

    aulasPorDia.forEach((aulas, dia) => {
      const cores = Array.from(
        new Set(
          aulas.map(
            (a) => getColorForEspecialidade(a.especialidade).backgroundColor,
          ),
        ),
      ).slice(0, 4);

      marcas[dia] = {
        dots: cores.map((color, i) => ({ key: `${dia}-${i}`, color })),
      };
    });

    marcas[diaSelecionado] = {
      ...(marcas[diaSelecionado] || {}),

      selected: true,

      selectedColor: "#f77433",
    };

    return marcas;
  }, [aulasPorDia, diaSelecionado]);

  function selecionarDia(iso: string) {
    setDiaSelecionado(iso);

    setSemana(inicioDaSemana(isoParaData(iso)));
  }

  const dataSelecionada = isoParaData(diaSelecionado);

  return {
    diaSelecionado,

    setDiaSelecionado,

    semana,

    setSemana,

    selecionarDia,

    diasComAula,

    itensDoDia,

    markedDates,

    mesAtual: `${nomeMes(dataSelecionada)} ${dataSelecionada.getFullYear()}`,

    totalAulas: itensDoDia.filter((i) => i.tipo === "aula").length,
  };
}
