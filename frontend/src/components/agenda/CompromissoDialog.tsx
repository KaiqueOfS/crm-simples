import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientesApi, type Agendamento, type AgendamentoInput, type CategoriaAgendamento, type Cliente } from "@/lib/api";
import { ClienteCombobox } from "./ClienteCombobox";
import { SeletorCategoria } from "./SeletorCategoria";

/**
 * Modal de criação/edição de compromisso, no mesmo padrão do
 * `ClienteFormDialog`: usa os primitivos `Dialog` do Design System.
 *
 * Desde a Fase 7, `Agendamento` tem um vínculo real com `Cliente`
 * (`clienteId`, coluna `cliente_id` no backend) — o select "Cliente*" busca
 * os clientes reais (via `clientesApi.list`) e a seleção vira `clienteId` no
 * payload. O backend sincroniza `pessoa` a partir do nome do cliente
 * automaticamente; aqui só enviamos os dois por compatibilidade com o tipo
 * `AgendamentoInput`.
 *
 * "Observação" não existe no backend (Agendamento não tem essa coluna) —
 * por isso não aparece neste formulário nesta fase; entra quando o backend
 * expuser o campo.
 */

type CompromissoFormValues = {
  titulo: string;
  clienteId: number | "";
  data: string;
  hora: string;
  categoria: CategoriaAgendamento;
};

function valoresIniciais(compromisso: Agendamento | null, dataPadrao: string): CompromissoFormValues {
  if (compromisso) {
    return {
      titulo: compromisso.titulo,
      clienteId: compromisso.clienteId ?? "",
      data: compromisso.data,
      hora: compromisso.hora,
      categoria: compromisso.categoria,
    };
  }
  return { titulo: "", clienteId: "", data: dataPadrao, hora: "09:00", categoria: "atendimento" };
}

export function CompromissoDialog({
  aberto,
  compromisso,
  dataPadrao,
  aoFechar,
  aoSalvar,
}: {
  aberto: boolean;
  compromisso: Agendamento | null;
  dataPadrao: string;
  aoFechar: () => void;
  aoSalvar: (valores: AgendamentoInput) => Promise<void>;
}) {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [carregandoClientes, setCarregandoClientes] = useState(false);
  const [valores, setValores] = useState<CompromissoFormValues>(() => valoresIniciais(compromisso, dataPadrao));
  const [salvando, setSalvando] = useState(false);
  const [clienteObrigatorio, setClienteObrigatorio] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setCarregandoClientes(true);
    clientesApi
      .list({ tamanho: 100 })
      .then((resposta) => setClientes(resposta.conteudo))
      .finally(() => setCarregandoClientes(false));
  }, [aberto]);

  useEffect(() => {
    if (aberto) {
      setValores(valoresIniciais(compromisso, dataPadrao));
      setClienteObrigatorio(false);
    }
  }, [aberto, compromisso, dataPadrao]);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    const clienteEscolhido = clientes.find((c) => c.id === valores.clienteId);
    if (!clienteEscolhido) {
      setClienteObrigatorio(true);
      return;
    }

    setSalvando(true);
    try {
      await aoSalvar({
        titulo: valores.titulo,
        pessoa: clienteEscolhido.nome,
        clienteId: clienteEscolhido.id,
        data: valores.data,
        hora: valores.hora,
        categoria: valores.categoria,
        lembrete: compromisso?.lembrete ?? 0,
      });
    } finally {
      setSalvando(false);
    }
  }

  return (
    <Dialog open={aberto} onOpenChange={(open) => { if (!open) aoFechar(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{compromisso ? "Editar compromisso" : "Novo compromisso"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={aoSubmeter} className="flex flex-1 flex-col overflow-hidden">
          <DialogBody>
            <div className="space-y-1">
              <Label htmlFor="compromisso-titulo">Título *</Label>
              <Input
                id="compromisso-titulo"
                required
                value={valores.titulo}
                onChange={(e) => setValores((v) => ({ ...v, titulo: e.target.value }))}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="compromisso-cliente">Cliente *</Label>
              <ClienteCombobox
                id="compromisso-cliente"
                clientes={clientes}
                carregando={carregandoClientes}
                value={valores.clienteId}
                erro={clienteObrigatorio}
                onChange={(clienteId) => {
                  setValores((v) => ({ ...v, clienteId }));
                  setClienteObrigatorio(false);
                }}
              />
              {clienteObrigatorio && (
                <p className="text-xs text-destructive">Selecione um cliente para continuar.</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label htmlFor="compromisso-data">Data *</Label>
                <Input
                  id="compromisso-data"
                  type="date"
                  required
                  value={valores.data}
                  onChange={(e) => setValores((v) => ({ ...v, data: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="compromisso-hora">Hora *</Label>
                <Input
                  id="compromisso-hora"
                  type="time"
                  required
                  value={valores.hora}
                  onChange={(e) => setValores((v) => ({ ...v, hora: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <SeletorCategoria
                value={valores.categoria}
                onChange={(categoria) => setValores((v) => ({ ...v, categoria }))}
              />
            </div>
          </DialogBody>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={aoFechar}>
              Cancelar
            </Button>
            <Button type="submit" disabled={salvando}>
              {salvando ? "Salvando…" : compromisso ? "Salvar alterações" : "Salvar compromisso"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
