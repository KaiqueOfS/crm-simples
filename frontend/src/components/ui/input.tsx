import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<
  HTMLInputElement,
  InputProps
>(
  (
    {
      className,
      type = "text",
      ...props
    },
    ref
  ) => {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(
          "flex h-11 w-full rounded-xl",
          "border border-neutral-200",
          "bg-white",
          "px-4 py-2",
          "text-sm",
          "placeholder:text-neutral-400",
          "orbis-transition",
          "outline-none",
          "focus:border-neutral-400",
          "focus:ring-2",
          "focus:ring-neutral-200",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";