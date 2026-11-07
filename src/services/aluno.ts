import api from "./api";

/**
 * Portal do aluno (`/api/aluno/**`). O backend identifica o aluno pelo token: nenhuma chamada
 * envia id de aluno. Datas dos filtros no formato "YYYY-MM-DD".
 */

export type SituacaoAula = "AGENDADA" | "REALIZADA" | "CANCELADA";

export interface AulaAluno {
  agendamentoId: number;
  dataHora: string;
  duracaoMinutos: number;
  especialidade: string;
  professor: string | null;
  professorId: number | null;
  professorFoto: string | null;
  sala: string | null;
  situacao: SituacaoAula;
  presencaConfirmada: boolean;
  podeCancelar: boolean;
  cancelamentoSemPerda: boolean;
  aulaDevolvida: boolean | null;
  foraDoPrazo: boolean | null;
  canceladoEm: string | null;
}

export interface PacoteAluno {
  especialidadeId: number;
  especialidade: string;
  saldo: number;
}

export interface ItemContagem {
  nome: string;
  quantidade: number;
}

export interface DashboardAluno {
  de: string;
  ate: string;
  aulasRealizadas: number;
  aulasCanceladas: number;
  aulasPerdidas: number;
  aulasAgendadas: number;
  especialidadeMaisFrequente: string | null;
  diaSemanaMaisFrequente: string | null;
  saldoTotal: number;
  pacotes: PacoteAluno[];
  aulasPorEspecialidade: ItemContagem[];
  aulasPorDiaSemana: ItemContagem[];
  proximaAula: AulaAluno | null;
}

export interface PerfilAluno {
  id: number;
  nome: string;
  email: string;
  telefone: string | null;
  status: boolean;
  notificacaoAtiva: boolean;
}

export interface CancelamentoResultado {
  aulaDevolvida: boolean;
  foraDoPrazo: boolean;
  mensagem: string;
}

export const alunoApi = {
  aulas: (de: string, ate: string) =>
    api.get<AulaAluno[]>("api/aluno/aulas", { params: { de, ate } }).then((r) => r.data),

  aula: (agendamentoId: number | string) =>
    api.get<AulaAluno>(`api/aluno/aulas/${agendamentoId}`).then((r) => r.data),

  confirmarPresenca: (agendamentoId: number | string) =>
    api.patch(`api/aluno/aulas/${agendamentoId}/presenca`).then((r) => r.data),

  cancelarAula: (agendamentoId: number | string) =>
    api.delete<CancelamentoResultado>(`api/aluno/aulas/${agendamentoId}`).then((r) => r.data),

  dashboard: (de: string, ate: string) =>
    api.get<DashboardAluno>("api/aluno/dashboard", { params: { de, ate } }).then((r) => r.data),

  pacotes: () => api.get<PacoteAluno[]>("api/aluno/pacotes").then((r) => r.data),

  perfil: () => api.get<PerfilAluno>("api/aluno/perfil").then((r) => r.data),

  atualizarPerfil: (dados: Partial<Pick<PerfilAluno, "telefone" | "notificacaoAtiva">>) =>
    api.patch<PerfilAluno>("api/aluno/perfil", dados).then((r) => r.data),
};

/** Mensagem de erro do backend (`erro`/`message`) ou um texto padrão. */
export function mensagemDeErro(
  error: unknown,
  padrao = "Não foi possível concluir. Tente novamente.",
): string {
  const data = (error as { response?: { data?: unknown } })?.response?.data;
  if (typeof data === "string" && data.trim()) return data;
  const obj = data as { erro?: string; message?: string } | undefined;
  return obj?.erro || obj?.message || padrao;
}
