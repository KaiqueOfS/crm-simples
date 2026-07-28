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
    "bg-orbis-blue text-white hover:opacity-90",

    secondary:
    "bg-surface-2 text-foreground hover:bg-surface-3",

    outline:
      "border border-neutral-300 bg-white hover:bg-neutral-50",

    ghost:
      "hover:bg-neutral-100",

    danger:
      "bg-red-500 text-white hover:bg-red-600"

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
        "focus:ring-2",
        "focus:ring-neutral-300",
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