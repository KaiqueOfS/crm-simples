import { useEffect, useState, type FormEvent } from "react";
import { Building2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  clientesApi,
  configuracaoUsuarioApi,
  type Agendamento,
  type AgendamentoInput,
  type CategoriaAgendamento,
  type Cliente,
  type LocalAtendimento,
} from "@/lib/api";
import { cn } from "@/lib/utils";
import { formatarHora } from "@/lib/datas";
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
  localAtendimento: LocalAtendimento | null;
};

function valoresIniciais(compromisso: Agendamento | null, dataPadrao: string): CompromissoFormValues {
  if (compromisso) {
    return {
      titulo: compromisso.titulo,
      clienteId: compromisso.clienteId ?? "",
      data: compromisso.data,
      hora: formatarHora(compromisso.hora),
      categoria: compromisso.categoria,
      localAtendimento: compromisso.localAtendimento,
    };
  }
  return { titulo: "", clienteId: "", data: dataPadrao, hora: "09:00", categoria: "atendimento", localAtendimento: null };
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
  const [localObrigatorio, setLocalObrigatorio] = useState(false);

  // Só usuários AMBOS escolhem o local por compromisso — NO_ESTABELECIMENTO/
  // EXTERNO nem veem a pergunta, o backend resolve sozinho (ver
  // AgendamentoService.resolverLocalAtendimento). `null` enquanto carrega
  // ou se a conta ainda não tem configuração salva — nesse caso o seletor
  // fica oculto e o backend decide (ou exige o valor, se vier ausente).
  const [mostrarSeletorLocal, setMostrarSeletorLocal] = useState(false);

  useEffect(() => {
    if (!aberto) return;
    setCarregandoClientes(true);
    clientesApi
      .list({ tamanho: 100 })
      .then((resposta) => setClientes(resposta.conteudo))
      .finally(() => setCarregandoClientes(false));

    configuracaoUsuarioApi
      .get()
      .then((configuracao) => setMostrarSeletorLocal(configuracao.tipoAtendimento === "AMBOS"))
      .catch(() => setMostrarSeletorLocal(false));
  }, [aberto]);

  useEffect(() => {
    if (aberto) {
      setValores(valoresIniciais(compromisso, dataPadrao));
      setClienteObrigatorio(false);
      setLocalObrigatorio(false);
    }
  }, [aberto, compromisso, dataPadrao]);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    const clienteEscolhido = clientes.find((c) => c.id === valores.clienteId);
    if (!clienteEscolhido) {
      setClienteObrigatorio(true);
      return;
    }
    if (mostrarSeletorLocal && !valores.localAtendimento) {
      setLocalObrigatorio(true);
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
        localAtendimento: valores.localAtendimento ?? undefined,
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

            {mostrarSeletorLocal && (
              <div className="space-y-1.5">
                <Label>Local de atendimento *</Label>
                <div role="radiogroup" aria-label="Local de atendimento" className="flex flex-wrap gap-2">
                  {(
                    [
                      { valor: "ESTABELECIMENTO" as LocalAtendimento, icone: Building2, rotulo: "Meu estabelecimento" },
                      { valor: "EXTERNO" as LocalAtendimento, icone: MapPin, rotulo: "Atendimento externo" },
                    ]
                  ).map(({ valor, icone: Icone, rotulo }) => {
                    const selecionado = valores.localAtendimento === valor;
                    return (
                      <button
                        key={valor}
                        type="button"
                        role="radio"
                        aria-checked={selecionado}
                        onClick={() => {
                          setValores((v) => ({ ...v, localAtendimento: valor }));
                          setLocalObrigatorio(false);
                        }}
                        className={cn(
                          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium orbis-transition",
                          selecionado
                            ? "border-transparent bg-orbis-blue-tint text-orbis-blue"
                            : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
                        )}
                      >
                        <Icone className="h-3.5 w-3.5" strokeWidth={1.75} />
                        {rotulo}
                      </button>
                    );
                  })}
                </div>
                {localObrigatorio && (
                  <p className="text-xs text-destructive">Selecione onde este atendimento vai acontecer.</p>
                )}
              </div>
            )}
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
