'use client';

import Link from 'next/link';
import { useCountry } from '@/providers/CountryProvider';

export default function Footer() {
  // The buying/selling guides are Portugal-specific (IUC, IPO, DUA, matrícula,
  // Standvirtual). Hide the link for the Brazilian market until BR guides exist
  // (plan 12 — i18n & SEO) rather than lead BR users into wrong tax/legal info.
  const { country } = useCountry();
  return (
    <footer className="bg-brand-900 text-slate-400 py-8 px-4 border-t border-slate-800 text-sm text-center">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.svg" alt="RecarGarage" className="h-9 w-auto" />
          <span className="text-xs">© 2026</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
          <Link href="/termos" className="hover:text-white transition">Termos de Utilização</Link>
          <Link href="/privacidade" className="hover:text-white transition">Política de Privacidade</Link>
          <Link href="/cookies" className="hover:text-white transition">Política de Cookies</Link>
          <button
            onClick={() => window.dispatchEvent(new Event('reparauto_open_cookie_settings'))}
            className="hover:text-white transition cursor-pointer font-semibold"
          >
            Definições de Cookies
          </button>
          <Link href="/seguranca" className="hover:text-white transition">Segurança</Link>
          {country === 'PT' && (
            <Link href="/guias" className="hover:text-white transition">Guias</Link>
          )}
          <Link href="/faq" className="hover:text-white transition">Perguntas Frequentes (FAQ)</Link>
          <a href="mailto:suporte@recargarage.com" className="hover:text-white transition">Fale Conosco (suporte@recargarage.com)</a>
          {country === 'BR' && (
            <a
              href="https://www.instagram.com/recargaragebr/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition"
            >
              Instagram
            </a>
          )}
        </div>
      </div>
    </footer>
  );
}
