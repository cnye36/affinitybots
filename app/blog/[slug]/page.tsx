import { notFound } from 'next/navigation';
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Calendar, 
  Clock, 
  User, 
  ArrowLeft,
  BookOpen,
  Tag,
  ExternalLink
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getBlogPostWithMDX, getAllBlogPosts } from "@/lib/blog";
import { ShareButton } from '@/components/blog/ShareButton';
import { MDXContent } from '@/components/blog/MDXContent';
import { BlogPost } from '@/lib/blog';

interface BlogPostPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllBlogPosts();
  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const result = await getBlogPostWithMDX(slug);
  
  if (!result) {
    return {
      title: 'Blog Post Not Found',
    };
  }

  const { post } = result;

  const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || (process.env.NODE_ENV === 'production' ? 'https://affinitybots.com' : 'http://localhost:3000');
  
  return {
    title: post.title,
    description: post.excerpt,
    authors: [{ name: post.author }],
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      url: `${siteUrl}/blog/${slug}`,
      publishedTime: post.date,
      authors: [post.author],
      tags: post.tags,
      images: post.coverImage ? [
        {
          url: post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ] : [
        {
          url: `${siteUrl}/logo.png`,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
      images: post.coverImage ? [
        post.coverImage.startsWith('http') ? post.coverImage : `${siteUrl}${post.coverImage}`
      ] : [`${siteUrl}/logo.png`],
    },
  };
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params;
  const result = await getBlogPostWithMDX(slug);
  
  if (!result) {
    notFound();
  }

  const { post, mdxSource } = result;

  // Get related posts (same category, excluding current post)
  const allPosts = await getAllBlogPosts();
  const relatedPosts = allPosts
    .filter(p => p.category === post.category && p.slug !== post.slug)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Back Navigation */}
      <section className="pt-32 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/blog">
            <Button variant="ghost" className="text-gray-400 hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Blog
            </Button>
          </Link>
        </div>
      </section>

      {/* Article Header */}
      <section className="pb-8 px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-8">
            {/* Category Badge */}
            <Badge variant="outline" className="mb-4 border-gray-600 text-gray-300">
              {post.category}
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              {post.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4" />
                <span>{post.author}</span>
              </div>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(post.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{post.readTime}</span>
              </div>
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap justify-center gap-2 mb-8">
                {post.tags.map((tag, index) => (
                  <Badge 
                    key={index} 
                    variant="secondary" 
                    className="text-xs bg-gray-800 text-gray-300 hover:bg-gray-700"
                  >
                    <Tag className="h-3 w-3 mr-1" />
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Share Button */}
            <ShareButton 
              title={post.title}
              excerpt={post.excerpt}
              url={`${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/blog/${post.slug}`}
            />
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="pb-16 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <MDXContent mdxSource={mdxSource} />
          </div>
        </div>
      </section>

      {/* Inline CTA Banner */}
      <section className="px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="rounded-md border border-gray-300 dark:border-gray-700 bg-gradient-to-r from-blue-600/10 to-purple-600/10 dark:from-blue-500/10 dark:to-purple-500/10 px-4 py-3 md:px-6 md:py-4 flex flex-col md:flex-row items-center justify-between gap-3">
            <p className="text-sm md:text-base text-foreground/90">
              Ready to build with multi‑agent workflows?
            </p>
            <div className="flex items-center gap-2">
              <Link href="/signup">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Try AffinityBots Now
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="sm" variant="outline" className="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400 hover:bg-blue-600/10">
                  Request Access
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <section className="py-16 px-4 bg-gray-900/50">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-foreground mb-4">
                Related Articles
              </h2>
              <p className="text-gray-300">
                Continue exploring more insights on {post.category.toLowerCase()}
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {relatedPosts.map((relatedPost) => (
                <Card key={relatedPost.slug} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 group">
                  <div className="relative aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {relatedPost.coverImage ? (
                      <Image
                        src={relatedPost.coverImage}
                        alt={relatedPost.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-700 to-gray-800 h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                        {relatedPost.category}
                      </Badge>
                    </div>
                    <h3 className="text-white text-lg font-semibold mb-3 group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                      {relatedPost.title}
                    </h3>
                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {relatedPost.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-4">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{relatedPost.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{relatedPost.readTime}</span>
                      </div>
                    </div>
                    <Link href={`/blog/${relatedPost.slug}`}>
                      <Button variant="outline" className="w-full group-hover:border-primary group-hover:text-primary transition-all duration-200">
                        Read More
                        <ExternalLink className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Link href="/blog">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Articles
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
