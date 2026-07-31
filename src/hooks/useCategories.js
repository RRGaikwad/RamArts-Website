import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { slugify } from '../lib/uploadHelpers';

const col = () => collection(db, 'categories');

async function fetchCategories({ includeAll = false } = {}) {
  const snap = await getDocs(query(col(), orderBy('order', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function useCategories({ admin = false } = {}) {
  return useQuery({
    queryKey: ['categories', { admin }],
    queryFn: () => fetchCategories({ includeAll: admin }),
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
        { id: `temp-${Date.now()}`, name: vars.name, slug: slugify(vars.name), order: vars.order ?? old.length },
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

export async function getCategoryById(id) {
  const snap = await getDoc(doc(db, 'categories', id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
