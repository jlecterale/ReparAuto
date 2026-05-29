'use client';

import { useRef } from 'react';
import type { SegmentedControlProps } from '@/types/ui';

/**
 * Segmented control (a.k.a. "slide button") — a compact group of mutually
 * exclusive options. Improved-contrast successor to the inline toggle that
 * lived in CarGrid: the track is a defined neutral surface, inactive labels
 * use `neutral-700` (≈8:1) instead of washed-out slate, and the active pill
 * pairs a white surface with the darker brand orange (`accent-hover`, ≥5:1).
 *
 * Accessible as a radiogroup with full arrow-key navigation.
 */
export default function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  ariaLabel,
  tamanho = 'md',
  blocoCompleto = true,
  className = '',
}: SegmentedControlProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);

  const tamanhos = {
    sm: 'px-2.5 py-1.5 text-xs gap-1.5',
    md: 'px-3 py-2 text-sm gap-2',
  } as const;

  function focusOption(index: number) {
    const next = (index + options.length) % options.length;
    refs.current[next]?.focus();
    onChange(options[next].value);
  }

  function handleKey(e: React.KeyboardEvent, index: number) {
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      focusOption(index + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      focusOption(index - 1);
    }
  }

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={`flex gap-1 bg-neutral-100 border border-neutral-200 rounded-xl p-1 ${
        blocoCompleto ? 'w-full' : 'inline-flex'
      } ${className}`}
    >
      {options.map((opt, i) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            ref={(el) => {
              refs.current[i] = el;
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onChange(opt.value)}
            onKeyDown={(e) => handleKey(e, i)}
            className={`flex-1 flex items-center justify-center font-bold rounded-lg transition focus:outline-none focus-visible:ring-3 focus-visible:ring-accent ${
              tamanhos[tamanho]
            } ${
              active
                ? 'bg-white text-accent-hover shadow-sm ring-1 ring-black/5'
                : 'text-fg hover:text-fg-strong hover:bg-white/60'
            }`}
          >
            {opt.icone}
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
