import { useState, useCallback } from 'react';

interface ShareButtonProps {
  title: string;
  text: string;
  url?: string;
}

export default function ShareButton({ title, text, url }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = useCallback(async () => {
    const shareUrl = url || window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        return;
      } catch {
        // user cancelled or share failed — fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard not available
    }
  }, [title, text, url]);

  return (
    <button
      onClick={handleShare}
      className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition flex items-center gap-1"
      aria-label="Partilhar anúncio"
    >
      <i className={`fa-solid ${copied ? 'fa-check text-green-500' : 'fa-share-nodes'}`}></i>
      {copied ? 'Link copiado!' : 'Partilhar'}
    </button>
  );
}
