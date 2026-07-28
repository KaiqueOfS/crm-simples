import { Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/sonner";
import { getToken } from "@/lib/api";
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

/**
 * Envolve rotas que exigem autenticação.
 * Redireciona para /auth caso não haja token válido.
 * Injeta o AppShell (sidebar + topbar mobile) em todas as páginas internas.
 */
function Protegida({ children }: { children: React.ReactNode }) {
  if (!getToken()) return <Navigate to="/auth" replace />;
  return <AppShell>{children}</AppShell>;
}

export default function App() {
  return (
    <>
      <Routes>
        {/* Públicas */}
        <Route path="/"     element={<Landing />} />
        <Route path="/auth" element={<Auth />} />

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