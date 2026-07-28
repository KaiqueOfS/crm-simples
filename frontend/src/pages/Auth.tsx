import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { authApi, getToken, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type Modo = "login" | "cadastro";

export default function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<Modo>("login");

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);

  useEffect(() => {
    if (getToken()) navigate("/hoje", { replace: true });
  }, [navigate]);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setOcupado(true);
    try {
      if (modo === "login") {
        const { token } = await authApi.login(email, senha);
        setToken(token);
        navigate("/hoje", { replace: true });
      } else {
        if (senha.length < 6) {
          toast.error("A senha deve ter no mínimo 6 caracteres.");
          return;
        }

        await authApi.cadastrar(nome, email, senha);

        // Após cadastrar, autentica automaticamente para não obrigar
        // o usuário a digitar tudo de novo na tela de login.
        const { token } = await authApi.login(email, senha);
        setToken(token);
        toast.success("Conta criada com sucesso!");
        navigate("/hoje", { replace: true });
      }
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : modo === "login"
            ? "Falha no login"
            : "Não foi possível criar a conta",
      );
    } finally {
      setOcupado(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6 rounded-lg border bg-card p-8 shadow-sm">
        <div className="space-y-1 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Orbis</h1>
          <p className="text-sm text-muted-foreground">
            {modo === "login" ? "Entre para acessar seu CRM" : "Crie sua conta gratuita"}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 rounded-md bg-muted p-1 text-sm">
          <button
            type="button"
            onClick={() => setModo("login")}
            className={`rounded-sm py-1.5 transition-colors ${
              modo === "login" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setModo("cadastro")}
            className={`rounded-sm py-1.5 transition-colors ${
              modo === "cadastro" ? "bg-background font-medium shadow-sm" : "text-muted-foreground"
            }`}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-3">
          {modo === "cadastro" && (
            <div className="space-y-1">
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" required minLength={2} value={nome} onChange={(e) => setNome(e.target.value)} />
            </div>
          )}

          <div className="space-y-1">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-1">
            <Label htmlFor="senha">Senha</Label>
            <Input id="senha" type="password" required minLength={6} value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>

          <Button type="submit" className="w-full" disabled={ocupado}>
            {ocupado
              ? modo === "login" ? "Entrando…" : "Criando conta…"
              : modo === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>
      </div>
    </div>
  );
}