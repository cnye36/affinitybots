type OrganizationJsonLdProps = {
  name: string
  url: string
  logoUrl: string
}

export function OrganizationJsonLd({ name, url, logoUrl }: OrganizationJsonLdProps) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name,
    url,
    logo: logoUrl,
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}


