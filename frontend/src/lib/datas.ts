/**
 * Funções de data compartilhadas entre Agenda e Clientes.
 * Antes cada página tinha sua própria cópia; centralizado aqui para
 * evitar que as duas fiquem divergindo com o tempo.
 */

function doisDigitos(n: number): string {
  return String(n).padStart(2, "0");
}

/** Converte uma data para o formato YYYY-MM-DD usado como chave interna. */
export function paraChave(data: Date): string {
  return `${data.getFullYear()}-${doisDigitos(data.getMonth() + 1)}-${doisDigitos(data.getDate())}`;
}

/**
 * Data/hora atual, sob demanda — nunca cacheada. Antes existia uma
 * constante `HOJE` calculada uma única vez no carregamento do módulo, que
 * ficava presa no dia em que a aba foi aberta (bug real se a aba
 * atravessasse a meia-noite). Toda a Agenda/Hoje usa isto agora, em vez
 * de guardar o valor.
 */
export function hoje(): Date {
  return new Date();
}

/** Chave YYYY-MM-DD do dia atual, sob demanda (ver hoje()). */
export function hojeChave(): string {
  return paraChave(hoje());
}

/** Retorna a chave de uma data N dias a partir de hoje (aceita negativos). */
export function chaveComOffset(dias: number): string {
  const data = hoje();
  data.setDate(data.getDate() + dias);
  return paraChave(data);
}

/**
 * Converte uma chave YYYY-MM-DD em Date ao meio-dia local — evita o bug
 * clássico de `new Date("2026-07-30")` (meia-noite UTC) cair no dia
 * anterior em fusos horários negativos. Toda formatação de data baseada em
 * chave (abaixo) usa isso por baixo, em vez de repetir o truque do meio-dia.
 */
export function paraDataLocal(chave: string): Date {
  return new Date(`${chave}T12:00:00`);
}

/** Formata uma chave YYYY-MM-DD para exibição em português (ex: "23 jul. 2026"). */
export function formatarData(chave: string): string {
  return paraDataLocal(chave).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Formata uma chave YYYY-MM-DD de forma curta (ex: "23 jul."). */
export function formatarDataCurta(chave: string): string {
  return paraDataLocal(chave).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}

/** Formata uma chave YYYY-MM-DD por extenso numérica (ex: "23/07/2026"). */
export function formatarDataLonga(chave: string): string {
  return paraDataLocal(chave).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/**
 * Formata uma data por extenso, com dia da semana (ex: "Quinta-feira, 30 de
 * julho"). Só a primeira letra é maiúscula — não usar a classe CSS
 * `capitalize`, que erroneamente maiuscula todas as palavras (ex: "...30 De
 * Julho").
 */
export function dataPorExtenso(data: Date): string {
  const texto = data.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

/** Único ponto do sistema que formata horário para exibição: sempre HH:mm,
 * nunca segundos — independente de o backend enviar "09:00" ou "09:00:00". */
export function formatarHora(hora: string): string {
  return hora.slice(0, 5);
}

/** true se a data já passou (fim do dia). */
export function estaAtrasado(chave: string): boolean {
  return new Date(`${chave}T23:59:59`) < hoje();
}

/** true se a data é exatamente hoje. */
export function eHoje(chave: string): boolean {
  return chave === hojeChave();
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

/** Nomes de mês por extenso, em português — usado pelas visões de Agenda. */
export const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

/** Dias da semana abreviados (domingo a sábado) — usado pelas visões de Agenda. */
export const DIAS_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

/** Dias da semana por extenso (domingo a sábado) — usado pela visão Semana. */
export const DIAS_COMPLETO = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

export { doisDigitos };