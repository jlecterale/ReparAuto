import { useState, useEffect } from 'react';
import useOnlineStatus from '@/hooks/useOnlineStatus';

export default function OfflineBanner() {
  const online = useOnlineStatus();
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

  if (online && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[110] text-center text-xs font-semibold py-1.5 px-4 shadow-md transition-transform duration-300 ${
        online
          ? 'bg-green-500 text-white'
          : 'bg-yellow-500 text-yellow-950'
      }`}
      role="status"
      aria-live="polite"
    >
      {online ? (
        <>
          <i className="fa-solid fa-wifi mr-1.5"></i>
          Ligação restabelecida
        </>
      ) : (
        <>
          <i className="fa-solid fa-wifi mr-1.5"></i>
          Sem ligação à Internet — a mostrar dados em cache
        </>
      )}
    </div>
  );
}
