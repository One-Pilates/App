import axios from 'axios';
import api from './api';

export const DASHBOARD_PERIODS = [
  { value: 7, label: '7 dias' },
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
] as const;

export const WEEKDAY_SHORT_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

export type TeacherDashboardResponse = {
  kpisProfessorDTO?: {
    qtdTotalSessoesRealizadas?: number | string | null;
    qtdAlunosAtendidos?: number | string | null;
    diaSemanaComMaiorAtendimento?: string | null;
    especialidadeMaisRequisitada?: string | null;
  } | null;
  agendamentosPorDiasDTO?: DiaItem[] | null;
  aulasPorEspecialidadesDTO?: EspItem[] | null;
};

export type SecretaryDashboardResponse = {
  agendamentosPorDias?: DiaItem[] | null;
  qtdSessoesPorProfessor?: ProfItem[] | null;
  qtdDeAlunosAtendidos?: number | string | null;
};

export type DiaItem = {
  diaSemana?: string;
  totalAgendamentos?: number | string;
};

export type EspItem = {
  especialidade?: string;
  percentualAulas?: number | string;
};

export type ProfItem = {
  nomeProfessor?: string;
  totalAgendamentosPorProfessor?: number | string;
};

export type TeacherDashboardView = {
  kpis: {
    sessoes: string;
    alunos: string;
    diaMaior: string;
    especialidade: string;
  };
  weekly: number[];
  top: { name: string; percent: number }[];
  hasData: boolean;
};

export type SecretaryDashboardView = {
  kpis: {
    sessoes: string;
    alunos: string;
    diaMaior: string;
    professorMaior: string;
  };
  weekly: number[];
  pie: { name: string; value: number; percent: number }[];
  hasData: boolean;
};

function normalizeKey(value: string | null | undefined): string {
  return (value || '')
    .toString()
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function toNumber(value: unknown, fallback = 0): number {
  if (value == null || value === '') return fallback;
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

const TO_SHORT: Record<string, string> = {
  sunday: 'Dom',
  domingo: 'Dom',
  monday: 'Seg',
  'segunda-feira': 'Seg',
  segunda: 'Seg',
  tuesday: 'Ter',
  'terca-feira': 'Ter',
  terca: 'Ter',
  wednesday: 'Qua',
  'quarta-feira': 'Qua',
  quarta: 'Qua',
  thursday: 'Qui',
  'quinta-feira': 'Qui',
  quinta: 'Qui',
  friday: 'Sex',
  'sexta-feira': 'Sex',
  sexta: 'Sex',
  saturday: 'Sáb',
  sabado: 'Sáb',
};

const TO_LONG_PT: Record<string, string> = {
  sunday: 'Domingo',
  domingo: 'Domingo',
  monday: 'Segunda-feira',
  'segunda-feira': 'Segunda-feira',
  segunda: 'Segunda-feira',
  tuesday: 'Terça-feira',
  'terca-feira': 'Terça-feira',
  terca: 'Terça-feira',
  wednesday: 'Quarta-feira',
  'quarta-feira': 'Quarta-feira',
  quarta: 'Quarta-feira',
  thursday: 'Quinta-feira',
  'quinta-feira': 'Quinta-feira',
  quinta: 'Quinta-feira',
  friday: 'Sexta-feira',
  'sexta-feira': 'Sexta-feira',
  sexta: 'Sexta-feira',
  saturday: 'Sábado',
  sabado: 'Sábado',
};

export function weekdayToShort(diaSemana: string | null | undefined): string | undefined {
  return TO_SHORT[normalizeKey(diaSemana)];
}

export function weekdayToLongPt(diaSemana: string | null | undefined): string {
  return TO_LONG_PT[normalizeKey(diaSemana)] || '';
}

export function weeklySeries(dias: DiaItem[]): number[] {
  return WEEKDAY_SHORT_LABELS.map((label) =>
    dias.reduce(
      (total, item) =>
        weekdayToShort(item.diaSemana) === label
          ? total + toNumber(item.totalAgendamentos)
          : total,
      0,
    ),
  );
}

export function dashboardErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return 'Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.';
    }
    const status = error.response.status;
    const data = error.response.data as { message?: string; erro?: string; error?: string } | string;
    const msg =
      typeof data === 'string' ? data : data?.message || data?.erro || data?.error;
    if (status === 401) return 'Sessão expirada. Faça login novamente.';
    if (status === 403) return 'Você não tem permissão para visualizar estes dados.';
    if (status === 404) return 'Não foi possível localizar os dados do dashboard.';
    if (msg && msg.length < 240) return msg;
  }
  return fallback;
}

