// Tipos da agenda (espelham os payloads da API usados no web).

export interface AlunoAgendamento {
  id: number;

  nome: string;

  observacao?: string | null;

  alunoComLimitacoesFisicas?: boolean;
}

export interface Agendamento {
  id: number;

  dataHora: string; // 'yyyy-mm-ddTHH:mm:ss' em horário local

  especialidade: string;

  especialidadeId?: number;

  professorNome?: string;

  professor?: string;

  professorId?: number;

  idProfessor?: number;

  salaNome?: string;

  sala?: string;

  salaId?: number;

  alunos?: AlunoAgendamento[];
}

export interface Ausencia {
  id: number;

  professorId?: number;

  dataInicio: string;

  dataFim: string;

  motivo?: string;
}

export interface Sala {
  id: number;

  nome: string;
}

export interface Especialidade {
  id: number;

  nome: string;
}

export interface ProfessorResumo {
  id: number;

  nome: string;
}

// Item renderizado na lista do dia: aula ou bloco de ausência.

export type ItemAgenda =
  | { tipo: "aula"; id: string; hora: string; agendamento: Agendamento }
  | { tipo: "ausencia"; id: string; hora: string; ausencia: Ausencia };
