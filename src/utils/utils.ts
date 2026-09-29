// Máscaras e validações compartilhadas (portadas do web Frontend/src/utils/utils.js).

export function formatarTelefone(telefone?: string | null): string {
  if (!telefone) return "";

  const digits = telefone.replace(/\D/g, "");

  if (digits.length === 0) return "";

  if (digits.length <= 2) return `(${digits}`;

  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;

  if (digits.length <= 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function formatarCep(cep?: string | null): string {
  if (!cep) return "";

  const digits = cep.replace(/\D/g, "").slice(0, 8);

  if (digits.length > 5) return digits.replace(/^(\d{5})(\d)/, "$1-$2");

  return digits;
}

export function somenteDigitos(valor?: string | null): string {
  return (valor || "").replace(/\D/g, "");
}

// Converte um Date (local) para 'yyyy-mm-dd' sem passar por UTC (evita deslocar o dia por fuso).

export function dataParaIso(date: Date): string {
  const ano = date.getFullYear();

  const mes = String(date.getMonth() + 1).padStart(2, "0");

  const dia = String(date.getDate()).padStart(2, "0");

  return `${ano}-${mes}-${dia}`;
}

// Converte 'yyyy-mm-dd' para um Date na meia-noite local (evita o off-by-one do parse UTC).

export function isoParaData(iso?: string | null): Date {
  if (!iso) return new Date();

  const [ano, mes, dia] = iso.split("-").map(Number);

  if (!ano || !mes || !dia) return new Date();

  return new Date(ano, mes - 1, dia);
}

export function validarEmail(email?: string | null): boolean {
  if (!email) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function formatarCpf(cpf?: string | null): string {
  const digits = (cpf || "").replace(/\D/g, "").slice(0, 11);

  return digits

    .replace(/(\d{3})(\d)/, "$1.$2")

    .replace(/(\d{3})(\d)/, "$1.$2")

    .replace(/(\d{3})(\d{1,2})/, "$1-$2")

    .replace(/(-\d{2})\d+?$/, "$1");
}

export function validarCpf(cpf?: string | null): boolean {
  const digits = (cpf || "").replace(/\D/g, "");

  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) return false;

  let soma = 0;

  for (let i = 1; i <= 9; i++) {
    soma += parseInt(digits.substring(i - 1, i), 10) * (11 - i);
  }

  let resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;

  if (resto !== parseInt(digits.substring(9, 10), 10)) return false;

  soma = 0;

  for (let i = 1; i <= 10; i++) {
    soma += parseInt(digits.substring(i - 1, i), 10) * (12 - i);
  }

  resto = (soma * 10) % 11;

  if (resto === 10 || resto === 11) resto = 0;

  return resto === parseInt(digits.substring(10, 11), 10);
}

const ESTADOS: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",

  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",

  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",

  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",

  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",

  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

export function getEstadoNome(uf?: string | null): string {
  if (!uf) return "";

  return ESTADOS[uf.toUpperCase()] || "";
}

export const especialidadeCores: Record<string, string> = {
  Pilates: "#ff6600",

  Fisioterapia: "#4CAF50",

  Osteopatia: "#2196F3",

  RPG: "#009688",

  Microfisioterapia: "#9C27B0",

  Shiatsu: "#673AB7",

  "Drenagem Linfática": "#03A9F4",

  Acupuntura: "#E91E63",
};

export function getColorForEspecialidade(nome?: string): {
  backgroundColor: string;
  textColor: string;
} {
  const backgroundColor = (nome && especialidadeCores[nome]) || "#3788d8";

  return { backgroundColor, textColor: "#fff" };
}
