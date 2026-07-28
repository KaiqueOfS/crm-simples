import { useEffect, useState } from "react";
import { dashboardApi, type Dashboard as DadosDashboard } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";

/**
 * Visão geral do funil de vendas: totais por etapa e taxa de conversão.
 * A navegação e o tratamento de sessão expirada já ficam no AppShell,
 * então esta página cuida só dos próprios dados.
 */

type Etapa = {
  rotulo: string;
  campo: keyof Pick<DadosDashboard, "novos" | "contatados" | "negociacao" | "proposta" | "ganhos" | "perdidos">;
};

const ETAPAS: Etapa[] = [
  { rotulo: "Novos",       campo: "novos"      },
  { rotulo: "Contatados",  campo: "contatados" },
  { rotulo: "Negociação",  campo: "negociacao" },
  { rotulo: "Propostas",   campo: "proposta"   },
  { rotulo: "Ganhos",      campo: "ganhos"     },
  { rotulo: "Perdidos",    campo: "perdidos"   },
];

function percentual(valor: number, total: number): string {
  if (total === 0) return "0%";
  return `${Math.round((valor / total) * 100)}%`;
}

export default function Dashboard() {
  const [dados, setDados] = useState<DadosDashboard | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    async function carregar() {
      try {
        setDados(await dashboardApi.get());
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar dashboard");
      } finally {
        setCarregando(false);
      }
    }
    void carregar();
  }, []);

  const maiorEtapa = Math.max(...(dados ? ETAPAS.map((etapa) => dados[etapa.campo]) : [0]), 1);

  return (
    <div className="mx-auto max-w-[1200px] p-4 sm:p-6 lg:p-8">
      <PageHeader title="Relatórios" subtitle="Acompanhe a distribuição dos seus leads no funil" />

      {carregando ? (
        <p className="text-sm text-muted-foreground">Carregando indicadores…</p>
      ) : dados ? (
        <>
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Total de clientes</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{dados.totalClientes}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Negociações em andamento</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{dados.negociacao + dados.proposta}</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Taxa de conversão</CardTitle></CardHeader>
              <CardContent><p className="text-3xl font-semibold">{percentual(dados.ganhos, dados.totalClientes)}</p></CardContent>
            </Card>
          </section>

          <section className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {ETAPAS.map((etapa) => (
              <Card key={etapa.campo}>
                <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{etapa.rotulo}</CardTitle></CardHeader>
                <CardContent className="flex items-end justify-between gap-4">
                  <p className="text-2xl font-semibold">{dados[etapa.campo]}</p>
                  <span className="text-sm text-muted-foreground">{percentual(dados[etapa.campo], dados.totalClientes)}</span>
                </CardContent>
              </Card>
            ))}
          </section>

          <Card className="mt-4">
            <CardHeader><CardTitle className="text-base">Distribuição do funil</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              {ETAPAS.map((etapa) => {
                const valor = dados[etapa.campo];
                return (
                  <div key={etapa.campo} className="space-y-1.5">
                    <div className="flex justify-between text-sm">
                      <span>{etapa.rotulo}</span>
                      <span className="text-muted-foreground">{valor}</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary orbis-transition"
                        style={{ width: `${(valor / maiorEtapa) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Não foi possível carregar os indicadores.</p>
      )}
    </div>
  );
}