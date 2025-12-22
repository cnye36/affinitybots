/**
 * One-time migration script to import existing MDX blog posts into the database
 *
 * Usage: npx tsx scripts/migrate-blog-to-db.ts
 */

import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import { getSupabaseAdmin } from '../lib/supabase-admin'

const contentDirectory = path.join(process.cwd(), 'content', 'blog')

async function migrateBlogPosts() {
  console.log('🚀 Starting blog posts migration...\n')

  if (!fs.existsSync(contentDirectory)) {
    console.error(`❌ Content directory not found: ${contentDirectory}`)
    return
  }

  const supabase = getSupabaseAdmin()
  const fileNames = fs.readdirSync(contentDirectory).filter(name => name.endsWith('.mdx'))

  console.log(`Found ${fileNames.length} MDX files to migrate\n`)

  let successCount = 0
  let skipCount = 0
  let errorCount = 0

  for (const fileName of fileNames) {
    const slug = fileName.replace(/\.mdx$/, '')
    console.log(`Processing: ${fileName}`)

    try {
      // Check if already exists in database
      const { data: existing } = await supabase
        .from('blog_posts')
        .select('id')
        .eq('slug', slug)
        .single()

      if (existing) {
        console.log(`  ⏭️  Skipped (already exists)\n`)
        skipCount++
        continue
      }

      // Read and parse MDX file
      const fullPath = path.join(contentDirectory, fileName)
      const fileContents = fs.readFileSync(fullPath, 'utf8')
      const { data, content } = matter(fileContents)

      // Convert date
      let dateString = ''
      if (data.date) {
        if (data.date instanceof Date) {
          dateString = data.date.toISOString()
        } else {
          dateString = new Date(data.date).toISOString()
        }
      } else {
        dateString = new Date().toISOString()
      }

      // Extract cover image
      let coverImage = ''
      if (data.coverImage) {
        coverImage = data.coverImage
      } else if (data.featuredImage) {
        if (typeof data.featuredImage === 'object' && data.featuredImage.src) {
          coverImage = data.featuredImage.src
        } else if (typeof data.featuredImage === 'string') {
          coverImage = data.featuredImage
        }
      }

      // Extract categories
      let categories: string[] = []
      if (data.categories) {
        if (Array.isArray(data.categories)) {
          categories = data.categories.filter(cat => cat && typeof cat === 'string')
        } else if (typeof data.categories === 'string') {
          categories = [data.categories]
        }
      }

      // Calculate read time
      const wordCount = content.split(/\s+/).length
      const minutes = Math.max(1, Math.round(wordCount / 200))
      const readTime = `${minutes} min read`

      // Prepare post data
      const postData = {
        slug,
        title: data.title || slug,
        excerpt: data.excerpt || data.description || '',
        content,
        author: data.author || 'Curtis Nye',
        cover_image: coverImage,
        categories,
        tags: data.tags || [],
        status: 'published',
        featured: data.featured || false,
        read_time: data.readTime || readTime,
        published_at: dateString,
        user_id: null, // Will be set by database if needed
        meta_description: data.excerpt || data.description || '',
        meta_keywords: data.tags || [],
      }

      // Insert into database
      const { error } = await supabase
        .from('blog_posts')
        .insert([postData])

      if (error) {
        console.error(`  ❌ Error: ${error.message}\n`)
        errorCount++
      } else {
        console.log(`  ✅ Migrated successfully\n`)
        successCount++
      }
    } catch (error) {
      console.error(`  ❌ Error: ${error}\n`)
      errorCount++
    }
  }

  console.log('\n📊 Migration Summary:')
  console.log(`  ✅ Migrated: ${successCount}`)
  console.log(`  ⏭️  Skipped: ${skipCount}`)
  console.log(`  ❌ Errors: ${errorCount}`)
  console.log(`  📝 Total: ${fileNames.length}`)
  console.log('\n✨ Migration complete!')
}

migrateBlogPosts()
  .catch(error => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
