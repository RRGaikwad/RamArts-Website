import {
  collection,
  doc,
  getDocs,
  addDoc,
  updateDoc,
  query,
  orderBy,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';

const col = () => collection(db, 'inquiries');

function mapDoc(d) {
  return { id: d.id, ...d.data() };
}

export function useInquiries() {
  return useQuery({
    queryKey: ['inquiries'],
    queryFn: async () => {
      const snap = await getDocs(query(col(), orderBy('createdAt', 'desc')));
      return snap.docs.map(mapDoc);
    },
  });
}

export function useUnreadInquiryCount() {
  return useQuery({
    queryKey: ['inquiries', 'unread'],
    queryFn: async () => {
      const snap = await getDocs(query(col(), where('status', '==', 'new')));
      return snap.size;
    },
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
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['inquiries'] });
  };

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
    onSettled: invalidate,
  });

  return { updateStatus };
}
