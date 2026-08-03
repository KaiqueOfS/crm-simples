import React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";

interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "success";

  size?:
    | "sm"
    | "md"
    | "lg";

  loading?: boolean;

  asChild?: boolean;

  children: React.ReactNode;
}


export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  asChild = false,
  children,
  disabled,
  className,
  ...props
}: ButtonProps) {
  const variants = {

    primary:
    "bg-orbis-blue text-white shadow-[var(--shadow-xs)] hover:opacity-90 active:opacity-95",

    secondary:
    "bg-surface-2 text-foreground border border-border hover:bg-surface-3",

    outline:
      "border border-border-strong bg-transparent text-foreground hover:bg-accent hover:border-border-strong",

    ghost:
      "text-foreground hover:bg-accent",

    danger:
      "bg-orbis-red text-white shadow-[var(--shadow-xs)] hover:opacity-90 active:opacity-95",

    success:
      "bg-orbis-green text-white shadow-[var(--shadow-xs)] hover:opacity-90 active:opacity-95"

  };


  const sizes = {

    sm:
      "h-8 px-3 text-sm",

    md:
      "h-10 px-4 text-sm",

    lg:
      "h-12 px-6 text-base"

  };


  const classes = cn(
    "inline-flex items-center justify-center",
    "rounded-xl",
    "font-medium",
    "orbis-transition",
    "duration-[var(--duration-slow)]",
    "focus:outline-none",
    "focus:ring-4",
    "focus:ring-ring/20",
    "disabled:cursor-not-allowed",
    "disabled:opacity-50",
    variants[variant],
    sizes[size],
    className
  );

  if (asChild) {
    return (
      <Slot {...props} className={classes}>
        {children}
      </Slot>
    );
  }

  return (
    <button {...props} disabled={disabled || loading} className={classes}>
      {loading ? <span>Carregando...</span> : children}
    </button>
  );
}