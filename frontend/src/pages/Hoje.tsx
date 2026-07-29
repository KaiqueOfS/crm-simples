import { useState } from "react";
import { Calendar, FileText, Undo2, Wallet, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";

/**
 * Central do Dia — primeira tela que o usuário vê ao entrar no Orbis.
 * Mostra o que precisa ser feito hoje: compromissos, cobranças e orçamentos
 * pendentes, sem exigir que o usuário procure essas informações em outra tela.
 */

type TipoTarefa = "compromisso" | "orcamento" | "cobranca" | "retorno";

interface Tarefa {
  hora: string;
  titulo: string;
  cliente: string;
  tipo: TipoTarefa;
  valor?: string;
}

interface Pendencia {
  nome: string;
  descricao: string;
  tipo: "orcamento" | "atraso" | "retorno";
  valor?: string;
}

const BARRA_TAREFA: Record<TipoTarefa, string> = {
  compromisso: "bg-orbis-blue",
  orcamento:   "bg-orbis-amber",
  cobranca:    "bg-orbis-red",
  retorno:     "bg-orbis-purple",
};

const SELO_TAREFA: Record<TipoTarefa, string> = {
  compromisso: "bg-orbis-blue-tint text-orbis-blue",
  orcamento:   "bg-orbis-amber-tint text-orbis-amber",
  cobranca:    "bg-orbis-red-tint text-orbis-red",
  retorno:     "bg-orbis-purple-tint text-orbis-purple",
};

const ROTULO_TAREFA: Record<TipoTarefa, string> = {
  compromisso: "Compromisso",
  orcamento:   "Orçamento",
  cobranca:    "Cobrança",
  retorno:     "Retorno",
};

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

// Dados de exemplo — serão substituídos pela API de agendamentos/clientes.
const TAREFAS: Tarefa[] = [
  { hora: "09:00", titulo: "Visita técnica",     cliente: "Roberto Silva",   tipo: "compromisso", valor: "R$ 280"   },
  { hora: "11:00", titulo: "Enviar orçamento",   cliente: "Ana Paula",       tipo: "orcamento",   valor: "R$ 2.400" },
  { hora: "14:00", titulo: "Instalação elétrica",cliente: "João Mendes",     tipo: "compromisso", valor: "R$ 350"   },
  { hora: "15:30", titulo: "Cobrar pagamento",   cliente: "Marcos Ferreira", tipo: "cobranca",    valor: "R$ 800"   },
  { hora: "17:00", titulo: "Retorno de ligação", cliente: "Juliana Costa",   tipo: "retorno"                        },
];

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

interface CardMetricaProps {
  icone: LucideIcon;
  rotulo: string;
  valor: string | number;
  detalhe?: string;
  corValor: string;
  corPonto: string;
  corFundoIcone: string;
}

function CardMetrica({ icone: Icone, rotulo, valor, detalhe, corValor, corPonto, corFundoIcone }: CardMetricaProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 orbis-transition hover:shadow-sm">
      <div className="flex items-center justify-between">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", corFundoIcone, corValor)}>
          <Icone className="h-4 w-4" strokeWidth={1.75} />
        </div>
        <div className={cn("h-1.5 w-1.5 rounded-full", corPonto)} />
      </div>
      <div>
        <p className={cn("text-2xl font-light tracking-tight tabular-nums", corValor)}>{valor}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{rotulo}</p>
        {detalhe && <p className="mt-1 text-[11px] text-muted-foreground/60">{detalhe}</p>}
      </div>
    </div>
  );
}

