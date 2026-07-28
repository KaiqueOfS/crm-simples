import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar-inicial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { clientesApi, STATUS_LIST, type Cliente, type Status } from "@/lib/api";

/**
 * Gestão de clientes: listagem, busca, filtro por status, cadastro, edição,
 * exclusão e mudança de etapa no funil — tudo integrado à API real.
 *
 * Histórico, próxima ação e painel de atenções ainda não têm suporte no
 * backend. Quando existirem, entram como um novo bloco dentro de
 * `DetalheCliente` sem precisar mexer no restante da página.
 */

const STATUS_CFG: Record<Status, { rotulo: string; selo: string }> = {
  NOVO:       { rotulo: "Novo contato",     selo: "bg-orbis-blue-tint text-orbis-blue"     },
  CONTATADO:  { rotulo: "Aguardando resp.", selo: "bg-orbis-purple-tint text-orbis-purple" },
  NEGOCIACAO: { rotulo: "Em conversa",      selo: "bg-orbis-amber-tint text-orbis-amber"   },
  PROPOSTA:   { rotulo: "Proposta enviada", selo: "bg-orbis-blue-tint text-orbis-blue"     },
  GANHO:      { rotulo: "Fechado ✓",        selo: "bg-orbis-green-tint text-orbis-green"   },
  PERDIDO:    { rotulo: "Não fechou",       selo: "bg-orbis-red-tint text-orbis-red"       },
};

type ClienteFormValues = {
  nome: string;
  telefone: string;
  email: string;
  observacoes: string;
};

const FORM_VAZIO: ClienteFormValues = { nome: "", telefone: "", email: "", observacoes: "" };

