import { Link } from 'react-router-dom';
import { useState } from 'react';
import { SEO } from '../../components/SEO';
import { ConfirmModal } from '../../components/Modal';
import { Skeleton } from '../../components/Skeletons';
import { useUpdates, useUpdateMutations } from '../../hooks/useUpdates';
import { toast } from '../../lib/toast';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AdminUpdatesPage() {
  const { data: updates, isLoading } = useUpdates({ admin: true });
  const { remove, update } = useUpdateMutations();
  const [deleting, setDeleting] = useState(null);

  const togglePublish = async (item) => {
    try {
      await update.mutateAsync({
        id: item.id,
        published: !item.published,
        ...( !item.published ? { publishedAt: undefined } : {}),
      });
      toast.success(item.published ? 'Unpublished' : 'Published');
    } catch {
      toast.error('Update failed');
    }
  };

  const onDelete = async () => {
    try {
      await remove.mutateAsync(deleting);
      toast.success('Update deleted');
      setDeleting(null);
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <>
      <SEO title="Manage Updates" path="/admin/updates" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md">Updates</h1>
          <p className="text-ink-muted">News, offers, and project stories.</p>
        </div>
        <Link to="/admin/updates/new" className="btn-primary">
          New update
        </Link>
      </div>

      <div className="mt-8 overflow-x-auto border border-line bg-paper-raised">
        {isLoading && (
          <div className="space-y-3 p-4">
            <Skeleton className="h-12 w-full" />
          </div>
        )}
        {!isLoading && !updates?.length && (
          <p className="p-8 text-center text-ink-muted">No updates yet.</p>
        )}
        {updates?.length > 0 && (
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-line bg-paper-sunken text-caption uppercase tracking-wider text-ink-muted">
              <tr>
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Published</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {updates.map((u) => (
                <tr key={u.id} className="border-b border-line last:border-0">
                  <td className="px-4 py-3 font-medium">{u.title}</td>
                  <td className="px-4 py-3 text-ink-muted">{formatDate(u.publishedAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => togglePublish(u)}
                      className={`rounded-sm px-2 py-1 text-caption ${
                        u.published ? 'bg-brand-muted text-brand' : 'bg-paper-sunken text-ink-muted'
                      }`}
                    >
                      {u.published ? 'Published' : 'Draft'}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link to={`/admin/updates/${u.id}`} className="btn-ghost">
                      Edit
                    </Link>
                    <button type="button" className="btn-ghost text-danger" onClick={() => setDeleting(u)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <ConfirmModal
        open={Boolean(deleting)}
        onClose={() => setDeleting(null)}
        onConfirm={onDelete}
        title="Delete update?"
        message={`Permanently delete “${deleting?.title}”?`}
        loading={remove.isPending}
      />
    </>
  );
}
