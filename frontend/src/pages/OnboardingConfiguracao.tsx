import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, Car, Repeat } from "lucide-react";
import { configuracaoUsuarioApi, type TipoAtendimento } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { OrbisLogo } from "@/components/ui/orbis-logo";
import { OrbisBadge } from "@/components/ui/orbis-badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const OPCOES: {
  valor: TipoAtendimento;
  icone: typeof Building2;
  titulo: string;
  descricao: string;
}[] = [
  {
    valor: "NO_ESTABELECIMENTO",
    icone: Building2,
    titulo: "Tenho um local",
    descricao: "Meus clientes vêm até mim.",
  },
  {
    valor: "EXTERNO",
    icone: Car,
    titulo: "Vou até meus clientes",
    descricao: "Presto atendimento externo.",
  },
  {
    valor: "AMBOS",
    icone: Repeat,
    titulo: "Ambos",
    descricao: "Atendo no meu espaço e também fora.",
  },
];

export default function OnboardingConfiguracao() {
  const navigate = useNavigate();
  const [selecionado, setSelecionado] = useState<TipoAtendimento | null>(null);
  const [ocupado, setOcupado] = useState(false);

  async function continuar() {
    if (!selecionado) return;
    setOcupado(true);
    try {
      await configuracaoUsuarioApi.salvar(selecionado);
      navigate("/hoje", { replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Não foi possível salvar sua configuração.");
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="dark relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--orbis-blue)", opacity: 0.35 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-24 -top-24 h-[320px] w-[320px] rounded-full blur-3xl"
        style={{ backgroundColor: "var(--orbis-blue)", opacity: 0.16 }}
      />

      <div className="relative z-10 w-full max-w-[440px] rounded-[28px] border border-border bg-card/60 p-7 shadow-[var(--shadow-xl)] backdrop-blur-xl orbis-transition sm:p-9">
        <div className="mb-5 flex justify-center">
          <div
            style={{
              filter: "drop-shadow(0 0 14px color-mix(in oklch, var(--orbis-blue) 65%, transparent))",
            }}
          >
            <OrbisLogo size={40} showWordmark={false} />
          </div>
        </div>

        <div className="mb-6 text-center">
          <div className="mb-3 flex justify-center">
            <OrbisBadge color="blue">Configuração inicial</OrbisBadge>
          </div>
          <h1
            className="font-semibold tracking-tight text-foreground"
            style={{ fontSize: "var(--font-size-2xl)" }}
          >
            Vamos personalizar seu Orbis
          </h1>
          <p
            className="mx-auto mt-2 max-w-[320px] text-muted-foreground"
            style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-relaxed)" }}
          >
            Uma pergunta rápida antes de começar a usar o sistema.
          </p>
        </div>

        <div className="space-y-3">
          <p
            className="font-medium text-foreground"
            style={{ fontSize: "var(--font-size-sm)" }}
          >
            Como você atende seus clientes?
          </p>

          {OPCOES.map(({ valor, icone: Icone, titulo, descricao }) => {
            const ativo = selecionado === valor;
            return (
              <button
                key={valor}
                type="button"
                onClick={() => setSelecionado(valor)}
                className={cn(
                  "flex w-full items-center gap-4 rounded-2xl border p-4 text-left orbis-transition",
                  "bg-white/5",
                  ativo
                    ? "border-orbis-blue shadow-[0_0_0_4px_var(--orbis-blue-tint)]"
                    : "border-border hover:border-border-strong",
                )}
              >
                <div
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl orbis-transition",
                    ativo ? "bg-orbis-blue-tint text-orbis-blue" : "bg-white/5 text-muted-foreground",
                  )}
                >
                  <Icone className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{titulo}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{descricao}</p>
                </div>
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          className="mt-7 w-full rounded-full"
          style={{
            height: "48px",
            boxShadow: "0 10px 30px -8px color-mix(in oklch, var(--orbis-blue) 70%, transparent)",
          }}
          disabled={!selecionado}
          loading={ocupado}
          onClick={continuar}
        >
          Continuar →
        </Button>
      </div>
    </div>
  );
}
