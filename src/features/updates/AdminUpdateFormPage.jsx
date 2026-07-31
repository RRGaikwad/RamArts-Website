import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/Button';
import { MediaUploader } from '../../components/MediaUploader';
import { Skeleton } from '../../components/Skeletons';
import { useUpdate, useUpdateMutations } from '../../hooks/useUpdates';
import { uploadImage, slugify } from '../../lib/uploadHelpers';
import { toast } from '../../lib/toast';

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  slug: z.string().optional(),
  published: z.boolean().optional(),
  scheduledAt: z.string().optional(),
});

const quillModules = {
  toolbar: [
    [{ header: [2, 3, false] }],
    ['bold', 'italic', 'underline'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    ['link'],
    ['clean'],
  ],
};

export default function AdminUpdateFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { data: existing, isLoading } = useUpdate(isNew ? null : id, { bySlug: false });
  const { create, update } = useUpdateMutations();

  const [body, setBody] = useState('');
  const [coverImage, setCoverImage] = useState(null);
  const [gallery, setGallery] = useState([]);
  const [coverUploading, setCoverUploading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { title: '', slug: '', published: false, scheduledAt: '' },
  });

  const title = watch('title');

  useEffect(() => {
    if (!isNew && existing) {
      reset({
        title: existing.title,
        slug: existing.slug,
        published: Boolean(existing.published),
        scheduledAt: existing.publishedAt?.toDate
          ? existing.publishedAt.toDate().toISOString().slice(0, 16)
          : '',
      });
      setBody(existing.bodyRichText || '');
      setCoverImage(existing.coverImage || null);
      setGallery(existing.gallery || []);
    }
  }, [existing, isNew, reset]);

  const onCoverChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const alt = window.prompt('Alt text for cover image (required):');
    if (!alt?.trim()) {
      toast.error('Alt text is required');
      e.target.value = '';
      return;
    }
    setCoverUploading(true);
    try {
      const result = await uploadImage(file, 'updates/covers');
      setCoverImage({ ...result, alt: alt.trim() });
      toast.success('Cover uploaded');
    } catch {
      toast.error('Cover upload failed');
    } finally {
      setCoverUploading(false);
      e.target.value = '';
    }
  };

  const onSubmit = async (values) => {
    const payload = {
      title: values.title,
      slug: values.slug || slugify(values.title),
      bodyRichText: body,
      coverImage,
      gallery,
      published: Boolean(values.published),
      scheduledAt: values.scheduledAt || undefined,
    };

    try {
      if (isNew) {
        const newId = await create.mutateAsync(payload);
        toast.success('Update created');
        navigate(`/admin/updates/${newId}`);
      } else {
        await update.mutateAsync({ id, ...payload });
        toast.success('Update saved');
      }
    } catch (err) {
      console.error(err);
      toast.error('Save failed');
    }
  };

  if (!isNew && isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <>
      <SEO title={isNew ? 'New Update' : 'Edit Update'} path="/admin/updates" />
      <h1 className="font-display text-display-md">{isNew ? 'New update' : 'Edit update'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-3xl space-y-6">
        <div>
          <label className="label-field" htmlFor="title">
            Title
          </label>
          <input
            id="title"
            className="input-field"
            {...register('title')}
            onBlur={() => {
              if (!watch('slug') && title) setValue('slug', slugify(title));
            }}
          />
          {errors.title && <p className="mt-1 text-sm text-danger">{errors.title.message}</p>}
        </div>

        <div>
          <label className="label-field" htmlFor="slug">
            Slug
          </label>
          <input id="slug" className="input-field" {...register('slug')} />
        </div>

        <div>
          <p className="label-field">Cover image</p>
          {coverImage?.url && (
            <div className="mb-3 aspect-[16/10] max-w-md overflow-hidden bg-paper-sunken">
              <img src={coverImage.url} alt={coverImage.alt || ''} className="h-full w-full object-cover" />
            </div>
          )}
          <label className="btn-secondary cursor-pointer inline-flex">
            {coverUploading ? 'Uploading…' : 'Upload cover'}
            <input type="file" accept="image/*" className="sr-only" onChange={onCoverChange} disabled={coverUploading} />
          </label>
          {coverImage && (
            <button type="button" className="btn-ghost text-danger ml-2" onClick={() => setCoverImage(null)}>
              Remove
            </button>
          )}
        </div>

        <div>
          <p className="label-field">Body</p>
          <div className="overflow-hidden rounded-sm border border-line bg-paper-raised [&_.ql-container]:min-h-[200px] [&_.ql-toolbar]:border-line [&_.ql-container]:border-line">
            <ReactQuill theme="snow" value={body} onChange={setBody} modules={quillModules} />
          </div>
        </div>

        <div>
          <p className="label-field">Gallery</p>
          <MediaUploader value={gallery} onChange={setGallery} folder="updates/gallery" type="image" requireAlt />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('published')} />
            Published
          </label>
          <div>
            <label className="label-field" htmlFor="scheduledAt">
              Schedule / publish at
            </label>
            <input id="scheduledAt" type="datetime-local" className="input-field" {...register('scheduledAt')} />
          </div>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isNew ? 'Create' : 'Save changes'}
          </Button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/updates')}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
