/**
 * Funções de data compartilhadas entre Agenda e Clientes.
 * Antes cada página tinha sua própria cópia; centralizado aqui para
 * evitar que as duas fiquem divergindo com o tempo.
 */

const HOJE = new Date();

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/** Converte uma data para o formato YYYY-MM-DD usado como chave interna. */
export function paraChave(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

export const HOJE_CHAVE = paraChave(HOJE);

/** Retorna a chave de uma data N dias a partir de hoje (aceita negativos). */
export function chaveComOffset(dias: number): string {
  const data = new Date(HOJE);
  data.setDate(data.getDate() + dias);
  return paraChave(data);
}

/** Formata uma chave YYYY-MM-DD para exibição em português (ex: "23 jul. 2026"). */
export function formatarData(chave: string): string {
  return new Date(`${chave}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** true se a data já passou (fim do dia). */
export function estaAtrasado(chave: string): boolean {
  return new Date(`${chave}T23:59:59`) < HOJE;
}

/** true se a data é exatamente hoje. */
export function eHoje(chave: string): boolean {
  return chave === HOJE_CHAVE;
}

/** Retorna as datas da semana (domingo a sábado) que contém a data base. */
export function datasDaSemana(base: Date): Date[] {
  const diaSemana = base.getDay();
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(base);
    d.setDate(base.getDate() - diaSemana + i);
    return d;
  });
}

export { HOJE, doisDigitos };