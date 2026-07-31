import { useCallback, useState } from 'react';
import { uploadImage, uploadVideo } from '../lib/uploadHelpers';
import { toast } from '../lib/toast';

/**
 * Drag-and-drop media uploader with alt text requirement for images.
 * value: array of { url, storagePath, alt?, order?, thumbnailUrl? }
 */
export function MediaUploader({
  value = [],
  onChange,
  folder = 'uploads',
  accept = 'image/*',
  multiple = true,
  type = 'image', // image | video
  requireAlt = true,
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [pendingAlt, setPendingAlt] = useState(null); // { file, preview }

  const commitUpload = async (file, alt = '') => {
    setUploading(true);
    setProgress(0);
    try {
      const result =
        type === 'video'
          ? await uploadVideo(file, folder, setProgress)
          : await uploadImage(file, folder, setProgress);

      const item =
        type === 'video'
          ? { ...result, thumbnailUrl: '', order: value.length }
          : { ...result, alt: alt || file.name, order: value.length };

      onChange([...(value || []), item]);
      toast.success(type === 'video' ? 'Video uploaded' : 'Image uploaded');
    } catch (err) {
      console.error(err);
      toast.error('Upload failed');
    } finally {
      setUploading(false);
      setProgress(0);
      setPendingAlt(null);
    }
  };

  const handleFiles = async (fileList) => {
    const files = Array.from(fileList || []);
    if (!files.length) return;

    for (const file of files) {
      if (type === 'image' && requireAlt) {
        const preview = URL.createObjectURL(file);
        setPendingAlt({ file, preview });
        return; // one at a time when alt required
      }
      await commitUpload(file);
      if (!multiple) break;
    }
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [value, type, requireAlt, folder]
  );

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

  const updateAlt = (index, alt) => {
    const next = value.map((item, i) => (i === index ? { ...item, alt } : item));
    onChange(next);
  };

  const remove = (index) => {
    onChange(value.filter((_, i) => i !== index).map((item, i) => ({ ...item, order: i })));
  };

  return (
    <div className="space-y-4">
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center border border-dashed px-4 py-10 text-center transition ${
          dragging ? 'border-brand bg-brand-muted/40' : 'border-line bg-paper'
        }`}
      >
        <p className="text-sm text-ink-muted">
          Drag & drop {type === 'video' ? 'videos' : 'images'} here, or
        </p>
        <label className="btn-secondary mt-3 cursor-pointer">
          Browse files
          <input
            type="file"
            className="sr-only"
            accept={accept}
            multiple={multiple}
            disabled={uploading}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = '';
            }}
          />
        </label>
        {uploading && (
          <div className="mt-4 w-full max-w-xs">
            <div className="h-1.5 overflow-hidden rounded-full bg-paper-sunken">
              <div className="h-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-1 text-caption text-ink-muted">Uploading… {progress}%</p>
          </div>
        )}
      </div>

      {pendingAlt && (
        <div className="border border-line bg-paper-raised p-4">
          <p className="label-field">Alt text required</p>
          <p className="mb-3 text-sm text-ink-muted">Describe the image for accessibility and SEO.</p>
          <div className="mb-3 aspect-video max-w-xs overflow-hidden bg-paper-sunken">
            <img src={pendingAlt.preview} alt="" className="h-full w-full object-cover" />
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const alt = new FormData(e.target).get('alt');
              if (!String(alt).trim()) {
                toast.error('Alt text is required');
                return;
              }
              URL.revokeObjectURL(pendingAlt.preview);
              commitUpload(pendingAlt.file, String(alt).trim());
            }}
            className="flex flex-col gap-3 sm:flex-row"
          >
            <input name="alt" className="input-field" placeholder="e.g. Acrylic storefront sign at dusk" required />
            <Button type="submit">Upload</Button>
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                URL.revokeObjectURL(pendingAlt.preview);
                setPendingAlt(null);
              }}
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {value?.length > 0 && (
        <ul className="space-y-3">
          {value.map((item, index) => (
            <li key={item.storagePath || item.url} className="flex flex-col gap-3 border border-line bg-paper p-3 sm:flex-row sm:items-center">
              <div className="h-20 w-28 shrink-0 overflow-hidden bg-paper-sunken">
                {type === 'video' ? (
                  <div className="flex h-full items-center justify-center text-caption">Video</div>
                ) : (
                  <img src={item.url} alt={item.alt || ''} className="h-full w-full object-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1 space-y-2">
                {type === 'image' && (
                  <input
                    className="input-field !py-2 text-sm"
                    value={item.alt || ''}
                    onChange={(e) => updateAlt(index, e.target.value)}
                    placeholder="Alt text"
                    aria-label={`Alt text for image ${index + 1}`}
                  />
                )}
                <p className="truncate text-caption text-ink-muted">
                  {index === 0 ? 'Cover · ' : ''}
                  {item.storagePath}
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
