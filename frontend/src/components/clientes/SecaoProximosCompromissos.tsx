import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORIA_CFG } from "@/components/agenda/AgendaItem";
import { HOJE_CHAVE } from "@/lib/datas";
import { agendamentosApi, type Agendamento } from "@/lib/api";

/**
 * Seção "Próximos compromissos" do painel de detalhes do cliente — usa o
 * vínculo real `clienteId` (Fase 7) via GET /api/agendamentos/cliente/{id}.
 * Mostra só hoje em diante; compromissos passados ficam para uma futura
 * seção de Histórico (fora do escopo desta fase).
 */
export function SecaoProximosCompromissos({ clienteId }: { clienteId: number }) {
  const navigate = useNavigate();
  const [compromissos, setCompromissos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    agendamentosApi
      .listarPorCliente(clienteId)
      .then((lista) => {
        if (cancelado) return;
        setCompromissos(lista.filter((c) => c.data >= HOJE_CHAVE));
      })
      .catch((err) => {
        if (cancelado) return;
        setErro(err instanceof Error ? err.message : "Não foi possível carregar os compromissos.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => { cancelado = true; };
  }, [clienteId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground">Próximos compromissos</label>
        <Button variant="ghost" size="sm" onClick={() => navigate("/agenda")}>
          Ver agenda
        </Button>
      </div>

      {erro ? (
        <p className="text-xs text-muted-foreground">{erro}</p>
      ) : carregando ? (
        <p className="text-sm text-muted-foreground">Carregando compromissos…</p>
      ) : compromissos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
          <CalendarDays className="mb-2 h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Nenhum compromisso agendado</p>
        </div>
      ) : (
        <div className="space-y-2">
          {compromissos.map((compromisso) => {
            const cfg = CATEGORIA_CFG[compromisso.categoria];
            return (
              <Card key={compromisso.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">
                      {formatarDataCurta(compromisso.data)} · {compromisso.hora}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">{compromisso.titulo}</p>
                  </div>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.selo)}>
                    {cfg.rotulo}
                  </span>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function formatarDataCurta(data: string): string {
  return new Date(`${data}T12:00:00`).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
}
