import { useEffect, useState } from 'react';

/** Shows only when the browser is actually offline — not on Firestore permission errors. */
export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-[95] bg-ink px-4 py-2 text-center text-caption text-paper"
    >
      You are offline. Some content may be unavailable.
    </div>
  );
}
