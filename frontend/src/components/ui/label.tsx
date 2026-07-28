import React from "react";
import { cn } from "@/lib/utils";

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement> {}

export const Label = React.forwardRef<
  HTMLLabelElement,
  LabelProps
>(
  (
    {
      className,
      children,
      ...props
    },
    ref
  ) => {
    return (
      <label
        ref={ref}
        className={cn(
          "text-[13px]",
          "font-medium",
          "text-foreground/90",
          "leading-none",
          "tracking-wide",
          "peer-disabled:cursor-not-allowed",
          "peer-disabled:opacity-70",
          className
        )}
        {...props}
      >
        {children}
      </label>
    );
  }
);

Label.displayName = "Label";