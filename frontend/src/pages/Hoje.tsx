import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertTriangle, Calendar, CalendarDays, FileText, Undo2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { CATEGORIA_CFG } from "@/components/agenda/AgendaItem";
import { HOJE_CHAVE } from "@/lib/datas";
import { agendamentosApi, type Agendamento } from "@/lib/api";

/**
 * Meu Dia — central operacional diária do Orbis.
 * Responde "qual é minha próxima ação?", não "quais são todos os meus
 * compromissos?" (isso é responsabilidade da Agenda). Por isso mostra só o
 * próximo compromisso de hoje, vindo de `agendamentosApi` — a lista completa
 * fica só na Agenda.
 *
 * "Precisa de atenção" (cobranças/orçamentos) continua com dados de exemplo,
 * de propósito: ainda não existe API real para isso, e não deve se misturar
 * com compromissos.
 */

interface Pendencia {
  nome: string;
  descricao: string;
  tipo: "orcamento" | "atraso" | "retorno";
  valor?: string;
}

const BARRA_PENDENCIA: Record<Pendencia["tipo"], string> = {
  orcamento: "bg-orbis-amber",
  atraso:    "bg-orbis-red",
  retorno:   "bg-orbis-purple",
};

const VALOR_PENDENCIA: Record<Pendencia["tipo"], string> = {
  orcamento: "text-orbis-amber",
  atraso:    "text-orbis-red",
  retorno:   "text-foreground",
};

// Dados de exemplo — substituir quando existir API de cobranças/orçamentos.
const PENDENCIAS: Pendencia[] = [
  { nome: "Pedro Alves",     descricao: "Orçamento enviado · sem resposta", tipo: "orcamento", valor: "R$ 1.800" },
  { nome: "Marcos Ferreira", descricao: "Pagamento vencido há 3 dias",       tipo: "atraso",    valor: "R$ 800"   },
  { nome: "Construtora ABC", descricao: "Orçamento aguardando aprovação",    tipo: "orcamento", valor: "R$ 4.800" },
  { nome: "Fernanda Lima",   descricao: "Boleto vencido há 5 dias",          tipo: "atraso",    valor: "R$ 400"   },
  { nome: "Juliana Costa",   descricao: "Aguardando retorno há 2 dias",      tipo: "retorno"                      },
];

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function dataPorExtenso(): string {
  const texto = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function horaAtual(): string {
  const agora = new Date();
  return `${String(agora.getHours()).padStart(2, "0")}:${String(agora.getMinutes()).padStart(2, "0")}`;
}

/* ─── Skeleton discreto de carregamento ──────────────────── */
function SkeletonProximoCompromisso() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-4 h-2.5 w-36 animate-pulse rounded-full bg-surface-2" />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-2.5">
          <div className="h-9 w-20 animate-pulse rounded-lg bg-surface-2" />
          <div className="h-4 w-40 animate-pulse rounded-full bg-surface-2" />
          <div className="h-3 w-28 animate-pulse rounded-full bg-surface-2" />
        </div>
        <div className="h-8 w-24 animate-pulse rounded-xl bg-surface-2" />
      </div>
    </div>
  );
}

export default function Hoje() {
  const navigate = useNavigate();

  const [proximo, setProximo] = useState<Agendamento | null>(null);
  const [totalHoje, setTotalHoje] = useState(0);
  const [jaConcluidos, setJaConcluidos] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    void carregarProximoCompromisso();
  }, []);

  async function carregarProximoCompromisso() {
    setCarregando(true);
    setErro(null);
    try {
      const doDia = await agendamentosApi.list(HOJE_CHAVE);
      const ordenados = doDia.slice().sort((a, b) => a.hora.localeCompare(b.hora));
      const agora = horaAtual();
      const futuro = ordenados.find((c) => c.hora >= agora) ?? null;

      setTotalHoje(ordenados.length);
      setProximo(futuro);
      setJaConcluidos(ordenados.length > 0 && !futuro);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar seus compromissos.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {saudacao()}, tudo pronto para hoje?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dataPorExtenso()}</p>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Resumo do seu dia: compromissos, cobranças e pendências em um só lugar.
        </p>
      </div>

      {/* Métricas do dia */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Calendar}
          color="blue"
          label="Agenda hoje"
          value={totalHoje}
          sub={proximo ? `Próximo às ${proximo.hora}` : totalHoje > 0 ? "Todos concluídos" : "Nenhum hoje"}
        />
        <StatCard icon={Wallet}   color="red"    label="A receber"             value="R$ 1.200" sub="2 em atraso" />
        <StatCard icon={FileText} color="amber"  label="Orçamentos pendentes"  value={3}         sub="R$ 9.000 em aberto" />
        <StatCard icon={Undo2}    color="purple" label="Retornos"              value={2}         sub="Retorno pendente" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">

        {/* Coluna principal: próximo compromisso */}
        <div className="flex flex-col gap-4">
          {erro ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orbis-red-tint py-16 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-orbis-red/70" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Não foi possível carregar seus compromissos</p>
              <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => void carregarProximoCompromisso()}>
                Tentar novamente
              </Button>
            </div>
          ) : carregando ? (
            <SkeletonProximoCompromisso />
          ) : proximo ? (
            <div
              className="rounded-2xl border bg-orbis-blue-tint p-6"
              style={{ borderColor: "color-mix(in oklch, var(--orbis-blue) 22%, transparent)" }}
            >
              <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-orbis-blue">
                Próximo compromisso
              </p>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-light tracking-tight tabular-nums text-foreground">{proximo.hora}</p>
                  <p className="mt-2 text-lg font-medium text-foreground">{proximo.titulo}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <p className="text-sm text-muted-foreground">Cliente {proximo.pessoa}</p>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", CATEGORIA_CFG[proximo.categoria].selo)}>
                      {CATEGORIA_CFG[proximo.categoria].rotulo}
                    </span>
                  </div>
                </div>
                <Button variant="primary" size="sm" onClick={() => navigate(`/agenda?compromissoId=${proximo.id}`)}>
                  Ver detalhes
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
              <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">
                {jaConcluidos ? "Você já concluiu os compromissos de hoje." : "Você não possui compromissos para hoje."}
              </p>
            </div>
          )}
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-foreground">Precisa de atenção</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{PENDENCIAS.length} ações pendentes</p>
            </div>
            <div className="divide-y divide-border">
              {PENDENCIAS.map((item, indice) => (
                <div key={indice} className="flex items-center gap-3 px-5 py-3.5 orbis-transition hover:bg-accent">
                  <div className={cn("h-8 w-1 shrink-0 rounded-full", BARRA_PENDENCIA[item.tipo])} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{item.nome}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{item.descricao}</p>
                  </div>
                  {item.valor && (
                    <span className={cn("shrink-0 text-sm font-medium tabular-nums", VALOR_PENDENCIA[item.tipo])}>
                      {item.valor}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
