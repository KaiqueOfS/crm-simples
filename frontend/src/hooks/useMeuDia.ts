import { useCallback, useEffect, useState } from "react";
import { meuDiaApi, type MeuDia } from "@/lib/api";

interface UseMeuDiaResultado {
  dados: MeuDia | null;
  carregando: boolean;
  erro: string | null;
  recarregar: () => Promise<void>;
}

/**
 * Única fonte de dados da tela "Meu Dia" (Fase 12). Busca GET /api/meu-dia
 * e expõe o resultado como veio — próximo compromisso, lista do dia e
 * contadores já calculados pelo backend (MeuDiaService). Nenhum cálculo
 * (próximo, pendentes, atrasados etc.) acontece aqui: esse é o ponto da
 * fase, tirar essa lógica do frontend.
 */
export function useMeuDia(): UseMeuDiaResultado {
  const [dados, setDados] = useState<MeuDia | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async () => {
    setCarregando(true);
    setErro(null);
    try {
      const resultado = await meuDiaApi.get();
      setDados(resultado);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível carregar seu painel de hoje.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { dados, carregando, erro, recarregar };
}
