import { useEffect, useState } from "react";
import { type Usuario, usuariosApi } from "@/lib/api";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    async function carregar() {
      try {
        const perfil = await usuariosApi.perfil();
        setUsuario(perfil);
        setNome(perfil.nome);
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Erro ao carregar perfil");
      } finally {
        setCarregando(false);
      }
    }
    void carregar();
  }, []);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();

    if (novaSenha && novaSenha.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres.");
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
          {carregando ? (
            <p className="text-sm text-muted-foreground">Carregando perfil…</p>
          ) : usuario ? (
            <form onSubmit={salvar} className="space-y-4">
              <div className="space-y-1">
                <Label htmlFor="nome">Nome</Label>
                <Input id="nome" required minLength={2} maxLength={100} value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" disabled value={usuario.email} />
                <p className="text-xs text-muted-foreground">O e-mail é usado para login e não pode ser alterado aqui.</p>
              </div>

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium">
                  Alterar senha <span className="font-normal text-muted-foreground">(opcional)</span>
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1">
                    <Label htmlFor="nova-senha">Nova senha</Label>
                    <Input id="nova-senha" type="password" minLength={6} value={novaSenha} onChange={(e) => setNovaSenha(e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="confirmar-senha">Confirmar nova senha</Label>
                    <Input id="confirmar-senha" type="password" minLength={6} value={confirmarSenha} onChange={(e) => setConfirmarSenha(e.target.value)} />
                  </div>
                </div>
              </div>

              <Button type="submit" disabled={salvando}>{salvando ? "Salvando…" : "Salvar alterações"}</Button>
            </form>
          ) : (
            <p className="text-sm text-muted-foreground">Não foi possível carregar o perfil.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}