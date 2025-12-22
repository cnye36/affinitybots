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

const POSTS_PER_PAGE = 12;

export default async function BlogPage({ searchParams }: BlogPageProps) {
  // Parse search params
  const params = await searchParams;
  const currentPage = parseInt((params.page as string) || '1', 10);
  const selectedTag = params.tag as string | undefined;
  
  // Fetch blog posts from MDX files
  const allPosts = await getAllBlogPosts();
  const allCategoriesList = await getAllCategories();
  const popularTags = await getAllTags();

  // Filter posts by tag if selected
  let filteredPosts = allPosts;
  if (selectedTag) {
    filteredPosts = allPosts.filter(post => 
      post.tags.some(tag => tag.toLowerCase() === selectedTag.toLowerCase())
    );
  }

  // Sort all posts by date (latest first)
  const sortedPosts = filteredPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  
  // Paginate posts
  const totalPages = Math.ceil(sortedPosts.length / POSTS_PER_PAGE);
  const startIndex = (currentPage - 1) * POSTS_PER_PAGE;
  const endIndex = startIndex + POSTS_PER_PAGE;
  const paginatedPosts = sortedPosts.slice(startIndex, endIndex);

  // Get category counts - only include categories that have posts
  const categoryCounts = allCategoriesList
    .map(category => ({
      name: category,
      count: allPosts.filter(post => 
        post.categories.some(cat => cat.toLowerCase() === category.toLowerCase())
      ).length,
      active: false
    }))
    .filter(cat => cat.count > 0); // Only show categories with posts

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
      <section className="pt-32 pb-8 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
              AffinityBots Blog
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto">
              Stay ahead of the curve with expert insights, tutorials, and real-world case studies 
              on AI agent automation and business transformation.
            </p>
            {selectedTag && (
              <div className="mt-4 flex items-center justify-center gap-2">
                <Badge className="bg-blue-600 text-white text-sm px-3 py-1">
                  <Tag className="h-3 w-3 mr-1" />
                  {selectedTag}
                </Badge>
                <Link href="/blog">
                  <Button variant="ghost" size="sm" className="text-sm">
                    Clear filter
                  </Button>
                </Link>
              </div>
            )}
          </div>
          
          {/* Search and Sort Bar */}
          <div className="max-w-6xl mx-auto mb-6">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <Input 
                    placeholder="Search articles..." 
                    className="pl-10 pr-4 py-2.5"
                  />
                </div>
              </div>

              {/* Sort Filter */}
              <div className="flex items-center space-x-2 flex-shrink-0">
                <Filter className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Sort by:</span>
                <select className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option>Newest</option>
                  <option>Oldest</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="pb-16 px-4">
        <div className="container mx-auto">
          <div className="flex gap-4 md:gap-6 lg:gap-8">
            {/* Sidebar - Always visible, narrower on small screens */}
            <aside className="w-56 md:w-64 flex-shrink-0 hidden sm:block">
              <div className="sticky top-24 space-y-6 max-h-[calc(100vh-8rem)] overflow-y-auto pr-2">
                {/* Categories */}
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-3 uppercase tracking-wide">Categories</h3>
                  <div className="space-y-1.5">
                    {allCategories.map((category, index) => (
                      <Button
                        key={index}
                        variant={category.active ? "default" : "ghost"}
                        size="sm"
                        className={`w-full justify-start text-sm ${
                          category.active 
                            ? "bg-blue-600 hover:bg-blue-700 text-white" 
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <span className="truncate">{category.name}</span>
                        <Badge variant="secondary" className="ml-auto text-xs flex-shrink-0 bg-gray-200 dark:bg-gray-700">
                          {category.count}
                        </Badge>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wide">Tags</h3>
                    {selectedTag && (
                      <Link href="/blog">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 h-auto p-0"
                        >
                          Clear
                        </Button>
                      </Link>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {popularTags.map((tag, index) => {
                      const isSelected = selectedTag?.toLowerCase() === tag.toLowerCase();
                      return (
                        <Link key={index} href={`/blog?tag=${encodeURIComponent(tag)}`}>
                          <Button
                            variant={isSelected ? "default" : "outline"}
                            size="sm"
                            className={`text-xs ${
                              isSelected
                                ? "bg-blue-600 hover:bg-blue-700 text-white"
                                : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600"
                            }`}
                          >
                            <Tag className="h-3 w-3 mr-1 flex-shrink-0" />
                            <span className="truncate">{tag}</span>
                          </Button>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedPosts.map((post, index) => (
                  <Link key={index} href={`/blog/${post.slug}`} className="group">
                    <Card className="bg-white dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 transition-all duration-300 hover:shadow-xl h-full flex flex-col overflow-hidden">
                      <div className="relative aspect-[3/2] overflow-hidden bg-gray-100 dark:bg-gray-800">
                        {post.coverImage ? (
                          <Image
                            src={post.coverImage}
                            alt={post.title}
                            fill
                            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                            className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                            quality={85}
                            priority={index < 3}
                          />
                        ) : (
                          <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 h-full flex items-center justify-center">
                            <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-gray-600 dark:text-gray-400" />
                          </div>
                        )}
                      </div>
                      <CardHeader className="p-4 flex-1 flex flex-col">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 text-xs px-2 py-0.5">
                            {post.category}
                          </Badge>
                        </div>
                        <CardTitle className="text-gray-900 dark:text-white text-base font-semibold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-200 line-clamp-2 mb-2">
                          {post.title}
                        </CardTitle>
                        <CardDescription className="text-gray-600 dark:text-gray-300 text-sm line-clamp-2 flex-1">
                          {post.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="p-4 pt-0">
                        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                          <div className="flex items-center space-x-1.5">
                            <Calendar className="h-3.5 w-3.5" />
                            <span>{post.date}</span>
                          </div>
                          <div className="flex items-center space-x-1.5">
                            <Clock className="h-3.5 w-3.5" />
                            <span>{post.readTime}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-16">
                  {/* Previous Button */}
                  <Link href={currentPage > 1 ? `/blog?page=${currentPage - 1}` : `/blog?page=1`}>
                    <Button 
                      variant="outline" 
                      disabled={currentPage === 1}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </Button>
                  </Link>
                  
                  {/* Page Numbers */}
                  <div className="flex gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1);
                      
                      // Show ellipsis
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3;
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2;
                      
                      return (
                        <div key={page} className="flex items-center gap-1">
                          {showEllipsisBefore && (
                            <span className="text-gray-500 dark:text-gray-400 px-2">...</span>
                          )}
                          {showPage && (
                            <Link href={`/blog?page=${page}`}>
                              <Button
                                variant={page === currentPage ? "default" : "outline"}
                                className={`${
                                  page === currentPage
                                    ? "bg-blue-600 hover:bg-blue-700 text-white"
                                    : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                } min-w-[40px]`}
                              >
                                {page}
                              </Button>
                            </Link>
                          )}
                          {showEllipsisAfter && (
                            <span className="text-gray-500 dark:text-gray-400 px-2">...</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                  
                  {/* Next Button */}
                  <Link href={currentPage < totalPages ? `/blog?page=${currentPage + 1}` : `/blog?page=${totalPages}`}>
                    <Button 
                      variant="outline" 
                      disabled={currentPage === totalPages}
                      className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </Button>
                  </Link>
                </div>
              )}
              
              {/* Page Info */}
              <div className="text-center mt-6 text-sm text-gray-500 dark:text-gray-400">
                Showing {startIndex + 1} to {Math.min(endIndex, sortedPosts.length)} of {sortedPosts.length} articles
              </div>
            </div>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}
