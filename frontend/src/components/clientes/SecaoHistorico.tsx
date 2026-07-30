import { useEffect, useState } from "react";
import { Check, History } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { CATEGORIA_CFG, STATUS_AGENDAMENTO_CFG } from "@/components/agenda/AgendaItem";
import { agendamentosApi, type Agendamento } from "@/lib/api";
import { formatarDataLonga, formatarHora } from "@/lib/datas";

/**
 * Seção "Histórico" do painel de detalhes do cliente — reaproveita os
 * próprios agendamentos do cliente com status CONCLUIDO (Fase 10), via
 * GET /api/agendamentos/cliente/{id}/historico. Não existe entidade ou
 * tabela de histórico própria: é sempre uma consulta sobre os agendamentos
 * já existentes, do mais recente para o mais antigo.
 *
 * Funciona no mesmo padrão de `SecaoProximosCompromissos` (independente,
 * busca própria, sem lógica dentro de `Clientes.tsx`), mas sem "Ver agenda"
 * nem ação de WhatsApp — o histórico é só consulta, não pede ação.
 */
export function SecaoHistorico({ clienteId }: { clienteId: number }) {
  const [compromissos, setCompromissos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    setCarregando(true);
    setErro(null);

    agendamentosApi
      .listarHistorico(clienteId)
      .then((lista) => {
        if (cancelado) return;
        setCompromissos(lista);
      })
      .catch((err) => {
        if (cancelado) return;
        setErro(err instanceof Error ? err.message : "Não foi possível carregar o histórico.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => { cancelado = true; };
  }, [clienteId]);

  const statusCfg = STATUS_AGENDAMENTO_CFG.CONCLUIDO;

  return (
    <div className="space-y-2">
      <div>
        <label className="text-xs font-medium text-muted-foreground">Histórico</label>
        <p className="text-[11px] text-muted-foreground/70">Serviços já realizados para este cliente.</p>
      </div>

      {erro ? (
        <p className="text-xs text-muted-foreground">{erro}</p>
      ) : carregando ? (
        <p className="text-sm text-muted-foreground">Carregando histórico…</p>
      ) : compromissos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-8 text-center">
          <History className="mb-2 h-6 w-6 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm text-muted-foreground">Nenhum serviço concluído para este cliente.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {compromissos.map((compromisso) => {
            const cfg = CATEGORIA_CFG[compromisso.categoria];
            return (
              <Card key={compromisso.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <span className={cn("mb-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium", statusCfg.selo)}>
                      <Check className="h-3 w-3" strokeWidth={2} />
                      {statusCfg.rotulo}
                    </span>
                    <p className="truncate text-sm font-medium text-foreground">{compromisso.titulo}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatarDataLonga(compromisso.data)} · {formatarHora(compromisso.hora)}
                    </p>
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
