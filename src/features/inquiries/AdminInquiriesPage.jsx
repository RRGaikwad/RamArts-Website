import { SEO } from '../../components/SEO';
import { Skeleton } from '../../components/Skeletons';
import { useInquiries, useInquiryMutations } from '../../hooks/useInquiries';
import { toast } from '../../lib/toast';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statuses = ['new', 'read', 'resolved'];

export default function AdminInquiriesPage() {
  const { data: inquiries, isLoading } = useInquiries();
  const { updateStatus } = useInquiryMutations();

  const setStatus = async (id, status) => {
    try {
      await updateStatus.mutateAsync({ id, status });
      toast.success(`Marked ${status}`);
    } catch {
      toast.error('Could not update status');
    }
  };

  return (
    <>
      <SEO title="Inquiries" path="/admin/inquiries" />
      <h1 className="font-display text-display-md">Inquiries</h1>
      <p className="text-ink-muted">Messages from the contact form.</p>

      <div className="mt-8 space-y-4">
        {isLoading && (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        )}
        {!isLoading && !inquiries?.length && (
          <p className="border border-line bg-paper-raised p-8 text-center text-ink-muted">No inquiries yet.</p>
        )}
        {inquiries?.map((inq) => (
          <article key={inq.id} className="border border-line bg-paper-raised p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 className="font-display text-lg font-600">{inq.name}</h2>
                <p className="text-sm text-ink-muted">
                  <a href={`mailto:${inq.email}`} className="hover:text-brand">
                    {inq.email}
                  </a>
                  {inq.phone && (
                    <>
                      {' · '}
                      <a href={`tel:${inq.phone}`} className="hover:text-brand">
                        {inq.phone}
                      </a>
                    </>
                  )}
                </p>
                <p className="mt-1 text-caption text-ink-muted">{formatDate(inq.createdAt)}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {statuses.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setStatus(inq.id, s)}
                    className={`rounded-sm px-2.5 py-1 text-caption capitalize ${
                      inq.status === s ? 'bg-brand text-white' : 'bg-paper-sunken text-ink-muted hover:text-ink'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-4 whitespace-pre-wrap text-ink-soft">{inq.message}</p>
          </article>
        ))}
      </div>
    </>
  );
}
