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
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { slugify } from '../lib/utils';
import { sortByTimestampDesc, useFirestoreRealtimeQuery } from './useFirestoreRealtimeQuery';

const col = () => collection(db, 'products');

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

/**
 * Public lists use equality-only filters (no orderBy) so they work without
 * composite indexes. Sorting happens client-side.
 */
export function useProducts({ admin = false, featuredOnly = false, categoryId } = {}) {
  const queryKey = ['products', { admin, featuredOnly, categoryId }];

  return useFirestoreRealtimeQuery({
    queryKey,
    initialData: [],
    getRefOrQuery: () => {
      // Equality-only / collection scans — no composite indexes required.
      // Filter featured/category client-side for Spark-plan reliability.
      if (admin) return col();
      return query(col(), where('published', '==', true));
    },
    mapSnapshot: (snap) => {
      let list = snap.docs.map(mapDoc);
      if (!admin) {
        list = list.filter((p) => p.published);
        if (featuredOnly) list = list.filter((p) => p.featured);
        if (categoryId) list = list.filter((p) => p.categoryId === categoryId);
      }
      return sortByTimestampDesc(list, 'updatedAt');
    },
  });
}

export function useProduct(slugOrId, { bySlug = true } = {}) {
  const qc = useQueryClient();
  const queryKey = ['product', slugOrId, { bySlug }];
  const enabled = Boolean(slugOrId);
  const [ready, setReady] = useState(!enabled);
  const [listenError, setListenError] = useState(null);

  useEffect(() => {
    if (!enabled) return undefined;
    setReady(false);
    setListenError(null);

    const onErr = (err) => {
      console.error('[product]', err);
      setListenError(err);
      setReady(true);
    };

    if (!bySlug) {
      return onSnapshot(
        doc(db, 'products', slugOrId),
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

export function useRelatedProducts(categoryId, excludeId, count = 3) {
  return useFirestoreRealtimeQuery({
    queryKey: ['products', 'related', categoryId, excludeId],
    enabled: Boolean(categoryId),
    initialData: [],
    getRefOrQuery: () => query(col(), where('published', '==', true)),
    mapSnapshot: (snap) =>
      sortByTimestampDesc(snap.docs.map(mapDoc), 'updatedAt')
        .filter((p) => p.published && p.categoryId === categoryId && p.id !== excludeId)
        .slice(0, count),
  });
}

export function useProductMutations() {
  const qc = useQueryClient();
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['products'] });
    qc.invalidateQueries({ queryKey: ['product'] });
  };

  const create = useMutation({
    mutationFn: async (data) => {
      const payload = {
        name: data.name,
        slug: data.slug || slugify(data.name),
        description: data.description || '',
        categoryId: data.categoryId || '',
        images: data.images || [],
        videos: data.videos || [],
        specs: data.specs || {},
        tags: data.tags || [],
        featured: Boolean(data.featured),
        published: Boolean(data.published),
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
      if (data.name && !data.slug) payload.slug = slugify(data.name);
      await updateDoc(doc(db, 'products', id), payload);
    },
    onMutate: async ({ id, ...data }) => {
      await qc.cancelQueries({ queryKey: ['products'] });
      const key = ['products', { admin: true, featuredOnly: false, categoryId: undefined }];
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old = []) => old.map((p) => (p.id === id ? { ...p, ...data } : p)));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (product) => {
      await deleteDoc(doc(db, 'products', product.id));
    },
    onMutate: async (product) => {
      await qc.cancelQueries({ queryKey: ['products'] });
      const key = ['products', { admin: true, featuredOnly: false, categoryId: undefined }];
      const prev = qc.getQueryData(key);
      qc.setQueryData(key, (old = []) => old.filter((p) => p.id !== product.id));
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: invalidate,
  });

  return { create, update, remove };
}

export function useProductStats() {
  const { data: products, isLoading, isError } = useProducts({ admin: true });
  const all = products || [];
  return {
    data: {
      total: all.length,
      published: all.filter((p) => p.published).length,
      featured: all.filter((p) => p.featured).length,
      draft: all.filter((p) => !p.published).length,
    },
    isLoading,
    isError,
  };
}
