import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AlertTriangle, CalendarDays } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ConfirmarExclusaoDialog } from "@/components/ui/confirmar-exclusao-dialog";
import { AgendaHeader, type Visualizacao } from "@/components/agenda/AgendaHeader";
import { AgendaItem, compromissosDoDia, type AcoesCompromisso } from "@/components/agenda/AgendaItem";
import { VisaoSemana } from "@/components/agenda/VisaoSemana";
import { VisaoMes } from "@/components/agenda/VisaoMes";
import { CompromissoDialog } from "@/components/agenda/CompromissoDialog";
import { hoje, hojeChave, MESES, dataPorExtenso, datasDaSemana, paraChave } from "@/lib/datas";
import { agendamentosApi, type Agendamento, type AgendamentoInput } from "@/lib/api";

/**
 * Agenda — responde "quem eu preciso atender e o que eu preciso fazer?".
 * Visões Hoje, Semana e Mês dos compromissos do usuário, com cadastro,
 * edição e exclusão integrados ao backend real (`agendamentosApi`).
 *
 * Semana e Mês vivem em components/agenda/Visao{Semana,Mes}.tsx (lógica
 * substancial o bastante pra justificar arquivo próprio); Hoje é simples o
 * bastante pra ficar aqui mesmo, como função interna deste arquivo.
 *
 * Preparado para a futura integração Agenda → Meu Dia: quando o "Próximo
 * compromisso" da tela inicial passar a vir da API real em vez do mock
 * atual, ele pode reaproveitar `agendamentosApi.list()` e `AgendaItem` —
 * nada nesta fase precisa mudar para isso acontecer.
 */

/* ─── Visão: Hoje ────────────────────────────────────────── */
function VisaoHoje({
  compromissos,
  selecionadoId,
  aoSelecionar,
  aoEditar,
  aoExcluir,
  aoConcluir,
}: AcoesCompromisso & { compromissos: Agendamento[] }) {
  const doDia = compromissosDoDia(compromissos, hojeChave());
  const rotulo = dataPorExtenso(hoje());

  return (
    <div>
      <p className="mb-4 text-sm font-medium text-foreground">{rotulo}</p>
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
              aoConcluir={() => aoConcluir(compromisso)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Agenda() {
  const [searchParams] = useSearchParams();

  const [compromissos, setCompromissos] = useState<Agendamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const [visao, setVisao] = useState<Visualizacao>("hoje");
  const [selecionadoId, setSelecionadoId] = useState<number | null>(null);
  const [dataBase, setDataBase] = useState(hoje());
  const [anoCalendario, setAnoCalendario] = useState(hoje().getFullYear());
  const [mesCalendario, setMesCalendario] = useState(hoje().getMonth());
  const [dataSelecionada, setDataSelecionada] = useState(hojeChave());

  const [formAberto, setFormAberto] = useState(false);
  const [compromissoEmEdicao, setCompromissoEmEdicao] = useState<Agendamento | null>(null);
  const [compromissoParaExcluir, setCompromissoParaExcluir] = useState<Agendamento | null>(null);

  // Evita disparar dois PATCH /concluir para o mesmo compromisso quando o
  // usuário clica duas vezes rápido antes da UI atualizar.
  const concluindoIdsRef = useRef<Set<number>>(new Set());

  useEffect(() => {
    void carregarCompromissos();
  }, []);

  // Deep-link vindo do Meu Dia (?compromissoId=X): seleciona/expande o
  // compromisso correspondente assim que a lista termina de carregar. Como o
  // Meu Dia só linka compromissos de hoje, a visão "Hoje" (padrão) já basta.
  useEffect(() => {
    const idParam = searchParams.get("compromissoId");
    if (!idParam) return;
    const id = Number(idParam);
    if (compromissos.some((c) => c.id === id)) {
      setSelecionadoId(id);
    }
  }, [compromissos, searchParams]);

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
    setDataBase(hoje());
    setAnoCalendario(hoje().getFullYear());
    setMesCalendario(hoje().getMonth());
    setDataSelecionada(hojeChave());
    setVisao("hoje");
    setSelecionadoId(null);
  }

  function rotuloPeriodo(): string {
    if (visao === "hoje") {
      return hoje().toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" });
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
    return hojeChave();
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

  async function concluirCompromisso(compromisso: Agendamento) {
    if (concluindoIdsRef.current.has(compromisso.id)) return;
    concluindoIdsRef.current.add(compromisso.id);
    try {
      const atualizado = await agendamentosApi.concluir(compromisso.id);
      setCompromissos((atual) => atual.map((c) => (c.id === atualizado.id ? atualizado : c)));
      toast.success("Compromisso concluído");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível concluir o compromisso.");
    } finally {
      concluindoIdsRef.current.delete(compromisso.id);
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
                aoConcluir={concluirCompromisso}
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
                aoConcluir={concluirCompromisso}
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
                aoConcluir={concluirCompromisso}
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
        <ConfirmarExclusaoDialog
          titulo="Remover compromisso"
          nomeItem={compromissoParaExcluir.titulo}
          aoCancelar={() => setCompromissoParaExcluir(null)}
          aoConfirmar={confirmarExclusao}
        />
      )}
    </div>
  );
}
