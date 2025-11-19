import { notFound } from 'next/navigation';
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  ArrowLeft,
  Tag
} from "lucide-react";
import Link from "next/link";
import { getDocWithMDX, getAllDocs } from "@/lib/docs";
import { MDXContent } from '@/components/blog/MDXContent';

interface DocPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const docs = await getAllDocs();
  return docs.map((doc) => ({
    slug: doc.slug,
  }));
}

export async function generateMetadata({ params }: DocPageProps) {
  const { slug } = await params;
  const result = await getDocWithMDX(slug);
  
  if (!result) {
    return {
      title: 'Document Not Found',
    };
  }

  const { doc } = result;
  
  return {
    title: doc.title,
    description: doc.excerpt,
  };
}

export default async function DocPage({ params }: DocPageProps) {
  const { slug } = await params;
  const result = await getDocWithMDX(slug);
  
  if (!result) {
    notFound();
  }

  const { doc, mdxSource } = result;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Back Navigation */}
      <section className="pt-32 pb-8 px-4">
        <div className="container mx-auto">
          <Link href="/docs">
            <Button variant="ghost" className="text-gray-400 hover:text-foreground">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Documentation
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
              {doc.category}
            </Badge>

            {/* Title */}
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6 leading-tight">
              {doc.title}
            </h1>

            {/* Excerpt */}
            <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              {doc.excerpt}
            </p>

            {/* Meta Information */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400 mb-8">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{new Date(doc.date).toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>{doc.readTime}</span>
              </div>
            </div>
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

      {/* Back to Docs */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <Link href="/docs">
            <Button variant="outline" className="border-gray-600 text-gray-300 hover:bg-gray-700">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to All Guides
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
