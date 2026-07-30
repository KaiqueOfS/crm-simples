import { useEffect, useState } from "react";
import { AlertTriangle, ChevronDown, FileText, MessageCircle, Plus, Search, Users, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar-inicial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ClienteFormDialog, type ClienteFormValues } from "@/components/clientes/ClienteFormDialog";
import { SecaoProximosCompromissos } from "@/components/clientes/SecaoProximosCompromissos";
import { clientesApi, STATUS_LIST, type Cliente, type Status } from "@/lib/api";
import { linkWhatsapp } from "@/lib/utils/whatsapp";

/**
 * Tela operacional principal: listagem, busca, filtro por status, cadastro,
 * edição, exclusão e mudança de etapa no funil — tudo integrado à API real.
 *
 * Layout em split-view a partir do breakpoint `lg`: lista à esquerda, painel
 * de detalhes fixo à direita. Em telas menores o detalhe abre como bottom
 * sheet. O conteúdo do detalhe fica isolado em `DetalheConteudo`: cabeçalho
 * (nome, status editável, telefone) → informações (e-mail, quando existir)
 * → observações → ações rápidas (WhatsApp, Editar). Histórico, próxima ação,
 * arquivos e integração com Agenda/Financeiro entram como novos blocos nesse
 * mesmo padrão quando o backend passar a suportar esses dados.
 */

const STATUS_CFG: Record<Status, { rotulo: string; selo: string }> = {
  NOVO:       { rotulo: "Novo",        selo: "bg-orbis-blue-tint text-orbis-blue"     },
  CONTATADO:  { rotulo: "Contatado",   selo: "bg-orbis-purple-tint text-orbis-purple" },
  NEGOCIACAO: { rotulo: "Negociação",  selo: "bg-orbis-amber-tint text-orbis-amber"   },
  PROPOSTA:   { rotulo: "Proposta",    selo: "bg-orbis-blue-tint text-orbis-blue"     },
  GANHO:      { rotulo: "Ganho",       selo: "bg-orbis-green-tint text-orbis-green"   },
  PERDIDO:    { rotulo: "Perdido",     selo: "bg-orbis-red-tint text-orbis-red"       },
};

