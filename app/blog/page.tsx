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
  User, 
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

export default function BlogPage() {
  const featuredPost = {
    title: "The Future of AI Agents: How AffinityBots is Revolutionizing Business Automation",
    excerpt: "Discover how AI agents are transforming the way businesses operate, from customer service to sales automation, and learn how AffinityBots is leading this revolution.",
    author: "Sarah Chen",
    date: "2024-01-15",
    readTime: "8 min read",
    category: "AI & Automation",
    image: "/images/blog/featured-post.jpg",
    featured: true
  };

  const blogPosts = [
    {
      title: "Building Your First AI Agent: A Step-by-Step Guide",
      excerpt: "Learn how to create your first AI agent using AffinityBots in under 10 minutes. We'll walk you through the entire process from setup to deployment.",
      author: "Mike Rodriguez",
      date: "2024-01-12",
      readTime: "6 min read",
      category: "Tutorial",
      image: "/images/blog/agent-guide.jpg"
    },
    {
      title: "5 Ways AI Agents Are Transforming Customer Support",
      excerpt: "Explore how businesses are using AI agents to provide 24/7 customer support, reduce response times, and improve customer satisfaction.",
      author: "Emily Watson",
      date: "2024-01-10",
      readTime: "5 min read",
      category: "Use Cases",
      image: "/images/blog/customer-support.jpg"
    },
    {
      title: "The ROI of AI Automation: Real Numbers from Real Companies",
      excerpt: "See the actual impact AI agents have had on businesses, including cost savings, efficiency gains, and revenue increases.",
      author: "David Kim",
      date: "2024-01-08",
      readTime: "7 min read",
      category: "Case Study",
      image: "/images/blog/roi-analysis.jpg"
    },
    {
      title: "Integrating AI Agents with Your Existing Workflow",
      excerpt: "Learn how to seamlessly integrate AI agents into your current business processes without disrupting operations.",
      author: "Lisa Park",
      date: "2024-01-05",
      readTime: "9 min read",
      category: "Integration",
      image: "/images/blog/workflow-integration.jpg"
    },
    {
      title: "Security Best Practices for AI Agent Deployment",
      excerpt: "Essential security considerations when deploying AI agents in enterprise environments, including data protection and access control.",
      author: "Alex Thompson",
      date: "2024-01-03",
      readTime: "10 min read",
      category: "Security",
      image: "/images/blog/security.jpg"
    },
    {
      title: "The Psychology of AI-Human Interaction",
      excerpt: "Understanding how to design AI agents that users trust and enjoy interacting with, based on behavioral psychology principles.",
      author: "Dr. Maria Santos",
      date: "2024-01-01",
      readTime: "12 min read",
      category: "Research",
      image: "/images/blog/psychology.jpg"
    }
  ];

  const categories = [
    { name: "All", count: 24, active: true },
    { name: "Tutorial", count: 8, active: false },
    { name: "Use Cases", count: 6, active: false },
    { name: "Case Study", count: 4, active: false },
    { name: "Integration", count: 3, active: false },
    { name: "Security", count: 2, active: false },
    { name: "Research", count: 1, active: false }
  ];

  const popularTags = [
    "AI Agents", "Automation", "Customer Support", "Sales", "Integration", 
    "Security", "ROI", "Best Practices", "Tutorial", "Case Study"
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
            AI Automation
            <br />
            <span className="text-foreground">Insights & Updates</span>
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
        </div>
      </section>

      {/* Featured Post */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Featured Article
            </h2>
          </div>
          
          <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-gray-700 overflow-hidden">
            <div className="md:flex">
              <div className="md:w-1/2 p-8">
                <div className="flex items-center space-x-2 mb-4">
                  <Badge className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <Sparkles className="h-3 w-3 mr-1" />
                    Featured
                  </Badge>
                  <Badge variant="outline" className="border-gray-600 text-gray-300">
                    {featuredPost.category}
                  </Badge>
                </div>
                <CardTitle className="text-2xl md:text-3xl text-white mb-4">
                  {featuredPost.title}
                </CardTitle>
                <CardDescription className="text-gray-300 text-lg mb-6">
                  {featuredPost.excerpt}
                </CardDescription>
                <div className="flex items-center space-x-4 text-sm text-gray-400 mb-6">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4" />
                    <span>{featuredPost.author}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{featuredPost.date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{featuredPost.readTime}</span>
                  </div>
                </div>
                <Link href="/blog/featured-post">
                  <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                    Read Article
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="md:w-1/2 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-8">
                <div className="text-center text-white">
                  <BookOpen className="h-16 w-16 mx-auto mb-4 opacity-80" />
                  <p className="text-lg opacity-90">Featured Article</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </section>

      {/* Categories and Filters */}
      <section className="py-8 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="flex flex-wrap items-center justify-between mb-6">
            <div className="flex flex-wrap gap-2 mb-4 md:mb-0">
              {categories.map((category, index) => (
                <Button
                  key={index}
                  variant={category.active ? "default" : "outline"}
                  className={`${
                    category.active 
                      ? "bg-blue-600 hover:bg-blue-700" 
                      : "border-gray-600 text-gray-300 hover:bg-gray-700"
                  }`}
                >
                  {category.name}
                  <Badge variant="secondary" className="ml-2 text-xs">
                    {category.count}
                  </Badge>
                </Button>
              ))}
            </div>
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-400">Sort by:</span>
              <select className="bg-gray-800 border-gray-700 text-white rounded px-3 py-1 text-sm">
                <option>Latest</option>
                <option>Popular</option>
                <option>Trending</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {blogPosts.map((post, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl group">
                <div className="bg-gradient-to-br from-gray-700 to-gray-800 h-48 flex items-center justify-center">
                  <BookOpen className="h-12 w-12 text-gray-400" />
                </div>
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-3">
                    <Badge variant="outline" className="border-gray-600 text-gray-300 text-xs">
                      {post.category}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors duration-200">
                    {post.title}
                  </CardTitle>
                  <CardDescription className="text-gray-300 text-sm">
                    {post.excerpt}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4 text-xs text-gray-400">
                      <div className="flex items-center space-x-1">
                        <User className="h-3 w-3" />
                        <span>{post.author}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-3 w-3" />
                        <span>{post.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-1 text-xs text-gray-400">
                      <Clock className="h-3 w-3" />
                      <span>{post.readTime}</span>
                    </div>
                  </div>
                  <Link href={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}>
                    <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700 group-hover:border-blue-500 group-hover:text-blue-400 transition-all duration-200">
                      Read More
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
          
          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" className="border-gray-600 text-white hover:bg-gray-700">
              Load More Articles
            </Button>
          </div>
        </div>
      </section>

      {/* Popular Tags */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">Popular Tags</h3>
            <p className="text-gray-300">Explore articles by topic</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2">
            {popularTags.map((tag, index) => (
              <Button
                key={index}
                variant="outline"
                className="border-gray-600 text-gray-300 hover:bg-gray-700 hover:border-blue-500 hover:text-blue-400 transition-all duration-200"
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
