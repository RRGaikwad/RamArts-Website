import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  limit,
  Timestamp,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { slugify } from '../lib/utils';
import { sortByTimestampDesc, useFirestoreRealtimeQuery } from './useFirestoreRealtimeQuery';

const col = () => collection(db, 'updates');

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

function filterPublic(list) {
  const now = Date.now();
  return list.filter((u) => {
    if (!u.published) return false;
    if (!u.publishedAt) return true;
    const ts = u.publishedAt?.toMillis?.() ?? new Date(u.publishedAt).getTime();
    return ts <= now;
  });
}

export function useUpdates({ admin = false, limitCount } = {}) {
  return useFirestoreRealtimeQuery({
    queryKey: ['updates', { admin, limitCount }],
    initialData: [],
    getRefOrQuery: () => {
      if (admin) return col();
      return query(col(), where('published', '==', true));
    },
    mapSnapshot: (snap) => {
      let list = snap.docs.map(mapDoc);
      if (!admin) list = filterPublic(list);
      list = sortByTimestampDesc(list, admin ? 'createdAt' : 'publishedAt');
      if (limitCount && !admin) list = list.slice(0, limitCount);
      return list;
    },
  });
}

export function useUpdate(slugOrId, { bySlug = true } = {}) {
  const qc = useQueryClient();
  const queryKey = ['update', slugOrId, { bySlug }];
  const enabled = Boolean(slugOrId);
  const [ready, setReady] = useState(!enabled);
  const [listenError, setListenError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    setReady(false);
    setListenError(null);

    const onErr = (err) => {
      console.error('[update]', err);
      setListenError(err);
      setReady(true);
    };

    if (!bySlug) {
      return onSnapshot(
        doc(db, 'updates', slugOrId),
        (snap) => {
          qc.setQueryData(queryKey, snap.exists() ? mapDoc(snap) : null);
          setReady(true);
        },
        onErr
      );
    }

    return onSnapshot(
      query(col(), where('slug', '==', slugOrId), limit(1)),
      (snap) => {
        qc.setQueryData(queryKey, snap.empty ? null : mapDoc(snap.docs[0]));
        setReady(true);
      },
      onErr
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugOrId, bySlug, enabled]);

  const result = useQuery({
    queryKey,
    enabled,
    queryFn: async () => null,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  return {
    ...result,
    isLoading: enabled && !ready,
    isError: Boolean(listenError) || result.isError,
    error: listenError || result.error,
  };
}

export function useUpdateMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['updates'] });
    qc.invalidateQueries({ queryKey: ['update'] });
  };

  const create = useMutation({
    mutationFn: async (data) => {
      let publishedAt = null;
      if (data.published) {
        publishedAt = data.scheduledAt
          ? Timestamp.fromDate(new Date(data.scheduledAt))
          : serverTimestamp();
      } else if (data.scheduledAt) {
        publishedAt = Timestamp.fromDate(new Date(data.scheduledAt));
      }

      const payload = {
        title: data.title,
        slug: data.slug || slugify(data.title),
        coverImage: data.coverImage || null,
        bodyRichText: data.bodyRichText || '',
        gallery: data.gallery || [],
        published: Boolean(data.published),
        publishedAt,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      const ref = await addDoc(col(), payload);
      return ref.id;
    },
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const payload = { ...data, updatedAt: serverTimestamp() };
      if (data.title && !data.slug) payload.slug = slugify(data.title);
      if (data.scheduledAt) {
        payload.publishedAt = Timestamp.fromDate(new Date(data.scheduledAt));
        delete payload.scheduledAt;
      } else if (data.published === true && data.publishedAt === undefined) {
        payload.publishedAt = serverTimestamp();
      }
      await updateDoc(doc(db, 'updates', id), payload);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (item) => {
      await deleteDoc(doc(db, 'updates', item.id));
    },
    onMutate: async (item) => {
      await qc.cancelQueries({ queryKey: ['updates'] });
      const key = ['updates', { admin: true, limitCount: undefined }];
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old = []) => old.filter((u) => u.id !== item.id));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: invalidate,
  });

  return { create, update, remove };
}
