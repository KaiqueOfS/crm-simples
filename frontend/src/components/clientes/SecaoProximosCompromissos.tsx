import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORIA_CFG } from "@/components/agenda/AgendaItem";
import { hojeChave, formatarDataCurta, formatarHora } from "@/lib/datas";
import { agendamentosApi, type Agendamento } from "@/lib/api";
import { linkWhatsapp } from "@/lib/utils/whatsapp";

/**
 * Seção "Próximos compromissos" do painel de detalhes do cliente — usa o
 * vínculo real `clienteId` (Fase 7) via GET /api/agendamentos/cliente/{id}.
 * Mostra só hoje em diante e com status PENDENTE (Fase 9.2); compromissos
 * passados ou já concluídos ficam para uma futura seção de Histórico (fora
 * do escopo desta fase).
 *
 * `telefoneCliente` vem como prop (o painel-pai já tem o Cliente completo
 * carregado) em vez de uma busca própria — todo compromisso aqui já é,
 * por definição, deste mesmo cliente, então o telefone é sempre o mesmo.
 */
export function SecaoProximosCompromissos({
  clienteId,
  telefoneCliente,
}: {
  clienteId: number;
  telefoneCliente: string;
}) {
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
        // Concluídos ficam para uma futura seção de Histórico, não aqui.
        setCompromissos(lista.filter((c) => c.data >= hojeChave() && c.status === "PENDENTE"));
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
                      {formatarDataCurta(compromisso.data)} · {formatarHora(compromisso.hora)}
                    </p>
                    <p className="truncate text-sm font-medium text-foreground">{compromisso.titulo}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.selo)}>
                      {cfg.rotulo}
                    </span>
                    <button
                      onClick={() => window.open(linkWhatsapp(telefoneCliente), "_blank", "noopener,noreferrer")}
                      aria-label="Abrir WhatsApp"
                      className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground"
                    >
                      <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
