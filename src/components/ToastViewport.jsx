import { useEffect, useState } from 'react';
import { subscribe, getToasts, dismissToast } from '../lib/toastStore';
import { AnimatePresence, motion } from 'framer-motion';

const styles = {
  success: 'border-success/30 bg-paper-raised text-ink',
  error: 'border-danger/30 bg-paper-raised text-ink',
  info: 'border-brand/30 bg-paper-raised text-ink',
};

const dots = {
  success: 'bg-success',
  error: 'bg-danger',
  info: 'bg-brand',
};

export function ToastViewport() {
  const [items, setItems] = useState(getToasts());

  useEffect(() => subscribe(setItems), []);

  return (
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[100] flex w-full max-w-sm flex-col gap-2"
      aria-live="polite"
    >
      <AnimatePresence>
        {items.map((t) => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8 }}
            className={`pointer-events-auto flex items-start gap-3 rounded-sm border px-4 py-3 shadow-soft ${styles[t.type] || styles.info}`}
          >
            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dots[t.type] || dots.info}`} />
            <p className="flex-1 text-sm">{t.message}</p>
            <button
              type="button"
              className="text-ink-muted hover:text-ink"
              onClick={() => dismissToast(t.id)}
              aria-label="Dismiss"
            >
              ×
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
