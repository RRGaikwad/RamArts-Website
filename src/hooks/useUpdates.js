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
  Timestamp,
} from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { slugify, deleteStorageFile } from '../lib/uploadHelpers';

const col = () => collection(db, 'updates');

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

export function useUpdates({ admin = false, limitCount } = {}) {
  return useQuery({
    queryKey: ['updates', { admin, limitCount }],
    queryFn: async () => {
      let q;
      if (admin) {
        q = query(col(), orderBy('createdAt', 'desc'));
      } else {
        const constraints = [
          where('published', '==', true),
          orderBy('publishedAt', 'desc'),
        ];
        if (limitCount) constraints.push(limit(limitCount));
        q = query(col(), ...constraints);
      }
      const snap = await getDocs(q);
      // Filter scheduled posts that aren't due yet (client-side for public)
      const now = Date.now();
      return snap.docs.map(mapDoc).filter((u) => {
        if (admin) return true;
        if (!u.publishedAt) return true;
        const ts = u.publishedAt?.toMillis?.() ?? new Date(u.publishedAt).getTime();
        return ts <= now;
      });
    },
  });
}

export function useUpdate(slugOrId, { bySlug = true } = {}) {
  return useQuery({
    queryKey: ['update', slugOrId, { bySlug }],
    enabled: Boolean(slugOrId),
    queryFn: async () => {
      if (!bySlug) {
        const snap = await getDoc(doc(db, 'updates', slugOrId));
        return snap.exists() ? mapDoc(snap) : null;
      }
      const snap = await getDocs(query(col(), where('slug', '==', slugOrId), limit(1)));
      if (snap.empty) return null;
      return mapDoc(snap.docs[0]);
    },
  });
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
      } else if (data.published === true && !data.publishedAt) {
        payload.publishedAt = serverTimestamp();
      }
      await updateDoc(doc(db, 'updates', id), payload);
    },
    onSettled: invalidate,
  });

  const remove = useMutation({
    mutationFn: async (item) => {
      const paths = [
        item.coverImage?.storagePath,
        ...(item.gallery || []).map((g) => g.storagePath),
      ].filter(Boolean);
      await Promise.all(paths.map(deleteStorageFile));
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
