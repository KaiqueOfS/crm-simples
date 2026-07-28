import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger";

  size?:
    | "sm"
    | "md"
    | "lg";

  loading?: boolean;

  children: React.ReactNode;
}


export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {


  const variants = {

    primary:
    "bg-orbis-blue text-white shadow-sm hover:opacity-90 active:opacity-95",

    secondary:
    "bg-surface-2 text-foreground border border-border hover:bg-surface-3",

    outline:
      "border border-border-strong bg-transparent text-foreground hover:bg-accent hover:border-border-strong",

    ghost:
      "text-foreground hover:bg-accent",

    danger:
      "bg-orbis-red text-white shadow-sm hover:opacity-90 active:opacity-95"

  };


  const sizes = {

    sm:
      "h-8 px-3 text-sm",

    md:
      "h-10 px-4 text-sm",

    lg:
      "h-12 px-6 text-base"

  };


  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center",
        "rounded-xl",
        "font-medium",
        "orbis-transition",
        "duration-200",
        "focus:outline-none",
        "focus:ring-4",
        "focus:ring-ring/20",
        "disabled:cursor-not-allowed",
        "disabled:opacity-50",
        variants[variant],
        sizes[size],
        className
      )}
    >

      {loading ? (
        <span>
          Carregando...
        </span>
      ) : (
        children
      )}

    </button>
  );
}