import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/Button';
import { MediaUploader } from '../../components/MediaUploader';
import { Skeleton } from '../../components/Skeletons';
import { useProduct, useProductMutations } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { slugify } from '../../lib/uploadHelpers';
import { toast } from '../../lib/toast';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().min(1, 'Select a category'),
  tags: z.string().optional(),
  featured: z.boolean().optional(),
  published: z.boolean().optional(),
});

export default function AdminProductFormPage() {
  const { id } = useParams();
  const isNew = !id || id === 'new';
  const navigate = useNavigate();
  const { data: existing, isLoading } = useProduct(isNew ? null : id, { bySlug: false });
  const { data: categories } = useCategories({ admin: true });
  const { create, update } = useProductMutations();

  const [images, setImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [specsText, setSpecsText] = useState('material: \nsizes: Custom');

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      slug: '',
      description: '',
      categoryId: '',
      tags: '',
      featured: false,
      published: false,
    },
  });

  const name = watch('name');

  useEffect(() => {
    if (!isNew && existing) {
      reset({
        name: existing.name,
        slug: existing.slug,
        description: existing.description || '',
        categoryId: existing.categoryId || '',
        tags: (existing.tags || []).join(', '),
        featured: Boolean(existing.featured),
        published: Boolean(existing.published),
      });
      setImages(existing.images || []);
      setVideos(existing.videos || []);
      if (existing.specs) {
        setSpecsText(
          Object.entries(existing.specs)
            .map(([k, v]) => `${k}: ${v}`)
            .join('\n')
        );
      }
    }
  }, [existing, isNew, reset]);

  const parseSpecs = (text) => {
    const specs = {};
    text.split('\n').forEach((line) => {
      const idx = line.indexOf(':');
      if (idx === -1) return;
      const key = line.slice(0, idx).trim();
      const val = line.slice(idx + 1).trim();
      if (key) specs[key] = val;
    });
    return specs;
  };

  const onSubmit = async (values) => {
    if (images.some((img) => !img.alt?.trim())) {
      toast.error('Every image needs alt text');
      return;
    }
    const payload = {
      name: values.name,
      slug: values.slug || slugify(values.name),
      description: values.description || '',
      categoryId: values.categoryId,
      tags: values.tags
        ? values.tags.split(',').map((t) => t.trim()).filter(Boolean)
        : [],
      featured: Boolean(values.featured),
      published: Boolean(values.published),
      images: images.map((img, i) => ({ ...img, order: i })),
      videos,
      specs: parseSpecs(specsText),
    };

    try {
      if (isNew) {
        const newId = await create.mutateAsync(payload);
        toast.success('Product created');
        navigate(`/admin/products/${newId}`);
      } else {
        await update.mutateAsync({ id, ...payload });
        toast.success('Product saved');
      }
    } catch (err) {
      console.error(err);
      toast.error('Save failed — check Firebase permissions and connection');
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
      <SEO title={isNew ? 'New Product' : 'Edit Product'} path="/admin/products" />
      <h1 className="font-display text-display-md">{isNew ? 'New product' : 'Edit product'}</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="mt-8 max-w-3xl space-y-6">
        <div>
          <label className="label-field" htmlFor="name">
            Name
          </label>
          <input
            id="name"
            className="input-field"
            {...register('name')}
            onBlur={() => {
              if (!watch('slug') && name) setValue('slug', slugify(name));
            }}
          />
          {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
        </div>

        <div>
          <label className="label-field" htmlFor="slug">
            Slug
          </label>
          <input id="slug" className="input-field" {...register('slug')} />
        </div>

        <div>
          <label className="label-field" htmlFor="categoryId">
            Category
          </label>
          <select id="categoryId" className="input-field" {...register('categoryId')}>
            <option value="">Select…</option>
            {categories?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {errors.categoryId && <p className="mt-1 text-sm text-danger">{errors.categoryId.message}</p>}
        </div>

        <div>
          <label className="label-field" htmlFor="description">
            Description
          </label>
          <textarea id="description" rows={5} className="input-field" {...register('description')} />
        </div>

        <div>
          <label className="label-field" htmlFor="tags">
            Tags <span className="normal-case tracking-normal">(comma-separated)</span>
          </label>
          <input id="tags" className="input-field" {...register('tags')} placeholder="acrylic, illuminated" />
        </div>

        <div>
          <p className="label-field">Images</p>
          <MediaUploader value={images} onChange={setImages} folder="products/images" type="image" requireAlt />
        </div>

        <div>
          <p className="label-field">Videos</p>
          <MediaUploader
            value={videos}
            onChange={setVideos}
            folder="products/videos"
            type="video"
            accept="video/*"
            requireAlt={false}
          />
        </div>

        <div>
          <label className="label-field" htmlFor="specs">
            Specs <span className="normal-case tracking-normal">(one key: value per line)</span>
          </label>
          <textarea
            id="specs"
            rows={5}
            className="input-field font-mono text-sm"
            value={specsText}
            onChange={(e) => setSpecsText(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('published')} />
            Published
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register('featured')} />
            Featured on home
          </label>
        </div>

        <div className="flex gap-3">
          <Button type="submit" loading={create.isPending || update.isPending}>
            {isNew ? 'Create' : 'Save changes'}
          </Button>
          <button type="button" className="btn-secondary" onClick={() => navigate('/admin/products')}>
            Cancel
          </button>
        </div>
      </form>
    </>
  );
}
