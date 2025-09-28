import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
// RSC MDX flow: no serialize at build time
import remarkGfm from 'remark-gfm';
import remarkFrontmatter from 'remark-frontmatter';

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  author: string;
  date: string;
  readTime: string;
  category: string;
  featured?: boolean;
  tags: string[];
  coverImage?: string;
  content?: string;
  mdxSource?: any;
}

const contentDirectory = path.join(process.cwd(), 'content', 'blog');

export async function getAllBlogPosts(): Promise<BlogPost[]> {
  try {
    if (!fs.existsSync(contentDirectory)) {
      return [];
    }

    const fileNames = fs.readdirSync(contentDirectory);
    const allPostsData = await Promise.all(
      fileNames
        .filter(name => name.endsWith('.mdx'))
        .map(async (fileName) => {
          const slug = fileName.replace(/\.mdx$/, '');
          return await getBlogPostBySlug(slug);
        })
    );

    // Sort posts by date (newest first)
    return allPostsData
      .filter(post => post !== null)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  } catch (error) {
    console.error('Error reading blog posts:', error);
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  try {
    const fullPath = path.join(contentDirectory, `${slug}.mdx`);
    
    if (!fs.existsSync(fullPath)) {
      return null;
    }

    const fileContents = fs.readFileSync(fullPath, 'utf8');
    const { data, content } = matter(fileContents);

    return {
      slug,
      title: data.title || '',
      excerpt: data.excerpt || '',
      author: data.author || '',
      date: data.date || '',
      readTime: data.readTime || '',
      category: data.category || '',
      featured: data.featured || false,
      tags: data.tags || [],
      coverImage: data.coverImage || '',
      content,
    };
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
    post.category.toLowerCase() === category.toLowerCase()
  );
}

export async function getBlogPostsByTag(tag: string): Promise<BlogPost[]> {
  const allPosts = await getAllBlogPosts();
  return allPosts.filter(post => 
    post.tags.some(t => t.toLowerCase() === tag.toLowerCase())
  );
}

export function getAllCategories(): string[] {
  // This would typically be called after getAllBlogPosts
  // For now, return a static list based on our sample posts
  return [
    'AI & Automation',
    'AI Agents',
    'Use Cases',
    'Integration',
    'Security',
    'MCP',
    'Chatbots',
    'Multimodal Agents'
  ];
}

export function getAllTags(): string[] {
  // This would typically be called after getAllBlogPosts
  // For now, return a static list based on our sample posts
  return [
    'AI Agents',
    'Automation',
    'Business',
    'Future',
    'Tutorial',
    'Getting Started',
    'Guide',
    'Customer Support',
    'Best Practices',
    'Case Study'
  ];
}
