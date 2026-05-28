import { useState, useEffect } from 'react';
import useNetworkStatus from '@/hooks/useNetworkStatus';

export default function OfflineBanner() {
  const { online, speed } = useNetworkStatus();
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!online) {
      setWasOffline(true);
      setShowReconnected(false);
    } else if (wasOffline) {
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setShowReconnected(false);
        setWasOffline(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [online, wasOffline]);

  if (online && !showReconnected && speed !== 'slow') return null;

  const isSlow = online && !showReconnected && speed === 'slow';

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[110] text-center text-xs font-semibold py-1.5 px-4 shadow-md transition-transform duration-300 ${
        !online
          ? 'bg-yellow-500 text-yellow-950'
          : showReconnected
            ? 'bg-green-500 text-white'
            : 'bg-orange-400 text-orange-950'
      }`}
      role="status"
      aria-live="polite"
    >
      {!online ? (
        <>
          <i className="fa-solid fa-wifi-slash mr-1.5"></i>
          Sem ligação à Internet — a mostrar dados em cache
        </>
      ) : showReconnected ? (
        <>
          <i className="fa-solid fa-wifi mr-1.5"></i>
          Ligação restabelecida
        </>
      ) : isSlow ? (
        <>
          <i className="fa-solid fa-signal-weak mr-1.5"></i>
          Ligação lenta — algumas imagens podem demorar a carregar
        </>
      ) : null}
    </div>
  );
}
