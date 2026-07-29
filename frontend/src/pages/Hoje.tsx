import { useState } from "react";
import { Calendar, FileText, Undo2, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";

/**
 * Meu Dia — central operacional diária do Orbis.
 * Resumo do que precisa de atenção hoje: compromissos, cobranças e orçamentos
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
        <p className="mt-2 text-sm text-muted-foreground/70">
          Resumo do seu dia: compromissos, cobranças e pendências em um só lugar.
        </p>
      </div>

      {/* Métricas do dia */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard icon={Calendar} color="blue"   label="Agenda hoje"           value={TAREFAS.length} sub={`Próximo às ${proximaTarefa.hora}`} />
        <StatCard icon={Wallet}   color="red"    label="A receber"             value="R$ 1.200"       sub="2 em atraso" />
        <StatCard icon={FileText} color="amber"  label="Orçamentos pendentes"  value={3}               sub="R$ 9.000 em aberto" />
        <StatCard icon={Undo2}    color="purple" label="Retornos"              value={2}               sub="Retorno pendente" />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">

        {/* Coluna principal */}
        <div className="flex flex-col gap-4">

          {/* Próximo compromisso — bloco principal da tela */}
          <div
            className="rounded-2xl border bg-orbis-blue-tint p-6"
            style={{ borderColor: "color-mix(in oklch, var(--orbis-blue) 22%, transparent)" }}
          >
            <p className="mb-3 text-[10px] font-semibold uppercase tracking-widest text-orbis-blue">
              Próximo compromisso
            </p>
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <p className="text-4xl font-light tracking-tight tabular-nums text-foreground">{proximaTarefa.hora}</p>
                <p className="mt-2 text-lg font-medium text-foreground">{proximaTarefa.titulo}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Cliente {proximaTarefa.cliente}{proximaTarefa.valor ? ` · ${proximaTarefa.valor}` : ""}
                </p>
              </div>
              <Button variant="primary" size="sm">
                Ver detalhes
              </Button>
            </div>
          </div>

          {/* Lista de tarefas do dia */}
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-foreground">Agenda de hoje</h2>
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
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <Button variant="primary" size="sm">
                          Concluir
                        </Button>
                        <Button variant="outline" size="sm">
                          Reagendar
                        </Button>
                        <Button variant="ghost" size="sm">
                          WhatsApp
                        </Button>
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
