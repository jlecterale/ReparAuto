interface ReportButtonProps {
  onClick: () => void;
  compact?: boolean;
}

export default function ReportButton({ onClick, compact = false }: ReportButtonProps) {
  if (compact) {
    return (
      <button
        onClick={onClick}
        className="text-xs text-slate-400 hover:text-red-500 transition flex items-center gap-1"
        title="Denunciar"
      >
        <i className="fa-solid fa-flag"></i>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-red-500 font-semibold transition px-3 py-1.5 rounded-full border border-slate-200 hover:border-red-200"
    >
      <i className="fa-solid fa-flag"></i>
      Denunciar
    </button>
  );
}
