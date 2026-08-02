/**
 * Formata um telefone brasileiro para o formato exigido pelo WhatsApp Web/app
 * (wa.me): só dígitos, com o DDI 55 na frente quando ainda não tem um.
 *
 * Entrada: "(11) 99999-9999" → Saída: "5511999999999"
 */
export function formatarTelefoneWhatsApp(telefone: string): string {
  const digitos = telefone.replace(/\D/g, "");
  return digitos.length <= 11 ? `55${digitos}` : digitos;
}

/** Link para abrir uma conversa no WhatsApp Web/app a partir de um telefone já cadastrado. */
export function linkWhatsapp(telefone: string): string {
  return `https://wa.me/${formatarTelefoneWhatsApp(telefone)}`;
}

/**
 * Máscara progressiva de telefone brasileiro para uso em campos de input:
 * mantém só dígitos (descarta letras/símbolos) e aplica "(DD) DDDD-DDDD"
 * (fixo) ou "(DD) DDDDD-DDDD" (celular) conforme o usuário digita.
 */
export function mascaraTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, "").slice(0, 11);
  if (digitos.length === 0) return "";
  if (digitos.length <= 2) return `(${digitos}`;
  if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
  if (digitos.length <= 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
}
