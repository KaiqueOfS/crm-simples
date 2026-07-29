import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, LineChart, Menu, Moon, Settings, Sun, Users, Home } from "lucide-react";
import { clearToken, SESSION_EXPIRED_EVENT } from "@/lib/api";
import { cn } from "@/lib/utils";
import { OrbisLogo } from "@/components/ui/orbis-logo";
import { toast } from "sonner";

/* ─── Navegação ──────────────────────────────────────────── */
const NAV_PRINCIPAL = [
  { para: "/hoje",      icone: Home,      rotulo: "Meu Dia"       },
  { para: "/clientes",  icone: Users,     rotulo: "Clientes"      },
  { para: "/agenda",    icone: Calendar,  rotulo: "Agenda"        },
  { para: "/dashboard", icone: LineChart, rotulo: "Financeiro"    },
  { para: "/perfil",    icone: Settings,  rotulo: "Configurações" },
] as const;

/* ─── Componente ─────────────────────────────────────────── */
export function AppShell({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const path = window.location.pathname;

  const [sidebarAberta, setSidebarAberta] = useState(false);
  const [modoEscuro, setModoEscuro] = useState(() => {
    if (typeof window === "undefined") return true;
    const salvo = localStorage.getItem("orbis-tema");
    if (salvo) return salvo === "escuro";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Aplica classe dark no <html>
  useEffect(() => {
    document.documentElement.classList.toggle("dark", modoEscuro);
    localStorage.setItem("orbis-tema", modoEscuro ? "escuro" : "claro");
  }, [modoEscuro]);

  // Fecha sidebar ao navegar (mobile)
  useEffect(() => {
    setSidebarAberta(false);
  }, [path]);

  // Escuta expiração de sessão em qualquer página protegida
  useEffect(() => {
    function aoExpirar() {
      toast.error("Sua sessão expirou. Faça login novamente.");
      navigate("/auth", { replace: true });
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, aoExpirar);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, aoExpirar);
  }, [navigate]);

  function sair() {
    clearToken();
    navigate("/auth", { replace: true });
  }

  function estaAtivo(para: string): boolean {
    if (para === "/hoje") return path === "/hoje";
    return path.startsWith(para);
  }

  /* ── Sidebar ── */
  const sidebar = (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-50 flex w-56 flex-col",
        "bg-sidebar border-r border-sidebar-border",
        "transition-transform duration-200 ease-out will-change-transform",
        "lg:static lg:translate-x-0",
        sidebarAberta ? "translate-x-0" : "-translate-x-full",
      )}
    >
      {/* Logo */}
      <div className="flex h-14 shrink-0 items-center border-b border-sidebar-border px-4">
        <OrbisLogo />
      </div>

      {/* Links */}
      <nav className="flex-1 space-y-0.5 overflow-y-auto px-2 py-3">
        {NAV_PRINCIPAL.map((item) => {
          const Icone = item.icone;
          return (
            <Link
              key={item.para}
              to={item.para}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm select-none orbis-transition",
                estaAtivo(item.para)
                  ? "bg-orbis-blue-tint font-medium text-orbis-blue"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground",
              )}
            >
              <Icone className="h-4 w-4 shrink-0" strokeWidth={1.75} />
              <span className="truncate">{item.rotulo}</span>
            </Link>
          );
        })}
      </nav>

      {/* Usuário */}
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <div className="flex items-center gap-2.5 rounded-lg px-2.5 py-2">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full avatar-gradient text-white text-xs font-semibold">
            U
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium leading-none text-foreground">Minha conta</p>
          </div>
          <button
            onClick={() => setModoEscuro((v) => !v)}
            className="shrink-0 text-muted-foreground orbis-transition hover:text-foreground"
            aria-label="Alternar tema"
          >
            {modoEscuro ? <Sun className="h-4 w-4" strokeWidth={1.75} /> : <Moon className="h-4 w-4" strokeWidth={1.75} />}
          </button>
        </div>
        <button
          onClick={sair}
          className="mt-1 w-full rounded-lg px-2.5 py-1.5 text-left text-xs text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground"
        >
          Sair da conta
        </button>
      </div>
    </aside>
  );

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Overlay mobile */}
      {sidebarAberta && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarAberta(false)}
          aria-hidden="true"
        />
      )}

      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Cabeçalho mobile */}
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-background px-4 lg:hidden">
          <button
            onClick={() => setSidebarAberta(true)}
            className="rounded-lg p-1.5 text-muted-foreground orbis-transition hover:bg-accent hover:text-foreground"
            aria-label="Abrir menu"
          >
            <Menu className="h-5 w-5" strokeWidth={1.75} />
          </button>
          <OrbisLogo size={24} />
        </header>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}