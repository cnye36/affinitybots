import type { MetadataRoute } from 'next'

const publicRoutes = [
  '/',
  '/early-access',
  '/pitch-deck',
  '/privacy',
  '/terms',
  '/cookie',
]

export default function sitemap(): MetadataRoute.Sitemap {
  const isProd = process.env.NODE_ENV === 'production'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || (isProd ? 'https://affinitybots.com' : 'http://localhost:3000')
  const now = new Date()

  return publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: path === '/' ? 1 : 0.6,
  }))
}


