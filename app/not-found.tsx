'use client';

import { ArrowLeft, Warning } from '@phosphor-icons/react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="text-center py-20 page-enter">
      <Warning className="text-4xl text-slate-300 mb-3" />
      <h1 className="text-2xl font-extrabold text-fg-heading mb-2">Página não encontrada</h1>
      <p className="text-sm text-fg-subtle mb-4">A página que procura não existe ou foi removida.</p>
      <Link
        href="/"
        className="text-accent hover:text-accent-hover font-semibold text-sm inline-flex items-center gap-1"
      >
        <ArrowLeft /> Voltar à página inicial
      </Link>
    </div>
  );
}
