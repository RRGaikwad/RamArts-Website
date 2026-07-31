import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { slugify } from '../lib/utils';

const col = () => collection(db, 'categories');

export function useCategories({ admin = false } = {}) {
  const qc = useQueryClient();
  const queryKey = ['categories', { admin }];

  useEffect(() => {
    const q = query(col(), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        qc.setQueryData(queryKey, list);
        // Keep both admin/public caches aligned (same data)
        qc.setQueryData(['categories', { admin: !admin }], list);
      },
      (err) => console.error('[categories]', err)
    );
    return unsub;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [admin]);

  return useQuery({
    queryKey,
    queryFn: async () => [],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useCategoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] });

  const create = useMutation({
    mutationFn: async ({ name, order = 0 }) => {
      const slug = slugify(name);
      const ref = await addDoc(col(), { name, slug, order, createdAt: serverTimestamp() });
      return ref.id;
    },
    onMutate: async (vars) => {
      await qc.cancelQueries({ queryKey: ['categories'] });
      const prev = qc.getQueryData(['categories', { admin: true }]);
      qc.setQueryData(['categories', { admin: true }], (old = []) => [
        ...old,
        {
          id: `temp-${Date.now()}`,
          name: vars.name,
          slug: slugify(vars.name),
          order: vars.order ?? old.length,
        },
      ]);
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['categories', { admin: true }], ctx.prev);
    },
    onSettled: invalidate,
  });

  const update = useMutation({
    mutationFn: async ({ id, ...data }) => {
      const payload = { ...data };
      if (data.name) payload.slug = slugify(data.name);
      await updateDoc(doc(db, 'categories', id), payload);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (id) => {
      await deleteDoc(doc(db, 'categories', id));
    },
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['categories'] });
      const prev = qc.getQueryData(['categories', { admin: true }]);
      qc.setQueryData(['categories', { admin: true }], (old = []) => old.filter((c) => c.id !== id));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['categories', { admin: true }], ctx.prev);
    },
    onSettled: invalidate,
  });

  const reorder = useMutation({
    mutationFn: async (orderedIds) => {
      const batch = writeBatch(db);
      orderedIds.forEach((id, i) => {
        batch.update(doc(db, 'categories', id), { order: i });
      });
      await batch.commit();
    },
    onSettled: invalidate,
  });

  return { create, update, remove, reorder };
}
