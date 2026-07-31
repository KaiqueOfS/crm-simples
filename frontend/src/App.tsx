import { useEffect, useState } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { getToken, usuariosApi } from "@/lib/api";
import { AppShell } from "@/components/layout/AppShell";

// Páginas públicas
import Landing from "@/pages/Landing";
import Auth    from "@/pages/Auth";

// Páginas protegidas
import Hoje      from "@/pages/Hoje";
import Agenda    from "@/pages/Agenda";
import Clientes  from "@/pages/Clientes";
import Dashboard from "@/pages/Dashboard";
import Perfil    from "@/pages/Perfil";
import OnboardingConfiguracao from "@/pages/OnboardingConfiguracao";

/**
 * Envolve rotas que exigem autenticação e ainda não concluíram o
 * onboarding inicial (Sprint 14). Busca o perfil uma vez por navegação
 * para saber `onboardingConcluido` — se ainda não concluiu, redireciona
 * para /onboarding antes de mostrar o AppShell.
 *
 * Falha ao buscar o perfil não deve travar o usuário fora do app: nesse
 * caso deixamos passar (o próprio conteúdo da página tratará o erro,
 * como já acontece hoje se a API estiver fora do ar).
 */
function GateOnboarding({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<"carregando" | "ok" | "pendente">("carregando");

  useEffect(() => {
    let ativo = true;
    usuariosApi
      .perfil()
      .then((usuario) => {
        if (ativo) setStatus(usuario.onboardingConcluido ? "ok" : "pendente");
      })
      .catch(() => {
        if (ativo) setStatus("ok");
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (status === "carregando") return null;
  if (status === "pendente") return <Navigate to="/onboarding" replace />;
  return <AppShell>{children}</AppShell>;
}

/**
 * Envolve rotas que exigem autenticação.
 * Redireciona para /auth caso não haja token válido.
 */
function Protegida({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/auth" replace />;
  return <GateOnboarding>{children}</GateOnboarding>;
}

/**
 * Variante de Protegida para a própria tela de onboarding: exige token,
 * mas não passa pelo gate (senão seria um redirecionamento infinito) nem
 * pelo AppShell — é uma tela de tela cheia, sem sidebar.
 */
function ProtegidaSemShell({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/auth" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Públicas */}
        <Route path="/"     element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

        {/* Onboarding — protegida, mas sem AppShell */}
        <Route
          path="/onboarding"
          element={
            <ProtegidaSemShell>
              <OnboardingConfiguracao />
            </ProtegidaSemShell>
          }
        />

        {/* Protegidas — todas passam pelo AppShell */}
        <Route path="/hoje"      element={<Protegida><Hoje /></Protegida>} />
        <Route path="/agenda"    element={<Protegida><Agenda /></Protegida>} />
        <Route path="/clientes"  element={<Protegida><Clientes /></Protegida>} />
        <Route path="/dashboard" element={<Protegida><Dashboard /></Protegida>} />
        <Route path="/perfil"    element={<Protegida><Perfil /></Protegida>} />

        {/* Qualquer rota desconhecida volta para /hoje se autenticado, senão para / */}
        <Route path="*" element={<Navigate to={getToken() ? "/hoje" : "/"} replace />} />
      </Routes>

      <Toaster />
    </>
  );
}
