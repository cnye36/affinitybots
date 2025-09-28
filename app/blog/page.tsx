import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  Calendar, 
  Clock, 
  ArrowRight, 
  Search,
  Filter,
  Tag,
  TrendingUp,
  BookOpen,
  Lightbulb,
  Zap,
  MessageSquare,
  ExternalLink,
  Sparkles
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { getAllBlogPosts, getAllCategories, getAllTags } from "@/lib/blog";
import { BlogPost } from "@/lib/blog";

interface BlogPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BlogPage({ searchParams }: BlogPageProps) {
  // Fetch blog posts from MDX files
  const allPosts = await getAllBlogPosts();
  const categories = getAllCategories();
  const popularTags = getAllTags();

  // Get featured posts (up to 3)
  const featuredPosts = allPosts.filter(post => post.featured).slice(0, 3);
  
  // Get other posts (excluding featured)
  const blogPosts = allPosts.filter(post => !post.featured);

  // Get category counts
  const categoryCounts = categories.map(category => ({
    name: category,
    count: allPosts.filter(post => post.category === category).length,
    active: false
  }));

  // Add "All" category
  const allCategories = [
    { name: "All", count: allPosts.length, active: true },
    ...categoryCounts
  ];

  const newsletter = {
    title: "Stay Updated",
    description: "Get the latest insights on AI automation, product updates, and industry trends delivered to your inbox.",
    placeholder: "Enter your email address",
    buttonText: "Subscribe"
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Latest Insights
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            AffinityBots Blog
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Stay ahead of the curve with expert insights, tutorials, and real-world case studies 
            on AI agent automation and business transformation.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search articles..." 
                className="pl-10 pr-4 py-3"
              />
            </div>
          </div>

          {/* Categories and Filters */}
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-wrap items-center justify-between mb-6">
              <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
                {allCategories.map((category, index) => (
                  <Button
                    key={index}
                    variant={category.active ? "default" : "outline"}
                    className={`${
                      category.active 
                        ? "bg-blue-600 hover:bg-blue-700 text-white" 
                        : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {category.name}
                    <Badge variant="secondary" className="ml-2 text-xs">
                      {category.count}
                    </Badge>
                  </Button>
                ))}
              </div>
              <div className="flex items-center pt-2 space-x-2">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Sort by:</span>
                <select className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded px-3 py-1 text-sm">
                  <option>Latest</option>
                  <option>Popular</option>
                  <option>Trending</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Articles */}
      {featuredPosts.length > 0 && (
        <section className="py-4 px-4">
          <div className="container mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Featured Articles
              </h2>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredPosts.map((post, index) => (
                <Link key={index} href={`/blog/${post.slug}`} className="group">
                  <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl group-hover:shadow-2xl h-full">
                    <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                      {post.coverImage ? (
                        <Image
                          src={post.coverImage}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          className="object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 h-full flex items-center justify-center">
                          <div className="text-center">
                            <Sparkles className="h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-2" />
                            <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Featured</p>
                          </div>
                        </div>
                      )}
                    </div>
                    <CardHeader>
                      <div className="flex items-center space-x-2 mb-3">
                        <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs">
                          <Sparkles className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                        <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs">
                          {post.category}
                        </Badge>
                      </div>
                      <CardTitle className="text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                        {post.title}
                      </CardTitle>
                      <CardDescription className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                        {post.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}


      {/* Blog Posts Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Link key={index} href={`/blog/${post.slug}`} className="group">
                <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-all duration-300 hover:shadow-xl group-hover:shadow-2xl h-full">
                  <div className="relative aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-800">
                    {post.coverImage ? (
                      <Image
                        src={post.coverImage}
                        alt={post.title}
                        fill
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 h-full flex items-center justify-center">
                        <BookOpen className="h-12 w-12 text-gray-600 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center space-x-2 mb-3">
                      <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs">
                        {post.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-gray-900 dark:text-white text-lg group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2">
                      {post.title}
                    </CardTitle>
                    <CardDescription className="text-gray-600 dark:text-gray-300 text-sm line-clamp-3">
                      {post.excerpt}
                    </CardDescription>
                  </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{post.date}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Clock className="h-3 w-3" />
                          <span>{post.readTime}</span>
                        </div>
                      </div>
                    </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Tags */}
      <section className="py-16 px-4 bg-gray-100 dark:bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-foreground mb-4">Popular Tags</h3>
            <p className="text-gray-600 dark:text-gray-300">Explore articles by topic</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map((tag, index) => (
              <Button
                key={index}
                variant="outline"
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-all duration-200"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </Button>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}
