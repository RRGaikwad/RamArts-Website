import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/Button';
import { ConfirmModal, Modal } from '../../components/Modal';
import { useCategories, useCategoryMutations } from '../../hooks/useCategories';
import { toast } from '../../lib/toast';
import { Skeleton } from '../../components/Skeletons';

const schema = z.object({
  name: z.string().min(2, 'Name required'),
  order: z.coerce.number().int().min(0),
});

export default function AdminCategoriesPage() {
  const { data: categories, isLoading } = useCategories({ admin: true });
  const { create, update, remove } = useCategoryMutations();
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [open, setOpen] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({ resolver: zodResolver(schema), defaultValues: { name: '', order: 0 } });

  const openCreate = () => {
    setEditing(null);
    reset({ name: '', order: categories?.length || 0 });
    setOpen(true);
  };

  const openEdit = (cat) => {
    setEditing(cat);
    reset({ name: cat.name, order: cat.order ?? 0 });
    setOpen(true);
  };

  const onSubmit = async (values) => {
    try {
      if (editing) {
        await update.mutateAsync({ id: editing.id, ...values });
        toast.success('Category updated');
      } else {
        await create.mutateAsync(values);
        toast.success('Category created');
      }
      setOpen(false);
    } catch {
      toast.error('Save failed');
    }
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(deleting.id);
      toast.success('Category deleted');
      setDeleting(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <SEO title="Manage Categories" path="/admin/categories" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md">Categories</h1>
          <p className="text-ink-muted">Used to filter the public Work page.</p>
        </div>
        <Button onClick={openCreate}>Add category</Button>
      </div>

      <div className="mt-8 overflow-hidden border border-line bg-paper-raised">
        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        )}
        {!isLoading && !categories?.length && (
          <p className="p-8 text-center text-ink-muted">No categories yet. Add Signage, Banners, etc.</p>
        )}
        {categories?.length > 0 && (
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-sunken text-caption uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Slug</th>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-ink-muted">{c.slug}</td>
                  <td className="px-4 py-3">{c.order}</td>
                  <td className="px-4 py-3 text-right">
                    <button type="button" className="btn-ghost" onClick={() => openEdit(c)}>
                      Edit
                    </button>
                    <button type="button" className="btn-ghost text-danger" onClick={() => setDeleting(c)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit category' : 'New category'}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="label-field" htmlFor="cat-name">
              Name
            </label>
            <input id="cat-name" className="input-field" {...register('name')} />
            {errors.name && <p className="mt-1 text-sm text-danger">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label-field" htmlFor="cat-order">
              Order
            </label>
            <input id="cat-order" type="number" className="input-field" {...register('order')} />
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" className="btn-secondary" onClick={() => setOpen(false)}>
              Cancel
            </button>
            <Button type="submit" loading={create.isPending || update.isPending}>
              Save
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title="Delete category?"
        message={`Delete “${deleting?.name}”? Products using it will keep the old category ID until reassigned.`}
        loading={remove.isPending}
      />
    </>
  );
}
