let listeners = [];
let toasts = [];

export function subscribe(listener) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getToasts() {
  return toasts;
}

function emit() {
  listeners.forEach((l) => l(toasts));
}

export function toast({ type = 'info', message, duration = 4000 }) {
  const id = Date.now() + Math.random();
  toasts = [...toasts, { id, type, message }];
  emit();
  setTimeout(() => {
    toasts = toasts.filter((t) => t.id !== id);
    emit();
  }, duration);
  return id;
}

export function dismissToast(id) {
  toasts = toasts.filter((t) => t.id !== id);
  emit();
}
