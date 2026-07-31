import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { useProductStats } from '../../hooks/useProducts';
import { useUpdates } from '../../hooks/useUpdates';
import { useUnreadInquiryCount } from '../../hooks/useInquiries';
import { Skeleton } from '../../components/Skeletons';

export default function DashboardPage() {
  const { data: productStats, isLoading: lp } = useProductStats();
  const { data: updates, isLoading: lu } = useUpdates({ admin: true });
  const { data: unread, isLoading: li } = useUnreadInquiryCount();

  const cards = [
    { label: 'Products', value: productStats?.total ?? '—', href: '/admin/products', loading: lp },
    { label: 'Published', value: productStats?.published ?? '—', href: '/admin/products', loading: lp },
    { label: 'Updates', value: updates?.length ?? '—', href: '/admin/updates', loading: lu },
    { label: 'New inquiries', value: unread ?? '—', href: '/admin/inquiries', loading: li, accent: true },
  ];

  return (
    <>
      <SEO title="Admin Dashboard" path="/admin" />
      <h1 className="font-display text-display-md">Dashboard</h1>
      <p className="mt-1 text-ink-muted">Quick overview of RamArts content.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            to={c.href}
            className={`border border-line bg-paper-raised p-5 transition hover:shadow-soft ${
              c.accent ? 'border-accent/40' : ''
            }`}
          >
            <p className="text-caption uppercase tracking-wider text-ink-muted">{c.label}</p>
            {c.loading ? (
              <Skeleton className="mt-3 h-9 w-16" />
            ) : (
              <p className="mt-2 font-display text-3xl font-bold">{c.value}</p>
            )}
          </Link>
        ))}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[
          { to: '/admin/products/new', label: 'Add product' },
          { to: '/admin/updates/new', label: 'Write update' },
          { to: '/admin/settings', label: 'Edit site settings' },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="btn-secondary justify-start">
            {s.label} →
          </Link>
        ))}
      </div>
    </>
  );
}
