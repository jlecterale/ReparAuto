import type { InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Field label rendered above the input. */
  label?: string;
  /** Validation/error message rendered below the input. */
  erro?: string;
  /** Optional trailing element (e.g. a password-visibility toggle). */
  iconeFim?: ReactNode;
}

/**
 * Canonical text input for RecarGarage.
 *
 * Label, placeholder and value all meet WCAG AA contrast on white:
 *  - label       → neutral-700 (~8:1)
 *  - placeholder → neutral-500 (~5.7:1)
 *  - value       → neutral-900
 */
export default function Input({
  label,
  erro,
  iconeFim,
  id,
  name,
  className = '',
  ...rest
}: InputProps) {
  const inputId = id || name;

  return (
    <div>
      {label && (
        <label htmlFor={inputId} className="block text-xs font-bold text-fg mb-1.5">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={inputId}
          name={name}
          aria-invalid={erro ? true : undefined}
          className={`w-full bg-white rounded-xl px-3.5 py-3 text-sm text-fg-strong placeholder:text-fg-subtle transition
            focus:outline-none focus:ring-3 focus:ring-accent/25 border
            ${erro ? 'border-danger-500 focus:border-danger-500' : 'border-neutral-300 focus:border-accent'}
            ${iconeFim ? 'pr-11' : ''} ${className}`}
          {...rest}
        />
        {iconeFim && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center">
            {iconeFim}
          </span>
        )}
      </div>
      {erro && <p className="mt-1.5 text-xs font-medium text-danger-600">{erro}</p>}
    </div>
  );
}
