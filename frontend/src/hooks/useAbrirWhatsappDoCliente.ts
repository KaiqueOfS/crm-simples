import { useState } from "react";
import { toast } from "sonner";
import { clientesApi } from "@/lib/api";
import { linkWhatsapp } from "@/lib/utils/whatsapp";

/**
 * Busca o telefone do cliente (sob demanda, por id) e abre o WhatsApp —
 * usado tanto em AgendaItem quanto em Hoje, que antes tinham cada um sua
 * própria cópia desta mesma lógica.
 */
export function useAbrirWhatsappDoCliente() {
  const [abrindoWhatsapp, setAbrindoWhatsapp] = useState(false);

  async function abrirWhatsapp(clienteId: number | null | undefined) {
    if (!clienteId) return;
    setAbrindoWhatsapp(true);
    try {
      const cliente = await clientesApi.get(clienteId);
      window.open(linkWhatsapp(cliente.telefone), "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível abrir o WhatsApp deste cliente.");
    } finally {
      setAbrindoWhatsapp(false);
    }
  }

  return { abrirWhatsapp, abrindoWhatsapp };
}
