import { Helmet } from 'react-helmet-async';

const SITE = 'RamArts';
const DEFAULT_DESC =
  'Premium printing, signage, and branding studio. Signs, banners, packaging, vehicle wraps, and digital print.';

export function SEO({
  title,
  description = DEFAULT_DESC,
  image,
  path = '',
  type = 'website',
}) {
  const fullTitle = title ? `${title} · ${SITE}` : `${SITE} — Printing, Signage & Branding`;
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://ramarts.web.app';
  const url = `${origin}${path}`;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      {image && <meta property="og:image" content={image} />}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      {image && <meta name="twitter:image" content={image} />}
    </Helmet>
  );
}
