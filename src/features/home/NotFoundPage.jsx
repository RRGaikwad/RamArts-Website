import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Reveal } from '../../components/Reveal';

export default function NotFoundPage() {
  return (
    <>
      <SEO title="Page not found" path="/404" />
      <section className="container-page flex min-h-[70vh] flex-col items-start justify-center section-pad">
        <Reveal>
          <p className="label-field">404</p>
          <h1 className="mt-3 font-display text-display-xl">This page didn&apos;t make the cut.</h1>
          <p className="mt-4 max-w-md text-ink-muted">
            The link may be outdated, or the work moved. Head home or browse the portfolio.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/" className="btn-primary">
              Home
            </Link>
            <Link to="/products" className="btn-secondary">
              View work
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
