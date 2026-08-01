import { forwardRef, useEffect, useImperativeHandle, useState } from 'react';
import { toast } from '../lib/toast';
import {
  isValidHttpUrl,
  normalizeImageUrl,
  normalizeVideo,
  ensureHttps,
} from '../lib/mediaUrls';

/**
 * Admin media list using external URLs (no Firebase Storage).
 * - No nested <form> (avoids stealing parent Save submit).
 * - flush() commits any in-progress URL when parent saves.
 */
export const UrlMediaList = forwardRef(function UrlMediaList(
  { value = [], onChange, type = 'image', requireAlt = true, addLabel = 'Add' },
  ref
) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [thumb, setThumb] = useState('');

  const commitOne = (list, rawUrl, rawAlt, rawThumb) => {
    const trimmedInput = String(rawUrl || '').trim();
    if (!trimmedInput) return { ok: true, added: false, list };

    const trimmed = ensureHttps(trimmedInput);
    if (!isValidHttpUrl(trimmed)) {
      return {
        ok: false,
        error: 'Enter a valid URL (YouTube, Vimeo, or direct .mp4 / https link)',
        list,
      };
    }

    if (type === 'image') {
      const altText = (rawAlt || '').trim() || 'Portfolio image';
      if (requireAlt && !(rawAlt || '').trim()) {
        toast.info('Alt text was empty — used a default. Edit it for better SEO.');
      }
      const item = {
        url: normalizeImageUrl(trimmed),
        alt: altText,
        order: list.length,
      };
      return { ok: true, added: true, list: [...list, item] };
    }

    const video = normalizeVideo(trimmedInput);
    if (!video.src && !video.embedUrl) {
      return { ok: false, error: 'Could not read that video URL', list };
    }

    const thumbNorm = (rawThumb || '').trim() ? normalizeImageUrl(rawThumb.trim()) : '';
    if ((rawThumb || '').trim() && !isValidHttpUrl(thumbNorm)) {
      return { ok: false, error: 'Thumbnail must be a valid URL', list };
    }

    const item = {
      url: video.src || trimmed,
      thumbnailUrl: thumbNorm || '',
      order: list.length,
      provider: video.kind !== 'file' ? video.kind : null,
      embedUrl: video.embedUrl || null,
    };
    return { ok: true, added: true, list: [...list, item] };
  };

  const add = () => {
    if (!url.trim()) {
      toast.error(type === 'video' ? 'Paste a YouTube, Vimeo, or video file URL first' : 'Paste a media URL first');
      return;
    }
    const result = commitOne(value || [], url, alt, thumb);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (!result.added) {
      toast.error('Paste a media URL first');
      return;
    }
    onChange(result.list);
    setUrl('');
    setAlt('');
    setThumb('');
    const kind = type === 'video' ? normalizeVideo(url).kind : 'image';
    toast.success(
      type === 'video'
        ? kind === 'youtube'
          ? 'YouTube video added'
          : kind === 'vimeo'
            ? 'Vimeo video added'
            : 'Video URL added'
        : 'Image URL added'
    );
  };

  useImperativeHandle(ref, () => ({
    /** Returns { ok, error?, items } — items include any pending draft URL */
    flush: () => {
      if (!url.trim() && !alt.trim() && !thumb.trim()) {
        return { ok: true, items: value || [] };
      }
      const result = commitOne(value || [], url, alt, thumb);
      if (!result.ok) return { ok: false, error: result.error, items: value || [] };
      onChange(result.list);
      setUrl('');
      setAlt('');
      setThumb('');
      return { ok: true, items: result.list };
    },
  }));

  const move = (index, dir) => {
    const next = [...value];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((item, i) => ({ ...item, order: i })));
  };

  const setCover = (index) => {
    const next = [...value];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    onChange(next.map((item, i) => ({ ...item, order: i })));
  };

  const updateField = (index, field, fieldValue) => {
    onChange(
      value.map((item, i) => {
        if (i !== index) return item;
        if (field === 'url' && type === 'image') {
          return { ...item, url: normalizeImageUrl(fieldValue) };
        }
        if (field === 'url' && type === 'video') {
          const video = normalizeVideo(fieldValue);
          return {
            ...item,
            url: video.src || ensureHttps(fieldValue),
            provider: video.kind !== 'file' ? video.kind : null,
            embedUrl: video.embedUrl || null,
          };
        }
        if (field === 'thumbnailUrl') {
          return { ...item, thumbnailUrl: normalizeImageUrl(fieldValue) };
        }
        return { ...item, [field]: fieldValue };
      })
    );
  };

  const remove = (index) => {
    onChange(value.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        {type === 'video' ? (
          <>
            Paste a <strong>YouTube</strong>, <strong>Vimeo</strong>, or direct video file URL, then click{' '}
            <strong>{addLabel}</strong> (or Save — pending URLs are included). Works with or without{' '}
            <code className="text-caption">https://</code>.
          </>
        ) : (
          <>
            Paste a public link, then click <strong>{addLabel}</strong> (or just Save — we&apos;ll pick up a
            pending URL). Direct image links work best; Drive/Dropbox links are normalized when possible.
          </>
        )}
      </p>

      <div className="space-y-3 border border-line bg-paper p-4">
        <div>
          <label className="label-field" htmlFor={`media-url-${type}`}>
            {type === 'video' ? 'Video URL' : 'Image URL'}
          </label>
          <input
            id={`media-url-${type}`}
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                add();
              }
            }}
            placeholder={
              type === 'video'
                ? 'youtube.com/watch?v=… or youtu.be/… or .mp4'
                : 'https://…/photo.jpg'
            }
          />
        </div>
        {type === 'image' && (
          <div>
            <label className="label-field" htmlFor={`media-alt-${type}`}>
              Alt text {requireAlt ? '(recommended)' : ''}
            </label>
            <input
              id={`media-alt-${type}`}
              className="input-field"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  add();
                }
              }}
              placeholder="e.g. Acrylic storefront sign at dusk"
            />
          </div>
        )}
        {type === 'video' && (
          <div>
            <label className="label-field" htmlFor={`media-thumb-${type}`}>
              Thumbnail image URL <span className="normal-case tracking-normal">(optional)</span>
            </label>
            <input
              id={`media-thumb-${type}`}
              className="input-field"
              value={thumb}
              onChange={(e) => setThumb(e.target.value)}
              placeholder="https://…/thumb.jpg"
            />
          </div>
        )}
        <button type="button" className="btn-secondary" onClick={add}>
          {addLabel}
        </button>
      </div>

      {value?.length > 0 && (
        <ul className="space-y-3">
          {value.map((item, index) => (
            <li
              key={`${item.url}-${index}`}
              className="flex flex-col gap-3 border border-line bg-paper-raised p-3 sm:flex-row sm:items-start"
            >
              <div className="h-20 w-28 shrink-0 overflow-hidden bg-paper-sunken">
                {type === 'video' ? (
                  item.thumbnailUrl ? (
                    <img src={item.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-caption">
                      {item.provider || 'Video'}
                    </div>
                  )
                ) : (
                  <img src={item.url} alt={item.alt || ''} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                <input
                  className="input-field !py-2 font-mono text-xs"
                  value={item.url}
                  onChange={(e) => updateField(index, 'url', e.target.value)}
                  aria-label={`URL ${index + 1}`}
                />
                {type === 'image' && (
                  <input
                    className="input-field !py-2 text-sm"
                    value={item.alt || ''}
                    onChange={(e) => updateField(index, 'alt', e.target.value)}
                    placeholder="Alt text"
                    aria-label={`Alt text ${index + 1}`}
                  />
                )}
                <p className="text-caption text-ink-muted">
                  {index === 0 && type === 'image' ? 'Cover · ' : ''}
                  Item {index + 1}
                </p>
              </div>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="btn-ghost text-xs" onClick={() => move(index, -1)} aria-label="Move up">
                  ↑
                </button>
                <button type="button" className="btn-ghost text-xs" onClick={() => move(index, 1)} aria-label="Move down">
                  ↓
                </button>
                {index !== 0 && type === 'image' && (
                  <button type="button" className="btn-ghost text-xs" onClick={() => setCover(index)}>
                    Set cover
                  </button>
                )}
                <button type="button" className="btn-ghost text-xs text-danger" onClick={() => remove(index)}>
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
});

/** Cover image — always synced to parent (no separate Set click required before Save) */
export function UrlCoverField({ value, onChange }) {
  const [url, setUrl] = useState(value?.url || '');
  const [alt, setAlt] = useState(value?.alt || '');

  useEffect(() => {
    setUrl(value?.url || '');
    setAlt(value?.alt || '');
  }, [value?.url, value?.alt]);

  const sync = (nextUrl, nextAlt) => {
    const trimmedUrl = nextUrl.trim();
    if (!trimmedUrl) {
      onChange(null);
      return;
    }
    const normalized = normalizeImageUrl(trimmedUrl);
    if (!isValidHttpUrl(normalized)) return;
    onChange({
      url: normalized,
      alt: nextAlt.trim() || 'Cover image',
    });
  };

  return (
    <div className="space-y-3">
      {value?.url && (
        <div className="aspect-[16/10] max-w-md overflow-hidden bg-paper-sunken">
          <img src={value.url} alt={value.alt || ''} className="h-full w-full object-cover" />
        </div>
      )}
      <div className="space-y-3 border border-line bg-paper p-4">
        <div>
          <label className="label-field" htmlFor="cover-url">
            Cover image URL
          </label>
          <input
            id="cover-url"
            className="input-field"
            value={url}
            onChange={(e) => {
              setUrl(e.target.value);
              sync(e.target.value, alt);
            }}
            onBlur={() => sync(url, alt)}
            placeholder="https://…/cover.jpg"
          />
        </div>
        <div>
          <label className="label-field" htmlFor="cover-alt">
            Alt text
          </label>
          <input
            id="cover-alt"
            className="input-field"
            value={alt}
            onChange={(e) => {
              setAlt(e.target.value);
              sync(url, e.target.value);
            }}
            onBlur={() => sync(url, alt)}
            placeholder="Describe the cover image"
          />
        </div>
        {value && (
          <button
            type="button"
            className="btn-ghost text-danger"
            onClick={() => {
              onChange(null);
              setUrl('');
              setAlt('');
            }}
          >
            Remove cover
          </button>
        )}
        <p className="text-caption text-ink-muted">Saved automatically with the post — no extra click needed.</p>
      </div>
    </div>
  );
}
