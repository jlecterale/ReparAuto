'use client';

import { useState, useEffect } from 'react';
import { Cookie, Gear } from '@phosphor-icons/react';
import Button from './Button';

export default function CookieConsent({ deferred = false }: { deferred?: boolean }) {
  const [showBanner, setShowBanner] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  
  const [funcionais, setFuncionais] = useState(true);
  const [analiticos, setAnaliticos] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const consent = localStorage.getItem('reparauto_cookie_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const parsed = JSON.parse(consent);
        setFuncionais(!!parsed.funcionais);
        setAnaliticos(!!parsed.analiticos);
      } catch {
        setShowBanner(true);
      }
    }

    // Event listener to open settings from footer
    const handleOpenSettings = () => {
      setShowPreferences(true);
      setShowBanner(true);
    };
    window.addEventListener('reparauto_open_cookie_settings', handleOpenSettings);
    return () => window.removeEventListener('reparauto_open_cookie_settings', handleOpenSettings);
  }, []);

  const saveConsent = (preferences: { necessarios: boolean; funcionais: boolean; analiticos: boolean }) => {
    localStorage.setItem('reparauto_cookie_consent', JSON.stringify(preferences));
    setShowBanner(false);
    setShowPreferences(false);
    
    // If they rejected functional cookies, clear local storage favorites
    if (!preferences.funcionais) {
      localStorage.removeItem('favs_reparauto');
    }
    
    // Notify consent-aware hooks (e.g. favourites) to re-read preferences live.
    // No full reload — a reload here flashes the page and, on first visit, would
    // re-trigger the welcome tour. Hooks listen for this event instead.
    window.dispatchEvent(new Event('cookieConsentChanged'));
  };

  const handleAcceptAll = () => {
    saveConsent({ necessarios: true, funcionais: true, analiticos: true });
  };

  const handleRejectAll = () => {
    saveConsent({ necessarios: true, funcionais: false, analiticos: false });
  };

  const handleSavePreferences = () => {
    saveConsent({ necessarios: true, funcionais, analiticos });
  };

  // While the welcome tour is up, hold the banner back so the two first-visit
  // overlays don't compete; it slides in once the tour is resolved.
  if (deferred || !showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-slate-200 shadow-2xl p-4 sm:p-6 page-enter">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        
        {/* Banner text */}
        <div className="flex items-start gap-3 flex-1">
          <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center shrink-0 text-accent">
            <Cookie size={22} weight="fill" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-fg-heading">Respeitamos a sua Privacidade</h4>
            <p className="text-xs text-fg-muted mt-1 leading-relaxed">
              Utilizamos cookies e tecnologias semelhantes para melhorar a sua experiência de navegação,
              salvar as suas preferências (como favoritos locais e pesquisas recentes) e analisar o nosso tráfego,
              em conformidade com o Regulamento Geral sobre a Proteção de Dados (RGPD).
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        {!showPreferences ? (
          <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
            <button
              onClick={() => setShowPreferences(true)}
              className="flex-1 md:flex-none flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold border border-slate-200 hover:border-slate-300 rounded-lg text-fg transition hover:bg-slate-50 cursor-pointer"
            >
              <Gear size={16} /> Personalizar
            </button>
            <Button tipo="secundario" onClick={handleRejectAll} className="flex-1 md:flex-none text-xs">
              Recusar
            </Button>
            <Button tipo="primario" onClick={handleAcceptAll} className="flex-1 md:flex-none text-xs">
              Aceitar Todos
            </Button>
          </div>
        ) : (
          <div className="w-full md:max-w-md bg-slate-50 rounded-xl p-4 border border-slate-200 mt-2 md:mt-0">
            <h5 className="font-bold text-xs text-fg-heading mb-3">Definições de Privacidade</h5>
            
            <div className="space-y-3 mb-4">
              {/* Necessary */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  disabled
                  checked
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30 opacity-70"
                />
                <div>
                  <label className="text-xs font-bold text-fg-heading flex items-center gap-1">
                    Estritamente Necessários <span className="text-[10px] text-accent font-semibold bg-accent/10 px-1.5 py-0.5 rounded">Obrigatório</span>
                  </label>
                  <p className="text-[10px] text-fg-subtle leading-relaxed mt-0.5">
                    Essenciais para manter a sessão iniciada, segurança da conta (CSRF) e guardar as suas escolhas de privacidade.
                  </p>
                </div>
              </div>

              {/* Functional */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="cookie-func"
                  checked={funcionais}
                  onChange={(e) => setFuncionais(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30 cursor-pointer"
                />
                <div>
                  <label htmlFor="cookie-func" className="text-xs font-bold text-fg-heading cursor-pointer">
                    Cookies Funcionais
                  </label>
                  <p className="text-[10px] text-fg-subtle leading-relaxed mt-0.5">
                    Permitem memorizar as suas preferências locais, como os seus anúncios favoritos (quando não está autenticado) e filtros de pesquisa.
                  </p>
                </div>
              </div>

              {/* Analytical */}
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="cookie-analitico"
                  checked={analiticos}
                  onChange={(e) => setAnaliticos(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-slate-300 text-accent focus:ring-accent/30 cursor-pointer"
                />
                <div>
                  <label htmlFor="cookie-analitico" className="text-xs font-bold text-fg-heading cursor-pointer">
                    Cookies Analíticos e de Desempenho
                  </label>
                  <p className="text-[10px] text-fg-subtle leading-relaxed mt-0.5">
                    Ajudam-nos a perceber como os visitantes interagem com o site, contabilizando as visitas às páginas de forma 100% anónima.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowPreferences(false)}
                className="flex-1 px-3 py-2 text-xs font-bold border border-slate-200 rounded-lg text-fg transition hover:bg-slate-100 cursor-pointer"
              >
                Voltar
              </button>
              <Button tipo="primario" onClick={handleSavePreferences} className="flex-1 text-xs">
                Guardar Escolhas
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
