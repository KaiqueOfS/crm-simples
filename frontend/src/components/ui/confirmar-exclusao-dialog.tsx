import { useState } from "react";
import { Button } from "@/components/ui/button";

/**
 * Modal de confirmação de exclusão, reaproveitado por Clientes e Agenda
 * (antes eram duas cópias quase idênticas — só o título e o nome do item
 * mudavam entre elas).
 */
export function ConfirmarExclusaoDialog({
  titulo,
  nomeItem,
  aoCancelar,
  aoConfirmar,
}: {
  titulo: string;
  nomeItem: string;
  aoCancelar: () => void;
  aoConfirmar: () => Promise<void>;
}) {
  const [excluindo, setExcluindo] = useState(false);

  async function confirmar() {
    setExcluindo(true);
    try {
      await aoConfirmar();
    } finally {
      setExcluindo(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={aoCancelar} />
      <div className="relative z-10 w-full max-w-sm rounded-2xl border border-border bg-card p-5">
        <p className="text-sm font-semibold text-foreground">{titulo}</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tem certeza que deseja remover <strong>{nomeItem}</strong>? Essa ação não pode ser desfeita.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="danger" className="flex-1" onClick={() => void confirmar()} disabled={excluindo}>
            {excluindo ? "Removendo…" : "Remover"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={aoCancelar}>
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
