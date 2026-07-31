import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import { SEO } from '../../components/SEO';
import { Reveal } from '../../components/Reveal';
import { LazyImage } from '../../components/Gallery';
import { GridSkeleton } from '../../components/Skeletons';
import { useProducts } from '../../hooks/useProducts';
import { useCategories } from '../../hooks/useCategories';

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const activeSlug = params.get('category') || 'all';
  const { data: categories, isLoading: loadingCats } = useCategories();
  const { data: products, isLoading, isError } = useProducts();

  const activeCategory = useMemo(
    () => categories?.find((c) => c.slug === activeSlug),
    [categories, activeSlug]
  );

  const filtered = useMemo(() => {
    if (!products) return [];
    if (activeSlug === 'all' || !activeCategory) return products;
    return products.filter((p) => p.categoryId === activeCategory.id);
  }, [products, activeSlug, activeCategory]);

  const setFilter = (slug) => {
    if (slug === 'all') setParams({});
    else setParams({ category: slug });
  };

  return (
    <>
      <SEO
        title="Work"
        description="Browse RamArts printing, signage, and branding portfolio."
        path="/products"
      />

      <section className="container-page section-pad !pb-8">
        <Reveal>
          <p className="label-field">Portfolio</p>
          <h1 className="mt-3 font-display text-display-xl">Work that holds up close.</h1>
          <p className="mt-4 max-w-xl text-ink-muted">
            Filter by category to explore signage, print, packaging, and vehicle branding projects.
          </p>
        </Reveal>

        <div className="mt-10 flex flex-wrap gap-2 border-b border-line pb-4" role="tablist" aria-label="Filter by category">
          <FilterChip active={activeSlug === 'all'} onClick={() => setFilter('all')}>
            All
          </FilterChip>
          {!loadingCats &&
            categories?.map((c) => (
              <FilterChip key={c.id} active={activeSlug === c.slug} onClick={() => setFilter(c.slug)}>
                {c.name}
              </FilterChip>
            ))}
        </div>
      </section>

      <section className="container-page pb-20 md:pb-30">
        {isLoading && <GridSkeleton count={6} />}
        {isError && (
          <div className="mb-8 rounded-sm border border-danger/30 bg-paper-raised p-4 text-sm text-danger">
            Could not load projects from Firestore. Check that security rules allow public read of published
            products, then refresh. (Admin-created drafts never appear here until Published.)
          </div>
        )}
        {!isLoading && !isError && !filtered.length && (
          <p className="py-16 text-center text-ink-muted">
            No published work in this category yet. In Admin → Products, create an item and ensure{' '}
            <strong>Published</strong> is on.
          </p>
        )}

        <LayoutGroup>
          <motion.div layout className="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {filtered.map((product) => (
                <motion.div
                  key={product.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ProductCard product={product} categories={categories} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        </LayoutGroup>
      </section>
    </>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`relative px-4 py-2 text-sm font-medium transition ${
        active ? 'text-ink' : 'text-ink-muted hover:text-ink'
      }`}
    >
      {children}
      {active && (
        <motion.span
          layoutId="filter-underline"
          className="absolute inset-x-2 -bottom-[17px] h-0.5 bg-brand"
        />
      )}
    </button>
  );
}

function ProductCard({ product, categories }) {
  const images = [...(product.images || [])].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const primary = images[0];
  const secondary = images[1];
  const cat = categories?.find((c) => c.id === product.categoryId);

  return (
    <Link to={`/products/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-paper-sunken">
        {primary ? (
          <>
            <LazyImage
              src={primary.url}
              alt={primary.alt || product.name}
              wrapperClassName="absolute inset-0"
              className={`duration-700 ease-smooth group-hover:scale-[1.04] ${
                secondary ? 'transition-all group-hover:opacity-0' : 'transition-transform'
              }`}
            />
            {secondary && (
              <img
                src={secondary.url}
                alt=""
                aria-hidden
                className="absolute inset-0 h-full w-full object-cover opacity-0 transition duration-700 ease-smooth group-hover:scale-[1.04] group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center text-caption text-ink-muted">No image</div>
        )}
      </div>
      <div className="mt-3">
        {cat && <p className="text-caption uppercase tracking-wider text-ink-muted">{cat.name}</p>}
        <h2 className="font-display text-lg font-600 transition group-hover:text-brand">{product.name}</h2>
      </div>
    </Link>
  );
}
