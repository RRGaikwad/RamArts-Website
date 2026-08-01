/**
 * Normalize third-party share links into URLs browsers can render.
 * Admin pastes whatever users commonly copy; public pages need embed/direct forms.
 */

export function ensureHttps(value) {
  let raw = String(value || '').trim();
  if (!raw) return '';

  // Paste of full iframe HTML → extract src first
  const iframeSrc = raw.match(/src=["']([^"']+)["']/i)?.[1];
  if (iframeSrc) raw = iframeSrc.trim();

  if (/^https?:\/\//i.test(raw)) return raw;
  if (/^\/\//.test(raw)) return `https:${raw}`;

  // www.youtube.com/..., youtube.com/..., youtu.be/..., domain.com/path
  if (/^(www\.)?[a-z0-9.-]+\.[a-z]{2,}([/:?#].*)?$/i.test(raw)) {
    return `https://${raw}`;
  }

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

function extractIframeSrc(value) {
  const m = String(value || '').match(/src=["']([^"']+)["']/i);
  return m?.[1]?.trim() || '';
}

/**
 * Google Maps → embeddable iframe src (no API key).
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
      return `https://maps.google.com/maps?q=${encodeURIComponent(candidate)}&z=15&output=embed`;
    }

    return candidate;
  } catch {
    return candidate;
  }
}

export function normalizeImageUrl(value) {
  const raw = ensureHttps(value);
  if (!raw) return '';

  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');

    if (host.includes('drive.google.com')) {
      const idMatch = u.pathname.match(/\/file\/d\/([^/]+)/) || u.searchParams.get('id');
      const id = Array.isArray(idMatch) ? idMatch[1] : idMatch;
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    if (host.includes('dropbox.com')) {
      u.searchParams.set('raw', '1');
      return u.toString().replace('www.dropbox.com', 'dl.dropboxusercontent.com');
    }

    if (host === 'imgur.com' && !u.pathname.startsWith('/a/') && !u.pathname.includes('.')) {
      const id = u.pathname.replace(/\//g, '');
      if (id) return `https://i.imgur.com/${id}.jpg`;
    }

    return raw;
  } catch {
    return raw;
  }
}

/** Robust YouTube ID from watch, shorts, live, embed, youtu.be, m., music. */
export function getYouTubeId(url) {
  try {
    const u = new URL(ensureHttps(url));
    const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '').replace(/^music\./, '');

    if (!host.includes('youtu')) return null;

    if (host === 'youtu.be') {
      const id = u.pathname.split('/').filter(Boolean)[0];
      return id?.split('?')[0] || null;
    }

    const v = u.searchParams.get('v');
    if (v) return v;

    const patterns = [/\/embed\/([^/?#]+)/, /\/shorts\/([^/?#]+)/, /\/live\/([^/?#]+)/, /\/v\/([^/?#]+)/];
    for (const re of patterns) {
      const m = u.pathname.match(re);
      if (m?.[1]) return m[1];
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
  const raw = ensureHttps(String(value || '').trim());
  if (!raw) return { kind: 'file', src: '' };

  // Allow pasting a full YouTube/Vimeo iframe
  const iframeSrc = extractIframeSrc(value);
  const candidate = iframeSrc ? ensureHttps(iframeSrc) : raw;

  const yt = getYouTubeId(candidate);
  if (yt) {
    return {
      kind: 'youtube',
      src: `https://www.youtube.com/watch?v=${yt}`,
      embedUrl: `https://www.youtube.com/embed/${yt}`,
    };
  }

  const vimeo = getVimeoId(candidate);
  if (vimeo) {
    return {
      kind: 'vimeo',
      src: `https://vimeo.com/${vimeo}`,
      embedUrl: `https://player.vimeo.com/video/${vimeo}`,
    };
  }

  return { kind: 'file', src: candidate };
}

export function normalizeSocialUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  if (raw.startsWith('@')) {
    return `https://instagram.com/${raw.slice(1)}`;
  }
  return ensureHttps(raw);
}

/** Strip undefined so Firestore writes never fail */
export function stripUndefined(value) {
  if (Array.isArray(value)) return value.map(stripUndefined);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => [k, stripUndefined(v)])
    );
  }
  return value;
}
