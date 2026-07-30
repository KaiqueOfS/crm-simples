import { useRef, type KeyboardEvent } from "react";
import { cn } from "@/lib/utils";
import type { CategoriaAgendamento } from "@/lib/api";
import { CATEGORIA_CFG } from "./AgendaItem";

const CATEGORIAS = Object.keys(CATEGORIA_CFG) as CategoriaAgendamento[];

/**
 * Seletor visual de tipo do compromisso — chips com as mesmas cores de
 * `CATEGORIA_CFG` já usadas nos badges da Agenda. Substitui o `<select>`
 * nativo (baixa legibilidade no dark mode); continua enviando o mesmo
 * valor de `categoria` para a API.
 */
export function SeletorCategoria({
  value,
  onChange,
}: {
  value: CategoriaAgendamento;
  onChange: (categoria: CategoriaAgendamento) => void;
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  function mover(indiceAtual: number, delta: number) {
    const proximoIndice = (indiceAtual + delta + CATEGORIAS.length) % CATEGORIAS.length;
    onChange(CATEGORIAS[proximoIndice]);
    refs.current[proximoIndice]?.focus();
  }

  function aoTeclar(e: KeyboardEvent<HTMLButtonElement>, indice: number) {
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      mover(indice, 1);
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      mover(indice, -1);
    }
  }

  return (
    <div role="radiogroup" aria-label="Tipo do compromisso" className="flex flex-wrap gap-2">
      {CATEGORIAS.map((categoria, indice) => {
        const cfg = CATEGORIA_CFG[categoria];
        const selecionado = categoria === value;
        return (
          <button
            key={categoria}
            ref={(el) => { refs.current[indice] = el; }}
            type="button"
            role="radio"
            aria-checked={selecionado}
            tabIndex={selecionado ? 0 : -1}
            onClick={() => onChange(categoria)}
            onKeyDown={(e) => aoTeclar(e, indice)}
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium orbis-transition",
              selecionado
                ? cn(cfg.selo, "border-transparent")
                : "border-border bg-card text-muted-foreground hover:bg-accent hover:text-foreground",
            )}
          >
            <span className={cn("h-1.5 w-1.5 rounded-full", cfg.ponto)} />
            {cfg.rotulo}
          </button>
        );
      })}
    </div>
  );
}
