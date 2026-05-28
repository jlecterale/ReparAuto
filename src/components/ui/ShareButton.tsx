import { useState, useCallback, useRef, useEffect } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(timerRef.current), []);

  useEffect(() => {
    if (!showMenu) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showMenu]);

  const getShareUrl = useCallback(() => url || window.location.href, [url]);

  const handleShare = useCallback(async () => {
    const shareUrl = getShareUrl();

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // user cancelled — fall through to menu
      }
    }
    setShowMenu(true);
  }, [title, text, getShareUrl]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setShowMenu(false);
      timerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {}
  }, [getShareUrl]);

  const shareWhatsApp = useCallback(() => {
    const shareUrl = getShareUrl();
    const msg = encodeURIComponent(`${text}\n${shareUrl}`);
    window.open(`https://wa.me/?text=${msg}`, '_blank', 'noopener');
    setShowMenu(false);
  }, [text, getShareUrl]);

  const shareFacebook = useCallback(() => {
    const shareUrl = getShareUrl();
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'noopener,width=600,height=400');
    setShowMenu(false);
  }, [getShareUrl]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={handleShare}
        className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center gap-1"
        aria-label="Partilhar anúncio"
      >
        <i className={`fa-solid ${copied ? 'fa-check text-green-500' : 'fa-share-nodes'}`}></i>
        {copied ? 'Link copiado!' : 'Partilhar'}
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-slate-200 py-1 z-50 min-w-[160px] page-enter">
          <button
            onClick={copyLink}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <i className="fa-solid fa-link text-slate-400"></i> Copiar link
          </button>
          <button
            onClick={shareWhatsApp}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <i className="fa-brands fa-whatsapp text-green-500"></i> WhatsApp
          </button>
          <button
            onClick={shareFacebook}
            className="w-full text-left px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
          >
            <i className="fa-brands fa-facebook text-blue-600"></i> Facebook
          </button>
        </div>
      )}
    </div>
  );
}
