import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Reveal } from '../../components/Reveal';
import { LazyImage, GalleryLightbox, MediaPlayer } from '../../components/Gallery';
import { PageHeaderSkeleton, Skeleton } from '../../components/Skeletons';
import { useProduct, useRelatedProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { data: product, isLoading, isError } = useProduct(slug);
  const { data: categories } = useCategories();
  const { data: related } = useRelatedProducts(product?.categoryId, product?.id);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const galleryItems = useMemo(() => {
    if (!product) return [];
    const images = [...(product.images || [])]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map((img) => ({ type: 'image', url: img.url, alt: img.alt || product.name }));
    const videos = (product.videos || []).map((v) => ({
      type: 'video',
      url: v.url,
      thumbnailUrl: v.thumbnailUrl,
      alt: product.name,
    }));
    return [...images, ...videos];
  }, [product]);

  const openAt = (i) => {
    setLightboxIndex(i);
    setLightboxOpen(true);
  };

  if (isLoading) {
    return (
      <div className="container-page section-pad">
        <PageHeaderSkeleton />
        <Skeleton className="mt-8 aspect-video w-full" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="container-page section-pad text-center">
        <h1 className="font-display text-display-md">Project not found</h1>
        <Link to="/products" className="btn-primary mt-6 inline-flex">
          Back to work
        </Link>
      </div>
    );
  }

  const cat = categories?.find((c) => c.id === product.categoryId);
  const cover = galleryItems[0];
  const specs = product.specs && typeof product.specs === 'object' ? Object.entries(product.specs) : [];

  return (
    <>
      <SEO
        title={product.name}
        description={product.description?.slice(0, 160) || `${product.name} by RamArts`}
        image={cover?.url}
        path={`/products/${product.slug}`}
        type="article"
      />

      <article className="container-page section-pad !pb-10">
        <Reveal>
          <nav className="mb-6 text-caption text-ink-muted" aria-label="Breadcrumb">
            <Link to="/products" className="hover:text-brand">
              Work
            </Link>
            {cat && (
              <>
                <span className="mx-2">/</span>
                <Link to={`/products?category=${cat.slug}`} className="hover:text-brand">
                  {cat.name}
                </Link>
              </>
            )}
          </nav>
          <h1 className="font-display text-display-xl">{product.name}</h1>
          {product.description && (
            <p className="mt-5 max-w-2xl text-body-lg text-ink-muted">{product.description}</p>
          )}
        </Reveal>
      </article>

      {galleryItems.length > 0 && (
        <section className="container-page pb-12">
          <Reveal>
            <button
              type="button"
              onClick={() => openAt(0)}
              className="group relative block w-full overflow-hidden bg-paper-sunken focus-visible:outline"
              aria-label="Open gallery"
            >
              {cover?.type === 'video' ? (
                <div className="pointer-events-none aspect-[16/10] w-full">
                  <MediaPlayer url={cover.url} poster={cover.thumbnailUrl} className="h-full object-cover" />
                </div>
              ) : (
                <LazyImage
                  src={cover.url}
                  alt={cover.alt || product.name}
                  aspect="16/10"
                  className="transition duration-700 group-hover:scale-[1.02]"
                />
              )}
              <span className="absolute bottom-4 right-4 bg-ink/70 px-3 py-1.5 text-caption text-paper backdrop-blur-sm">
                View gallery · {galleryItems.length}
              </span>
            </button>
          </Reveal>

          {galleryItems.length > 1 && (
            <div className="mt-3 grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6">
              {galleryItems.slice(1).map((item, i) => (
                <button
                  key={`${item.url}-${i}`}
                  type="button"
                  onClick={() => openAt(i + 1)}
                  className="relative aspect-square overflow-hidden bg-paper-sunken focus-visible:outline"
                >
                  {item.type === 'video' ? (
                    <div className="flex h-full items-center justify-center bg-ink text-caption text-paper">
                      Video
                    </div>
                  ) : (
                    <LazyImage src={item.url} alt={item.alt || ''} wrapperClassName="absolute inset-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      <section className="border-y border-line bg-paper-sunken">
          <div className="container-page section-pad !py-14 grid gap-12 md:grid-cols-2">
            <Reveal>
              <h2 className="font-display text-display-md">Specifications</h2>
              {specs.length ? (
                <dl className="mt-6 divide-y divide-line">
                  {specs.map(([key, value]) => (
                    <div key={key} className="flex justify-between gap-4 py-3 text-sm">
                      <dt className="capitalize text-ink-muted">{key.replace(/([A-Z])/g, ' $1')}</dt>
                      <dd className="text-right font-medium">{value}</dd>
                    </div>
                  ))}
                </dl>
              ) : (
                <p className="mt-4 text-ink-muted">Custom specifications available on request.</p>
              )}
            </Reveal>
            <Reveal delay={0.1} className="flex flex-col justify-center">
              <h2 className="font-display text-display-md">Interested in similar work?</h2>
              <p className="mt-3 text-ink-muted">
                Tell us about your surfaces, quantities, and timeline — we&apos;ll prepare a clear quote.
              </p>
              <Link
                to="/contact"
                state={{ productInterest: product.name }}
                className="btn-primary mt-6 self-start"
              >
                Request quote
              </Link>
            </Reveal>
          </div>
        </section>

      {related?.length > 0 && (
        <section className="container-page section-pad">
          <h2 className="font-display text-display-md">Related work</h2>
          <div className="mt-8 grid gap-8 sm:grid-cols-3">
            {related.map((p) => {
              const img = [...(p.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))[0];
              return (
                <Link key={p.id} to={`/products/${p.slug}`} className="group block">
                  {img && (
                    <LazyImage
                      src={img.url}
                      alt={img.alt || p.name}
                      aspect="4/5"
                      className="transition duration-500 group-hover:scale-105"
                    />
                  )}
                  <h3 className="mt-3 font-display text-lg font-600 group-hover:text-brand">{p.name}</h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <GalleryLightbox
        items={galleryItems}
        startIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </>
  );
}
