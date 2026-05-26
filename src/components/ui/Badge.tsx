import type { BadgeProps } from '@/types/ui';

export default function Badge({ children, cor = 'accent', className = '' }: BadgeProps) {
  const cores: Record<string, string> = {
    accent: 'bg-accent text-white',
    green: 'bg-green-100 text-green-800',
    red: 'bg-red-100 text-red-800',
    yellow: 'bg-yellow-100 text-yellow-800',
    blue: 'bg-blue-100 text-blue-800',
    gray: 'bg-slate-200 text-slate-700',
    brand: 'bg-brand-700 text-white',
  };

  return (
    <span
      className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${
        cores[cor] || cores.accent
      } ${className}`}
    >
      {children}
    </span>
  );
}
