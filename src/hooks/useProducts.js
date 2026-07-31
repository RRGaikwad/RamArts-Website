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
  limit,
} from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { slugify, deleteStorageFile } from '../lib/uploadHelpers';

const col = () => collection(db, 'products');

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

export function useProducts({ admin = false, featuredOnly = false, categoryId } = {}) {
  return useQuery({
    queryKey: ['products', { admin, featuredOnly, categoryId }],
    queryFn: async () => {
      let q;
      if (admin) {
        q = query(col(), orderBy('updatedAt', 'desc'));
      } else if (featuredOnly) {
        q = query(col(), where('published', '==', true), where('featured', '==', true), orderBy('updatedAt', 'desc'));
      } else if (categoryId) {
        q = query(
          col(),
          where('published', '==', true),
          where('categoryId', '==', categoryId),
          orderBy('updatedAt', 'desc')
        );
      } else {
        q = query(col(), where('published', '==', true), orderBy('updatedAt', 'desc'));
      }
      const snap = await getDocs(q);
      return snap.docs.map(mapDoc);
    },
  });
}

export function useProduct(slugOrId, { bySlug = true } = {}) {
  return useQuery({
    queryKey: ['product', slugOrId, { bySlug }],
    enabled: Boolean(slugOrId),
    queryFn: async () => {
      if (!bySlug) {
        const snap = await getDoc(doc(db, 'products', slugOrId));
        return snap.exists() ? mapDoc(snap) : null;
      }
      const snap = await getDocs(query(col(), where('slug', '==', slugOrId), limit(1)));
      if (snap.empty) return null;
      return mapDoc(snap.docs[0]);
    },
  });
}

export function useRelatedProducts(categoryId, excludeId, count = 3) {
  return useQuery({
    queryKey: ['products', 'related', categoryId, excludeId],
    enabled: Boolean(categoryId),
    queryFn: async () => {
      const snap = await getDocs(
        query(
          col(),
          where('published', '==', true),
          where('categoryId', '==', categoryId),
          orderBy('updatedAt', 'desc'),
          limit(count + 2)
        )
      );
      return snap.docs.map(mapDoc).filter((p) => p.id !== excludeId).slice(0, count);
    },
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
      qc.setQueryData(key, (old = []) =>
        old.map((p) => (p.id === id ? { ...p, ...data } : p))
      );
      return { prev, key };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(ctx.key, ctx.prev);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (product) => {
      const paths = [
        ...(product.images || []).map((i) => i.storagePath),
        ...(product.videos || []).map((v) => v.storagePath),
      ].filter(Boolean);
      await Promise.all(paths.map(deleteStorageFile));
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
  return useQuery({
    queryKey: ['products', 'stats'],
    queryFn: async () => {
      const snap = await getDocs(col());
      const all = snap.docs.map(mapDoc);
      return {
        total: all.length,
        published: all.filter((p) => p.published).length,
        featured: all.filter((p) => p.featured).length,
        draft: all.filter((p) => !p.published).length,
      };
    },
  });
}
