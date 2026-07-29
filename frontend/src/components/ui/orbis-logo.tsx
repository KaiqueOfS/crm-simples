import { useId } from "react";
import { cn } from "@/lib/utils";

interface OrbisLogoProps {
  /** Tamanho do símbolo em pixels (largura = altura). */
  size?: number;
  /** Mostra "Orbis" + "CRM" ao lado do símbolo. */
  showWordmark?: boolean;
  className?: string;
}

/**
 * Marca do Orbis: um anel único e sólido (círculo externo perfeito, furo
 * circular perfeito no centro) em degradê ciano → azul, com três "costuras"
 * curvas por cima — girados 120° entre si — para dar a leitura de giro/
 * pinwheel, como um símbolo de órbita.
 *
 * É um placeholder mais elaborado — quando a logo oficial (SVG/PNG) estiver
 * pronta, basta trocar o conteúdo do <svg> abaixo (ou substituir por
 * <img src="/orbis-mark.svg" />). Sidebar e header mobile consomem só
 * este componente, então nenhum outro arquivo precisa mudar.
 */
export function OrbisLogo({ size = 28, showWordmark = true, className }: OrbisLogoProps) {
  const gradientId = useId();
  const maskId = useId();

  return (
    <div className={cn("flex items-center gap-3", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        className="shrink-0"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#22D3EE" />
            <stop offset="100%" stopColor="#1D4ED8" />
          </linearGradient>

          {/* Furo circular transparente no centro do anel */}
          <mask id={maskId}>
            <circle cx="16" cy="16" r="15" fill="white" />
            <circle cx="16" cy="16" r="6" fill="black" />
          </mask>
        </defs>

        {/* Anel base — círculo sólido com furo, sem falhas nem sobreposições */}
        <circle cx="16" cy="16" r="15" fill={`url(#${gradientId})`} mask={`url(#${maskId})`} />

        {/* Costuras curvas — dão a leitura de giro/pinwheel, sem quebrar o anel */}
        {[0, 120, 240].map((angulo) => (
          <path
            key={angulo}
            d="M 16 10 C 16 4 24 3 27.49 6.36"
            fill="none"
            stroke="#0F2E6B"
            strokeOpacity="0.28"
            strokeWidth="1"
            strokeLinecap="round"
            transform={`rotate(${angulo} 16 16)`}
          />
        ))}
      </svg>

      {showWordmark && (
        <div>
          <p className="text-sm font-semibold leading-none tracking-tight text-foreground">Orbis</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-widest text-muted-foreground">CRM</p>
        </div>
      )}
    </div>
  );
}
