import { useEffect, useState } from 'react';
import { onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';

export function OfflineBanner() {
  const [offline, setOffline] = useState(!navigator.onLine);
  const [firestoreDown, setFirestoreDown] = useState(false);

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

  useEffect(() => {
    // Lightweight connectivity probe against a known doc path
    let unsub;
    try {
      unsub = onSnapshot(
        doc(db, 'settings', 'site'),
        () => setFirestoreDown(false),
        () => setFirestoreDown(true)
      );
    } catch {
      setFirestoreDown(true);
    }
    return () => unsub?.();
  }, []);

  if (!offline && !firestoreDown) return null;

  return (
    <div
      role="status"
      className="fixed bottom-0 left-0 right-0 z-[95] bg-ink px-4 py-2 text-center text-caption text-paper"
    >
      {offline
        ? 'You are offline. Some content may be unavailable.'
        : 'Connection to the server is unstable. Showing cached content where possible.'}
    </div>
  );
}
