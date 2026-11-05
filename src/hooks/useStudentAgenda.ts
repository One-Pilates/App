import { useCallback, useEffect, useState } from "react";
import api from "@/services/api";
import { Agendamento } from "@/types/agenda";

export const DEMO_STUDENT_ID = 999;

const demoAppointments: Agendamento[] = [
  {
    id: 9001,
    dataHora: "2026-11-05T09:00:00",
    especialidade: "Pilates",
    professorNome: "Mariana Costa",
    salaNome: "Pilates 1",
    alunos: [{ id: DEMO_STUDENT_ID, nome: "Maria Alice Souza", status: "PENDENTE" }],
  },
  {
    id: 9002,
    dataHora: "2026-11-07T14:00:00",
    especialidade: "Fisioterapia",
    professorNome: "Rafael Mendes",
    salaNome: "Fisioterapia 2",
    alunos: [{ id: DEMO_STUDENT_ID, nome: "Maria Alice Souza", status: "CONFIRMADA" }],
  },
  {
    id: 9003,
    dataHora: "2026-11-10T18:30:00",
    especialidade: "RPG",
    professorNome: "Camila Rocha",
    salaNome: "Estúdio 3",
    alunos: [{ id: DEMO_STUDENT_ID, nome: "Maria Alice Souza", status: "CONFIRMADA" }],
  },
];

function extractAppointments(payload: unknown): Agendamento[] {
  if (Array.isArray(payload)) return payload as Agendamento[];
  if (!payload || typeof payload !== "object") return [];
  const data = payload as { agendamentos?: unknown; content?: unknown };
  if (Array.isArray(data.agendamentos)) return data.agendamentos as Agendamento[];
  if (Array.isArray(data.content)) return data.content as Agendamento[];
  return [];
}

export function useStudentAgenda(studentId?: number, preview = false) {
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const reload = useCallback(async () => {
    if (preview) {
      setAppointments(demoAppointments);
      setLoading(false);
      setError("");
      return;
    }
    if (!studentId) {
      setAppointments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const response = await api.get("api/agendamentos");
      const allAppointments = extractAppointments(response.data);
      setAppointments(
        allAppointments.filter((appointment) =>
          appointment.alunos?.some((student) => student.id === studentId),
        ),
      );
    } catch (requestError) {
      console.error("Erro ao carregar agenda do aluno:", requestError);
      setError("Não foi possível carregar sua agenda.");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [preview, studentId]);

  useEffect(() => {
    reload();
  }, [reload]);

  return { appointments, loading, error, reload };
}

export function getStudentAppointmentStatus(
  appointment: Agendamento,
  studentId?: number,
) {
  const student = appointment.alunos?.find((item) => item.id === studentId);
  return (student?.status || "PENDENTE").toUpperCase();
}
