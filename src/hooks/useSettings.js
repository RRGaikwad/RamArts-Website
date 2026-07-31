import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';

export const DEFAULT_SETTINGS = {
  heroTitle: 'Print. Sign. Brand.',
  heroSubtitle:
    'RamArts crafts premium printing, signage, and branding that make businesses impossible to ignore.',
  contactEmail: 'hello@ramarts.example',
  contactPhone: '+91 98765 43210',
  whatsappNumber: '919876543210',
  address: 'RamArts Studio\nYour City, State 000000',
  mapEmbedUrl: '',
  socialLinks: {
    instagram: '',
    facebook: '',
  },
  businessHours: 'Mon–Sat · 9:00 AM – 7:00 PM',
};

export function useSiteSettings() {
  const qc = useQueryClient();
  const queryKey = ['settings', 'site'];

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => {
        qc.setQueryData(
          queryKey,
          snap.exists() ? { ...DEFAULT_SETTINGS, ...snap.data() } : DEFAULT_SETTINGS
        );
      },
      (err) => console.error('[settings]', err)
    );
    return unsub;
  }, [qc]);

  return useQuery({
    queryKey,
    queryFn: async () => DEFAULT_SETTINGS,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      await setDoc(
        doc(db, 'settings', 'site'),
        { ...data, updatedAt: serverTimestamp() },
        { merge: true }
      );
    },
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['settings', 'site'] });
      const prev = qc.getQueryData(['settings', 'site']);
      qc.setQueryData(['settings', 'site'], (old) => ({ ...old, ...data }));
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['settings', 'site'], ctx.prev);
    },
  });
}
