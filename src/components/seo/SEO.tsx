import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  canonicalUrl?: string;
  type?: 'website' | 'article' | 'software';
  imageUrl?: string;
  schema?: object | object[];
}

export function SEO({
  title,
  description,
  canonicalUrl = 'https://subbly.in',
  type = 'website',
  imageUrl = 'https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/8c509b87-098b-4a26-9dd1-e0cf8d4ea2a5/id-preview-71e1d772--724c19ee-27fb-4b68-b77c-2a7f15becb76.lovable.app-1776709492821.png',
  schema,
}: SEOProps) {
  
  const baseSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "Subbly",
    "url": "https://subbly.in",
    "potentialAction": {
      "@type": "SearchAction",
      "target": "https://subbly.in/search?q={search_term_string}",
      "query-input": "required name=search_term_string"
    }
  };

  const orgSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "Subbly",
    "url": "https://subbly.in",
    "logo": "https://subbly.in/logo.png",
    "sameAs": [
      "https://twitter.com/subbly_in"
    ]
  };

  const softwareSchema = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Subbly - AI Video Caption Generator",
    "operatingSystem": "All",
    "applicationCategory": "MultimediaApplication",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  const schemaData = schema 
    ? (Array.isArray(schema) ? [baseSchema, orgSchema, softwareSchema, ...schema] : [baseSchema, orgSchema, softwareSchema, schema])
    : [baseSchema, orgSchema, softwareSchema];

  return (
    <Helmet>
      {/* Standard Meta Tags */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph / Facebook */}
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={imageUrl} />

      {/* Twitter */}
      <meta property="twitter:card" content="summary_large_image" />
      <meta property="twitter:url" content={canonicalUrl} />
      <meta property="twitter:title" content={title} />
      <meta property="twitter:description" content={description} />
      <meta property="twitter:image" content={imageUrl} />

      {/* JSON-LD Schema */}
      <script type="application/ld+json">
        {JSON.stringify(schemaData)}
      </script>
    </Helmet>
  );
}
