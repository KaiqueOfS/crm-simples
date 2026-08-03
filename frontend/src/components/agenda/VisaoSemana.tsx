import { cn } from "@/lib/utils";
import { AgendaItem, CATEGORIA_CFG, compromissosDoDia, type AcoesCompromisso } from "@/components/agenda/AgendaItem";
import { HOJE_CHAVE, MESES, DIAS_ABREV, DIAS_COMPLETO, datasDaSemana, paraChave } from "@/lib/datas";
import type { Agendamento } from "@/lib/api";

/** Visão "Semana" da Agenda: tira de dias + compromissos agrupados por dia. */
export function VisaoSemana({
  compromissos, dataBase, selecionadoId, aoSelecionar, aoEditar, aoExcluir, aoConcluir,
}: AcoesCompromisso & { compromissos: Agendamento[]; dataBase: Date }) {
  const semana = datasDaSemana(dataBase);

  return (
    <div>
      {/* Tira de dias */}
      <div className="mb-5 grid grid-cols-7 gap-1">
        {semana.map((dia, indice) => {
          const chave = paraChave(dia);
          const ehHoje = chave === HOJE_CHAVE;
          const doDia = compromissosDoDia(compromissos, chave);
          return (
            <div key={indice} className="flex flex-col items-center gap-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{DIAS_ABREV[indice]}</span>
              <div className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium",
                ehHoje ? "bg-orbis-blue text-white" : "text-foreground",
              )}>
                {dia.getDate()}
              </div>
              <div className="flex h-2 gap-0.5">
                {doDia.slice(0, 3).map((compromisso, j) => (
                  <div key={j} className={cn("h-1.5 w-1.5 rounded-full", CATEGORIA_CFG[compromisso.categoria].ponto)} />
                ))}
                {doDia.length > 3 && <span className="text-[8px] text-muted-foreground">+{doDia.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Compromissos agrupados por dia */}
      <div className="space-y-5">
        {semana.map((dia, indice) => {
          const chave = paraChave(dia);
          const doDia = compromissosDoDia(compromissos, chave);
          if (doDia.length === 0) return null;
          const ehHoje = chave === HOJE_CHAVE;
          return (
            <div key={indice}>
              <div className="mb-2 flex items-center gap-2">
                <span className={cn("text-xs font-semibold", ehHoje ? "text-orbis-blue" : "text-muted-foreground")}>
                  {DIAS_COMPLETO[indice]}, {dia.getDate()} de {MESES[dia.getMonth()]}
                </span>
                {ehHoje && (
                  <span className="rounded-full bg-orbis-blue-tint px-2 py-0.5 text-[10px] font-medium text-orbis-blue">Hoje</span>
                )}
              </div>
              <div className="flex flex-col gap-2">
                {doDia.map((compromisso) => (
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
            </div>
          );
        })}
      </div>
    </div>
  );
}
