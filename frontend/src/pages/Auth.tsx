import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { authApi, getToken, setToken } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OrbisLogo } from "@/components/ui/orbis-logo";
import { bloquearTeclaInvalidaNome, cn, filtrarNome } from "@/lib/utils";
import { Mail, Lock, User, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

type Modo = "login" | "cadastro";

// Mesma regra do backend (CadastroUsuarioRequest): mínimo de 8 caracteres,
// com pelo menos 1 letra e 1 número.
const SENHA_VALIDA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

// Mesma regra do backend (UsuarioService.validarNome), na mesma ordem:
// caracteres inválidos → nome incompleto.
const NOME_CARACTERES_VALIDOS = /^[\p{L}\s'-]+$/u;
const NOME_COMPLETO = /^[\p{L}'-]+(?:\s[\p{L}'-]+)+$/u;

type Forca = "fraca" | "média" | "forte";

function forcaSenha(senha: string): Forca | null {
  if (!senha) return null;

  let pontos = 0;
  if (senha.length >= 8) pontos++;
  if (senha.length >= 12) pontos++;
  if (/[a-z]/.test(senha) && /[A-Z]/.test(senha)) pontos++;
  if (/\d/.test(senha)) pontos++;
  if (/[^A-Za-z0-9]/.test(senha)) pontos++;

  if (pontos <= 1) return "fraca";
  if (pontos <= 3) return "média";
  return "forte";
}

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();

  // A Landing envia o modo inicial via router state (Link `state={{ modo }}`),
  // sem precisar de query string nem de uma rota nova para cada CTA.
  const modoInicial: Modo = (location.state as { modo?: Modo } | null)?.modo === "cadastro"
    ? "cadastro"
    : "login";

  const [modo, setModo] = useState<Modo>(modoInicial);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [mostrarConfirmarSenha, setMostrarConfirmarSenha] = useState(false);

  const forca = modo === "cadastro" ? forcaSenha(senha) : null;

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
        // Remove espaços nas extremidades e colapsa espaços duplos —
        // evita nomes como "   Maria   Silva   " indo pro banco.
        const nomeNormalizado = nome.trim().replace(/\s+/g, " ");
        const emailNormalizado = email.trim().toLowerCase();

        if (!nomeNormalizado) {
          toast.error("Informe seu nome.");
          return;
        }

        if (!NOME_CARACTERES_VALIDOS.test(nomeNormalizado)) {
          toast.error("O nome deve conter apenas letras.");
          return;
        }

        if (!NOME_COMPLETO.test(nomeNormalizado)) {
          toast.error("Informe seu nome completo (nome e sobrenome).");
          return;
        }

        if (!SENHA_VALIDA.test(senha)) {
          toast.error("A senha deve ter no mínimo 8 caracteres, incluindo letras e números.");
          return;
        }

        if (senha !== confirmarSenha) {
          toast.error("As senhas não coincidem.");
          return;
        }

        await authApi.cadastrar(nomeNormalizado, emailNormalizado, senha, confirmarSenha);

        // Após cadastrar, autentica automaticamente para não obrigar
        // o usuário a digitar tudo de novo na tela de login.
        const { token } = await authApi.login(emailNormalizado, senha);
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

      <div
        className="relative z-10 w-full max-w-[380px] rounded-[28px] border border-border bg-card/60 p-7 shadow-[var(--shadow-xl)] backdrop-blur-xl orbis-transition sm:p-9"
      >
        <div className="mb-5 flex justify-center">
          <div
            style={{
              filter: "drop-shadow(0 0 14px color-mix(in oklch, var(--orbis-blue) 65%, transparent))",
            }}
          >
            <OrbisLogo size={40} showWordmark={false} />
          </div>
        </div>

        <div className="mb-7 text-center">
          <h1
            className="font-semibold tracking-tight text-foreground"
            style={{ fontSize: "var(--font-size-2xl)" }}
          >
            Bem-vindo ao Orbis
          </h1>
          <p
            className="mx-auto mt-2 max-w-[280px] text-muted-foreground"
            style={{ fontSize: "var(--font-size-xs)", lineHeight: "var(--line-height-relaxed)" }}
          >
            Tenha controle do seu negócio sem complicação. Acompanhe clientes, compromissos e tarefas do seu dia.
          </p>
        </div>

        <div className="mb-6 grid grid-cols-2 gap-1 rounded-full border border-border bg-black/20 p-1">
          <button
            type="button"
            onClick={() => setModo("login")}
            className={cn(
              "rounded-full py-2 text-sm font-medium orbis-transition",
              modo === "login"
                ? "bg-white/10 text-foreground shadow-[var(--shadow-xs)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => setModo("cadastro")}
            className={cn(
              "rounded-full py-2 text-sm font-medium orbis-transition",
              modo === "cadastro"
                ? "bg-white/10 text-foreground shadow-[var(--shadow-xs)]"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            Criar conta
          </button>
        </div>

        <form onSubmit={enviar} className="space-y-4">
          {modo === "cadastro" && (
            <div className="space-y-1.5">
              <Label htmlFor="nome">Nome</Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <Input
                  id="nome"
                  required
                  maxLength={100}
                  value={nome}
                  onChange={(e) => setNome(filtrarNome(e.target.value))}
                  onKeyDown={bloquearTeclaInvalidaNome}
                  placeholder="Digite seu nome"
                  autoComplete="name"
                  className="h-12 rounded-full pl-11"
                />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="email">E-mail</Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                id="email"
                type="email"
                required
                maxLength={255}
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Digite seu e-mail"
                className="h-12 rounded-full pl-11"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="senha">Senha</Label>
            <div className="relative">
              <Lock
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                strokeWidth={1.75}
              />
              <Input
                id="senha"
                type={mostrarSenha ? "text" : "password"}
                required
                minLength={modo === "cadastro" ? 8 : 6}
                autoComplete={modo === "login" ? "current-password" : "new-password"}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                placeholder="Digite sua senha"
                className="h-12 rounded-full pl-11 pr-11"
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((v) => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground orbis-transition hover:text-foreground"
                aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              >
                {mostrarSenha ? (
                  <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={1.75} />
                )}
              </button>
            </div>
            {forca && (
              <div className="flex items-center gap-2 px-1">
                <div className="flex h-1 flex-1 gap-1">
                  {(["fraca", "média", "forte"] as const).map((nivel, i) => {
                    const atingiu =
                      (forca === "fraca" && i === 0) ||
                      (forca === "média" && i <= 1) ||
                      (forca === "forte" && i <= 2);
                    return (
                      <span
                        key={nivel}
                        className="h-full flex-1 rounded-full orbis-transition"
                        style={{
                          backgroundColor: atingiu
                            ? forca === "fraca"
                              ? "var(--orbis-red)"
                              : forca === "média"
                                ? "var(--orbis-amber)"
                                : "var(--orbis-green)"
                            : "var(--border)",
                        }}
                      />
                    );
                  })}
                </div>
                <span className="text-muted-foreground" style={{ fontSize: "var(--font-size-xs)" }}>
                  Senha {forca}
                </span>
              </div>
            )}
          </div>

          {modo === "cadastro" && (
            <div className="space-y-1.5">
              <Label htmlFor="confirmar-senha">Confirmar senha</Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  strokeWidth={1.75}
                />
                <Input
                  id="confirmar-senha"
                  type={mostrarConfirmarSenha ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirmarSenha}
                  onChange={(e) => setConfirmarSenha(e.target.value)}
                  placeholder="Digite a senha novamente"
                  className="h-12 rounded-full pl-11 pr-11"
                />
                <button
                  type="button"
                  onClick={() => setMostrarConfirmarSenha((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground orbis-transition hover:text-foreground"
                  aria-label={mostrarConfirmarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  {mostrarConfirmarSenha ? (
                    <EyeOff className="h-4 w-4" strokeWidth={1.75} />
                  ) : (
                    <Eye className="h-4 w-4" strokeWidth={1.75} />
                  )}
                </button>
              </div>
            </div>
          )}

          {modo === "login" && (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => toast.info("Recuperação de senha ainda não disponível.")}
                className="text-orbis-blue orbis-transition hover:opacity-80"
                style={{ fontSize: "var(--font-size-xs)", fontWeight: "var(--font-weight-medium)" }}
              >
                Esqueci minha senha
              </button>
            </div>
          )}

          <Button
            type="submit"
            loading={ocupado}
            className="w-full rounded-full"
            style={{
              height: "48px",
              boxShadow: "0 10px 30px -8px color-mix(in oklch, var(--orbis-blue) 70%, transparent)",
            }}
          >
            {modo === "login" ? "Entrar" : "Criar conta"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          {modo === "login" ? (
            <>
              Não tem conta?{" "}
              <button
                type="button"
                onClick={() => setModo("cadastro")}
                className="font-medium text-orbis-blue orbis-transition hover:opacity-80"
              >
                Criar conta
              </button>
            </>
          ) : (
            <>
              Já tem conta?{" "}
              <button
                type="button"
                onClick={() => setModo("login")}
                className="font-medium text-orbis-blue orbis-transition hover:opacity-80"
              >
                Entrar
              </button>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