/** Formata o `createdAt` (já vindo da API) para "Cliente desde 15 de jan. de 2026". */
function clienteDesde(createdAt: string): string {
  return new Date(createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });
}

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [buscaEfetiva, setBuscaEfetiva] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<Status | "TODOS">("TODOS");

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);

  // Pesquisa instantânea: aguarda uma pequena pausa de digitação antes de
  // consultar a API, para não disparar uma requisição a cada tecla.
  useEffect(() => {
    const id = setTimeout(() => setBuscaEfetiva(busca), 300);
    return () => clearTimeout(id);
  }, [busca]);

  useEffect(() => {
    void carregarClientes();
  }, [buscaEfetiva, filtroStatus]);

  async function carregarClientes() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await clientesApi.list({
        tamanho: 50,
        termo: buscaEfetiva || undefined,
        status: filtroStatus === "TODOS" ? undefined : filtroStatus,
      });
      setClientes(resposta.conteudo);
      setTotalClientes(resposta.totalElementos);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar os clientes.");
    } finally {
      setCarregando(false);
    }
  }

  function abrirCriacao() {
    setClienteEmEdicao(null);
    setFormAberto(true);
  }

  function abrirEdicao(cliente: Cliente) {
    setClienteEmEdicao(cliente);
    setFormAberto(true);
  }

  async function salvarCliente(valores: ClienteFormValues) {
    try {
      if (clienteEmEdicao) {
        const atualizado = await clientesApi.update(clienteEmEdicao.id, { ...valores, status: clienteEmEdicao.status });
        setClientes((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
        setClienteSelecionado((atual) => (atual && atual.id === atualizado.id ? atualizado : atual));
        toast.success("Cliente atualizado");
      } else {
        const criado = await clientesApi.create({ ...valores, status: "NOVO" });
        setClientes((atual) => [criado, ...atual]);
        setTotalClientes((t) => t + 1);
        toast.success("Cliente cadastrado");
      }
      setFormAberto(false);
      setClienteEmEdicao(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o cliente.");
    }
  }

  async function confirmarExclusao() {
    if (!clienteParaExcluir) return;
    try {
      await clientesApi.remove(clienteParaExcluir.id);
      setClientes((atual) => atual.filter((c) => c.id !== clienteParaExcluir.id));
      setTotalClientes((t) => Math.max(0, t - 1));
      toast.success("Cliente removido");
      setClienteSelecionado((atual) => (atual && atual.id === clienteParaExcluir.id ? null : atual));
      setClienteParaExcluir(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o cliente.");
    }
  }

  async function mudarStatus(cliente: Cliente, status: Status) {
    try {
      const atualizado = await clientesApi.updateStatus(cliente.id, status);
      setClientes((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
      setClienteSelecionado((atual) => (atual && atual.id === atualizado.id ? atualizado : atual));
      toast.success("Status atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível atualizar o status.");
    }
  }

  const semResultado = buscaEfetiva !== "" || filtroStatus !== "TODOS";

  return (
    <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{totalClientes} clientes no funil</p>
        </div>
        <Button onClick={abrirCriacao} variant="outline" size="sm" className="w-fit gap-1.5">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Novo cliente
        </Button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente…"
            className="h-9 pl-9"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1 sm:pb-0">
          {(["TODOS", ...STATUS_LIST] as const).map((status) => (
            <button
              key={status}
              onClick={() => setFiltroStatus(status)}
              className={cn(
                "shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium orbis-transition",
                filtroStatus === status
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              {status === "TODOS" ? "Todos" : STATUS_CFG[status].rotulo}
            </button>
          ))}
        </div>
      </div>

      {/* Lista + painel lateral */}
      <div className="grid gap-4 lg:grid-cols-[380px_1fr] lg:items-start">

        {/* Lista */}
        <div>
          {erro ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orbis-red-tint py-20 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-orbis-red/70" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Não foi possível carregar os clientes</p>
              <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => void carregarClientes()}>
                Tentar novamente
              </Button>
            </div>
          ) : carregando ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <p className="text-sm text-muted-foreground">Carregando clientes…</p>
            </div>
          ) : clientes.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">
                {semResultado ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {semResultado ? "Tente outro termo ou filtro" : "Adicione seu primeiro cliente"}
              </p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              {clientes.map((cliente) => (
                <CardCliente
                  key={cliente.id}
                  cliente={cliente}
                  selecionado={cliente.id === clienteSelecionado?.id}
                  aoClicar={() => setClienteSelecionado(cliente)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Painel lateral de detalhes (desktop) */}
        <div className="hidden overflow-hidden rounded-2xl border border-border bg-card lg:sticky lg:top-6 lg:block">
          {clienteSelecionado ? (
            <DetalheConteudo
              cliente={clienteSelecionado}
              aoFechar={() => setClienteSelecionado(null)}
              aoEditar={() => abrirEdicao(clienteSelecionado)}
              aoExcluir={() => setClienteParaExcluir(clienteSelecionado)}
              aoMudarStatus={(status) => mudarStatus(clienteSelecionado, status)}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Users className="mb-2 h-8 w-8 text-muted-foreground/40" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">Selecione um cliente para ver os detalhes</p>
            </div>
          )}
        </div>
      </div>

      {/* Detalhe em bottom sheet (mobile/tablet) */}
      {clienteSelecionado && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-0 lg:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setClienteSelecionado(null)} />
          <div className="relative z-10 flex max-h-[90vh] w-full flex-col overflow-hidden rounded-t-2xl border border-border bg-card">
            <DetalheConteudo
              cliente={clienteSelecionado}
              aoFechar={() => setClienteSelecionado(null)}
              aoEditar={() => abrirEdicao(clienteSelecionado)}
              aoExcluir={() => setClienteParaExcluir(clienteSelecionado)}
              aoMudarStatus={(status) => mudarStatus(clienteSelecionado, status)}
            />
          </div>
        </div>
      )}

      <ClienteFormDialog
        aberto={formAberto}
        cliente={clienteEmEdicao}
        aoFechar={() => { setFormAberto(false); setClienteEmEdicao(null); }}
        aoSalvar={salvarCliente}
      />

      {clienteParaExcluir && (
        <ConfirmarExclusao
          cliente={clienteParaExcluir}
          aoCancelar={() => setClienteParaExcluir(null)}
          aoConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}

function SeloStatus({ status }: { status: Status }) {
  const cfg = STATUS_CFG[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.selo)}>{cfg.rotulo}</span>;
}

/* ─── Card de cliente na lista ───────────────────────────── */
function CardCliente({ cliente, selecionado, aoClicar }: { cliente: Cliente; selecionado: boolean; aoClicar: () => void }) {
  return (
    <div
      onClick={aoClicar}
      className={cn(
        "flex cursor-pointer items-start gap-3 border-b border-border px-4 py-4 orbis-transition last:border-b-0 hover:bg-accent sm:px-5",
        selecionado && "bg-accent",
      )}
    >
      <Avatar nome={cliente.nome} tamanho="md" />
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-foreground">{cliente.nome}</p>
            <p className="text-xs text-muted-foreground">{cliente.telefone}</p>
          </div>
          <SeloStatus status={cliente.status} />
        </div>
      </div>
    </div>
  );
}

/* ─── Conteúdo do painel/detalhe do cliente ──────────────── */
function DetalheConteudo({
  cliente,
  aoFechar,
  aoEditar,
  aoExcluir,
  aoMudarStatus,
}: {
  cliente: Cliente;
  aoFechar: () => void;
  aoEditar: () => void;
  aoExcluir: () => void;
  aoMudarStatus: (status: Status) => void;
}) {
  return (
    <div className="flex max-h-[90vh] flex-col lg:max-h-[calc(100vh-6rem)]">

      {/* Cabeçalho: nome, status (editável) e telefone */}
      <div className="flex items-start gap-3 border-b border-border p-5">
        <Avatar nome={cliente.nome} tamanho="lg" />
        <div className="min-w-0 flex-1">
          <p className="text-base font-semibold text-foreground">{cliente.nome}</p>
          <div className="mt-1"><SeloStatusEditavel status={cliente.status} aoMudar={aoMudarStatus} /></div>
          <p className="mt-1.5 text-sm text-muted-foreground">{cliente.telefone}</p>
          <p className="mt-0.5 text-[11px] text-muted-foreground/60">Cliente desde {clienteDesde(cliente.createdAt)}</p>
        </div>
        <button onClick={aoFechar} className="shrink-0 rounded-lg p-1.5 text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
          <X className="h-4 w-4" strokeWidth={1.75} />
        </button>
      </div>

      {/* Informações + observações */}
      <div className="flex-1 space-y-5 overflow-y-auto p-5">
        {cliente.email && (
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">E-mail</label>
            <p className="text-sm text-foreground">{cliente.email}</p>
          </div>
        )}
        <SecaoObservacoes cliente={cliente} />
        <SecaoProximosCompromissos clienteId={cliente.id} telefoneCliente={cliente.telefone} />
        {/*
          Próximas seções (histórico, arquivos e integração com Financeiro)
          entram aqui como novos blocos, seguindo o mesmo padrão de
          SecaoObservacoes/SecaoProximosCompromissos, assim que o backend
          passar a suportar esses dados.
        */}
      </div>

      {/* Ações rápidas */}
      <div className="flex flex-col gap-2 border-t border-border p-4">
        <div className="flex gap-2">
          <Button variant="outline" className="flex-1 gap-2" onClick={() => window.open(linkWhatsapp(cliente.telefone), "_blank", "noopener,noreferrer")}>
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            WhatsApp
          </Button>
          <Button className="flex-1" onClick={aoEditar}>Editar cliente</Button>
        </div>
        <button onClick={aoExcluir} className="self-center text-xs text-muted-foreground orbis-transition hover:text-orbis-red">
          Excluir cliente
        </button>
      </div>
    </div>
  );
}

function SeloStatusEditavel({ status, aoMudar }: { status: Status; aoMudar: (status: Status) => void }) {
  const cfg = STATUS_CFG[status];
  return (
    <div className="relative inline-flex">
      <select
        value={status}
        onChange={(e) => aoMudar(e.target.value as Status)}
        className={cn(
          "cursor-pointer appearance-none rounded-full py-0.5 pl-2 pr-5 text-[11px] font-medium outline-none orbis-transition hover:opacity-80",
          cfg.selo,
        )}
      >
        {STATUS_LIST.map((s) => (
          <option key={s} value={s}>{STATUS_CFG[s].rotulo}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-3 w-3 -translate-y-1/2" strokeWidth={2} />
    </div>
  );
}

function SecaoObservacoes({ cliente }: { cliente: Cliente }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-muted-foreground">Observações</label>
      {cliente.observacoes ? (
        <div className="rounded-xl border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">
          {cliente.observacoes}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <FileText className="mb-2 h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada</p>
        </div>
      )}
    </div>
  );
}

/* ─── Confirmação de exclusão ────────────────────────────── */
function ConfirmarExclusao({
  cliente,
  aoCancelar,
  aoConfirmar,
}: {
  cliente: Cliente;
  aoCancelar: () => void;
  aoConfirmar: () => Promise<void>;
}) {
  const [excluindo, setExcluindo] = useState(false);

  async function confirmar() {
    setExcluindo(true);
    try {
      await aoConfirmar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={aoCancelar} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Remover cliente</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tem certeza que deseja remover <strong>{cliente.nome}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" className="flex-1" onClick={() => void confirmar()} disabled={excluindo}>
            {excluindo ? "Removendo…" : "Remover"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
