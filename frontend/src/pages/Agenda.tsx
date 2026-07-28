import { useState } from "react";
import { cn } from "@/lib/utils";
import { HOJE, HOJE_CHAVE, chaveComOffset, datasDaSemana, doisDigitos, paraChave } from "@/lib/datas";

/**
 * Agenda / Calendário — visão Hoje, Semana e Mês dos compromissos,
 * recebimentos, orçamentos, atrasos e retornos do usuário.
 */

type TipoEvento = "compromisso" | "recebimento" | "orcamento" | "atraso" | "retorno";
type Visualizacao = "hoje" | "semana" | "mes";

interface Evento {
  id: number;
  data: string;   // chave YYYY-MM-DD
  hora?: string;  // HH:MM
  titulo: string;
  cliente: string;
  valor?: string;
  status: string;
  tipo: TipoEvento;
}

const PONTO: Record<TipoEvento, string> = {
  compromisso: "bg-orbis-blue",
  recebimento: "bg-orbis-green",
  orcamento:   "bg-orbis-amber",
  atraso:      "bg-orbis-red",
  retorno:     "bg-orbis-purple",
};

const BARRA: Record<TipoEvento, string> = PONTO;

const SELO: Record<TipoEvento, string> = {
  compromisso: "bg-orbis-blue-tint text-orbis-blue",
  recebimento: "bg-orbis-green-tint text-orbis-green",
  orcamento:   "bg-orbis-amber-tint text-orbis-amber",
  atraso:      "bg-orbis-red-tint text-orbis-red",
  retorno:     "bg-orbis-purple-tint text-orbis-purple",
};

const ROTULO_TIPO: Record<TipoEvento, string> = {
  compromisso: "Compromisso",
  recebimento: "Recebimento",
  orcamento:   "Orçamento",
  atraso:      "Atraso",
  retorno:     "Retorno",
};

