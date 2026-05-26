export default function Footer() {
  return (
    <footer className="bg-brand-900 text-slate-400 py-8 px-4 border-t border-slate-800 text-sm text-center">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <i className="fa-solid fa-wrench text-accent text-xl"></i>
          <span className="font-bold text-white">Repar<span className="text-accent">Auto</span></span>
          <span className="text-xs">© 2026</span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-xs font-semibold">
          <a href="#/termos" className="hover:text-white transition">Termos de Utilização</a>
          <a href="#/privacidade" className="hover:text-white transition">Política de Privacidade</a>
          <a href="#/cookies" className="hover:text-white transition">Política de Cookies</a>
          <a href="#/seguranca" className="hover:text-white transition">Segurança</a>
        </div>
      </div>
    </footer>
  );
}
