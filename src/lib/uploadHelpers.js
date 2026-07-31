import imageCompression from 'browser-image-compression';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './firebase';

const IMAGE_OPTIONS = {
  maxSizeMB: 0.9,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

const THUMB_OPTIONS = {
  maxSizeMB: 0.15,
  maxWidthOrHeight: 640,
  useWebWorker: true,
  fileType: 'image/jpeg',
};

export async function compressImage(file, forThumb = false) {
  if (!file.type.startsWith('image/')) return file;
  try {
    return await imageCompression(file, forThumb ? THUMB_OPTIONS : IMAGE_OPTIONS);
  } catch {
    return file;
  }
}

export function createBlurDataUrl(width = 16, height = 10, color = '#eceae5') {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}"><rect width="100%" height="100%" fill="${color}"/></svg>`;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

/**
 * Upload a file to Firebase Storage.
 * @returns {{ url: string, storagePath: string }}
 */
export function uploadFile(file, path, onProgress) {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, path);
    const task = uploadBytesResumable(storageRef, file);

    task.on(
      'state_changed',
      (snapshot) => {
        if (onProgress) {
          const pct = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
          onProgress(pct);
        }
      },
      reject,
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        resolve({ url, storagePath: path });
      }
    );
  });
}

export async function uploadImage(file, folder, onProgress) {
  const compressed = await compressImage(file);
  const ext = compressed.type === 'image/png' ? 'png' : 'jpg';
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  return uploadFile(compressed, path, onProgress);
}

export async function uploadVideo(file, folder, onProgress) {
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}-${file.name.replace(/\s+/g, '-')}`;
  return uploadFile(file, path, onProgress);
}

export async function deleteStorageFile(storagePath) {
  if (!storagePath) return;
  try {
    await deleteObject(ref(storage, storagePath));
  } catch {
    // File may already be gone
  }
}

export function slugify(text) {
  return String(text)
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}
