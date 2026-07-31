import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { Reveal, Stagger, StaggerItem } from '../../components/Reveal';
import { LazyImage } from '../../components/Gallery';
import { GridSkeleton } from '../../components/Skeletons';
import { useSiteSettings } from '../../hooks/useSettings';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';
import { useUpdates } from '../../hooks/useUpdates';

const testimonials = [
  {
    quote: 'RamArts transformed our storefront overnight. The quality of the acrylic lettering is unmatched.',
    name: 'Priya Mehta',
    role: 'Retail Director',
  },
  {
    quote: 'From vehicle wraps to event banners — consistent craft, on-time delivery, zero drama.',
    name: 'Arjun Shah',
    role: 'Marketing Lead',
  },
  {
    quote: 'They treat branding like architecture. Every detail feels intentional.',
    name: 'Neha Kapoor',
    role: 'Founder',
  },
];

const clients = ['Vertex', 'Northline', 'Kala Co.', 'Orbit Foods', 'Lumen Clinics', 'Forge Labs'];

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function HomePage() {
  const { data: settings } = useSiteSettings();
  const { data: featured, isLoading: loadingFeatured } = useProducts({ featuredOnly: true });
  const { data: categories } = useCategories();
  const { data: updates } = useUpdates({ limitCount: 3 });

  const heroTitle = settings?.heroTitle || 'Print. Sign. Brand.';
  const heroSubtitle =
    settings?.heroSubtitle ||
    'RamArts crafts premium printing, signage, and branding that make businesses impossible to ignore.';

  return (
    <>
      <SEO path="/" />

      {/* Hero — full-bleed visual plane */}
      <section className="relative min-h-[calc(100svh-var(--nav-height))] overflow-hidden">
        <div className="absolute inset-0">
          <div
            className="absolute inset-0 bg-ink"
            style={{
              backgroundImage: `
                linear-gradient(135deg, rgba(17,17,17,0.55) 0%, rgba(11,95,92,0.45) 50%, rgba(17,17,17,0.7) 100%),
                url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"),
                linear-gradient(160deg, #1a1a1a 0%, #0b5f5c 45%, #1f1a17 100%)
              `,
            }}
          />
          <motion.div
            className="absolute -right-20 top-1/4 h-[50vmin] w-[50vmin] rounded-full bg-brand/20 blur-3xl"
            animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
            transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute -left-16 bottom-0 h-[40vmin] w-[40vmin] rounded-full bg-accent/15 blur-3xl"
            animate={{ x: [0, -20, 0], y: [0, 15, 0] }}
            transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut' }}
          />
        </div>

        <div className="container-page relative flex min-h-[calc(100svh-var(--nav-height))] flex-col justify-end pb-16 pt-24 md:justify-center md:pb-24">
          <motion.p
            className="mb-4 font-display text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl lg:text-7xl"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            Ram<span className="text-[#7ecfcb]">Arts</span>
          </motion.p>
          <motion.h1
            className="max-w-3xl font-display text-display-md font-600 text-white/90 md:text-3xl"
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          >
            {heroTitle}
          </motion.h1>
          <motion.p
            className="mt-5 max-w-xl text-body-lg text-white/70"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            {heroSubtitle}
          </motion.p>
          <motion.div
            className="mt-8 flex flex-wrap gap-3"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <Link to="/contact" className="btn bg-white text-ink hover:bg-paper">
              Get a Quote
            </Link>
            <Link to="/products" className="btn border border-white/40 text-white hover:bg-white/10">
              View Work
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Categories */}
      <section className="section-pad border-b border-line">
        <div className="container-page">
          <Reveal>
            <p className="label-field">Capabilities</p>
            <h2 className="mt-2 max-w-xl font-display text-display-lg">Built for every surface your brand needs.</h2>
          </Reveal>
          <Stagger className="mt-12 grid gap-px bg-line sm:grid-cols-2 lg:grid-cols-3">
            {(categories?.length
              ? categories
              : [
                  { id: '1', name: 'Signage', slug: 'signage' },
                  { id: '2', name: 'Banners', slug: 'banners' },
                  { id: '3', name: 'Business Cards', slug: 'business-cards' },
                  { id: '4', name: 'Packaging', slug: 'packaging' },
                  { id: '5', name: 'Vehicle Branding', slug: 'vehicle-branding' },
                  { id: '6', name: 'Digital Print', slug: 'digital-print' },
                ]
            ).map((cat, i) => (
              <StaggerItem key={cat.id}>
                <Link
                  to={`/products?category=${cat.slug}`}
                  className="group flex min-h-[140px] flex-col justify-between bg-paper p-6 transition hover:bg-paper-raised sm:p-8"
                >
                  <span className="text-caption text-ink-muted">0{i + 1}</span>
                  <span className="font-display text-xl font-600 transition group-hover:text-brand md:text-2xl">
                    {cat.name}
                  </span>
                </Link>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Featured work */}
      <section className="section-pad">
        <div className="container-page">
          <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
            <Reveal>
              <p className="label-field">Selected work</p>
              <h2 className="mt-2 font-display text-display-lg">Featured projects</h2>
            </Reveal>
            <Reveal delay={0.1}>
              <Link to="/products" className="btn-ghost text-sm">
                All work →
              </Link>
            </Reveal>
          </div>

          {loadingFeatured ? (
            <GridSkeleton count={3} />
          ) : featured?.length ? (
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {featured.slice(0, 6).map((p, i) => (
                <Reveal key={p.id} delay={i * 0.05}>
                  <ProductTeaser product={p} />
                </Reveal>
              ))}
            </div>
          ) : (
            <p className="text-ink-muted">
              Featured work will appear here once published in the admin panel.{' '}
              <Link to="/products" className="text-brand underline-offset-2 hover:underline">
                Browse all work
              </Link>
            </p>
          )}
        </div>
      </section>

      {/* Latest updates */}
      <section className="border-y border-line bg-paper-sunken section-pad">
        <div className="container-page">
          <div className="mb-10 flex items-end justify-between gap-4">
            <Reveal>
              <p className="label-field">Studio news</p>
              <h2 className="mt-2 font-display text-display-lg">Latest updates</h2>
            </Reveal>
            <Link to="/updates" className="btn-ghost text-sm">
              All updates →
            </Link>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {(updates || []).slice(0, 3).map((u, i) => (
              <Reveal key={u.id} delay={i * 0.06}>
                <Link to={`/updates/${u.slug}`} className="group block">
                  {u.coverImage?.url && (
                    <LazyImage
                      src={u.coverImage.url}
                      alt={u.coverImage.alt || u.title}
                      aspect="16/10"
                      wrapperClassName="mb-4"
                      className="transition duration-500 group-hover:scale-105"
                    />
                  )}
                  <p className="text-caption text-ink-muted">{formatDate(u.publishedAt)}</p>
                  <h3 className="mt-1 font-display text-lg font-600 transition group-hover:text-brand">{u.title}</h3>
                </Link>
              </Reveal>
            ))}
            {!updates?.length && (
              <p className="text-ink-muted md:col-span-3">No updates yet — check back soon.</p>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="section-pad">
        <div className="container-page">
          <Reveal>
            <p className="label-field">Clients</p>
            <h2 className="mt-2 font-display text-display-lg">Trusted by brands that care about craft.</h2>
          </Reveal>
          <div className="mt-10 flex flex-wrap items-center gap-x-10 gap-y-4 border-y border-line py-8">
            {clients.map((c) => (
              <span key={c} className="font-display text-lg font-600 tracking-wide text-ink/30 md:text-xl">
                {c}
              </span>
            ))}
          </div>
          <Stagger className="mt-12 grid gap-10 md:grid-cols-3">
            {testimonials.map((t) => (
              <StaggerItem key={t.name}>
                <blockquote>
                  <p className="text-body-lg text-ink-soft">&ldquo;{t.quote}&rdquo;</p>
                  <footer className="mt-4">
                    <cite className="not-italic">
                      <span className="font-medium text-ink">{t.name}</span>
                      <span className="block text-caption text-ink-muted">{t.role}</span>
                    </cite>
                  </footer>
                </blockquote>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-line bg-ink text-paper">
        <div className="container-page section-pad flex flex-col items-start justify-between gap-8 md:flex-row md:items-center">
          <Reveal>
            <h2 className="font-display text-display-lg text-paper">Ready to make your brand impossible to miss?</h2>
            <p className="mt-3 max-w-lg text-paper/60">
              Tell us about your project — we&apos;ll respond with a clear quote and timeline.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <Link to="/contact" className="btn bg-brand text-white hover:bg-brand-hover">
              Contact RamArts
            </Link>
          </Reveal>
        </div>
      </section>
    </>
  );
}

function ProductTeaser({ product }) {
  const cover = product.images?.sorted
    ? product.images
    : [...(product.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primary = cover[0];
  const secondary = cover[1];

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-sunken">
        {primary && (
          <LazyImage
            src={primary.url}
            alt={primary.alt || product.name}
            className={`transition duration-700 ease-smooth group-hover:scale-105 ${secondary ? 'group-hover:opacity-0' : ''}`}
            wrapperClassName="absolute inset-0"
          />
        )}
        {secondary && (
          <img
            src={secondary.url}
            alt=""
            aria-hidden
            className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 group-hover:scale-105 group-hover:opacity-100"
          />
        )}
      </div>
      <p className="mt-3 text-caption uppercase tracking-wider text-ink-muted">
        {product.tags?.[0] || 'Project'}
      </p>
      <h3 className="font-display text-lg font-600 transition group-hover:text-brand">{product.name}</h3>
    </Link>
  );
}
