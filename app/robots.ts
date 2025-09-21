import type { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const isProd = process.env.NODE_ENV === 'production'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || (isProd ? 'https://affinitybots.com' : 'http://localhost:3000')

  return {
    rules: [
      {
        userAgent: '*',
        allow: isProd ? '/' : '',
        disallow: [
          ...(isProd ? [] as string[] : ['/']),
          '/api/',
          '/admin',
          '/dashboard',
          '/settings',
          '/tools',
          '/workflows',
          '/agents',
          '/playground',
          '/auth',
        ],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  }
}


