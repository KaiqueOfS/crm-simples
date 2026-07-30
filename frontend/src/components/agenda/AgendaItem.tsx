import { useState, type MouseEvent } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { clientesApi, type Agendamento, type CategoriaAgendamento, type StatusAgendamento } from "@/lib/api";
import { linkWhatsapp } from "@/lib/utils/whatsapp";
import { formatarHora } from "@/lib/datas";

/**
 * Configuração visual por categoria — cor do indicador, do selo de tipo e
 * rótulo. `categoria` já existe no backend (`Agendamento.categoria`); é o
 * que sustenta o "tipo" e o "status visual" de cada compromisso.
 */
export const CATEGORIA_CFG: Record<CategoriaAgendamento, { rotulo: string; ponto: string; selo: string }> = {
  atendimento: { rotulo: "Atendimento", ponto: "bg-orbis-blue",   selo: "bg-orbis-blue-tint text-orbis-blue"     },
  retorno:     { rotulo: "Retorno",     ponto: "bg-orbis-purple", selo: "bg-orbis-purple-tint text-orbis-purple" },
  orcamento:   { rotulo: "Orçamento",   ponto: "bg-orbis-amber",  selo: "bg-orbis-amber-tint text-orbis-amber"   },
  reuniao:     { rotulo: "Reunião",     ponto: "bg-orbis-green",  selo: "bg-orbis-green-tint text-orbis-green"   },
  urgente:     { rotulo: "Urgente",     ponto: "bg-orbis-red",    selo: "bg-orbis-red-tint text-orbis-red"       },
  outro:       { rotulo: "Outro",       ponto: "bg-surface-2",    selo: "bg-surface-2 text-muted-foreground"     },
};

/** Configuração visual por status do compromisso (Fase 9.1/9.2). */
export const STATUS_AGENDAMENTO_CFG: Record<StatusAgendamento, { rotulo: string; selo: string }> = {
  PENDENTE:  { rotulo: "Pendente",   selo: "bg-orbis-amber-tint text-orbis-amber" },
  CONCLUIDO: { rotulo: "Concluído",  selo: "bg-orbis-green-tint text-orbis-green" },
  CANCELADO: { rotulo: "Cancelado", selo: "bg-orbis-red-tint text-orbis-red"     },
};

/** Cartão de um compromisso na agenda: horário, título, cliente, tipo e status. */
export function AgendaItem({
  compromisso,
  selecionado,
  aoClicar,
  aoEditar,
  aoExcluir,
  aoConcluir,
}: {
  compromisso: Agendamento;
  selecionado: boolean;
  aoClicar: () => void;
  aoEditar: () => void;
  aoExcluir: () => void;
  aoConcluir: () => void;
}) {
  const cfg = CATEGORIA_CFG[compromisso.categoria];
  const statusCfg = STATUS_AGENDAMENTO_CFG[compromisso.status];
  const [abrindoWhatsapp, setAbrindoWhatsapp] = useState(false);

  // O compromisso só guarda o clienteId — o telefone vive no Cliente, então
  // é buscado sob demanda (só quando o usuário clica), sem correspondência
  // por nome e sem carregar a lista de clientes inteira para cada item.
  async function abrirWhatsapp(e: MouseEvent) {
    e.stopPropagation();
    if (!compromisso.clienteId) return;

    setAbrindoWhatsapp(true);
    try {
      const cliente = await clientesApi.get(compromisso.clienteId);
      window.open(linkWhatsapp(cliente.telefone), "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível abrir o WhatsApp deste cliente.");
    } finally {
      setAbrindoWhatsapp(false);
    }
  }

  return (
    <div
      onClick={aoClicar}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 orbis-transition",
        selecionado ? "border-border bg-accent" : "border-border bg-card hover:bg-accent/60",
      )}
    >
      <div className={cn("mt-1 min-h-[32px] w-1 shrink-0 self-stretch rounded-full", cfg.ponto)} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="mb-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{formatarHora(compromisso.hora)}</p>
            <p className="truncate text-sm font-medium text-foreground">{compromisso.titulo}</p>
            {compromisso.pessoa && <p className="truncate text-xs text-muted-foreground">{compromisso.pessoa}</p>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.selo)}>
              {cfg.rotulo}
            </span>
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", statusCfg.selo)}>
              {statusCfg.rotulo}
            </span>
          </div>
        </div>

        {selecionado && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Tipo</p>
                <p className="font-medium text-foreground">{cfg.rotulo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Horário</p>
                <p className="font-medium text-foreground">{formatarHora(compromisso.hora)}</p>
              </div>
              {compromisso.pessoa && (
                <div>
                  <p className="text-muted-foreground">Cliente</p>
                  <p className="font-medium text-foreground">{compromisso.pessoa}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-foreground">{statusCfg.rotulo}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              {compromisso.status === "PENDENTE" && (
                <Button
                  variant="success"
                  size="sm"
                  className="flex-1"
                  onClick={(e) => { e.stopPropagation(); aoConcluir(); }}
                >
                  Concluir
                </Button>
              )}
              <button
                onClick={(e) => { e.stopPropagation(); aoEditar(); }}
                className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground orbis-transition hover:opacity-90"
              >
                Editar
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); aoExcluir(); }}
                className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent"
              >
                Excluir
              </button>
              {compromisso.clienteId != null && (
                <button
                  onClick={abrirWhatsapp}
                  disabled={abrindoWhatsapp}
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-border bg-background py-2 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                  WhatsApp
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
