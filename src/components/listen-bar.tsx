import { Volume2 } from "lucide-react";

export function ListenBar({ label = "Escuchar pantalla" }: { label?: string }) {
  return (
    <button
      type="button"
      className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-3 border-t border-border bg-navy px-4 py-3 text-navy-foreground shadow-lg transition-colors hover:bg-navy/90"
      aria-label={label}
    >
      <Volume2 className="h-5 w-5" />
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}
