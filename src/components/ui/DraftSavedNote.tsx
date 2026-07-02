/** Discreet reminder that form progress is auto-saved locally as a draft. */
export default function DraftSavedNote({ className = '' }: { className?: string }) {
  return (
    <p className={`text-[11px] text-fg-muted ${className}`}>
      💾 O progresso é guardado automaticamente como rascunho apenas neste dispositivo.
    </p>
  );
}
