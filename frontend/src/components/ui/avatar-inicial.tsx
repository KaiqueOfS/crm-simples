import { cn } from "@/lib/utils";

type Tamanho = "sm" | "md" | "lg";

const TAMANHOS: Record<Tamanho, string> = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
};

interface AvatarProps {
  nome: string;
  tamanho?: Tamanho;
  className?: string;
}

/** Círculo com a inicial do nome — usado em listas de clientes e detalhes. */
export function Avatar({ nome, tamanho = "sm", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full bg-surface-1 font-semibold text-muted-foreground",
        TAMANHOS[tamanho],
        className,
      )}
    >
      {nome.charAt(0).toUpperCase()}
    </div>
  );
}