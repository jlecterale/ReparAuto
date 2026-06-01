'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-brand-900 text-slate-400 py-8 px-4 border-t border-slate-800 text-sm text-center">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="ReparAuto" className="h-9 w-auto" />
          <span className="text-xs">© 2026</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
          <Link href="/termos" className="hover:text-white transition">Termos de Utilização</Link>
          <Link href="/privacidade" className="hover:text-white transition">Política de Privacidade</Link>
          <Link href="/cookies" className="hover:text-white transition">Política de Cookies</Link>
          <Link href="/seguranca" className="hover:text-white transition">Segurança</Link>
          <Link href="/faq" className="hover:text-white transition">Perguntas Frequentes (FAQ)</Link>
          <a href="mailto:recargaragesuporte@gmail.com" className="hover:text-white transition">Fale Conosco (recargaragesuporte@gmail.com)</a>
        </div>
      </div>
    </footer>
  );
}
