import { doc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '../lib/firebase';
import { normalizeMapEmbedUrl, normalizeSocialUrl } from '../lib/mediaUrls';

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

function mergeSettings(raw = {}) {
  return {
    ...DEFAULT_SETTINGS,
    ...raw,
    socialLinks: {
      ...DEFAULT_SETTINGS.socialLinks,
      ...(raw.socialLinks || {}),
    },
  };
}

export function getDisplaySettings(settings) {
  const s = mergeSettings(settings || {});
  return {
    ...s,
    mapEmbedUrl: normalizeMapEmbedUrl(s.mapEmbedUrl),
    socialLinks: {
      instagram: normalizeSocialUrl(s.socialLinks?.instagram),
      facebook: normalizeSocialUrl(s.socialLinks?.facebook),
    },
  };
}

export function useSiteSettings() {
  const qc = useQueryClient();
  const queryKey = ['settings', 'site'];
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'settings', 'site'),
      (snap) => {
        // Store RAW merged settings in cache (stable until Firestore updates)
        qc.setQueryData(queryKey, snap.exists() ? mergeSettings(snap.data()) : DEFAULT_SETTINGS);
        setReady(true);
      },
      (err) => {
        console.error('[settings]', err);
        setReady(true);
      }
    );
    return unsub;
  }, [qc]);

  const result = useQuery({
    queryKey,
    queryFn: async () => DEFAULT_SETTINGS,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });

  // Memoize so admin form reset() is NOT called on every render
  const data = useMemo(() => getDisplaySettings(result.data), [result.data]);

  return {
    ...result,
    data,
    isLoading: !ready,
  };
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data) => {
      const socialLinks = {
        instagram: normalizeSocialUrl(data.socialLinks?.instagram || data.instagram || ''),
        facebook: normalizeSocialUrl(data.socialLinks?.facebook || data.facebook || ''),
      };
      const payload = {
        heroTitle: data.heroTitle,
        heroSubtitle: data.heroSubtitle,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        whatsappNumber: data.whatsappNumber || '',
        address: data.address || '',
        mapEmbedUrl: normalizeMapEmbedUrl(data.mapEmbedUrl || ''),
        businessHours: data.businessHours || '',
        socialLinks,
        updatedAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'settings', 'site'), payload, { merge: true });
    },
    onMutate: async (data) => {
      await qc.cancelQueries({ queryKey: ['settings', 'site'] });
      const prev = qc.getQueryData(['settings', 'site']);
      qc.setQueryData(['settings', 'site'], (old) =>
        mergeSettings({
          ...old,
          ...data,
          socialLinks: {
            ...old?.socialLinks,
            ...data.socialLinks,
          },
        })
      );
      return { prev };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(['settings', 'site'], ctx.prev);
    },
  });
}
