import { useEffect, useState, type FormEvent } from "react";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HOJE, HOJE_CHAVE, datasDaSemana, doisDigitos, paraChave } from "@/lib/datas";
import { agendamentosApi, type Agendamento, type AgendamentoInput, type CategoriaAgendamento } from "@/lib/api";

/**
 * Agenda / Calendário — visão Hoje, Semana e Mês dos agendamentos do usuário,
 * com cadastro, edição e exclusão integrados ao backend.
 *
 * Cada visão busca a mesma lista (já carregada uma vez ao entrar na página)
 * e filtra localmente por data — igual ao que já era feito antes com dados
 * de exemplo, só que agora com dados reais de `agendamentosApi`.
 */

type Visualizacao = "hoje" | "semana" | "mes";

const CATEGORIA_CFG: Record<CategoriaAgendamento, { rotulo: string; ponto: string; selo: string }> = {
  atendimento: { rotulo: "Atendimento", ponto: "bg-orbis-blue",   selo: "bg-orbis-blue-tint text-orbis-blue"     },
  retorno:     { rotulo: "Retorno",     ponto: "bg-orbis-purple", selo: "bg-orbis-purple-tint text-orbis-purple" },
  orcamento:   { rotulo: "Orçamento",   ponto: "bg-orbis-amber",  selo: "bg-orbis-amber-tint text-orbis-amber"   },
  reuniao:     { rotulo: "Reunião",     ponto: "bg-orbis-green",  selo: "bg-orbis-green-tint text-orbis-green"   },
  urgente:     { rotulo: "Urgente",     ponto: "bg-orbis-red",    selo: "bg-orbis-red-tint text-orbis-red"       },
  outro:       { rotulo: "Outro",       ponto: "bg-surface-2",    selo: "bg-surface-2 text-muted-foreground"     },
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_ABREV    = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DIAS_COMPLETO = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

function agendamentosDoDia(eventos: Agendamento[], data: string): Agendamento[] {
  return eventos
    .filter((e) => e.data === data)
    .sort((a, b) => a.hora.localeCompare(b.hora));
}

/* ─── Card de evento ─────────────────────────────────────── */
function CardEvento({
  evento,
  selecionado,
  aoClicar,
  aoEditar,
  aoExcluir,
}: {
  evento: Agendamento;
  selecionado: boolean;
  aoClicar: () => void;
  aoEditar: () => void;
  aoExcluir: () => void;
}) {
  const cfg = CATEGORIA_CFG[evento.categoria];

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
            <p className="mb-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{evento.hora}</p>
            <p className="truncate text-sm font-medium text-foreground">{evento.titulo}</p>
            {evento.pessoa && <p className="truncate text-xs text-muted-foreground">{evento.pessoa}</p>}
          </div>
          <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", cfg.selo)}>
            {cfg.rotulo}
          </span>
        </div>

        {selecionado && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Categoria</p>
                <p className="font-medium text-foreground">{cfg.rotulo}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Horário</p>
                <p className="font-medium text-foreground">{evento.hora}</p>
              </div>
              {evento.pessoa && (
                <div>
                  <p className="text-muted-foreground">Pessoa</p>
                  <p className="font-medium text-foreground">{evento.pessoa}</p>
                </div>
              )}
              {evento.lembrete > 0 && (
                <div>
                  <p className="text-muted-foreground">Lembrete</p>
                  <p className="font-medium text-foreground">{evento.lembrete} min antes</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Legenda de cores ───────────────────────────────────── */
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

type AcoesEvento = {
  selecionadoId: number | null;
  aoSelecionar: (id: number) => void;
  aoEditar: (evento: Agendamento) => void;
  aoExcluir: (evento: Agendamento) => void;
};

/* ─── Visão: Hoje ────────────────────────────────────────── */
function VisaoHoje({ eventos, selecionadoId, aoSelecionar, aoEditar, aoExcluir }: AcoesEvento & { eventos: Agendamento[] }) {
  const doDia = agendamentosDoDia(eventos, HOJE_CHAVE);
  const rotulo = HOJE.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <p className="mb-4 text-sm font-medium capitalize text-foreground">{rotulo}</p>
      {doDia.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <CalendarDays className="mb-2 h-8 w-8 text-muted-foreground/50" strokeWidth={1.5} />
          <p className="text-sm font-medium text-foreground">Nenhum evento hoje</p>
          <p className="mt-1 text-xs text-muted-foreground">Aproveite o dia livre!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {doDia.map((evento) => (
            <CardEvento
              key={evento.id}
              evento={evento}
              selecionado={selecionadoId === evento.id}
              aoClicar={() => aoSelecionar(evento.id)}
              aoEditar={() => aoEditar(evento)}
              aoExcluir={() => aoExcluir(evento)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Visão: Semana ──────────────────────────────────────── */
function VisaoSemana({
  eventos, dataBase, selecionadoId, aoSelecionar, aoEditar, aoExcluir,
}: AcoesEvento & { eventos: Agendamento[]; dataBase: Date }) {
  const semana = datasDaSemana(dataBase);

  return (
    <div>
      {/* Tira de dias */}
      <div className="mb-5 grid grid-cols-7 gap-1">
        {semana.map((dia, indice) => {
          const chave = paraChave(dia);
          const ehHoje = chave === HOJE_CHAVE;
          const doDia = agendamentosDoDia(eventos, chave);
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
                {doDia.slice(0, 3).map((evento, j) => (
                  <div key={j} className={cn("h-1.5 w-1.5 rounded-full", CATEGORIA_CFG[evento.categoria].ponto)} />
                ))}
                {doDia.length > 3 && <span className="text-[8px] text-muted-foreground">+{doDia.length - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Eventos agrupados por dia */}
      <div className="space-y-5">
        {semana.map((dia, indice) => {
          const chave = paraChave(dia);
          const doDia = agendamentosDoDia(eventos, chave);
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
                {doDia.map((evento) => (
                  <CardEvento
                    key={evento.id}
                    evento={evento}
                    selecionado={selecionadoId === evento.id}
                    aoClicar={() => aoSelecionar(evento.id)}
                    aoEditar={() => aoEditar(evento)}
                    aoExcluir={() => aoExcluir(evento)}
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
  eventos, ano, mes, dataSelecionada, aoSelecionarData, selecionadoId, aoSelecionar, aoEditar, aoExcluir,
}: AcoesEvento & {
  eventos: Agendamento[];
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

  const doDiaSelecionado = agendamentosDoDia(eventos, dataSelecionada);

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
            const doDia = agendamentosDoDia(eventos, chave);
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
                  {doDia.slice(0, 3).map((evento, j) => (
                    <div key={j} className={cn("h-1 w-1 rounded-full", CATEGORIA_CFG[evento.categoria].ponto)} />
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
            <p className="text-xs text-muted-foreground">Sem eventos neste dia</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {doDiaSelecionado.map((evento) => (
              <CardEvento
                key={evento.id}
                evento={evento}
                selecionado={selecionadoId === evento.id}
                aoClicar={() => aoSelecionar(evento.id)}
                aoEditar={() => aoEditar(evento)}
                aoExcluir={() => aoExcluir(evento)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Formulário de criação/edição ───────────────────────── */
type EventoFormValues = AgendamentoInput;

function valoresIniciais(evento: Agendamento | null, dataPadrao: string): EventoFormValues {
  if (evento) {
    return {
      titulo: evento.titulo,
      pessoa: evento.pessoa,
      data: evento.data,
      hora: evento.hora,
      categoria: evento.categoria,
      lembrete: evento.lembrete,
    };
  }
  return { titulo: "", pessoa: "", data: dataPadrao, hora: "09:00", categoria: "atendimento", lembrete: 0 };
}

function FormularioEvento({
  evento,
  dataPadrao,
  aoFechar,
  aoSalvar,
}: {
  evento: Agendamento | null;
  dataPadrao: string;
  aoFechar: () => void;
  aoSalvar: (valores: EventoFormValues) => Promise<void>;
}) {
  const [valores, setValores] = useState<EventoFormValues>(() => valoresIniciais(evento, dataPadrao));
  const [salvando, setSalvando] = useState(false);

  async function aoSubmeter(e: FormEvent) {
    e.preventDefault();
    setSalvando(true);
    try {
      await aoSalvar(valores);
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-0 sm:items-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={aoFechar} />

      <div className="relative z-10 flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-border bg-card sm:rounded-2xl">

        <div className="flex items-center justify-between border-b border-border p-5">
          <p className="text-base font-semibold text-foreground">{evento ? "Editar evento" : "Novo evento"}</p>
          <button onClick={aoFechar} className="shrink-0 rounded-lg p-1.5 text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={aoSubmeter} className="flex-1 space-y-4 overflow-y-auto p-5">
          <div className="space-y-1">
            <Label htmlFor="titulo">Título</Label>
            <Input
              id="titulo"
              required
              value={valores.titulo}
              onChange={(e) => setValores((v) => ({ ...v, titulo: e.target.value }))}
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="pessoa">Pessoa</Label>
            <Input
              id="pessoa"
              value={valores.pessoa}
              onChange={(e) => setValores((v) => ({ ...v, pessoa: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="data">Data</Label>
              <Input
                id="data"
                type="date"
                required
                value={valores.data}
                onChange={(e) => setValores((v) => ({ ...v, data: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="hora">Hora</Label>
              <Input
                id="hora"
                type="time"
                required
                value={valores.hora}
                onChange={(e) => setValores((v) => ({ ...v, hora: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="categoria">Categoria</Label>
            <select
              id="categoria"
              value={valores.categoria}
              onChange={(e) => setValores((v) => ({ ...v, categoria: e.target.value as CategoriaAgendamento }))}
              className="h-11 w-full rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none orbis-transition hover:border-border-strong focus:border-ring focus:ring-4 focus:ring-ring/15"
            >
              {(Object.keys(CATEGORIA_CFG) as CategoriaAgendamento[]).map((categoria) => (
                <option key={categoria} value={categoria}>{CATEGORIA_CFG[categoria].rotulo}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <Label htmlFor="lembrete">Lembrete (minutos antes)</Label>
            <Input
              id="lembrete"
              type="number"
              min={0}
              step={5}
              value={valores.lembrete}
              onChange={(e) => setValores((v) => ({ ...v, lembrete: Number(e.target.value) }))}
            />
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={salvando}>
              {salvando ? "Salvando…" : "Salvar"}
            </Button>
            <Button type="button" variant="outline" className="flex-1" onClick={aoFechar}>
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ─── Confirmação de exclusão ────────────────────────────── */
function ConfirmarExclusaoEvento({
  evento,
  aoCancelar,
  aoConfirmar,
}: {
  evento: Agendamento;
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
        <p className="text-sm font-semibold text-foreground">Remover evento</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tem certeza que deseja remover <strong>{evento.titulo}</strong>? Essa ação não pode ser desfeita.
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
  const [eventos, setEventos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [visao, setVisao] = useState<Visualizacao>("hoje");
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [dataBase, setDataBase] = useState(new Date(HOJE));
  const [anoCalendario, setAnoCalendario] = useState(HOJE.getFullYear());
  const [mesCalendario, setMesCalendario] = useState(HOJE.getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(HOJE_CHAVE);

  const [formAberto, setFormAberto] = useState(false);
  const [eventoEmEdicao, setEventoEmEdicao] = useState<Agendamento | null>(null);
  const [eventoParaExcluir, setEventoParaExcluir] = useState<Agendamento | null>(null);

  useEffect(() => {
    void carregarEventos();
  }, []);

  async function carregarEventos() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await agendamentosApi.list();
      setEventos(lista);
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

  function dataPadraoParaNovoEvento(): string {
    if (visao === "mes") return dataSelecionada;
    if (visao === "semana") return paraChave(dataBase);
    return HOJE_CHAVE;
  }

  function abrirCriacao() {
    setEventoEmEdicao(null);
    setFormAberto(true);
  }

  function abrirEdicao(evento: Agendamento) {
    setEventoEmEdicao(evento);
    setFormAberto(true);
  }

  async function salvarEvento(valores: EventoFormValues) {
    try {
      if (eventoEmEdicao) {
        await agendamentosApi.update(eventoEmEdicao.id, valores);
        toast.success("Evento atualizado");
      } else {
        await agendamentosApi.create(valores);
        toast.success("Evento criado");
      }
      setFormAberto(false);
      setEventoEmEdicao(null);
      await carregarEventos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar o evento.");
    }
  }

  async function confirmarExclusao() {
    if (!eventoParaExcluir) return;
    try {
      await agendamentosApi.remove(eventoParaExcluir.id);
      toast.success("Evento removido");
      setEventoParaExcluir(null);
      setSelecionadoId(null);
      await carregarEventos();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível remover o evento.");
    }
  }

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Gerencie seus compromissos e eventos</p>
        </div>
        <button
          onClick={abrirCriacao}
          className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground orbis-transition hover:opacity-90"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Novo evento
        </button>
      </div>

      {/* Barra de controles */}
      <div className="mb-6 rounded-2xl border border-border bg-card p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

          <div className="flex rounded-xl border border-border bg-surface-1 p-1">
            {(["hoje", "semana", "mes"] as Visualizacao[]).map((v) => (
              <button
                key={v}
                onClick={() => { setVisao(v); setSelecionadoId(null); }}
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
              <button onClick={periodoAnterior} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>
            )}
            <span className="min-w-[200px] text-center text-sm font-medium text-foreground">{rotuloPeriodo()}</span>
            {visao !== "hoje" && (
              <button onClick={proximoPeriodo} className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            )}
            <button onClick={irParaHoje} className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground">
              Hoje
            </button>
          </div>
        </div>

        <div className="mt-3 border-t border-border pt-3">
          <Legenda />
        </div>
      </div>

      {/* Conteúdo */}
      <div className="rounded-2xl border border-border bg-card p-4 sm:p-6">
        {erro ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-orbis-red-tint py-16 text-center">
            <AlertTriangle className="mb-2 h-8 w-8 text-orbis-red/70" strokeWidth={1.5} />
            <p className="text-sm font-medium text-foreground">Não foi possível carregar a agenda</p>
            <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
            <Button variant="outline" size="sm" className="mt-4" onClick={() => void carregarEventos()}>
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
                eventos={eventos}
                selecionadoId={selecionadoId}
                aoSelecionar={alternarSelecao}
                aoEditar={abrirEdicao}
                aoExcluir={setEventoParaExcluir}
              />
            )}
            {visao === "semana" && (
              <VisaoSemana
                eventos={eventos}
                dataBase={dataBase}
                selecionadoId={selecionadoId}
                aoSelecionar={alternarSelecao}
                aoEditar={abrirEdicao}
                aoExcluir={setEventoParaExcluir}
              />
            )}
            {visao === "mes" && (
              <VisaoMes
                eventos={eventos}
                ano={anoCalendario}
                mes={mesCalendario}
                dataSelecionada={dataSelecionada}
                aoSelecionarData={(d) => { setDataSelecionada(d); setSelecionadoId(null); }}
                selecionadoId={selecionadoId}
                aoSelecionar={alternarSelecao}
                aoEditar={abrirEdicao}
                aoExcluir={setEventoParaExcluir}
              />
            )}
          </>
        )}
      </div>

      {formAberto && (
        <FormularioEvento
          evento={eventoEmEdicao}
          dataPadrao={dataPadraoParaNovoEvento()}
          aoFechar={() => { setFormAberto(false); setEventoEmEdicao(null); }}
          aoSalvar={salvarEvento}
        />
      )}

      {eventoParaExcluir && (
        <ConfirmarExclusaoEvento
          evento={eventoParaExcluir}
          aoCancelar={() => setEventoParaExcluir(null)}
          aoConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}
