import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { onSnapshot } from 'firebase/firestore';

/**
 * Firestore onSnapshot → React Query cache.
 * Returns isLoading until first snapshot (or error), and isError/error when the listener fails
 * (e.g. missing index, permission denied).
 */
export function useFirestoreRealtimeQuery({
  queryKey,
  getRefOrQuery,
  mapSnapshot,
  enabled = true,
  initialData,
}) {
  const qc = useQueryClient();
  const [ready, setReady] = useState(!enabled);
  const [listenError, setListenError] = useState(null);

  useEffect(() => {
    if (!enabled) {
      setReady(true);
      setListenError(null);
      return undefined;
    }

    setReady(false);
    setListenError(null);
    let unsub;

    try {
      const target = typeof getRefOrQuery === 'function' ? getRefOrQuery() : getRefOrQuery;
      unsub = onSnapshot(
        target,
        (snap) => {
          qc.setQueryData(queryKey, mapSnapshot(snap));
          setListenError(null);
          setReady(true);
        },
        (err) => {
          console.error('[firestore realtime]', queryKey, err);
          setListenError(err);
          setReady(true);
        }
      );
    } catch (err) {
      console.error('[firestore realtime setup]', queryKey, err);
      setListenError(err);
      setReady(true);
    }

    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, JSON.stringify(queryKey)]);

  const result = useQuery({
    queryKey,
    queryFn: async () => qc.getQueryData(queryKey) ?? initialData ?? null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    enabled,
  });

  return {
    ...result,
    isLoading: enabled && !ready,
    isError: Boolean(listenError) || result.isError,
    error: listenError || result.error,
  };
}

/** Sort helpers — prefer client-side sort so we can avoid composite indexes. */
export function sortByTimestampDesc(items, field = 'updatedAt') {
  return [...(items || [])].sort((a, b) => {
    const ta = a?.[field]?.toMillis?.() ?? (a?.[field] ? new Date(a[field]).getTime() : 0);
    const tb = b?.[field]?.toMillis?.() ?? (b?.[field] ? new Date(b[field]).getTime() : 0);
    return tb - ta;
  });
}
