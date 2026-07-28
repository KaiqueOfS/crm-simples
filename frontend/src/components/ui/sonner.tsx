import { Toaster as Sonner, type ToasterProps } from "sonner";

/**
 * Wrapper fino sobre o <Toaster /> real do pacote `sonner`.
 * As cores vêm dos tokens do tema Orbis (não do tema interno do
 * sonner), então acompanham automaticamente o modo claro/escuro.
 */
export function Toaster(props: ToasterProps) {
  return (
    <Sonner
      position="bottom-right"
      closeButton
      toastOptions={{
        classNames: {
          toast:
            "!rounded-xl !border !border-border !bg-card !text-foreground !shadow-lg",
          title: "!text-foreground !font-medium",
          description: "!text-muted-foreground",
          actionButton: "!bg-orbis-blue !text-white",
          cancelButton: "!bg-surface-2 !text-foreground",
          closeButton:
            "!border-border !bg-surface-2 !text-muted-foreground hover:!text-foreground",
          success: "!border-orbis-green-tint [&_[data-icon]]:!text-orbis-green",
          error: "!border-orbis-red-tint [&_[data-icon]]:!text-orbis-red",
          warning: "!border-orbis-amber-tint [&_[data-icon]]:!text-orbis-amber",
          info: "!border-orbis-blue-tint [&_[data-icon]]:!text-orbis-blue",
        },
      }}
      {...props}
    />
  );
}
