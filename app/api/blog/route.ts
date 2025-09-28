import { NextRequest, NextResponse } from 'next/server';
import { getAllBlogPosts, getBlogPostsByCategory, getBlogPostsByTag, getFeaturedBlogPosts } from '@/lib/blog';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const featured = searchParams.get('featured');
    const limit = searchParams.get('limit');

    let posts;

    if (featured === 'true') {
      posts = await getFeaturedBlogPosts();
    } else if (category) {
      posts = await getBlogPostsByCategory(category);
    } else if (tag) {
      posts = await getBlogPostsByTag(tag);
    } else {
      posts = await getAllBlogPosts();
    }

    // Apply limit if specified
    if (limit) {
      const limitNum = parseInt(limit, 10);
      if (!isNaN(limitNum)) {
        posts = posts.slice(0, limitNum);
      }
    }

    return NextResponse.json({ posts });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
