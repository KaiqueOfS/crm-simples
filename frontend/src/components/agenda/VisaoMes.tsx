import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { AgendaItem, CATEGORIA_CFG, compromissosDoDia, type AcoesCompromisso } from "@/components/agenda/AgendaItem";
import { hojeChave, DIAS_ABREV, doisDigitos, paraDataLocal } from "@/lib/datas";
import type { Agendamento } from "@/lib/api";

/** Visão "Mês" da Agenda: grade de calendário + detalhe do dia selecionado. */
export function VisaoMes({
  compromissos, ano, mes, dataSelecionada, aoSelecionarData, selecionadoId, aoSelecionar, aoEditar, aoExcluir, aoConcluir,
}: AcoesCompromisso & {
  compromissos: Agendamento[];
  ano: number; mes: number;
  dataSelecionada: string; aoSelecionarData: (d: string) => void;
}) {
  const primeiroDiaSemana = new Date(ano, mes, 1).getDay();
  const diasNoMes = new Date(ano, mes + 1, 0).getDate();
  const diasNoMesAnterior = new Date(ano, mes, 0).getDate();

  const celulas: { dia: number; foraDoMes: boolean }[] = [];
  for (let i = 0; i < primeiroDiaSemana; i++) {
    celulas.push({ dia: diasNoMesAnterior - primeiroDiaSemana + 1 + i, foraDoMes: true });
  }
  for (let d = 1; d <= diasNoMes; d++) {
    celulas.push({ dia: d, foraDoMes: false });
  }
  while (celulas.length % 7 !== 0) {
    celulas.push({ dia: celulas.length - primeiroDiaSemana - diasNoMes + 1, foraDoMes: true });
  }

  const doDiaSelecionado = compromissosDoDia(compromissos, dataSelecionada);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_300px]">

      {/* Grade do calendário */}
      <div>
        <div className="mb-1 grid grid-cols-7">
          {DIAS_ABREV.map((dia) => (
            <div key={dia} className="py-2 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">{dia}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {celulas.map((celula, indice) => {
            if (celula.foraDoMes) return <div key={indice} className="aspect-square" />;
            const chave = `${ano}-${doisDigitos(mes + 1)}-${doisDigitos(celula.dia)}`;
            const doDia = compromissosDoDia(compromissos, chave);
            const ehHoje = chave === hojeChave();
            const estaSelecionado = chave === dataSelecionada;
            return (
              <button
                key={indice}
                onClick={() => aoSelecionarData(chave)}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl p-1.5 orbis-transition hover:bg-accent",
                  ehHoje && !estaSelecionado && "cal-today",
                  estaSelecionado && "cal-selected",
                )}
              >
                <span className={cn("text-xs font-medium leading-none", (ehHoje || estaSelecionado) ? "text-orbis-blue" : "text-foreground")}>
                  {celula.dia}
                </span>
                <div className="flex flex-wrap justify-center gap-0.5">
                  {doDia.slice(0, 3).map((compromisso, j) => (
                    <div key={j} className={cn("h-1 w-1 rounded-full", CATEGORIA_CFG[compromisso.categoria].ponto)} />
                  ))}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Detalhe do dia selecionado */}
      <div>
        <p className="mb-3 text-sm font-semibold text-foreground">
          {paraDataLocal(dataSelecionada).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
        </p>
        {doDiaSelecionado.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <CalendarDays className="mb-2 h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground">Sem compromissos neste dia</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {doDiaSelecionado.map((compromisso) => (
              <AgendaItem
                key={compromisso.id}
                compromisso={compromisso}
                selecionado={selecionadoId === compromisso.id}
                aoClicar={() => aoSelecionar(compromisso.id)}
                aoEditar={() => aoEditar(compromisso)}
                aoExcluir={() => aoExcluir(compromisso)}
                aoConcluir={() => aoConcluir(compromisso)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