const MESES = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
const DIAS_ABREV  = ["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
const DIAS_COMPLETO = ["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];

// Dados de exemplo — serão substituídos pela API de agendamentos.
const EVENTOS: Evento[] = [
  { id: 1,  data: chaveComOffset(0),  hora: "09:00", titulo: "Visita técnica",      cliente: "Roberto Silva",   valor: "R$ 280",   status: "Confirmado", tipo: "compromisso" },
  { id: 2,  data: chaveComOffset(0),  hora: "11:00", titulo: "Enviar orçamento",    cliente: "Ana Paula",       valor: "R$ 2.400", status: "Pendente",   tipo: "orcamento"   },
  { id: 3,  data: chaveComOffset(0),  hora: "14:00", titulo: "Instalação elétrica", cliente: "João Mendes",     valor: "R$ 350",   status: "Confirmado", tipo: "compromisso" },
  { id: 4,  data: chaveComOffset(0),  hora: "17:00", titulo: "Cobrar pagamento",    cliente: "Marcos Ferreira", valor: "R$ 800",   status: "Atrasado",   tipo: "atraso"      },
  { id: 5,  data: chaveComOffset(1),  hora: "10:00", titulo: "Manutenção",          cliente: "Carlos Souza",    valor: "R$ 500",   status: "Confirmado", tipo: "compromisso" },
  { id: 6,  data: chaveComOffset(1),  hora: "15:00", titulo: "Recebimento",         cliente: "Fernanda Lima",   valor: "R$ 1.200", status: "Recebido",   tipo: "recebimento" },
  { id: 7,  data: chaveComOffset(2),  hora: "08:00", titulo: "Orçamento",           cliente: "Construtora ABC", valor: "R$ 4.800", status: "Pendente",   tipo: "orcamento"   },
  { id: 8,  data: chaveComOffset(2),  hora: "13:00", titulo: "Retorno de ligação",  cliente: "Juliana Costa",                      status: "Pendente",   tipo: "retorno"     },
  { id: 9,  data: chaveComOffset(3),  hora: "09:30", titulo: "Instalação",          cliente: "Pedro Alves",     valor: "R$ 600",   status: "Confirmado", tipo: "compromisso" },
  { id: 10, data: chaveComOffset(5),  hora: "11:00", titulo: "Visita técnica",      cliente: "Marina Ramos",    valor: "R$ 350",   status: "Confirmado", tipo: "compromisso" },
  { id: 11, data: chaveComOffset(5),  hora: "16:00", titulo: "Recebimento",         cliente: "Paulo Costa",     valor: "R$ 900",   status: "Recebido",   tipo: "recebimento" },
  { id: 12, data: chaveComOffset(7),  hora: "10:00", titulo: "Orçamento",           cliente: "Rafael Lima",     valor: "R$ 1.500", status: "Pendente",   tipo: "orcamento"   },
  { id: 13, data: chaveComOffset(-1), hora: "14:00", titulo: "Atraso pagamento",    cliente: "Bruno Mendes",    valor: "R$ 400",   status: "Atrasado",   tipo: "atraso"      },
  { id: 14, data: chaveComOffset(-2), hora: "09:00", titulo: "Visita técnica",      cliente: "Carla Santos",    valor: "R$ 250",   status: "Concluído",  tipo: "compromisso" },
];

function eventosDoDia(data: string): Evento[] {
  return EVENTOS
    .filter((e) => e.data === data)
    .sort((a, b) => (a.hora ?? "").localeCompare(b.hora ?? ""));
}

/* ─── Card de evento ─────────────────────────────────────── */
function CardEvento({ evento, selecionado, aoClicar }: { evento: Evento; selecionado: boolean; aoClicar: () => void }) {
  return (
    <div
      onClick={aoClicar}
      className={cn(
        "flex cursor-pointer items-start gap-3 rounded-xl border p-3 orbis-transition",
        selecionado ? "border-border bg-accent" : "border-border bg-card hover:bg-accent/60",
      )}
    >
      <div className={cn("mt-1 min-h-[32px] w-1 shrink-0 self-stretch rounded-full", BARRA[evento.tipo])} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            {evento.hora && (
              <p className="mb-0.5 text-[11px] font-medium tabular-nums text-muted-foreground">{evento.hora}</p>
            )}
            <p className="truncate text-sm font-medium text-foreground">{evento.titulo}</p>
            <p className="truncate text-xs text-muted-foreground">{evento.cliente}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            {evento.valor && <span className="text-sm font-medium tabular-nums text-foreground">{evento.valor}</span>}
            <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-medium", SELO[evento.tipo])}>
              {ROTULO_TIPO[evento.tipo]}
            </span>
          </div>
        </div>

        {selecionado && (
          <div className="mt-3 space-y-2 border-t border-border pt-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-muted-foreground">Status</p>
                <p className="font-medium text-foreground">{evento.status}</p>
              </div>
              {evento.valor && (
                <div>
                  <p className="text-muted-foreground">Valor</p>
                  <p className="font-medium text-foreground">{evento.valor}</p>
                </div>
              )}
              <div>
                <p className="text-muted-foreground">Cliente</p>
                <p className="font-medium text-foreground">{evento.cliente}</p>
              </div>
              {evento.hora && (
                <div>
                  <p className="text-muted-foreground">Horário</p>
                  <p className="font-medium text-foreground">{evento.hora}</p>
                </div>
              )}
            </div>
            <div className="flex gap-2 pt-1">
              <button className="flex-1 rounded-lg bg-primary py-2 text-xs font-medium text-primary-foreground orbis-transition hover:opacity-90">
                Concluir
              </button>
              <button className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent">
                Reagendar
              </button>
              <button className="flex-1 rounded-lg border border-border bg-background py-2 text-xs font-medium text-muted-foreground orbis-transition hover:bg-accent">
                WhatsApp
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
  const itens: { rotulo: string; classe: string }[] = [
    { rotulo: "Compromisso", classe: "bg-orbis-blue"   },
    { rotulo: "Recebimento", classe: "bg-orbis-green"  },
    { rotulo: "Orçamento",   classe: "bg-orbis-amber"  },
    { rotulo: "Atraso",      classe: "bg-orbis-red"    },
    { rotulo: "Retorno",     classe: "bg-orbis-purple" },
  ];
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1.5">
      {itens.map(({ rotulo, classe }) => (
        <div key={rotulo} className="flex items-center gap-1.5">
          <div className={cn("h-2 w-2 rounded-full", classe)} />
          <span className="text-xs text-muted-foreground">{rotulo}</span>
        </div>
      ))}
    </div>
  );
}

/* ─── Visão: Hoje ────────────────────────────────────────── */
function VisaoHoje({ selecionadoId, aoSelecionar }: { selecionadoId: number | null; aoSelecionar: (id: number) => void }) {
  const eventos = eventosDoDia(HOJE_CHAVE);
  const rotulo = HOJE.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div>
      <p className="mb-4 text-sm font-medium capitalize text-foreground">{rotulo}</p>
      {eventos.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="mb-2 text-3xl">📅</p>
          <p className="text-sm font-medium text-foreground">Nenhum evento hoje</p>
          <p className="mt-1 text-xs text-muted-foreground">Aproveite o dia livre!</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {eventos.map((evento) => (
            <CardEvento key={evento.id} evento={evento} selecionado={selecionadoId === evento.id} aoClicar={() => aoSelecionar(evento.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── Visão: Semana ──────────────────────────────────────── */
function VisaoSemana({ dataBase, selecionadoId, aoSelecionar }: { dataBase: Date; selecionadoId: number | null; aoSelecionar: (id: number) => void }) {
  const semana = datasDaSemana(dataBase);

  return (
    <div>
      {/* Tira de dias */}
      <div className="mb-5 grid grid-cols-7 gap-1">
        {semana.map((dia, indice) => {
          const chave = paraChave(dia);
          const ehHoje = chave === HOJE_CHAVE;
          const quantidade = eventosDoDia(chave).length;
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
                {eventosDoDia(chave).slice(0, 3).map((evento, j) => (
                  <div key={j} className={cn("h-1.5 w-1.5 rounded-full", PONTO[evento.tipo])} />
                ))}
                {quantidade > 3 && <span className="text-[8px] text-muted-foreground">+{quantidade - 3}</span>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Eventos agrupados por dia */}
      <div className="space-y-5">
        {semana.map((dia, indice) => {
          const chave = paraChave(dia);
          const eventos = eventosDoDia(chave);
          if (eventos.length === 0) return null;
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
                {eventos.map((evento) => (
                  <CardEvento key={evento.id} evento={evento} selecionado={selecionadoId === evento.id} aoClicar={() => aoSelecionar(evento.id)} />
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
  ano, mes, dataSelecionada, aoSelecionarData, selecionadoId, aoSelecionarEvento,
}: {
  ano: number; mes: number;
  dataSelecionada: string; aoSelecionarData: (d: string) => void;
  selecionadoId: number | null; aoSelecionarEvento: (id: number) => void;
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

  const eventosDoDiaSelecionado = eventosDoDia(dataSelecionada);

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
            const eventos = eventosDoDia(chave);
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
                  {eventos.slice(0, 3).map((evento, j) => (
                    <div key={j} className={cn("h-1 w-1 rounded-full", PONTO[evento.tipo])} />
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
        {eventosDoDiaSelecionado.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-10 text-center">
            <p className="mb-2 text-2xl">📋</p>
            <p className="text-xs text-muted-foreground">Sem eventos neste dia</p>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {eventosDoDiaSelecionado.map((evento) => (
              <CardEvento key={evento.id} evento={evento} selecionado={selecionadoId === evento.id} aoClicar={() => aoSelecionarEvento(evento.id)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Página principal ───────────────────────────────────── */
export default function Agenda() {
  const [visao, setVisao] = useState<Visualizacao>("hoje");
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [dataBase, setDataBase] = useState(new Date(HOJE));
  const [anoCalendario, setAnoCalendario] = useState(HOJE.getFullYear());
  const [mesCalendario, setMesCalendario] = useState(HOJE.getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(HOJE_CHAVE);

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

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">Agenda</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Gerencie seus compromissos e eventos</p>
        </div>
        <button className="flex w-fit items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground orbis-transition hover:opacity-90">
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
        {visao === "hoje" && <VisaoHoje selecionadoId={selecionadoId} aoSelecionar={alternarSelecao} />}
        {visao === "semana" && <VisaoSemana dataBase={dataBase} selecionadoId={selecionadoId} aoSelecionar={alternarSelecao} />}
        {visao === "mes" && (
          <VisaoMes
            ano={anoCalendario}
            mes={mesCalendario}
            dataSelecionada={dataSelecionada}
            aoSelecionarData={(d) => { setDataSelecionada(d); setSelecionadoId(null); }}
            selecionadoId={selecionadoId}
            aoSelecionarEvento={alternarSelecao}
          />
        )}
      </div>
    </div>
  );
}