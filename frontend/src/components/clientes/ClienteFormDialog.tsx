import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Cliente } from "@/lib/api";
import { mascaraTelefone } from "@/lib/utils/whatsapp";
import { bloquearTeclaInvalidaNome, bloquearTeclaInvalidaTelefone, filtrarNome } from "@/lib/utils";

/**
 * Modal de cadastro/edição de cliente, reaproveitado pelos dois fluxos da
 * tela Clientes ("+ Novo cliente" e "Editar cliente" no painel de detalhes).
 * Só os campos que o backend aceita (nome, telefone, email, observações) —
 * ver `ClienteRequest` no backend para as validações espelhadas aqui.
 */

export type ClienteFormValues = {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
};

const FORM_VAZIO: ClienteFormValues = { nome: "", telefone: "", email: "", observacoes: "" };

export function ClienteFormDialog({
  aberto,
  cliente,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  cliente: Cliente | null;
  aoFechar: () => void;
  aoSalvar: (valores: ClienteFormValues) => Promise<void>;
}) {
  const [valores, setValores] = useState<ClienteFormValues>(FORM_VAZIO);
  const [salvando, setSalvando] = useState(false);

  // Recarrega os valores do formulário toda vez que o modal é aberto,
  // para o cliente certo (criação começa vazio; edição vem preenchida).
  useEffect(() => {
    if (aberto) {
      setValores(
        cliente
          ? { nome: cliente.nome, telefone: mascaraTelefone(cliente.telefone), email: cliente.email ?? "", observacoes: cliente.observacoes ?? "" }
          : FORM_VAZIO,
      );
    }
  }, [aberto, cliente]);

  async function aoSubmeter(evento: FormEvent) {
    evento.preventDefault();
    setSalvando(true);
    try {
      await aoSalvar(valores);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) aoFechar(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{cliente ? "Editar cliente" : "Novo cliente"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={aoSubmeter} className="flex flex-1 flex-col overflow-hidden">
          <DialogBody>
            <div className="space-y-1">
              <Label htmlFor="cliente-nome">Nome *</Label>
              <Input
                id="cliente-nome"
                required
                maxLength={100}
                value={valores.nome}
                onChange={(e) => setValores((v) => ({ ...v, nome: filtrarNome(e.target.value) }))}
                onKeyDown={bloquearTeclaInvalidaNome}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente-telefone">Telefone *</Label>
              <Input
                id="cliente-telefone"
                type="tel"
                required
                minLength={8}
                maxLength={20}
                placeholder="(11) 91234-5678"
                value={valores.telefone}
                onChange={(e) => setValores((v) => ({ ...v, telefone: mascaraTelefone(e.target.value) }))}
                onKeyDown={bloquearTeclaInvalidaTelefone}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente-email">E-mail</Label>
              <Input
                id="cliente-email"
                type="email"
                maxLength={255}
                value={valores.email}
                onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="cliente-observacoes">Observações</Label>
              <Textarea
                id="cliente-observacoes"
                maxLength={500}
                rows={3}
                value={valores.observacoes}
                onChange={(e) => setValores((v) => ({ ...v, observacoes: e.target.value }))}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : cliente ? "Salvar alterações" : "Salvar cliente"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
