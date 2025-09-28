import type { MetadataRoute } from 'next'
import { getAllBlogPosts } from '@/lib/blog'

const publicRoutes = [
  '/',
  '/early-access',
  '/pitch-deck',
  '/privacy',
  '/terms',
  '/cookie',
  '/pricing',
  '/docs',
  '/blog',
]

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const isProd = process.env.NODE_ENV === 'production'
  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || (isProd ? 'https://affinitybots.com' : 'http://localhost:3000')
  const now = new Date()

  // Get all blog posts
  const blogPosts = await getAllBlogPosts()
  
  // Create routes for all pages
  const routes = publicRoutes.map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified: now,
    changeFrequency: 'weekly' as const,
    priority: path === '/' ? 1 : 0.8,
  }))

  // Add blog post routes
  const blogRoutes = blogPosts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.date),
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  return [...routes, ...blogRoutes]
}


