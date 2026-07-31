import { Link } from 'react-router-dom';
import { useSiteSettings } from '../hooks/useSettings';

export function Footer() {
  const { data: settings } = useSiteSettings();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-line bg-paper-sunken">
      <div className="container-page section-pad !py-14 md:!py-18">
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <Link to="/" className="font-display text-2xl font-bold tracking-tight">
              Ram<span className="text-brand">Arts</span>
            </Link>
            <p className="mt-4 max-w-sm text-ink-muted">
              Printing, signage, and branding crafted with precision. From concept to installation —
              work that lasts.
            </p>
          </div>

          <div className="md:col-span-3">
            <p className="label-field">Explore</p>
            <ul className="space-y-2 text-sm">
              <li><Link className="hover:text-brand" to="/products">Work</Link></li>
              <li><Link className="hover:text-brand" to="/updates">Updates</Link></li>
              <li><Link className="hover:text-brand" to="/about">About</Link></li>
              <li><Link className="hover:text-brand" to="/contact">Contact</Link></li>
            </ul>
          </div>

          <div className="md:col-span-4">
            <p className="label-field">Contact</p>
            <ul className="space-y-2 text-sm text-ink-muted">
              {settings?.contactEmail && (
                <li>
                  <a className="hover:text-brand" href={`mailto:${settings.contactEmail}`}>
                    {settings.contactEmail}
                  </a>
                </li>
              )}
              {settings?.contactPhone && (
                <li>
                  <a className="hover:text-brand" href={`tel:${settings.contactPhone}`}>
                    {settings.contactPhone}
                  </a>
                </li>
              )}
              {settings?.address && <li className="whitespace-pre-line">{settings.address}</li>}
              {settings?.businessHours && (
                <li className="pt-2 text-caption uppercase tracking-wider">{settings.businessHours}</li>
              )}
            </ul>
            <div className="mt-4 flex flex-wrap gap-4 text-sm">
              {settings?.socialLinks?.instagram ? (
                <a
                  href={settings.socialLinks.instagram}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ink hover:text-brand"
                >
                  Instagram
                </a>
              ) : null}
              {settings?.socialLinks?.facebook ? (
                <a
                  href={settings.socialLinks.facebook}
                  target="_blank"
                  rel="noreferrer"
                  className="font-medium text-ink hover:text-brand"
                >
                  Facebook
                </a>
              ) : null}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-caption text-ink-muted sm:flex-row sm:justify-between">
          <p>© {year} RamArts. All rights reserved.</p>
          <p>Printing · Signage · Branding</p>
        </div>
      </div>
    </footer>
  );
}
