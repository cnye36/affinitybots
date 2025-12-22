import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
// RSC MDX flow: no serialize at build time
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';
import { getSupabaseAdmin } from './supabase-admin';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string; // For backward compatibility, uses first category
  categories: string[]; // Array of categories from frontmatter
  featured?: boolean;
  tags: string[];
  coverImage?: string;
  content?: string;
  mdxSource?: any;
}

const contentDirectory = path.join(process.cwd(), 'content', 'blog');

// Helper to convert database post to BlogPost format
function dbPostToBlogPost(dbPost: any): BlogPost {
  return {
    slug: dbPost.slug,
    title: dbPost.title,
    excerpt: dbPost.excerpt || '',
    author: dbPost.author,
    date: dbPost.published_at ? new Date(dbPost.published_at).toISOString().split('T')[0] : new Date(dbPost.created_at).toISOString().split('T')[0],
    readTime: dbPost.read_time || '5 min read',
    category: dbPost.categories?.[0] || '',
    categories: dbPost.categories || [],
    featured: dbPost.featured || false,
    tags: dbPost.tags || [],
    coverImage: dbPost.cover_image,
    content: dbPost.content,
  };
}

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    // Fetch posts from database (published only for public view)
    const dbPosts: BlogPost[] = [];
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('status', 'published')
        .order('published_at', { ascending: false });

      if (!error && data) {
        dbPosts.push(...data.map(dbPostToBlogPost));
      }
    } catch (dbError) {
      console.error('Error fetching database posts:', dbError);
      // Continue to MDX files even if database fails
    }

    // Fetch posts from MDX files
    const mdxPosts: BlogPost[] = [];
    if (fs.existsSync(contentDirectory)) {
      const fileNames = fs.readdirSync(contentDirectory);
      const allPostsData = await Promise.all(
        fileNames
          .filter(name => name.endsWith('.mdx'))
          .map(async (fileName) => {
            const slug = fileName.replace(/\.mdx$/, '');
            return await getBlogPostFromMDX(slug);
          })
      );

      mdxPosts.push(...allPostsData.filter(post => post !== null));
    }

    // Combine and deduplicate (database posts take precedence)
    const dbSlugs = new Set(dbPosts.map(p => p.slug));
    const uniqueMdxPosts = mdxPosts.filter(p => !dbSlugs.has(p.slug));
    const allPosts = [...dbPosts, ...uniqueMdxPosts];

    // Sort posts by date (newest first)
    return allPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

// Get post from MDX file
async function getBlogPostFromMDX(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);

    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    // Convert date to string if it's a Date object (gray-matter may parse dates automatically)
    let dateString = '';
    if (data.date) {
      if (data.date instanceof Date) {
        dateString = data.date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      } else {
        dateString = String(data.date);
      }
    }

    // Extract cover image from featuredImage.src or use coverImage directly
    let coverImage = '';
    if (data.coverImage) {
      coverImage = data.coverImage;
    } else if (data.featuredImage) {
      // Handle both object format (featuredImage.src) and string format
      if (typeof data.featuredImage === 'object' && data.featuredImage.src) {
        coverImage = data.featuredImage.src;
      } else if (typeof data.featuredImage === 'string') {
        coverImage = data.featuredImage;
      }
    }

    // Extract categories - handle both array and single category
    let categories: string[] = [];
    if (data.categories) {
      if (Array.isArray(data.categories)) {
        categories = data.categories.filter(cat => cat && typeof cat === 'string');
      } else if (typeof data.categories === 'string') {
        categories = [data.categories];
      }
    }
    // For backward compatibility, use first category or fallback to data.category
    const category = categories.length > 0 ? categories[0] : (data.category || '');

    return {
      slug,
      title: data.title || '',
      excerpt: data.excerpt || data.description || '',
      author: data.author || '',
      date: dateString,
      readTime: data.readTime || '',
      category: category,
      categories: categories,
      featured: data.featured || false,
      tags: data.tags || [],
      coverImage: coverImage,
      content,
    };
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    // Try database first
    try {
      const supabase = getSupabaseAdmin();
      const { data, error } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('status', 'published')
        .single();

      if (!error && data) {
        return dbPostToBlogPost(data);
      }
    } catch (dbError) {
      console.error('Error fetching from database:', dbError);
      // Fall through to MDX
    }

    // Fall back to MDX file
    return await getBlogPostFromMDX(slug);
  } catch (error) {
    console.error(`Error reading blog post ${slug}:`, error);
    return null;
  }
}

export async function getBlogPostWithMDX(slug: string): Promise<{
  post: BlogPost;
  mdxSource: any;
} | null> {
  try {
    const post = await getBlogPostBySlug(slug);
    
    if (!post || !post.content) {
      return null;
    }

    // Return raw MDX string; render with next-mdx-remote/rsc at usage site
    const mdxSource = post.content;

    return { post, mdxSource };
  } catch (error) {
    console.error(`Error processing MDX for ${slug}:`, error);
    return null;
  }
}

export async function getFeaturedBlogPosts(): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => post.featured);
}

export async function getBlogPostsByCategory(category: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => 
    post.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
  );
}

export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const categorySet = new Set<string>();
  
  allPosts.forEach(post => {
    post.categories.forEach(cat => {
      if (cat && cat.trim()) {
        categorySet.add(cat.trim());
      }
    });
  });
  
  return Array.from(categorySet).sort();
}

export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllBlogPosts();
  const tagSet = new Set<string>();
  
  allPosts.forEach(post => {
    post.tags.forEach(tag => {
      if (tag && tag.trim()) {
        tagSet.add(tag.trim());
      }
    });
  });
  
  return Array.from(tagSet).sort();
}
