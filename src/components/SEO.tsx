import { Helmet } from "react-helmet-async";

const BASE = "https://qblink-real.lovable.app";

interface SEOProps {
  title: string;
  description?: string;
  path?: string;
  type?: "website" | "article";
  jsonLd?: object | object[];
}


const SEO = ({ title, description, path = "/", type = "website", jsonLd }: SEOProps) => {
  const url = `${BASE}${path}`;
  return (
    <Helmet>
      <title>{title}</title>
      {description && <meta name="description" content={description} />}
      <link rel="canonical" href={url} />
      <meta property="og:title" content={title} />
      {description && <meta property="og:description" content={description} />}
      <meta property="og:url" content={url} />
      <meta property="og:type" content={type} />
      <meta name="twitter:title" content={title} />
      {description && <meta name="twitter:description" content={description} />}
      {jsonLd && (
        <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      )}
    </Helmet>
  );
};

export default SEO;