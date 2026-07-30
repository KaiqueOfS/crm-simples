import { useEffect, useState } from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { AgendaHeader, type Visualizacao } from "@/components/agenda/AgendaHeader";
import { AgendaItem, CATEGORIA_CFG } from "@/components/agenda/AgendaItem";
import { CompromissoDialog } from "@/components/agenda/CompromissoDialog";
import { HOJE, HOJE_CHAVE, datasDaSemana, doisDigitos, paraChave } from "@/lib/datas";
import { agendamentosApi, type Agendamento, type AgendamentoInput } from "@/lib/api";

/**
 * Agenda — responde "quem eu preciso atender e o que eu preciso fazer?".
 * Visões Hoje, Semana e Mês dos compromissos do usuário, com cadastro,
 * edição e exclusão integrados ao backend real (`agendamentosApi`).
 *
 * Preparado para a futura integração Agenda → Meu Dia: quando o "Próximo
 * compromisso" da tela inicial passar a vir da API real em vez do mock
 * atual, ele pode reaproveitar `agendamentosApi.list()` e `AgendaItem` —
 * nada nesta fase precisa mudar para isso acontecer.
 */

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_ABREV    = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DIAS_COMPLETO = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function compromissosDoDia(compromissos: Agendamento[], data: string): Agendamento[] {
  return compromissos
    .filter((c) => c.data === data)
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

type AcoesCompromisso = {
  selecionadoId: number | null;
  aoSelecionar: (id: number) => void;
  aoEditar: (compromisso: Agendamento) => void;
  aoExcluir: (compromisso: Agendamento) => void;
};

/* ─── Visão: Hoje ────────────────────────────────────────── */
function VisaoHoje({ compromissos, selecionadoId, aoSelecionar, aoEditar, aoExcluir }: AcoesCompromisso & { compromissos: Agendamento[] }) {
  const doDia = compromissosDoDia(compromissos, HOJE_CHAVE);
  const rotulo = HOJE.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <p className="mb-4 text-sm font-medium capitalize text-foreground">{rotulo}</p>
      {doDia.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">Nenhum compromisso hoje</p>
          <p className="mt-1 text-xs text-muted-foreground">Aproveite o dia livre!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {doDia.map((compromisso) => (
            <AgendaItem
              key={compromisso.id}
              compromisso={compromisso}
              selecionado={selecionadoId === compromisso.id}
              aoClicar={() => aoSelecionar(compromisso.id)}
              aoEditar={() => aoEditar(compromisso)}
              aoExcluir={() => aoExcluir(compromisso)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Visão: Semana ──────────────────────────────────────── */
function VisaoSemana({
  compromissos, dataBase, selecionadoId, aoSelecionar, aoEditar, aoExcluir,
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

/* ─── Visão: Mês ─────────────────────────────────────────── */
function VisaoMes({
  compromissos, ano, mes, dataSelecionada, aoSelecionarData, selecionadoId, aoSelecionar, aoEditar, aoExcluir,
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
            const ehHoje = chave === HOJE_CHAVE;
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
          {new Date(`${dataSelecionada}T12:00:00`).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Confirmação de exclusão ────────────────────────────── */
function ConfirmarExclusaoCompromisso({
  compromisso,
  aoCancelar,
  aoConfirmar,
}: {
  compromisso: Agendamento;
  aoCancelar: () => void;
  aoConfirmar: () => Promise<void>;
}) {
  const [excluindo, setExcluindo] = useState(false);

  async function confirmar() {
    setExcluindo(true);
    try {
      await aoConfirmar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={aoCancelar} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">Remover compromisso</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tem certeza que deseja remover <strong>{compromisso.titulo}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" className="flex-1" onClick={() => void confirmar()} disabled={excluindo}>
            {excluindo ? "Removendo…" : "Remover"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────── */
export default function Agenda() {
  const [compromissos, setCompromissos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [visao, setVisao] = useState<Visualizacao>("hoje");
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [dataBase, setDataBase] = useState(new Date(HOJE));
  const [anoCalendario, setAnoCalendario] = useState(HOJE.getFullYear());
  const [mesCalendario, setMesCalendario] = useState(HOJE.getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(HOJE_CHAVE);

  const [formAberto, setFormAberto] = useState(false);
  const [compromissoEmEdicao, setCompromissoEmEdicao] = useState<Agendamento | null>(null);
  const [compromissoParaExcluir, setCompromissoParaExcluir] = useState<Agendamento | null>(null);

  useEffect(() => {
    void carregarCompromissos();
  }, []);

  async function carregarCompromissos() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await agendamentosApi.list();
      setCompromissos(lista);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar a agenda.");
    } finally {
      setCarregando(false);
    }
  }

  function alternarSelecao(id: number) {
    setSelecionadoId((atual) => (atual === id ? null : id));
  }

  function periodoAnterior() {
    if (visao === "semana") {
      const d = new Date(dataBase);
      d.setDate(d.getDate() - 7);
      setDataBase(d);
    } else if (visao === "mes") {
      if (mesCalendario === 0) {
        setAnoCalendario((a) => a - 1);
        setMesCalendario(11);
      } else {
        setMesCalendario((m) => m - 1);
      }
    }
  }

  function proximoPeriodo() {
    if (visao === "semana") {
      const d = new Date(dataBase);
      d.setDate(d.getDate() + 7);
      setDataBase(d);
    } else if (visao === "mes") {
      if (mesCalendario === 11) {
        setAnoCalendario((a) => a + 1);
        setMesCalendario(0);
      } else {
        setMesCalendario((m) => m + 1);
      }
    }
  }

  function irParaHoje() {
    setDataBase(new Date(HOJE));
    setAnoCalendario(HOJE.getFullYear());
    setMesCalendario(HOJE.getMonth());
    setDataSelecionada(HOJE_CHAVE);
    setVisao("hoje");
    setSelecionadoId(null);
  }

  function rotuloPeriodo(): string {
    if (visao === "hoje") {
      return HOJE.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
    }
    if (visao === "semana") {
      const semana = datasDaSemana(dataBase);
      const primeiro = semana[0];
      const ultimo = semana[6];
      if (primeiro.getMonth() === ultimo.getMonth()) {
        return `${primeiro.getDate()} – ${ultimo.getDate()} de ${MESES[primeiro.getMonth()]} ${primeiro.getFullYear()}`;
      }
      return `${primeiro.getDate()} ${MESES[primeiro.getMonth()]} – ${ultimo.getDate()} ${MESES[ultimo.getMonth()]}`;
    }
    return `${MESES[mesCalendario]} ${anoCalendario}`;
  }

  function dataPadraoParaNovoCompromisso(): string {
    if (visao === "mes") return dataSelecionada;
    if (visao === "semana") return paraChave(dataBase);
    return HOJE_CHAVE;
  }

  function abrirCriacao() {
    setCompromissoEmEdicao(null);
    setFormAberto(true);
  }

  function abrirEdicao(compromisso: Agendamento) {
    setCompromissoEmEdicao(compromisso);
    setFormAberto(true);
  }

  async function salvarCompromisso(valores: AgendamentoInput) {
    try {
      if (compromissoEmEdicao) {
        await agendamentosApi.update(compromissoEmEdicao.id, valores);
        toast.success("Compromisso atualizado");
      } else {
        await agendamentosApi.create(valores);
        toast.success("Compromisso criado");
      }
      setFormAberto(false);
      setCompromissoEmEdicao(null);
      await carregarCompromissos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o compromisso.");
    }
  }

  async function confirmarExclusao() {
    if (!compromissoParaExcluir) return;
    try {
      await agendamentosApi.remove(compromissoParaExcluir.id);
      toast.success("Compromisso removido");
      setCompromissoParaExcluir(null);
      setSelecionadoId(null);
      await carregarCompromissos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o compromisso.");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <AgendaHeader
        visao={visao}
        aoMudarVisao={(v) => { setVisao(v); setSelecionadoId(null); }}
        rotuloPeriodo={rotuloPeriodo()}
        aoAnterior={periodoAnterior}
        aoProximo={proximoPeriodo}
        aoHoje={irParaHoje}
        aoNovoCompromisso={abrirCriacao}
      />

      {/* Conteúdo */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        {erro ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orbis-red-tint py-16 text-center">
            <AlertTriangle className="mb-2 h-8 w-8 text-orbis-red/70" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">Não foi possível carregar a agenda</p>
            <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void carregarCompromissos()}>
              Tentar novamente
            </Button>
          </div>
        ) : carregando ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
            <p className="text-sm text-muted-foreground">Carregando agenda…</p>
          </div>
        ) : (
          <>
            {visao === "hoje" && (
              <VisaoHoje
                compromissos={compromissos}
                selecionadoId={selecionadoId}
                aoSelecionar={alternarSelecao}
                aoEditar={abrirEdicao}
                aoExcluir={setCompromissoParaExcluir}
              />
            )}
            {visao === "semana" && (
              <VisaoSemana
                compromissos={compromissos}
                dataBase={dataBase}
                selecionadoId={selecionadoId}
                aoSelecionar={alternarSelecao}
                aoEditar={abrirEdicao}
                aoExcluir={setCompromissoParaExcluir}
              />
            )}
            {visao === "mes" && (
              <VisaoMes
                compromissos={compromissos}
                ano={anoCalendario}
                mes={mesCalendario}
                dataSelecionada={dataSelecionada}
                aoSelecionarData={(d) => { setDataSelecionada(d); setSelecionadoId(null); }}
                selecionadoId={selecionadoId}
                aoSelecionar={alternarSelecao}
                aoEditar={abrirEdicao}
                aoExcluir={setCompromissoParaExcluir}
              />
            )}
          </>
        )}
      </div>

      <CompromissoDialog
        aberto={formAberto}
        compromisso={compromissoEmEdicao}
        dataPadrao={dataPadraoParaNovoCompromisso()}
        aoFechar={() => { setFormAberto(false); setCompromissoEmEdicao(null); }}
        aoSalvar={salvarCompromisso}
      />

      {compromissoParaExcluir && (
        <ConfirmarExclusaoCompromisso
          compromisso={compromissoParaExcluir}
          aoCancelar={() => setCompromissoParaExcluir(null)}
          aoConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}
