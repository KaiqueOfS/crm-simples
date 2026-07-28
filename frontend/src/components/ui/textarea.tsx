import React from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  TextareaProps
>(
  (
    {
      className,
      rows = 3,
      ...props
    },
    ref
  ) => {
    return (
      <textarea
        ref={ref}
        rows={rows}
        className={cn(
          "flex w-full rounded-xl",
          "border border-border",
          "bg-input text-foreground",
          "px-4 py-2.5",
          "text-sm leading-relaxed",
          "placeholder:text-muted-foreground/70",
          "orbis-transition",
          "outline-none",
          "resize-none",
          "hover:border-border-strong",
          "focus:border-ring",
          "focus:ring-4",
          "focus:ring-ring/15",
          "aria-[invalid=true]:border-destructive",
          "aria-[invalid=true]:focus:ring-destructive/15",
          "disabled:cursor-not-allowed",
          "disabled:opacity-50",
          className
        )}
        {...props}
      />
    );
  }
);

Textarea.displayName = "Textarea";
