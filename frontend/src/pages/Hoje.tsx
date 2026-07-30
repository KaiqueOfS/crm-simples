import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { AlertTriangle, Calendar, CalendarClock, CalendarDays, CheckCircle2, FileText, MessageCircle, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/ui/stat-card";
import { CATEGORIA_CFG, STATUS_AGENDAMENTO_CFG } from "@/components/agenda/AgendaItem";
import { CompromissoDialog } from "@/components/agenda/CompromissoDialog";
import { HOJE_CHAVE, dataPorExtenso, formatarHora } from "@/lib/datas";
import { agendamentosApi, clientesApi, type AgendamentoInput } from "@/lib/api";
import { linkWhatsapp } from "@/lib/utils/whatsapp";
import { useMeuDia } from "@/hooks/useMeuDia";

/**
 * Meu Dia — central operacional do Orbis (Fase 12).
 * Toda a agregação (próximo compromisso, pendentes, concluídos, atrasados)
 * vem pronta de GET /api/meu-dia via useMeuDia — esta página só renderiza e
 * dispara ações (concluir, reagendar, WhatsApp, ver cliente), recarregando
 * o painel depois de cada uma.
 *
 * "Financeiro" e "Orçamentos" ainda não existem como módulos: os cards
 * continuam aqui, mas mostram o estado real vindo do backend
 * (disponivel=false), sem nenhum dado de exemplo.
 */

function saudacao(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
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
  const { dados, carregando, erro, recarregar } = useMeuDia();

  const [formAberto, setFormAberto] = useState(false);
  const [abrindoWhatsapp, setAbrindoWhatsapp] = useState(false);

  const proximo = dados?.proximoCompromisso ?? null;
  const totalPendentes = dados?.totalPendentes ?? 0;
  const totalConcluidos = dados?.totalConcluidos ?? 0;
  const totalAtrasados = dados?.totalAtrasados ?? 0;
  const compromissosHoje = dados?.compromissosHoje ?? [];

  async function concluirProximo() {
    if (!proximo) return;
    try {
      await agendamentosApi.concluir(proximo.id);
      toast.success("Compromisso concluído");
      await recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir o compromisso.");
    }
  }

  // Mesma lógica de AgendaItem: o telefone vive no Cliente, não no
  // compromisso — busca sob demanda, sem correspondência por nome.
  async function abrirWhatsappProximo() {
    if (!proximo?.clienteId) return;
    setAbrindoWhatsapp(true);
    try {
      const cliente = await clientesApi.get(proximo.clienteId);
      window.open(linkWhatsapp(cliente.telefone), "_blank", "noopener,noreferrer");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível abrir o WhatsApp deste cliente.");
    } finally {
      setAbrindoWhatsapp(false);
    }
  }

  async function salvarReagendamento(valores: AgendamentoInput) {
    if (!proximo) return;
    try {
      await agendamentosApi.update(proximo.id, valores);
      toast.success("Compromisso atualizado");
      setFormAberto(false);
      await recarregar();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o compromisso.");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {saudacao()}, tudo pronto para hoje?
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{dataPorExtenso(new Date())}</p>
        <p className="mt-2 text-sm text-muted-foreground/70">
          Resumo do seu dia: compromissos e pendências em um só lugar.
        </p>
      </div>

      {/* Métricas do dia */}
      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={Calendar}
          color="blue"
          label="Agenda hoje"
          value={totalPendentes}
          sub={`${totalConcluidos} concluído${totalConcluidos === 1 ? "" : "s"} hoje`}
        />
        <StatCard
          icon={AlertTriangle}
          color={totalAtrasados > 0 ? "red" : "default"}
          label="Atrasados"
          value={totalAtrasados}
          sub={totalAtrasados > 0 ? "Precisam de atenção" : "Nenhum atraso"}
        />
        <StatCard
          icon={Wallet}
          color="default"
          label="Financeiro"
          value={dados?.financeiro.disponivel ? "—" : "Em breve"}
          sub="Módulo ainda não disponível"
        />
        <StatCard
          icon={FileText}
          color="default"
          label="Orçamentos"
          value={dados?.orcamentos.disponivel ? "—" : "Em breve"}
          sub="Módulo ainda não disponível"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_340px]">

        {/* Coluna principal: próximo compromisso */}
        <div className="flex flex-col gap-4">
          {erro ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orbis-red-tint py-16 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-orbis-red/70" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Não foi possível carregar seus compromissos</p>
              <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => void recarregar()}>
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
              <div>
                <p className="text-4xl font-light tracking-tight tabular-nums text-foreground">{formatarHora(proximo.hora)}</p>
                <p className="mt-2 text-lg font-medium text-foreground">{proximo.titulo}</p>
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <p className="text-sm text-muted-foreground">{proximo.pessoa}</p>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", CATEGORIA_CFG[proximo.categoria].selo)}>
                    {CATEGORIA_CFG[proximo.categoria].rotulo}
                  </span>
                  <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_AGENDAMENTO_CFG[proximo.status].selo)}>
                    {STATUS_AGENDAMENTO_CFG[proximo.status].rotulo}
                  </span>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button variant="success" size="sm" onClick={() => void concluirProximo()}>
                  Concluir
                </Button>
                {proximo.clienteId != null && (
                  <Button variant="outline" size="sm" className="gap-1.5" disabled={abrindoWhatsapp} onClick={() => void abrirWhatsappProximo()}>
                    <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
                    WhatsApp
                  </Button>
                )}
                {proximo.clienteId != null && (
                  <Button variant="outline" size="sm" className="gap-1.5" onClick={() => navigate(`/clientes?clienteId=${proximo.clienteId}`)}>
                    <Users className="h-4 w-4" strokeWidth={1.75} />
                    Cliente
                  </Button>
                )}
                <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setFormAberto(true)}>
                  <CalendarClock className="h-4 w-4" strokeWidth={1.75} />
                  Reagendar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
              <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Você concluiu todos os compromissos de hoje.</p>
              <p className="mt-1 text-xs text-muted-foreground">Nenhum compromisso restante para hoje.</p>
            </div>
          )}
        </div>

        {/* Coluna lateral: agenda completa do dia, sem dado de exemplo */}
        <div className="flex flex-col gap-4">

          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="border-b border-border px-5 py-4">
              <h2 className="text-sm font-medium text-foreground">Compromissos de hoje</h2>
              <p className="mt-0.5 text-[11px] text-muted-foreground">
                {compromissosHoje.length} agendado{compromissosHoje.length === 1 ? "" : "s"}
              </p>
            </div>
            {compromissosHoje.length === 0 ? (
              <div className="flex flex-col items-center justify-center px-5 py-10 text-center">
                <CheckCircle2 className="mb-2 h-6 w-6 text-muted-foreground/40" strokeWidth={1.5} />
                <p className="text-xs text-muted-foreground">Nenhum compromisso para hoje.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {compromissosHoje.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 px-5 py-3.5 orbis-transition hover:bg-accent">
                    <span className="w-11 shrink-0 text-xs font-medium tabular-nums text-muted-foreground">{formatarHora(item.hora)}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{item.titulo}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{item.pessoa}</p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", STATUS_AGENDAMENTO_CFG[item.status].selo)}>
                      {STATUS_AGENDAMENTO_CFG[item.status].rotulo}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      <CompromissoDialog
        aberto={formAberto}
        compromisso={proximo}
        dataPadrao={HOJE_CHAVE}
        aoFechar={() => setFormAberto(false)}
        aoSalvar={salvarReagendamento}
      />
    </div>
  );
}
