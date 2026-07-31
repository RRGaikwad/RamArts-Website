import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SEO } from '../../components/SEO';
import { Button } from '../../components/Button';
import { ConfirmModal } from '../../components/Modal';
import { Skeleton } from '../../components/Skeletons';
import { useProducts, useProductMutations } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { toast } from '../../lib/toast';

export default function AdminProductsPage() {
  const { data: products, isLoading } = useProducts({ admin: true });
  const { data: categories } = useCategories({ admin: true });
  const { remove, update } = useProductMutations();
  const [deleting, setDeleting] = useState(null);

  const catName = (id) => categories?.find((c) => c.id === id)?.name || '—';

  const toggle = async (product, field) => {
    try {
      await update.mutateAsync({ id: product.id, [field]: !product[field] });
      toast.success('Updated');
    } catch {
      toast.error('Update failed');
    }
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(deleting);
      toast.success('Product deleted');
      setDeleting(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <SEO title="Manage Products" path="/admin/products" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md">Products</h1>
          <p className="text-ink-muted">Portfolio items shown on the public Work page.</p>
          <p className="mt-2 max-w-xl text-sm text-accent">
            Tip: items marked Draft stay hidden from visitors. Use the Published toggle or edit the product
            and keep “Publish on the public site” checked.
          </p>
        </div>
        <Link to="/admin/products/new" className="btn-primary">
          Add product
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto border border-line bg-paper-raised">
        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && !products?.length && (
          <p className="p-8 text-center text-ink-muted">No products yet.</p>
        )}
        {products?.length > 0 && (
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line bg-paper-sunken text-caption uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Featured</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => {
                const cover = [...(p.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
                return (
                  <tr key={p.id} className="border-b border-line last:border-0">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 shrink-0 overflow-hidden bg-paper-sunken">
                          {cover && <img src={cover.url} alt="" className="h-full w-full object-cover" />}
                        </div>
                        <div>
                          <p className="font-medium">{p.name}</p>
                          <p className="text-caption text-ink-muted">{p.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{catName(p.categoryId)}</td>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggle(p, 'published')}
                        className={`rounded-sm px-2 py-1 text-caption ${
                          p.published ? 'bg-brand-muted text-brand' : 'bg-paper-sunken text-ink-muted'
                        }`}
                      >
                        {p.published ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button type="button" onClick={() => toggle(p, 'featured')} className="text-sm">
                        {p.featured ? '★' : '☆'}
                      </button>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/admin/products/${p.id}`} className="btn-ghost">
                        Edit
                      </Link>
                      <button type="button" className="btn-ghost text-danger" onClick={() => setDeleting(p)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title="Delete product?"
        message={`Permanently delete “${deleting?.name}” and its media files?`}
        loading={remove.isPending}
      />
    </>
  );
}