export async function getTeacherDashboard(professorId: number, dias: number) {
  const endpoint = `api/professores/${professorId}/${dias || 30}`;
  console.info('[DASHBOARD][PROFESSOR] Buscando dados:', { endpoint, professorId, dias });
  const { data } = await api.get<TeacherDashboardResponse>(
    endpoint,
    { params: { _: Date.now() } },
  );
  console.info('[DASHBOARD][PROFESSOR] Resposta recebida:', {
    keys: data && typeof data === 'object' ? Object.keys(data) : [],
    hasKpis: Boolean(data?.kpisProfessorDTO),
    days: data?.agendamentosPorDiasDTO?.length || 0,
    specialties: data?.aulasPorEspecialidadesDTO?.length || 0,
  });
  return data;
}

export async function getSecretaryDashboard(dias: number) {
  const endpoint = `api/secretarias/qtdUltimosDias/${dias || 30}`;
  console.info('[DASHBOARD][SECRETARIA] Buscando dados:', { endpoint, dias });
  const { data } = await api.get<SecretaryDashboardResponse>(
    endpoint,
    { params: { _: Date.now() } },
  );
  console.info('[DASHBOARD][SECRETARIA] Resposta recebida:', {
    keys: data && typeof data === 'object' ? Object.keys(data) : [],
    days: data?.agendamentosPorDias?.length || 0,
    professors: data?.qtdSessoesPorProfessor?.length || 0,
    students: data?.qtdDeAlunosAtendidos ?? null,
  });
  return data;
}

export function mapTeacherDashboard(data: TeacherDashboardResponse): TeacherDashboardView {
  const kpisData = data.kpisProfessorDTO;
  const dias = data.agendamentosPorDiasDTO || [];
  const especialidades = data.aulasPorEspecialidadesDTO || [];

  const top = [...especialidades]
    .map((item) => ({
      name: item.especialidade || '-',
      percent: toNumber(item.percentualAulas),
    }))
    .sort((a, b) => b.percent - a.percent)
    .slice(0, 3);

  const hasData =
    dias.length > 0 ||
    especialidades.length > 0 ||
    Boolean(
      kpisData &&
        (kpisData.qtdTotalSessoesRealizadas != null ||
          kpisData.qtdAlunosAtendidos != null ||
          kpisData.diaSemanaComMaiorAtendimento ||
          kpisData.especialidadeMaisRequisitada),
    );

  const view = {
    kpis: {
      sessoes: String(kpisData?.qtdTotalSessoesRealizadas ?? '0'),
      alunos: String(kpisData?.qtdAlunosAtendidos ?? '0'),
      diaMaior:
        weekdayToLongPt(kpisData?.diaSemanaComMaiorAtendimento) ||
        kpisData?.diaSemanaComMaiorAtendimento ||
        '-',
      especialidade: kpisData?.especialidadeMaisRequisitada || '-',
    },
    weekly: weeklySeries(dias),
    top,
    hasData,
  };
  console.info('[DASHBOARD][PROFESSOR] Dados mapeados:', view);
  return view;
}

export function mapSecretaryDashboard(data: SecretaryDashboardResponse): SecretaryDashboardView {
  const dias = data.agendamentosPorDias || [];
  const profs = data.qtdSessoesPorProfessor || [];
  const qtdAlunos = toNumber(data.qtdDeAlunosAtendidos);
  const hasData = dias.length > 0 || profs.length > 0 || qtdAlunos > 0;

  if (!hasData) {
    const emptyView = {
      kpis: { sessoes: '', alunos: '', diaMaior: '', professorMaior: '' },
      weekly: WEEKDAY_SHORT_LABELS.map(() => 0),
      pie: [],
      hasData: false,
    };
    console.info('[DASHBOARD][SECRETARIA] Resposta sem dados:', emptyView);
    return emptyView;
  }

  const total = profs.reduce((sum, p) => sum + toNumber(p.totalAgendamentosPorProfessor), 0);

  const pie = [...profs]
    .map((p) => {
      const value = toNumber(p.totalAgendamentosPorProfessor);
      const view = {
        name: p.nomeProfessor || '-',
        value,
        percent: total ? (value / total) * 100 : 0,
      };
      return view;
    })
    .sort((a, b) => b.value - a.value);

  const diaMaiorRaw =
    dias.length > 0
      ? dias.reduce((a, b) =>
          toNumber(a.totalAgendamentos) > toNumber(b.totalAgendamentos) ? a : b,
        ).diaSemana
      : '';

  const professorMaior = pie[0]?.name && pie[0].name !== '-' ? pie[0].name : '';

  const view = {
    kpis: {
      sessoes: total ? String(total) : '',
      alunos: qtdAlunos ? String(qtdAlunos) : '',
      diaMaior: weekdayToLongPt(diaMaiorRaw),
      professorMaior,
    },
    weekly: weeklySeries(dias),
    pie,
    hasData: true,
  };
  console.info('[DASHBOARD][SECRETARIA] Dados mapeados:', view);
  return view;
}
