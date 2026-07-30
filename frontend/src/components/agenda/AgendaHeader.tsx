import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { CategoriaAgendamento } from "@/lib/api";
import { CATEGORIA_CFG } from "./AgendaItem";

export type Visualizacao = "hoje" | "semana" | "mes";

/**
 * Cabeçalho da Agenda: título, tabs Hoje/Semana/Mês (com lógica real de
 * navegação — não são só visuais), e o botão discreto de criação, na mesma
 * linguagem do "+ Novo cliente" da tela Clientes.
 */
export function AgendaHeader({
  visao,
  aoMudarVisao,
  rotuloPeriodo,
  aoAnterior,
  aoProximo,
  aoHoje,
  aoNovoCompromisso,
}: {
  visao: Visualizacao;
  aoMudarVisao: (v: Visualizacao) => void;
  rotuloPeriodo: string;
  aoAnterior: () => void;
  aoProximo: () => void;
  aoHoje: () => void;
  aoNovoCompromisso: () => void;
}) {
  return (
    <>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Organize seus compromissos e atendimentos.</p>
        </div>
        <Button onClick={aoNovoCompromisso} variant="outline" size="sm" className="w-fit gap-1.5">
          <Plus className="h-4 w-4" strokeWidth={1.75} />
          Novo compromisso
        </Button>
      </div>

      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex rounded-xl border border-border bg-surface-1 p-1">
            {(["hoje", "semana", "mes"] as Visualizacao[]).map((v) => (
              <button
                key={v}
                onClick={() => aoMudarVisao(v)}
                className={cn(
                  "flex-1 rounded-lg px-4 py-1.5 text-xs font-medium orbis-transition sm:flex-none",
                  visao === v ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {v === "hoje" ? "Hoje" : v === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {visao !== "hoje" && (
              <button onClick={aoAnterior} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
                <ChevronLeft className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
            <span className="min-w-[200px] text-center text-sm font-medium text-foreground">{rotuloPeriodo}</span>
            {visao !== "hoje" && (
              <button onClick={aoProximo} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
                <ChevronRight className="h-4 w-4" strokeWidth={1.75} />
              </button>
            )}
            <button onClick={aoHoje} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
              Hoje
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <Legenda />
        </div>
      </div>
    </>
  );
}

function Legenda() {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {(Object.keys(CATEGORIA_CFG) as CategoriaAgendamento[]).map((categoria) => (
        <div key={categoria} className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", CATEGORIA_CFG[categoria].ponto)} />
          <span className="text-xs text-muted-foreground">{CATEGORIA_CFG[categoria].rotulo}</span>
        </div>
      ))}
    </div>
  );
}
