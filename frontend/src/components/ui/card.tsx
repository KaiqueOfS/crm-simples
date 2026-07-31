import React from "react";
import { cn } from "@/lib/utils";


export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement> {}


export const Card = React.forwardRef<
  HTMLDivElement,
  CardProps
>(
  (
    {
      className,
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-2xl",
          "border border-border",
          "bg-card",
          "shadow-[var(--shadow-sm)]",
          "orbis-transition",
          className
        )}
        {...props}
      />
    );
  }
);

Card.displayName = "Card";



export const CardHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex",
        "flex-col",
        "space-y-1.5",
        "p-6",
        className
      )}
      {...props}
    />
  );
};



export const CardTitle = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) => {
  return (
    <h3
      className={cn(
        "text-lg",
        "font-semibold",
        "tracking-tight",
        className
      )}
      {...props}
    />
  );
};



export const CardDescription = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) => {
  return (
    <p
      className={cn(
        "text-sm",
        "text-muted-foreground",
        className
      )}
      {...props}
    />
  );
};



export const CardContent = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "p-6",
        "pt-0",
        className
      )}
      {...props}
    />
  );
};



export const CardFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  return (
    <div
      className={cn(
        "flex",
        "items-center",
        "p-6",
        "pt-0",
        className
      )}
      {...props}
    />
  );
};