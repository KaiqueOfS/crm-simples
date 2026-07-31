import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { OrbisLogo } from "@/components/ui/orbis-logo";

export default function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    if (getToken()) navigate("/hoje", { replace: true });
  }, [navigate]);

  return (
    <div className="dark relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-6 py-20 text-center">
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-56 left-1/2 h-[560px] w-[560px] -translate-x-1/2 rounded-full blur-3xl"
        style={{ backgroundColor: "var(--orbis-blue)", opacity: 0.32 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -right-32 -top-32 h-[380px] w-[380px] rounded-full blur-3xl"
        style={{ backgroundColor: "var(--orbis-blue)", opacity: 0.14 }}
      />

      <div
        aria-hidden
        className="orbis-float pointer-events-none absolute left-[6%] top-[22%] hidden w-52 -rotate-6 rounded-2xl border border-border bg-card/60 p-4 text-left shadow-[var(--shadow-lg)] backdrop-blur-xl md:block"
      >
        <p className="text-[11px] font-medium text-muted-foreground">Meu Dia</p>
        <div className="mt-3 flex items-center gap-4">
          <div>
            <p className="text-xl font-semibold text-foreground">6</p>
            <p className="text-[10px] text-muted-foreground">pendentes</p>
          </div>
          <div>
            <p className="text-xl font-semibold text-orbis-green">3</p>
            <p className="text-[10px] text-muted-foreground">concluídos</p>
          </div>
        </div>
      </div>

      <div
        aria-hidden
        className="orbis-float pointer-events-none absolute right-[8%] bottom-[20%] hidden w-56 rotate-3 rounded-2xl border border-border bg-card/60 p-4 text-left shadow-[var(--shadow-lg)] backdrop-blur-xl md:block"
        style={{ animationDelay: "1.5s" }}
      >
        <p className="text-[11px] font-medium text-muted-foreground">Próximo cliente</p>
        <div className="mt-3 flex items-center gap-2.5">
          <div className="avatar-gradient flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white">
            MA
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Maria Aparecida</p>
            <p className="text-[10px] text-muted-foreground">14:30 · Retorno</p>
          </div>
        </div>
      </div>

      <div className="relative z-10 flex max-w-xl animate-in fade-in-0 slide-in-from-bottom-4 flex-col items-center duration-700">
        <div
          className="mb-8"
          style={{
            filter: "drop-shadow(0 0 16px color-mix(in oklch, var(--orbis-blue) 65%, transparent))",
          }}
        >
          <OrbisLogo size={44} showWordmark={false} />
        </div>

        <h1
          className="font-semibold tracking-tight text-foreground"
          style={{ fontSize: "var(--font-size-3xl)", lineHeight: "var(--line-height-tight)" }}
        >
          Organize seu negócio.
          <br />
          Conquiste mais clientes.
        </h1>

        <p
          className="mx-auto mt-4 max-w-[380px] text-muted-foreground"
          style={{ fontSize: "var(--font-size-base)", lineHeight: "var(--line-height-relaxed)" }}
        >
          Um CRM simples e inteligente para microempreendedores gerenciarem clientes, agenda e vendas em um só lugar.
        </p>

        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            size="lg"
            className="rounded-full"
            style={{
              boxShadow: "0 10px 30px -8px color-mix(in oklch, var(--orbis-blue) 70%, transparent)",
            }}
          >
            <Link to="/auth" state={{ modo: "cadastro" }}>Começar agora</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-full">
            <Link to="/auth" state={{ modo: "login" }}>Entrar</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
