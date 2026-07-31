import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { auth, isAdminUid } from '../lib/firebase';

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = loading
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setReady(true);
    });
    return unsub;
  }, []);

  const isAdmin = Boolean(user && isAdminUid(user.uid));

  return { user, ready, isAdmin, isAuthenticated: Boolean(user) };
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ email, password }) => {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      if (!isAdminUid(cred.user.uid)) {
        await signOut(auth);
        throw new Error('This account is not authorized for admin access.');
      }
      return cred.user;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['auth'] }),
  });
}

export function useLogout() {
  return useMutation({
    mutationFn: () => signOut(auth),
  });
}

/** Convenience query-shaped auth for consumers that prefer React Query */
export function useAuthQuery() {
  return useQuery({
    queryKey: ['auth'],
    queryFn: () =>
      new Promise((resolve) => {
        const unsub = onAuthStateChanged(auth, (u) => {
          unsub();
          resolve(u);
        });
      }),
    staleTime: Infinity,
  });
}
