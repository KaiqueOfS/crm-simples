import { useEffect, useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clientesApi, type Agendamento, type AgendamentoInput, type CategoriaAgendamento, type Cliente } from "@/lib/api";
import { CATEGORIA_CFG } from "./AgendaItem";

/**
 * Modal de criação/edição de compromisso, no mesmo padrão do
 * `ClienteFormDialog`: usa os primitivos `Dialog` do Design System.
 *
 * O backend (`Agendamento`) não tem relação com `Cliente` — só um campo de
 * texto livre `pessoa`. Por isso o campo "Cliente*" aqui é um select com os
 * clientes reais cadastrados (via `clientesApi.list`), e ao salvar o nome do
 * cliente escolhido é gravado nesse campo `pessoa` já existente. Nenhuma API
 * nova, nenhum dado inventado — só garante que todo compromisso aponte para
 * um cliente cadastrado, em vez de texto livre.
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

function valoresIniciais(compromisso: Agendamento | null, clientes: Cliente[], dataPadrao: string): CompromissoFormValues {
  if (compromisso) {
    const clienteCorrespondente = clientes.find((c) => c.nome === compromisso.pessoa);
    return {
      titulo: compromisso.titulo,
      clienteId: clienteCorrespondente ? clienteCorrespondente.id : "",
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
  const [valores, setValores] = useState<CompromissoFormValues>(() => valoresIniciais(compromisso, [], dataPadrao));
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setCarregandoClientes(true);
    clientesApi
      .list({ tamanho: 100 })
      .then((resposta) => setClientes(resposta.conteudo))
      .finally(() => setCarregandoClientes(false));
  }, [aberto]);

  useEffect(() => {
    if (aberto) setValores(valoresIniciais(compromisso, clientes, dataPadrao));
  }, [aberto, compromisso, clientes, dataPadrao]);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    const clienteEscolhido = clientes.find((c) => c.id === valores.clienteId);
    if (!clienteEscolhido) return;

    setSalvando(true);
    try {
      await aoSalvar({
        titulo: valores.titulo,
        pessoa: clienteEscolhido.nome,
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
              <select
                id="compromisso-cliente"
                required
                value={valores.clienteId}
                onChange={(e) => setValores((v) => ({ ...v, clienteId: Number(e.target.value) }))}
                disabled={carregandoClientes}
                className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none orbis-transition hover:border-border-strong focus:border-ring focus:ring-4 focus:ring-ring/15 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="" disabled>
                  {carregandoClientes ? "Carregando clientes…" : "Selecione um cliente"}
                </option>
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>{c.nome}</option>
                ))}
              </select>
              {!carregandoClientes && clientes.length === 0 && (
                <p className="text-xs text-muted-foreground">Nenhum cliente cadastrado ainda. Cadastre um cliente primeiro.</p>
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

            <div className="space-y-1">
              <Label htmlFor="compromisso-categoria">Tipo</Label>
              <select
                id="compromisso-categoria"
                value={valores.categoria}
                onChange={(e) => setValores((v) => ({ ...v, categoria: e.target.value as CategoriaAgendamento }))}
                className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none orbis-transition hover:border-border-strong focus:border-ring focus:ring-4 focus:ring-ring/15"
              >
                {(Object.keys(CATEGORIA_CFG) as CategoriaAgendamento[]).map((categoria) => (
                  <option key={categoria} value={categoria}>{CATEGORIA_CFG[categoria].rotulo}</option>
                ))}
              </select>
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
