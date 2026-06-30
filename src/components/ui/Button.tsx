import type { ButtonProps } from '@/types/ui';

/**
 * Canonical action button for RecarGarage.
 *
 * Variants (`tipo`):
 *  - `primario`   — main call to action (brand orange, white text)
 *  - `secundario` — secondary action (white surface, blue label, border)
 *  - `terciario`  — low-emphasis action (transparent, tinted hover)
 *  - `perigo`     — destructive / error action (red, white text)
 *  - `verde`      — positive confirmation (green, white text)
 *  - `azul`       — informational / chat action (brand blue, white text)
 *  - `aviso`      — cautionary action (amber, dark text)
 *  - `escuro`     — high-emphasis dark CTA (navy, white text)
 *  - `ghost`      — for dark / photo backgrounds (translucent, white text)
 *
 * All variants meet WCAG AA (≥4.5:1) for their label text.
 */
export default function Button({
  children,
  tipo = 'primario',
  tamanho = 'md',
  icone = null,
  iconeFim = null,
  blocoCompleto = false,
  carregando = false,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}: ButtonProps) {
  const base =
    'relative font-bold rounded-xl transition flex items-center justify-center gap-2 ' +
    'focus:outline-none focus-visible:ring-3 focus-visible:ring-accent focus-visible:ring-offset-2 ' +
    // Disabled: a clearly-muted grey button with readable label (~5.4:1) instead
    // of a washed-out, low-contrast translucent fill.
    'disabled:cursor-not-allowed disabled:shadow-none disabled:bg-neutral-200 ' +
    'disabled:text-fg-muted disabled:border-transparent';

  const variantes: Record<string, string> = {
    primario: 'bg-accent hover:bg-accent-hover text-white shadow-sm hover:shadow-md',
    secundario:
      'bg-white hover:bg-neutral-50 text-primary-700 border border-neutral-300 hover:border-neutral-400 shadow-xs',
    terciario:
      'bg-transparent text-primary-700 hover:bg-primary-50 active:bg-primary-100',
    perigo: 'bg-danger-600 hover:bg-danger-700 text-white shadow-sm hover:shadow-md',
    verde: 'bg-success-700 hover:bg-success-800 text-white shadow-sm hover:shadow-md',
    azul: 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm hover:shadow-md',
    aviso: 'bg-warning-400 hover:bg-warning-500 text-fg-strong shadow-sm hover:shadow-md',
    escuro: 'bg-primary-900 hover:bg-primary-800 text-white shadow-sm hover:shadow-md',
    ghost: 'bg-white/10 hover:bg-white/20 text-white border border-white/25',
    premium: 'bg-gradient-to-r from-warning-300 via-warning-400 to-secondary-500 text-neutral-950 font-extrabold shadow-md shadow-secondary-500/20 hover:from-warning-400 hover:via-warning-500 hover:to-secondary-600 border border-warning-200/35 hover:shadow-lg hover:shadow-secondary-500/40 hover:-translate-y-0.5 transition-all duration-200',
  };

  const tamanhos: Record<string, string> = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      type={type}
      disabled={disabled || carregando}
      aria-busy={carregando || undefined}
      className={`${base} ${variantes[tipo] || variantes.primario} ${
        tamanhos[tamanho] || tamanhos.md
      } ${blocoCompleto ? 'w-full' : ''} ${className}`}
      {...rest}
    >
      {carregando && (
        <span
          className="absolute inline-block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
          aria-hidden="true"
        />
      )}
      <span
        className={`inline-flex items-center gap-2 ${carregando ? 'invisible' : ''}`}
      >
        {icone}
        {children}
        {iconeFim}
      </span>
    </button>
  );
}
