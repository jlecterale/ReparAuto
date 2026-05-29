import type { BadgeProps } from '@/types/ui';

export default function Badge({
  children,
  cor = 'accent',
  variante = 'soft',
  tamanho = 'sm',
  className = '',
}: BadgeProps) {
  const soft: Record<string, string> = {
    accent: 'bg-accent/10 text-accent',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-slate-200 text-fg',
    brand: 'bg-brand-100 text-brand-700',
  };

  const solid: Record<string, string> = {
    accent: 'bg-accent text-white',
    green: 'bg-green-500 text-white',
    red: 'bg-red-500 text-white',
    yellow: 'bg-yellow-500 text-white',
    blue: 'bg-blue-500 text-white',
    gray: 'bg-slate-500 text-white',
    brand: 'bg-brand-700 text-white',
  };

  const tamanhos: Record<string, string> = {
    sm: 'text-xs px-2.5 py-0.5',
    md: 'text-sm px-3 py-1',
  };

  const paleta = variante === 'solid' ? solid : soft;

  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-full ${
        paleta[cor] || paleta.accent
      } ${tamanhos[tamanho] || tamanhos.sm} ${className}`}
    >
      {children}
    </span>
  );
}
