import { cn } from "@/lib/utils";

export type BadgeColor = "blue" | "green" | "amber" | "red" | "purple" | "default";

const BADGE_CLASSES: Record<BadgeColor, string> = {
  blue:    "bg-orbis-blue-tint   text-orbis-blue   border border-orbis-blue-tint",
  green:   "bg-orbis-green-tint  text-orbis-green  border border-orbis-green-tint",
  amber:   "bg-orbis-amber-tint  text-orbis-amber  border border-orbis-amber-tint",
  red:     "bg-orbis-red-tint    text-orbis-red    border border-orbis-red-tint",
  purple:  "bg-orbis-purple-tint text-orbis-purple border border-orbis-purple-tint",
  default: "bg-surface-1 text-muted-foreground border border-border",
};

interface OrbisBadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;
  className?: string;
}

export function OrbisBadge({ children, color = "default", className }: OrbisBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        BADGE_CLASSES[color],
        className
      )}
    >
      {children}
    </span>
  );
}