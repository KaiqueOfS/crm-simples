import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/ui/avatar-inicial";
import { chaveComOffset, estaAtrasado, eHoje, formatarData, HOJE } from "@/lib/datas";
import { clientesApi, type Cliente } from "@/lib/api";


/**
 * Gestão de clientes: lista com busca/filtro, painel de atenções (pendências
 * que exigem ação) e detalhe do cliente com histórico, próxima ação e
 * observações.
 */

type Status      = "NOVO" | "CONTATADO" | "NEGOCIACAO" | "PROPOSTA" | "GANHO" | "PERDIDO";
type TipoAcao     = "ligar" | "orcamento" | "cobrar" | "visita" | "retorno";
type TipoHistorico = "cadastro" | "servico" | "orcamento" | "pagamento" | "observacao" | "contato";

interface ProximaAcao {
  tipo: TipoAcao;
  descricao: string;
  prazo: string; // chave YYYY-MM-DD
}

interface ItemHistorico {
  id: number;
  tipo: TipoHistorico;
  descricao: string;
  data: string;
  valor?: string;
}

interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  email?: string;
  status: Status;
  ultimoContato: string;
  proximaAcao?: ProximaAcao;
  historico: ItemHistorico[];
  observacoes?: string;
}

const STATUS_CFG: Record<Status, { rotulo: string; selo: string }> = {
  NOVO:       { rotulo: "Novo contato",     selo: "bg-orbis-blue-tint text-orbis-blue"     },
  CONTATADO:  { rotulo: "Aguardando resp.", selo: "bg-orbis-purple-tint text-orbis-purple" },
  NEGOCIACAO: { rotulo: "Em conversa",      selo: "bg-orbis-amber-tint text-orbis-amber"   },
  PROPOSTA:   { rotulo: "Proposta enviada", selo: "bg-orbis-blue-tint text-orbis-blue"     },
  GANHO:      { rotulo: "Fechado ✓",        selo: "bg-orbis-green-tint text-orbis-green"   },
  PERDIDO:    { rotulo: "Não fechou",       selo: "bg-orbis-red-tint text-orbis-red"       },
};

const ACAO_CFG: Record<TipoAcao, { rotulo: string; icone: string; cor: string }> = {
  ligar:     { rotulo: "Ligar",            icone: "📞", cor: "text-orbis-blue"   },
  orcamento: { rotulo: "Enviar orçamento", icone: "📄", cor: "text-orbis-amber"  },
  cobrar:    { rotulo: "Cobrar",           icone: "💰", cor: "text-orbis-red"    },
  visita:    { rotulo: "Visita técnica",   icone: "🔧", cor: "text-orbis-green"  },
  retorno:   { rotulo: "Retorno",          icone: "↩️", cor: "text-orbis-purple" },
};

const HISTORICO_CFG: Record<TipoHistorico, { icone: string }> = {
  cadastro:   { icone: "👤" },
  servico:    { icone: "🔧" },
  orcamento:  { icone: "📄" },
  pagamento:  { icone: "💰" },
  observacao: { icone: "📝" },
  contato:    { icone: "📞" },
};

export default function Clientes(){

 const [clientes,setClientes] = useState<Cliente[]>([]);
 const [carregando,setCarregando] = useState(true);


 useEffect(()=>{
   carregarClientes();
 },[]);


 async function carregarClientes(){

   try{

     const resposta = await clientesApi.list();

     setClientes(resposta.conteudo);

   }catch(erro){

     console.error(erro);

   }finally{

     setCarregando(false);

   }

 }


 return (
   ...
 )

}

/* ─── Painel de atenção ──────────────────────────────────── */
interface Alerta {
  tipo: "vencido" | "semRetorno" | "orcamento" | "atrasado";
  cliente: string;
  descricao: string;
}

function montarAlertas(clientes: Cliente[]): Alerta[] {
  const alertas: Alerta[] = [];

  clientes.forEach((cliente) => {
    const acao = cliente.proximaAcao;

    if (acao && estaAtrasado(acao.prazo)) {
      alertas.push(
        acao.tipo === "cobrar"
          ? { tipo: "vencido", cliente: cliente.nome, descricao: `Pagamento vencido — ${acao.descricao}` }
          : { tipo: "atrasado", cliente: cliente.nome, descricao: acao.descricao },
      );
    }

    const diasSemContato = Math.floor(
      (HOJE.getTime() - new Date(`${cliente.ultimoContato}T12:00:00`).getTime()) / 86_400_000,
    );
    if (diasSemContato >= 7) {
      alertas.push({ tipo: "semRetorno", cliente: cliente.nome, descricao: `Sem contato há ${diasSemContato} dias` });
    }

    if (cliente.status === "PROPOSTA") {
      alertas.push({ tipo: "orcamento", cliente: cliente.nome, descricao: "Orçamento aguardando resposta" });
    }
  });

  return alertas;
}

