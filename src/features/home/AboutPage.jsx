import { Link } from 'react-router-dom';
import { SEO } from '../../components/SEO';
import { Reveal, Stagger, StaggerItem } from '../../components/Reveal';

const capabilities = [
  { title: 'Signage systems', body: 'Acrylic, metal, illuminated, and wayfinding — engineered for longevity outdoors and indoors.' },
  { title: 'Large format print', body: 'Banners, wall graphics, exhibition backdrops, and retail environments at production quality.' },
  { title: 'Vehicle branding', body: 'Full and partial wraps with precision cutting and durable laminates for fleets and launches.' },
  { title: 'Packaging & collateral', body: 'Business cards, labels, boxes, and branded stationery finished to studio standards.' },
];

const process = [
  { step: '01', title: 'Brief', body: 'We clarify goals, surfaces, timelines, and budget so the proposal is grounded.' },
  { step: '02', title: 'Design & proof', body: 'Art direction, mockups, and material samples until you sign off with confidence.' },
  { step: '03', title: 'Produce', body: 'Print, fabricate, and finish in-house with QC at every checkpoint.' },
  { step: '04', title: 'Install & handoff', body: 'On-site installation where needed, plus care guides so the work stays sharp.' },
];

export default function AboutPage() {
  return (
    <>
      <SEO
        title="About"
        description="Meet RamArts — a craft-focused printing, signage, and branding studio."
        path="/about"
      />

      <section className="container-page section-pad !pb-10">
        <Reveal>
          <p className="label-field">About</p>
          <h1 className="mt-3 max-w-3xl font-display text-display-xl text-balance">
            A studio obsessed with how brands show up in the physical world.
          </h1>
          <p className="mt-6 max-w-2xl text-body-lg text-ink-muted">
            RamArts started with a simple belief: print and signage should feel as considered as the
            digital brand systems they support. We pair production expertise with design sensibility —
            so every panel, wrap, and card carries weight.
          </p>
        </Reveal>
      </section>

      <section className="border-y border-line bg-paper-sunken">
        <div className="container-page section-pad grid gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <h2 className="font-display text-display-md">Our story</h2>
            <div className="mt-4 space-y-4 text-ink-muted">
              <p>
                What began as a focused print workshop grew into a full-service signage and branding
                studio. Today we work with retailers, clinics, startups, and established brands who
                want work that lasts — not shortcuts that fade.
              </p>
              <p>
                Our facility houses large-format printers, CNC cutting, laminating, and finishing
                stations under one roof. That vertical control means tighter quality, clearer
                timelines, and fewer handoffs.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <div className="grid grid-cols-2 gap-3">
              {['Facility floor', 'Print bay', 'Finishing', 'Install crew'].map((label, i) => (
                <div
                  key={label}
                  className={`flex aspect-square items-end bg-gradient-to-br p-4 ${
                    i % 2 === 0
                      ? 'from-ink to-brand'
                      : 'from-brand to-accent'
                  }`}
                >
                  <span className="text-caption font-medium uppercase tracking-wider text-white/80">
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      <section className="container-page section-pad">
        <Reveal>
          <p className="label-field">Capabilities</p>
          <h2 className="mt-2 font-display text-display-lg">What we make</h2>
        </Reveal>
        <Stagger className="mt-12 grid gap-8 sm:grid-cols-2">
          {capabilities.map((c) => (
            <StaggerItem key={c.title}>
              <h3 className="font-display text-xl font-600">{c.title}</h3>
              <p className="mt-2 text-ink-muted">{c.body}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="border-t border-line bg-ink text-paper">
        <div className="container-page section-pad">
          <Reveal>
            <p className="text-caption uppercase tracking-widest text-paper/50">Process</p>
            <h2 className="mt-2 font-display text-display-lg text-paper">How we work</h2>
          </Reveal>
          <div className="mt-12 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
            {process.map((p, i) => (
              <Reveal key={p.step} delay={i * 0.08}>
                <p className="font-display text-3xl text-brand">{p.step}</p>
                <h3 className="mt-3 font-display text-lg font-600 text-paper">{p.title}</h3>
                <p className="mt-2 text-sm text-paper/60">{p.body}</p>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      <section className="container-page section-pad text-center">
        <Reveal>
          <h2 className="font-display text-display-md">Let&apos;s build something lasting.</h2>
          <Link to="/contact" className="btn-primary mt-6 inline-flex">
            Start a project
          </Link>
        </Reveal>
      </section>
    </>
  );
}
