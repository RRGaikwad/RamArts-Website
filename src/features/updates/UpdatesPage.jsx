import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Reveal } from '../../components/Reveal';
import { LazyImage } from '../../components/Gallery';
import { GridSkeleton } from '../../components/Skeletons';
import { useUpdates } from '../../hooks/useUpdates';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function UpdatesPage() {
  const { data: updates, isLoading, isError } = useUpdates();

  return (
    <>
      <SEO
        title="Updates"
        description="News, launches, and completed projects from RamArts."
        path="/updates"
      />

      <section className="container-page section-pad !pb-8">
        <Reveal>
          <p className="label-field">News</p>
          <h1 className="mt-3 font-display text-display-xl">Studio updates</h1>
          <p className="mt-4 max-w-xl text-ink-muted">
            New capabilities, completed installs, offers, and behind-the-scenes from the workshop.
          </p>
        </Reveal>
      </section>

      <section className="container-page pb-20 md:pb-30">
        {isLoading && <GridSkeleton count={3} />}
        {isError && (
          <div className="mb-8 rounded-sm border border-danger/30 bg-paper-raised p-4 text-sm text-danger">
            Could not load updates. Confirm Firestore rules are published and posts are marked Published.
          </div>
        )}
        {!isLoading && !isError && !updates?.length && (
          <p className="py-16 text-center text-ink-muted">
            No updates published yet. Publish a post from Admin → Updates to show it here.
          </p>
        )}

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-3">
          {updates?.map((u, i) => (
            <Reveal key={u.id} delay={i * 0.05}>
              <Link to={`/updates/${u.slug}`} className="group block">
                {u.coverImage?.url ? (
                  <LazyImage
                    src={u.coverImage.url}
                    alt={u.coverImage.alt || u.title}
                    aspect="16/10"
                    className="transition duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="aspect-[16/10] bg-paper-sunken" />
                )}
                <p className="mt-4 text-caption text-ink-muted">{formatDate(u.publishedAt)}</p>
                <h2 className="mt-1 font-display text-xl font-600 transition group-hover:text-brand">
                  {u.title}
                </h2>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
