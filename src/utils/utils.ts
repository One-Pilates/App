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

export function validarEmail(email?: string | null): boolean {
  if (!email) return false;

  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
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
