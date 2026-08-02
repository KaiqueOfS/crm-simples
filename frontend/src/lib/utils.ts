import type { KeyboardEvent } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Filtra um campo de nome (pessoa): mantém só letras (com acentos),
 * espaços, hífen e apóstrofo — descarta números e demais caracteres
 * especiais. Usado como rede de segurança para colar/autopreencher texto
 * (esses caminhos não passam pelo teclado, então `bloquearTeclaInvalidaNome`
 * não os intercepta).
 */
export function filtrarNome(valor: string): string {
  return valor.replace(/[^\p{L}\s'-]/gu, "");
}

/**
 * Impede que a tecla pressionada chegue a entrar no campo de nome, em vez
 * de deixar entrar e apagar depois — evita o caractere aparecer e sumir, e
 * evita o cursor pular para o fim do campo quando o caractere inválido é
 * digitado no meio do texto (o valor nunca muda de tamanho "à toa", então
 * não há posição de cursor para recalcular).
 */
export function bloquearTeclaInvalidaNome(e: KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return; // teclas de controle (Backspace, setas, Tab...)
  if (!/^[\p{L}\s'-]$/u.test(e.key)) {
    e.preventDefault();
  }
}

/**
 * Mesma lógica de `bloquearTeclaInvalidaNome`, mas para o campo de
 * telefone: só permite dígitos (a formatação em si é aplicada pela máscara
 * no onChange).
 */
export function bloquearTeclaInvalidaTelefone(e: KeyboardEvent<HTMLInputElement>) {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  if (e.key.length !== 1) return;
  if (!/^\d$/.test(e.key)) {
    e.preventDefault();
  }
}