export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [totalClientes, setTotalClientes] = useState(0);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState<Status | "TODOS">("TODOS");

  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [clienteEmEdicao, setClienteEmEdicao] = useState<Cliente | null>(null);
  const [formAberto, setFormAberto] = useState(false);
  const [clienteParaExcluir, setClienteParaExcluir] = useState<Cliente | null>(null);

  useEffect(() => {
    void carregarClientes();
  }, [busca, filtroStatus]);

  async function carregarClientes() {
    setCarregando(true);
    setErro(null);
    try {
      const resposta = await clientesApi.list({
        tamanho: 50,
        termo: busca || undefined,
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
    setClienteSelecionado(null);
  }

  async function salvarCliente(valores: ClienteFormValues) {
    try {
      if (clienteEmEdicao) {
        const atualizado = await clientesApi.update(clienteEmEdicao.id, { ...valores, status: clienteEmEdicao.status });
        setClientes((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
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
      setClienteParaExcluir(null);
      setClienteSelecionado(null);
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

  const semResultado = busca !== "" || filtroStatus !== "TODOS";

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{totalClientes} clientes no funil</p>
        </div>
        <button
          onClick={abrirCriacao}
          className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground orbis-transition hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo cliente
        </button>
      </div>

      {/* Filtros */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar cliente…"
            className="h-9 w-full rounded-xl border border-border bg-card pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring orbis-transition"
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

      {/* Conteúdo */}
      {erro ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orbis-red-tint py-20 text-center">
          <p className="mb-2 text-3xl">⚠️</p>
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
          <p className="mb-2 text-3xl">👥</p>
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
            <CardCliente key={cliente.id} cliente={cliente} aoClicar={() => setClienteSelecionado(cliente)} />
          ))}
        </div>
      )}

      {clienteSelecionado && (
        <DetalheCliente
          cliente={clienteSelecionado}
          aoFechar={() => setClienteSelecionado(null)}
          aoEditar={() => abrirEdicao(clienteSelecionado)}
          aoExcluir={() => setClienteParaExcluir(clienteSelecionado)}
          aoMudarStatus={(status) => mudarStatus(clienteSelecionado, status)}
        />
      )}

      {formAberto && (
        <FormularioCliente
          cliente={clienteEmEdicao}
          aoFechar={() => { setFormAberto(false); setClienteEmEdicao(null); }}
          aoSalvar={salvarCliente}
        />
      )}

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
function CardCliente({ cliente, aoClicar }: { cliente: Cliente; aoClicar: () => void }) {
  return (
    <div
      onClick={aoClicar}
      className="flex cursor-pointer items-start gap-3 border-b border-border px-4 py-4 orbis-transition last:border-b-0 hover:bg-accent sm:px-5"
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

/* ─── Painel de detalhe do cliente ───────────────────────── */
function DetalheCliente({
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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={aoFechar} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">

        {/* Cabeçalho */}
        <div className="flex items-start gap-3 border-b border-border p-5">
          <Avatar nome={cliente.nome} tamanho="lg" />
          <div className="min-w-0 flex-1">
            <p className="text-base font-semibold text-foreground">{cliente.nome}</p>
            <p className="text-sm text-muted-foreground">{cliente.telefone}</p>
            {cliente.email && <p className="text-xs text-muted-foreground">{cliente.email}</p>}
            <div className="mt-1.5"><SeloStatus status={cliente.status} /></div>
          </div>
          <button onClick={aoFechar} className="shrink-0 rounded-lg p-1.5 text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-4 overflow-y-auto p-5">

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Etapa do funil</label>
            <select
              value={cliente.status}
              onChange={(e) => aoMudarStatus(e.target.value as Status)}
              className="h-9 w-full rounded-lg border border-border bg-input px-3 text-sm text-foreground outline-none orbis-transition hover:border-border-strong focus:border-ring focus:ring-4 focus:ring-ring/15"
            >
              {STATUS_LIST.map((status) => (
                <option key={status} value={status}>{STATUS_CFG[status].rotulo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground">Observações</label>
            {cliente.observacoes ? (
              <div className="rounded-xl border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">
                {cliente.observacoes}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="mb-2 text-2xl">📝</p>
                <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada</p>
              </div>
            )}
          </div>

          {/*
            Histórico e próxima ação entram aqui quando o backend passar a
            suportar esses dados — este bloco pode virar um novo conjunto de
            abas sem precisar alterar o restante da página.
          */}
        </div>

        {/* Ações do rodapé */}
        <div className="flex gap-2 border-t border-border p-4">
          <Button className="flex-1" onClick={aoEditar}>Editar</Button>
          <Button variant="danger" className="flex-1" onClick={aoExcluir}>Excluir</Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Formulário de criação/edição ───────────────────────── */
function FormularioCliente({
  cliente,
  aoFechar,
  aoSalvar,
}: {
  cliente: Cliente | null;
  aoFechar: () => void;
  aoSalvar: (valores: ClienteFormValues) => Promise<void>;
}) {
  const [valores, setValores] = useState<ClienteFormValues>(
    cliente
      ? { nome: cliente.nome, telefone: cliente.telefone, email: cliente.email ?? "", observacoes: cliente.observacoes ?? "" }
      : FORM_VAZIO,
  );
  const [salvando, setSalvando] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={aoFechar} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">

        <div className="flex items-center justify-between border-b border-border p-5">
          <p className="text-base font-semibold text-foreground">{cliente ? "Editar cliente" : "Novo cliente"}</p>
          <button onClick={aoFechar} className="shrink-0 rounded-lg p-1.5 text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={aoSubmeter} className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="space-y-1">
            <Label htmlFor="nome">Nome</Label>
            <Input
              id="nome"
              required
              minLength={2}
              maxLength={100}
              value={valores.nome}
              onChange={(e) => setValores((v) => ({ ...v, nome: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="telefone">Telefone</Label>
            <Input
              id="telefone"
              required
              minLength={8}
              maxLength={20}
              value={valores.telefone}
              onChange={(e) => setValores((v) => ({ ...v, telefone: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={valores.email}
              onChange={(e) => setValores((v) => ({ ...v, email: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              maxLength={500}
              rows={3}
              value={valores.observacoes}
              onChange={(e) => setValores((v) => ({ ...v, observacoes: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={aoFechar}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
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
