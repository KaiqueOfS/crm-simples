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
