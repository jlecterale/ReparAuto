import type { ButtonProps } from '@/types/ui';

export default function Button({
  children,
  onClick,
  tipo = 'primario',
  tamanho = 'md',
  disabled = false,
  icone = null,
  className = '',
  type = 'button',
}: ButtonProps) {
  const base =
    'font-bold rounded-xl transition flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2';

  const variantes: Record<string, string> = {
    primario: 'bg-accent hover:bg-accent-hover text-white shadow-md hover:shadow-lg',
    secundario: 'bg-white hover:bg-slate-50 text-brand-700 border border-slate-300',
    ghost: 'bg-transparent hover:bg-white/10 text-white border border-white/20',
    perigo: 'bg-red-600 hover:bg-red-700 text-white',
    verde: 'bg-green-600 hover:bg-green-700 text-white',
  };

  const tamanhos: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variantes[tipo] || variantes.primario} ${tamanhos[tamanho] || tamanhos.md} ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${className}`}
    >
      {icone && <i className={icone}></i>}
      {children}
    </button>
  );
}
