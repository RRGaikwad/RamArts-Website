import {
  collection,
  doc,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';

const col = () => collection(db, 'inquiries');

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

export function useInquiries() {
  const qc = useQueryClient();
  const queryKey = ['inquiries'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(col(), orderBy('createdAt', 'desc')),
      (snap) => qc.setQueryData(queryKey, snap.docs.map(mapDoc)),
      (err) => console.error('[inquiries]', err)
    );
    return unsub;
  }, [qc]);

  return useQuery({
    queryKey,
    queryFn: async () => [],
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useUnreadInquiryCount() {
  const qc = useQueryClient();
  const queryKey = ['inquiries', 'unread'];

  useEffect(() => {
    const unsub = onSnapshot(
      query(col(), where('status', '==', 'new')),
      (snap) => qc.setQueryData(queryKey, snap.size),
      (err) => console.error('[inquiries unread]', err)
    );
    return unsub;
  }, [qc]);

  return useQuery({
    queryKey,
    queryFn: async () => 0,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useCreateInquiry() {
  return useMutation({
    mutationFn: async ({ name, email, phone, message }) => {
      await addDoc(col(), {
        name,
        email,
        phone: phone || '',
        message,
        status: 'new',
        createdAt: serverTimestamp(),
      });
    },
  });
}

export function useInquiryMutations() {
  const qc = useQueryClient();

  const updateStatus = useMutation({
    mutationFn: async ({ id, status }) => {
      await updateDoc(doc(db, 'inquiries', id), { status });
    },
    onMutate: async ({ id, status }) => {
      await qc.cancelQueries({ queryKey: ['inquiries'] });
      const prev = qc.getQueryData(['inquiries']);
      qc.setQueryData(['inquiries'], (old = []) =>
        old.map((i) => (i.id === id ? { ...i, status } : i))
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['inquiries'], ctx.prev);
    },
  });

  return { updateStatus };
}
