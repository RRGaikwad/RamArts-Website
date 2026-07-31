import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import DOMPurify from 'dompurify';
import { SEO } from '../../components/SEO';
import { Reveal } from '../../components/Reveal';
import { LazyImage, GalleryLightbox } from '../../components/Gallery';
import { PageHeaderSkeleton, Skeleton } from '../../components/Skeletons';
import { useUpdate } from '../../hooks/useUpdates';

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function UpdateDetailPage() {
  const { slug } = useParams();
  const { data: update, isLoading, isError } = useUpdate(slug);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const galleryItems = useMemo(() => {
    if (!update?.gallery?.length) return [];
    return update.gallery.map((g) => ({
      type: 'image',
      url: g.url,
      alt: g.alt || update.title,
    }));
  }, [update]);

  if (isLoading) {
    return (
      <div className="container-page section-pad max-w-narrow mx-auto">
        <PageHeaderSkeleton />
        <Skeleton className="mt-8 h-64 w-full" />
      </div>
    );
  }

  if (isError || !update) {
    return (
      <div className="container-page section-pad text-center">
        <h1 className="font-display text-display-md">Update not found</h1>
        <Link to="/updates" className="btn-primary mt-6 inline-flex">
          All updates
        </Link>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={update.title}
        description={update.bodyRichText?.replace(/<[^>]+>/g, '').slice(0, 160)}
        image={update.coverImage?.url}
        path={`/updates/${update.slug}`}
        type="article"
      />

      <article className="container-page section-pad mx-auto max-w-narrow">
        <Reveal>
          <nav className="mb-6 text-caption text-ink-muted">
            <Link to="/updates" className="hover:text-brand">
              Updates
            </Link>
          </nav>
          <time className="text-caption text-ink-muted">{formatDate(update.publishedAt)}</time>
          <h1 className="mt-2 font-display text-display-xl text-balance">{update.title}</h1>
        </Reveal>

        {update.coverImage?.url && (
          <Reveal className="mt-10">
            <LazyImage
              src={update.coverImage.url}
              alt={update.coverImage.alt || update.title}
              aspect="16/10"
            />
          </Reveal>
        )}

        <Reveal className="prose-ramarts mt-10" delay={0.05}>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(update.bodyRichText || ''),
            }}
          />
        </Reveal>

        {galleryItems.length > 0 && (
          <Reveal className="mt-12">
            <h2 className="font-display text-display-md">Gallery</h2>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {galleryItems.map((item, i) => (
                <button
                  key={item.url}
                  type="button"
                  onClick={() => {
                    setLightboxIndex(i);
                    setLightboxOpen(true);
                  }}
                  className="overflow-hidden"
                >
                  <LazyImage src={item.url} alt={item.alt} aspect="1" className="hover:scale-105 transition duration-500" />
                </button>
              ))}
            </div>
          </Reveal>
        )}
      </article>

      <GalleryLightbox
        items={galleryItems}
        startIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