const ALERTA_CFG: Record<Alerta["tipo"], { icone: string; selo: string; rotulo: string }> = {
  vencido:    { icone: "💰", selo: "bg-orbis-red-tint text-orbis-red",       rotulo: "Pagamento vencido" },
  semRetorno: { icone: "↩️", selo: "bg-orbis-purple-tint text-orbis-purple", rotulo: "Sem retorno"       },
  orcamento:  { icone: "📄", selo: "bg-orbis-amber-tint text-orbis-amber",   rotulo: "Orçamento pendente" },
  atrasado:   { icone: "⚠️", selo: "bg-orbis-red-tint text-orbis-red",       rotulo: "Tarefa atrasada"   },
};

function PainelAlertas({ alertas }: { alertas: Alerta[] }) {
  if (alertas.length === 0) return null;

  return (
    <div className="mb-6 overflow-hidden rounded-2xl border border-orbis-red-tint bg-card">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <span className="text-base">⚠️</span>
        <h2 className="text-sm font-semibold text-foreground">Atenções</h2>
        <span className="ml-auto rounded-full bg-orbis-red-tint px-2 py-0.5 text-[11px] font-semibold text-orbis-red">
          {alertas.length}
        </span>
      </div>
      <div className="divide-y divide-border">
        {alertas.map((alerta, indice) => {
          const cfg = ALERTA_CFG[alerta.tipo];
          return (
            <div key={indice} className="flex cursor-pointer items-center gap-3 px-5 py-3 orbis-transition hover:bg-accent">
              <span className="shrink-0 text-base">{cfg.icone}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{alerta.cliente}</p>
                <p className="truncate text-xs text-muted-foreground">{alerta.descricao}</p>
              </div>
              <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.selo)}>
                {cfg.rotulo}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SeloStatus({ status }: { status: Status }) {
  const cfg = STATUS_CFG[status];
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", cfg.selo)}>{cfg.rotulo}</span>;
}

/* ─── Painel de detalhe do cliente ───────────────────────── */
function DetalheCliente({ cliente, aoFechar }: { cliente: Cliente; aoFechar: () => void }) {
  const [aba, setAba] = useState<"historico" | "acao" | "obs">("historico");

  const acao = cliente.proximaAcao;
  const acaoCfg = acao ? ACAO_CFG[acao.tipo] : null;
  const acaoAtrasada = acao && estaAtrasado(acao.prazo);
  const acaoHoje = acao && eHoje(acao.prazo);

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

        {/* Destaque da próxima ação */}
        {acao && acaoCfg && (
          <div className={cn(
            "mx-5 mt-4 rounded-xl border p-3",
            acaoAtrasada ? "border-orbis-red-tint bg-orbis-red-tint"
              : acaoHoje ? "border-orbis-amber-tint bg-orbis-amber-tint"
                : "border-border bg-surface-1",
          )}>
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Próxima ação</p>
            <div className="flex items-center gap-2">
              <span className="text-base">{acaoCfg.icone}</span>
              <div className="min-w-0 flex-1">
                <p className={cn("text-sm font-medium", acaoCfg.cor)}>{acao.descricao}</p>
                <p className={cn("text-xs", acaoAtrasada ? "font-medium text-orbis-red" : "text-muted-foreground")}>
                  {acaoAtrasada ? "⚠️ Atrasada — " : acaoHoje ? "📅 Hoje — " : ""}
                  {formatarData(acao.prazo)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Abas */}
        <div className="flex gap-1 border-b border-border px-5 pt-4">
          {([
            { chave: "historico", rotulo: "Histórico"    },
            { chave: "acao",      rotulo: "Próxima ação" },
            { chave: "obs",       rotulo: "Observações"  },
          ] as const).map((item) => (
            <button
              key={item.chave}
              onClick={() => setAba(item.chave)}
              className={cn(
                "rounded-t-lg px-3 py-1.5 text-xs font-medium orbis-transition",
                aba === item.chave ? "border-b-2 border-orbis-blue text-orbis-blue" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.rotulo}
            </button>
          ))}
        </div>

        {/* Conteúdo da aba */}
        <div className="flex-1 overflow-y-auto p-5">

          {aba === "historico" && (
            <div className="relative">
              <div className="absolute bottom-0 left-3.5 top-0 w-px bg-border" />
              <div className="space-y-4">
                {[...cliente.historico].reverse().map((item) => (
                  <div key={item.id} className="flex items-start gap-3 pl-1">
                    <div className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-card text-sm">
                      {HISTORICO_CFG[item.tipo].icone}
                    </div>
                    <div className="min-w-0 flex-1 pt-0.5">
                      <p className="text-sm font-medium text-foreground">{item.descricao}</p>
                      <div className="mt-0.5 flex items-center gap-2">
                        <p className="text-xs text-muted-foreground">{formatarData(item.data)}</p>
                        {item.valor && <span className="text-xs font-medium text-orbis-green">{item.valor}</span>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {aba === "acao" && (
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-muted-foreground">Tipo de ação</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.entries(ACAO_CFG) as [TipoAcao, typeof ACAO_CFG[TipoAcao]][]).map(([chave, cfg]) => (
                    <div
                      key={chave}
                      className={cn(
                        "flex cursor-pointer items-center gap-2 rounded-xl border p-3 orbis-transition",
                        acao?.tipo === chave ? "border-orbis-blue-tint bg-orbis-blue-tint" : "border-border hover:bg-accent",
                      )}
                    >
                      <span className="text-base">{cfg.icone}</span>
                      <span className={cn("text-xs font-medium", acao?.tipo === chave ? "text-orbis-blue" : "text-foreground")}>
                        {cfg.rotulo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {acao && (
                <>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Descrição</label>
                    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-foreground">{acao.descricao}</div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-muted-foreground">Prazo</label>
                    <div className="rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-foreground">{formatarData(acao.prazo)}</div>
                  </div>
                </>
              )}

              <div className="flex items-center justify-between rounded-xl border border-border bg-surface-1 p-3">
                <div>
                  <p className="text-xs font-medium text-foreground">Último contato</p>
                  <p className="text-xs text-muted-foreground">{formatarData(cliente.ultimoContato)}</p>
                </div>
              </div>
            </div>
          )}

          {aba === "obs" && (
            cliente.observacoes ? (
              <div className="rounded-xl border border-border bg-surface-1 p-4 text-sm leading-relaxed text-foreground">
                {cliente.observacoes}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="mb-2 text-2xl">📝</p>
                <p className="text-sm text-muted-foreground">Nenhuma observação cadastrada</p>
              </div>
            )
          )}
        </div>

        {/* Ações do rodapé */}
        <div className="flex gap-2 border-t border-border p-4">
          <button className="flex-1 rounded-xl bg-primary py-2.5 text-sm font-medium text-primary-foreground orbis-transition hover:opacity-90">
            WhatsApp
          </button>
          <button className="flex-1 rounded-xl border border-border bg-background py-2.5 text-sm font-medium text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
            Editar
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Card de cliente na lista ───────────────────────────── */
function CardCliente({ cliente, aoClicar }: { cliente: Cliente; aoClicar: () => void }) {
  const acao = cliente.proximaAcao;
  const acaoCfg = acao ? ACAO_CFG[acao.tipo] : null;
  const acaoEmAlerta = acao && (estaAtrasado(acao.prazo) || eHoje(acao.prazo));

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

        {acao && acaoCfg && (
          <div className={cn("mt-2 flex items-center gap-1.5 rounded-lg px-2 py-1.5", acaoEmAlerta ? "bg-orbis-red-tint" : "bg-surface-1")}>
            <span className="text-xs">{acaoCfg.icone}</span>
            <p className={cn("truncate text-xs", acaoEmAlerta ? "font-medium text-orbis-red" : "text-muted-foreground")}>
              {acao.descricao}
            </p>
            <span className={cn("ml-auto shrink-0 text-[10px]", acaoEmAlerta ? "font-semibold text-orbis-red" : "text-muted-foreground")}>
              {formatarData(acao.prazo)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────── */
const [clientes, setClientes] = useState<Cliente[]>([]);
useEffect(() => {
  carregarClientes();
}, []);
async function carregarClientes() {
  try {
    const resposta = await api.get("/clientes");
    setClientes(resposta.data);
  } catch (erro) {
    console.error("Erro ao carregar clientes", erro);
  }
}
  const [busca, setBusca] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<Cliente | null>(null);
  const [filtroStatus, setFiltroStatus] = useState<Status | "TODOS">("TODOS");

  const alertas = montarAlertas(clientes);

  const filtrados = clientes.filter((cliente) => {
    const buscaOk = !busca
      || cliente.nome.toLowerCase().includes(busca.toLowerCase())
      || cliente.telefone.includes(busca);
    const statusOk = filtroStatus === "TODOS" || cliente.status === filtroStatus;
    return buscaOk && statusOk;
  });

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Clientes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">{clientes.length} clientes no funil</p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground orbis-transition hover:opacity-90">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo cliente
        </button>
      </div>

      <PainelAlertas alertas={alertas} />

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
          {(["TODOS", "NOVO", "CONTATADO", "NEGOCIACAO", "PROPOSTA", "GANHO", "PERDIDO"] as const).map((status) => (
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

      {/* Lista de clientes */}
      {filtrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <p className="mb-2 text-3xl">👥</p>
          <p className="text-sm font-medium text-foreground">
            {busca ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            {busca ? "Tente outro termo" : "Adicione seu primeiro cliente"}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {filtrados.map((cliente) => (
            <CardCliente key={cliente.id} cliente={cliente} aoClicar={() => setClienteSelecionado(cliente)} />
          ))}
        </div>
      )}

      {clienteSelecionado && (
        <DetalheCliente cliente={clienteSelecionado} aoFechar={() => setClienteSelecionado(null)} />
      )}
    </div>
  );
}