/**
 * Normalize third-party share links into URLs browsers can render.
 * Admin pastes whatever users commonly copy; public pages need embed/direct forms.
 */

export function ensureHttps(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;
  // Bare domains / social handles pasted as domain.com/path
  if (/^[\w.-]+\.[a-z]{2,}/i.test(raw)) return `https://${raw}`;
  return raw;
}

export function isValidHttpUrl(value) {
  try {
    const u = new URL(ensureHttps(value));
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** Extract src from a pasted Google Maps iframe snippet */
function extractIframeSrc(value) {
  const m = String(value || '').match(/src=["']([^"']+)["']/i);
  return m?.[1]?.trim() || '';
}

/**
 * Google Maps → embeddable iframe src (no API key).
 * Accepts embed URLs, iframe HTML, place/share links.
 */
export function normalizeMapEmbedUrl(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '';

  const fromIframe = extractIframeSrc(trimmed);
  const candidate = ensureHttps(fromIframe || trimmed);

  try {
    const u = new URL(candidate);
    const host = u.hostname.replace(/^www\./, '');

    if (u.pathname.includes('/maps/embed') || candidate.includes('/maps/embed?')) {
      return candidate;
    }

    if (host.includes('google.') || host.includes('goo.gl') || host.includes('maps.app.goo.gl')) {
      // Generic embed that works for many share/place URLs without Maps API key
      return `https://maps.google.com/maps?q=${encodeURIComponent(candidate)}&z=15&output=embed`;
    }

    // Non-Google: assume already an embeddable URL
    return candidate;
  } catch {
    return candidate;
  }
}

/** Google Drive share → direct view URL usable in <img> */
export function normalizeImageUrl(value) {
  const raw = ensureHttps(value);
  if (!raw) return '';

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');

    // drive.google.com/file/d/FILE_ID/view
    if (host.includes('drive.google.com')) {
      const idMatch =
        u.pathname.match(/\/file\/d\/([^/]+)/) ||
        u.searchParams.get('id');
      const id = Array.isArray(idMatch) ? idMatch[1] : idMatch;
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    // dropbox share → raw
    if (host.includes('dropbox.com')) {
      u.searchParams.set('raw', '1');
      return u.toString().replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    }

    // i.imgur.com already fine; imgur.com/gallery → try direct
    if (host === 'imgur.com' && !u.pathname.startsWith('/a/') && !u.pathname.includes('.')) {
      const id = u.pathname.replace(/\//g, '');
      if (id) return `https://i.imgur.com/${id}.jpg`;
    }

    return raw;
  } catch {
    return raw;
  }
}

export function getYouTubeId(url) {
  try {
    const u = new URL(ensureHttps(url));
    if (u.hostname.includes('youtu.be')) return u.pathname.slice(1).split('/')[0] || null;
    if (u.hostname.includes('youtube.com')) {
      return u.searchParams.get('v') || u.pathname.match(/\/embed\/([^/]+)/)?.[1] || null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function getVimeoId(url) {
  try {
    const u = new URL(ensureHttps(url));
    if (u.hostname.includes('vimeo.com')) {
      const id = u.pathname.split('/').filter(Boolean).pop();
      return id && /^\d+$/.test(id) ? id : null;
    }
  } catch {
    /* ignore */
  }
  return null;
}

/**
 * @returns {{ kind: 'youtube'|'vimeo'|'file', src: string, embedUrl?: string }}
 */
export function normalizeVideo(value) {
  const raw = ensureHttps(value);
  if (!raw) return { kind: 'file', src: '' };

  const yt = getYouTubeId(raw);
  if (yt) {
    return {
      kind: 'youtube',
      src: raw,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
    };
  }

  const vimeo = getVimeoId(raw);
  if (vimeo) {
    return {
      kind: 'vimeo',
      src: raw,
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
    };
  }

  return { kind: 'file', src: raw };
}

export function normalizeSocialUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  // @handle → assume Instagram
  if (raw.startsWith('@')) {
    return `https://instagram.com/${raw.slice(1)}`;
  }
  return ensureHttps(raw);
}