export default function Hoje() {
  const [tarefaSelecionada, setTarefaSelecionada] = useState<number | null>(null);
  const proximaTarefa = TAREFAS[0];

  function alternarTarefa(indice: number) {
    setTarefaSelecionada((atual) => (atual === indice ? null : indice));
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {saudacao()}, tudo pronto para hoje?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dataPorExtenso()}</p>
      </div>

      {/* Métricas do dia */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <CardMetrica icone={Calendar} rotulo="Compromissos hoje"    valor={TAREFAS.length} detalhe={`Próximo às ${proximaTarefa.hora}`} corValor="text-orbis-blue"   corPonto="bg-orbis-blue"   corFundoIcone="bg-orbis-blue-tint" />
        <CardMetrica icone={Wallet}   rotulo="Pagamentos a receber" valor="R$ 1.200"        detalhe="2 em atraso"                       corValor="text-orbis-red"    corPonto="bg-orbis-red"    corFundoIcone="bg-orbis-red-tint" />
        <CardMetrica icone={FileText} rotulo="Orçamentos pendentes" valor={3}               detalhe="R$ 9.000 em aberto"                corValor="text-orbis-amber"  corPonto="bg-orbis-amber"  corFundoIcone="bg-orbis-amber-tint" />
        <CardMetrica icone={Undo2}    rotulo="Clientes aguardando"  valor={2}               detalhe="Retorno pendente"                  corValor="text-orbis-purple" corPonto="bg-orbis-purple" corFundoIcone="bg-orbis-purple-tint" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">

        {/* Coluna principal */}
        <div className="flex flex-col gap-4">

          {/* Próximo compromisso em destaque */}
          <div
            className="rounded-2xl border bg-orbis-blue-tint p-5"
            style={{ borderColor: "color-mix(in oklch, var(--orbis-blue) 22%, transparent)" }}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-orbis-blue">
              Próximo compromisso
            </p>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-3xl font-light tracking-tight tabular-nums text-foreground">{proximaTarefa.hora}</p>
                <p className="mt-1 text-base font-medium text-foreground">{proximaTarefa.titulo}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Cliente {proximaTarefa.cliente}{proximaTarefa.valor ? ` · ${proximaTarefa.valor}` : ""}
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2">
                <button className="rounded-xl bg-orbis-blue px-4 py-2 text-xs font-medium text-white orbis-transition hover:opacity-90">
                  Ver detalhes
                </button>
                <button className="rounded-xl border border-border bg-card px-4 py-2 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
                  WhatsApp
                </button>
              </div>
            </div>
          </div>

          {/* Lista de tarefas do dia */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-foreground">Agenda de hoje</h2>
              <button className="text-xs text-muted-foreground orbis-transition hover:text-foreground">+ Adicionar</button>
            </div>

            <div className="divide-y divide-border">
              {TAREFAS.map((tarefa, indice) => (
                <div
                  key={indice}
                  onClick={() => alternarTarefa(indice)}
                  className={cn(
                    "flex cursor-pointer items-start gap-4 px-5 py-4 orbis-transition",
                    tarefaSelecionada === indice ? "bg-accent" : "hover:bg-accent/50",
                  )}
                >
                  <span className="mt-0.5 w-10 shrink-0 text-right text-xs tabular-nums text-muted-foreground">
                    {tarefa.hora}
                  </span>

                  <div className={cn("mt-1.5 min-h-[32px] w-0.5 shrink-0 self-stretch rounded-full", BARRA_TAREFA[tarefa.tipo])} />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">{tarefa.titulo}</p>
                        <p className="truncate text-xs text-muted-foreground">{tarefa.cliente}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        {tarefa.valor && (
                          <span className="text-sm font-medium tabular-nums text-foreground">{tarefa.valor}</span>
                        )}
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", SELO_TAREFA[tarefa.tipo])}>
                          {ROTULO_TAREFA[tarefa.tipo]}
                        </span>
                      </div>
                    </div>

                    {tarefaSelecionada === indice && (
                      <div className="mt-3 flex gap-2">
                        <button className="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground orbis-transition hover:opacity-90">
                          Concluir
                        </button>
                        <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent">
                          Reagendar
                        </button>
                        <button className="rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent">
                          WhatsApp
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Coluna lateral */}
        <div className="flex flex-col gap-4">

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-foreground">Ações pendentes</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">{PENDENCIAS.length} itens precisam de atenção</p>
            </div>
            <div className="divide-y divide-border">
              {PENDENCIAS.map((item, indice) => (
                <div key={indice} className="flex cursor-pointer items-center gap-3 px-5 py-3.5 orbis-transition hover:bg-accent">
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

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-foreground">Receita</h2>
              <button className="text-xs text-muted-foreground orbis-transition hover:text-foreground">Ver relatório →</button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Hoje</span>
                <span className="text-sm font-medium tabular-nums text-muted-foreground">R$ 0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Esta semana</span>
                <span className="text-sm font-medium tabular-nums text-foreground">R$ 1.600</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Este mês</span>
                <span className="text-sm font-medium tabular-nums text-orbis-green">R$ 3.400</span>
              </div>
              <div className="border-t border-border pt-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] text-muted-foreground">Meta mensal: R$ 8.000</span>
                  <span className="text-[11px] font-semibold text-orbis-green">42%</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-surface-2">
                  <div className="h-full w-[42%] rounded-full bg-orbis-green orbis-transition" />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}