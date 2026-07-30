import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { Cliente } from "@/lib/api";

/**
 * Combobox de clientes reais (busca por nome + telefone), usado no campo
 * "Cliente*" do CompromissoDialog. Só troca a interação — continua
 * retornando um `clienteId` numérico, exatamente o que o formulário já
 * espera para montar o payload (`pessoa: clienteEscolhido.nome`).
 */
export function ClienteCombobox({
  id,
  clientes,
  carregando,
  value,
  erro,
  onChange,
}: {
  id?: string;
  clientes: Cliente[];
  carregando: boolean;
  value: number | "";
  erro?: boolean;
  onChange: (clienteId: number) => void;
}) {
  const [aberto, setAberto] = useState(false);
  const [busca, setBusca] = useState("");
  const [indiceAtivo, setIndiceAtivo] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const selecionado = clientes.find((c) => c.id === value) ?? null;

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (!termo) return clientes;
    return clientes.filter((c) => c.nome.toLowerCase().includes(termo));
  }, [clientes, busca]);

  useEffect(() => {
    if (!aberto) return;
    setBusca("");
    setIndiceAtivo(0);
    const quadro = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(quadro);
  }, [aberto]);

  useEffect(() => {
    setIndiceAtivo(0);
  }, [busca]);

  function selecionar(cliente: Cliente) {
    onChange(cliente.id);
    setAberto(false);
  }

  function aoTeclarNaBusca(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.min(i + 1, filtrados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndiceAtivo((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const alvo = filtrados[indiceAtivo];
      if (alvo) selecionar(alvo);
    } else if (e.key === "Escape") {
      setAberto(false);
    }
  }

  const listboxId = id ? `${id}-listbox` : "cliente-combobox-listbox";

  return (
    <Popover open={aberto} onOpenChange={setAberto}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          disabled={carregando}
          aria-invalid={erro || undefined}
          className={cn(
            "flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-input px-4 text-sm text-foreground outline-none orbis-transition",
            "hover:border-border-strong focus:border-ring focus:ring-4 focus:ring-ring/15",
            "disabled:cursor-not-allowed disabled:opacity-50",
            erro && "border-destructive focus:ring-destructive/15",
          )}
        >
          {selecionado ? (
            <span className="flex min-w-0 flex-1 items-baseline gap-2 truncate text-left">
              <span className="truncate font-medium">{selecionado.nome}</span>
              <span className="shrink-0 text-xs text-muted-foreground">{selecionado.telefone}</span>
            </span>
          ) : (
            <span className="text-muted-foreground">
              {carregando ? "Carregando clientes…" : "Selecione um cliente"}
            </span>
          )}
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" strokeWidth={1.75} />
        </button>
      </PopoverTrigger>

      <PopoverContent className="p-0" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div className="relative border-b border-border p-2">
          <Search className="pointer-events-none absolute left-5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" strokeWidth={1.75} />
          <input
            ref={inputRef}
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            onKeyDown={aoTeclarNaBusca}
            placeholder="Buscar cliente por nome…"
            role="combobox"
            aria-expanded={aberto}
            aria-controls={listboxId}
            aria-activedescendant={filtrados[indiceAtivo] ? `cliente-opt-${filtrados[indiceAtivo].id}` : undefined}
            className="h-9 w-full rounded-lg border-none bg-transparent pl-7 pr-2 text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
          />
        </div>

        <ul id={listboxId} role="listbox" className="max-h-56 overflow-y-auto p-1">
          {filtrados.length === 0 ? (
            <li className="px-3 py-4 text-center text-xs text-muted-foreground">
              {clientes.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado."}
            </li>
          ) : (
            filtrados.map((cliente, indice) => (
              <li
                key={cliente.id}
                id={`cliente-opt-${cliente.id}`}
                role="option"
                aria-selected={cliente.id === value}
                onMouseEnter={() => setIndiceAtivo(indice)}
                onClick={() => selecionar(cliente)}
                className={cn(
                  "flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm orbis-transition",
                  indice === indiceAtivo ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <span className="min-w-0 flex-1 truncate">
                  <span className="font-medium text-foreground">{cliente.nome}</span>
                  <span className="ml-2 text-xs text-muted-foreground">{cliente.telefone}</span>
                </span>
                {cliente.id === value && <Check className="h-4 w-4 shrink-0 text-orbis-blue" strokeWidth={1.75} />}
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
