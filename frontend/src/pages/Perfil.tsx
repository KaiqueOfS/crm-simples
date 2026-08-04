import { useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { type Usuario, usuariosApi } from "@/lib/api";
import { bloquearTeclaInvalidaNome, filtrarNome } from "@/lib/utils";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// Mesma regra do backend (AtualizarPerfilRequest/CadastroUsuarioRequest):
// mínimo de 8 caracteres, com pelo menos 1 letra e 1 número.
const SENHA_VALIDA = /^(?=.*[A-Za-z])(?=.*\d).{8,}$/;

/**
 * Dados da conta: nome, e-mail (fixo) e troca de senha opcional.
 * O logout e a navegação já ficam no AppShell.
 */
export default function Perfil() {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [nome, setNome] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    void carregarPerfil();
  }, []);

  async function carregarPerfil() {
    setCarregando(true);
    setErro(null);
    try {
      const perfil = await usuariosApi.perfil();
      setUsuario(perfil);
      setNome(perfil.nome);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar o perfil.");
    } finally {
      setCarregando(false);
    }
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    if (novaSenha && !SENHA_VALIDA.test(novaSenha)) {
      toast.error("A nova senha deve ter no mínimo 8 caracteres, incluindo letras e números.");
      return;
    }
    if (novaSenha !== confirmarSenha) {
      toast.error("A confirmação de senha não confere.");
      return;
    }

    setSalvando(true);
    try {
      const atualizado = await usuariosApi.atualizarPerfil({ nome, novaSenha, confirmarSenha });
      setUsuario(atualizado);
      setNovaSenha("");
      setConfirmarSenha("");
      toast.success("Perfil atualizado");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro ao atualizar perfil");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6 lg:p-8">
      <PageHeader title="Meu perfil" subtitle="Atualize seus dados pessoais e sua senha" />

      <Card>
        <CardHeader><CardTitle className="text-base">Dados da conta</CardTitle></CardHeader>
        <CardContent>
          {erro ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <AlertTriangle className="mb-2 h-8 w-8 text-orbis-red/70" strokeWidth={1.5} />
              <p className="text-sm font-medium text-foreground">Não foi possível carregar o perfil</p>
              <p className="mt-1 text-xs text-muted-foreground">{erro}</p>
              <Button variant="outline" size="sm" className="mt-4" onClick={() => void carregarPerfil()}>
                Tentar novamente
              </Button>
            </div>
          ) : carregando ? (
            <p className="text-sm text-muted-foreground">Carregando perfil…</p>
          ) : usuario ? (
            <form onSubmit={salvar} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="nome">Nome</Label>
                <Input
                  id="nome"
                  required
                  minLength={2}
                  maxLength={100}
                  autoComplete="name"
                  value={nome}
                  onChange={(e) => setNome(filtrarNome(e.target.value))}
                  onKeyDown={bloquearTeclaInvalidaNome}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" disabled autoComplete="email" value={usuario.email} />
                <p className="text-xs text-muted-foreground">O e-mail é usado para login e não pode ser alterado aqui.</p>
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">
                  Alterar senha <span className="font-normal text-muted-foreground">(opcional)</span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="nova-senha">Nova senha</Label>
                    <Input id="nova-senha" type="password" minLength={8} autoComplete="new-password" value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                    <Input id="confirmar-senha" type="password" minLength={8} autoComplete="new-password" value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar alterações"}</Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}