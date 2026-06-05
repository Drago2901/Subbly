import { Helmet } from "react-helmet-async";

const SITE_URL = "https://subbly.lovable.app";

type Props = {
  title: string;
  description: string;
  /** Route path, e.g. "/pricing". Used for canonical + og:url. */
  path: string;
  /** Optional JSON-LD structured data object(s). */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  /** Set true on auth-gated / app routes that shouldn't be indexed. */
  noIndex?: boolean;
};

/**
 * Per-route <head> management. Overrides the static defaults in index.html
 * for JS-executing crawlers and sets a unique canonical + social preview
 * for each page.
 */
export function Seo({ title, description, path, jsonLd, noIndex }: Props) {
  const url = `${SITE_URL}${path}`;
  const blocks = jsonLd ? (Array.isArray(jsonLd) ? jsonLd : [jsonLd]) : [];

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}

      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:type" content="website" />

      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />

      {blocks.map((block, i) => (
        <script type="application/ld+json" key={i}>
          {JSON.stringify(block)}
        </script>
      ))}
    </Helmet>
  );
}

export default Seo;
