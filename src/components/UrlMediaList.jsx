import { useEffect, useState } from 'react';
import { toast } from '../lib/toast';
import { isValidHttpUrl } from '../lib/utils';

/**
 * Admin media list using external URLs (no Firebase Storage).
 * value: [{ url, alt?, order?, thumbnailUrl? }]
 */
export function UrlMediaList({
  value = [],
  onChange,
  type = 'image',
  requireAlt = true,
  addLabel = 'Add',
}) {
  const [url, setUrl] = useState('');
  const [alt, setAlt] = useState('');
  const [thumb, setThumb] = useState('');

  const add = (e) => {
    e?.preventDefault?.();
    const trimmed = url.trim();
    if (!trimmed) {
      toast.error('Paste a media URL first');
      return;
    }
    if (!isValidHttpUrl(trimmed)) {
      toast.error('Enter a valid http(s) URL');
      return;
    }
    if (type === 'image' && requireAlt && !alt.trim()) {
      toast.error('Alt text is required for accessibility');
      return;
    }
    if (type === 'video' && thumb.trim() && !isValidHttpUrl(thumb.trim())) {
      toast.error('Thumbnail must be a valid URL');
      return;
    }

    const item =
      type === 'video'
        ? {
            url: trimmed,
            thumbnailUrl: thumb.trim() || '',
            order: value.length,
          }
        : {
            url: trimmed,
            alt: alt.trim(),
            order: value.length,
          };

    onChange([...(value || []), item]);
    setUrl('');
    setAlt('');
    setThumb('');
    toast.success(type === 'video' ? 'Video URL added' : 'Image URL added');
  };

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
    onChange(value.map((item, i) => (i === index ? { ...item, [field]: fieldValue } : item)));
  };

  const remove = (index) => {
    onChange(value.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-ink-muted">
        Host images/videos on Drive, Dropbox, Cloudinary, ImgBB, YouTube, etc., then paste the
        public link here. Files are not uploaded to Firebase.
      </p>

      <form onSubmit={add} className="space-y-3 border border-line bg-paper p-4">
        <div>
          <label className="label-field" htmlFor={`media-url-${type}`}>
            {type === 'video' ? 'Video URL' : 'Image URL'}
          </label>
          <input
            id={`media-url-${type}`}
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder={
              type === 'video' ? 'https://…/video.mp4 or streaming URL' : 'https://…/photo.jpg'
            }
          />
        </div>
        {type === 'image' && (
          <div>
            <label className="label-field" htmlFor={`media-alt-${type}`}>
              Alt text {requireAlt ? '(required)' : ''}
            </label>
            <input
              id={`media-alt-${type}`}
              className="input-field"
              value={alt}
              onChange={(e) => setAlt(e.target.value)}
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
        <button type="submit" className="btn-secondary">
          {addLabel}
        </button>
      </form>

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
                    <div className="flex h-full items-center justify-center text-caption">Video</div>
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
}

/** Single cover image via URL */
export function UrlCoverField({ value, onChange }) {
  const [url, setUrl] = useState(value?.url || '');
  const [alt, setAlt] = useState(value?.alt || '');

  useEffect(() => {
    setUrl(value?.url || '');
    setAlt(value?.alt || '');
  }, [value?.url, value?.alt]);

  const apply = (e) => {
    e?.preventDefault?.();
    if (!url.trim()) {
      onChange(null);
      return;
    }
    if (!isValidHttpUrl(url.trim())) {
      toast.error('Enter a valid http(s) URL');
      return;
    }
    if (!alt.trim()) {
      toast.error('Alt text is required');
      return;
    }
    onChange({ url: url.trim(), alt: alt.trim() });
    toast.success('Cover URL saved');
  };

  return (
    <div className="space-y-3">
      {value?.url && (
        <div className="aspect-[16/10] max-w-md overflow-hidden bg-paper-sunken">
          <img src={value.url} alt={value.alt || ''} className="h-full w-full object-cover" />
        </div>
      )}
      <form onSubmit={apply} className="space-y-3 border border-line bg-paper p-4">
        <div>
          <label className="label-field" htmlFor="cover-url">
            Cover image URL
          </label>
          <input
            id="cover-url"
            className="input-field"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
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
            onChange={(e) => setAlt(e.target.value)}
            placeholder="Describe the cover image"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="submit" className="btn-secondary">
            Set cover
          </button>
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
              Remove
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
