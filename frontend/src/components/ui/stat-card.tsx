import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type StatColor = "blue" | "green" | "amber" | "red" | "purple" | "default";

const VALUE_CLASS: Record<StatColor, string> = {
  blue:    "text-orbis-blue",
  green:   "text-orbis-green",
  amber:   "text-orbis-amber",
  red:     "text-orbis-red",
  purple:  "text-orbis-purple",
  default: "text-foreground",
};

const DOT_CLASS: Record<StatColor, string> = {
  blue:    "bg-orbis-blue",
  green:   "bg-orbis-green",
  amber:   "bg-orbis-amber",
  red:     "bg-orbis-red",
  purple:  "bg-orbis-purple",
  default: "bg-muted-foreground",
};

const ICON_BG_CLASS: Record<StatColor, string> = {
  blue:    "bg-orbis-blue-tint border border-orbis-blue-tint",
  green:   "bg-orbis-green-tint border border-orbis-green-tint",
  amber:   "bg-orbis-amber-tint border border-orbis-amber-tint",
  red:     "bg-orbis-red-tint border border-orbis-red-tint",
  purple:  "bg-orbis-purple-tint border border-orbis-purple-tint",
  default: "bg-surface-1 border border-border",
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  color?: StatColor;
  icon?: LucideIcon;
  onClick?: () => void;
  className?: string;
}

export function StatCard({ label, value, sub, color = "default", icon: Icon, onClick, className }: StatCardProps) {
  const Tag = onClick ? "button" : "div";

  return (
    <Tag
      onClick={onClick}
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-card p-4 text-left orbis-transition",
        onClick && "cursor-pointer hover:shadow-[var(--shadow-sm)]",
        className
      )}
    >
      <div className="flex items-center justify-between">
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", ICON_BG_CLASS[color])}>
            <Icon className="h-4 w-4" strokeWidth={1.75} />
          </div>
        )}
        <div className={cn("ml-auto h-1.5 w-1.5 rounded-full", DOT_CLASS[color])} />
      </div>
      <div>
        <p className={cn("text-2xl font-light tracking-tight tabular-nums", VALUE_CLASS[color])}>
          {value}
        </p>
        <p className="mt-0.5 text-xs text-muted-foreground">{label}</p>
        {sub && <p className="mt-1 text-[11px] text-muted-foreground/60">{sub}</p>}
      </div>
    </Tag>
  );
}