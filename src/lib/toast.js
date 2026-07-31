import { toast as sonnerToast } from './toastStore';

/** Thin wrapper so callers stay stable if we swap toast libs later */
export const toast = {
  success: (msg) => sonnerToast({ type: 'success', message: msg }),
  error: (msg) => sonnerToast({ type: 'error', message: msg }),
  info: (msg) => sonnerToast({ type: 'info', message: msg }),
};
