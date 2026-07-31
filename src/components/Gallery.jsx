import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createBlurDataUrl } from '../lib/utils';

export function LazyImage({
  src,
  alt = '',
  className = '',
  wrapperClassName = '',
  aspect,
  ...props
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div
      className={`relative overflow-hidden bg-paper-sunken ${wrapperClassName}`}
      style={aspect ? { aspectRatio: aspect } : undefined}
    >
      {!loaded && !error && (
        <img
          src={createBlurDataUrl()}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full scale-110 object-cover blur-lg"
        />
      )}
      {!error ? (
        <img
          src={src}
          alt={alt}
          loading="lazy"
          decoding="async"
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={`h-full w-full object-cover transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
          {...props}
        />
      ) : (
        <div className="flex h-full min-h-[120px] w-full items-center justify-center text-caption text-ink-muted">
          Image unavailable
        </div>
      )}
    </div>
  );
}

export function GalleryLightbox({ items = [], startIndex = 0, open, onClose }) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    if (open) setIndex(startIndex);
  }, [open, startIndex]);

  const next = useCallback(() => {
    setIndex((i) => (i + 1) % items.length);
  }, [items.length]);

  const prev = useCallback(() => {
    setIndex((i) => (i - 1 + items.length) % items.length);
  }, [items.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose, next, prev]);

  // Basic swipe
  useEffect(() => {
    if (!open) return;
    let startX = 0;
    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
    };
    const onTouchEnd = (e) => {
      const dx = e.changedTouches[0].clientX - startX;
      if (dx < -50) next();
      if (dx > 50) prev();
    };
    window.addEventListener('touchstart', onTouchStart);
    window.addEventListener('touchend', onTouchEnd);
    return () => {
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchend', onTouchEnd);
    };
  }, [open, next, prev]);

  const current = items[index];

  return (
    <AnimatePresence>
      {open && current && (
        <motion.div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/90 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label="Media gallery"
        >
          <button
            type="button"
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-sm bg-paper/10 p-2 text-paper hover:bg-paper/20"
            aria-label="Close gallery"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {items.length > 1 && (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-2 top-1/2 z-10 -translate-y-1/2 rounded-sm bg-paper/10 p-3 text-paper hover:bg-paper/20 md:left-6"
                aria-label="Previous"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 18l-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-2 top-1/2 z-10 -translate-y-1/2 rounded-sm bg-paper/10 p-3 text-paper hover:bg-paper/20 md:right-6"
                aria-label="Next"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              className="relative max-h-[85vh] max-w-5xl"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {current.type === 'video' ? (
                <video
                  src={current.url}
                  controls
                  autoPlay
                  className="max-h-[85vh] w-auto max-w-full"
                  poster={current.thumbnailUrl}
                >
                  <track kind="captions" />
                </video>
              ) : (
                <img
                  src={current.url}
                  alt={current.alt || ''}
                  className="max-h-[85vh] w-auto max-w-full object-contain"
                />
              )}
            </motion.div>
          </AnimatePresence>

          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-caption text-paper/70">
            {index + 1} / {items.length}
          </p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
