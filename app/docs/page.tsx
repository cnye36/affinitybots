import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Code, 
  Play, 
  ArrowRight, 
  Search,
  FileText,
  Video,
  Download,
  ExternalLink,
  Zap,
  Users,
  Settings,
  Shield,
  Brain,
  Workflow,
  MessageSquare,
  BarChart3,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function DocsPage() {
  const quickStart = [
    {
      title: "Create Your First Agent",
      description: "Learn how to build and deploy your first AI agent in under 5 minutes",
      icon: <Zap className="h-6 w-6 text-blue-500" />,
      time: "5 min read",
      link: "/docs/quick-start"
    },
    {
      title: "Agent Configuration",
      description: "Configure your agent's personality, skills, and behavior",
      icon: <Settings className="h-6 w-6 text-purple-500" />,
      time: "10 min read",
      link: "/docs/configuration"
    },
    {
      title: "Deploy & Test",
      description: "Deploy your agent and test it in a real environment",
      icon: <Play className="h-6 w-6 text-green-500" />,
      time: "8 min read",
      link: "/docs/deployment"
    }
  ];

  const guides = [
    {
      category: "Getting Started",
      icon: <BookOpen className="h-5 w-5" />,
      articles: [
        { title: "Introduction to AffinityBots", time: "3 min", link: "/docs/introduction" },
        { title: "Account Setup", time: "2 min", link: "/docs/account-setup" },
        { title: "Your First Agent", time: "5 min", link: "/docs/first-agent" },
        { title: "Understanding Workflows", time: "7 min", link: "/docs/workflows" }
      ]
    },
    {
      category: "Agent Development",
      icon: <Brain className="h-5 w-5" />,
      articles: [
        { title: "Agent Architecture", time: "12 min", link: "/docs/agent-architecture" },
        { title: "Custom Skills", time: "15 min", link: "/docs/custom-skills" },
        { title: "Training Data", time: "10 min", link: "/docs/training-data" },
        { title: "Testing & Debugging", time: "8 min", link: "/docs/testing" }
      ]
    },
    {
      category: "Integrations",
      icon: <Workflow className="h-5 w-5" />,
      articles: [
        { title: "Slack Integration", time: "6 min", link: "/docs/slack" },
        { title: "Teams Integration", time: "6 min", link: "/docs/teams" },
        { title: "API Integration", time: "12 min", link: "/docs/api" },
        { title: "Webhook Setup", time: "8 min", link: "/docs/webhooks" }
      ]
    },
    {
      category: "Advanced Features",
      icon: <Shield className="h-5 w-5" />,
      articles: [
        { title: "Security Best Practices", time: "10 min", link: "/docs/security" },
        { title: "Performance Optimization", time: "12 min", link: "/docs/performance" },
        { title: "Custom Models", time: "20 min", link: "/docs/custom-models" },
        { title: "Enterprise Features", time: "15 min", link: "/docs/enterprise" }
      ]
    }
  ];

  const apiDocs = [
    {
      title: "Authentication",
      description: "Learn how to authenticate with our API",
      icon: <Shield className="h-6 w-6 text-red-500" />,
      link: "/docs/api/auth"
    },
    {
      title: "Agent Management",
      description: "Create, update, and manage agents via API",
      icon: <Brain className="h-6 w-6 text-blue-500" />,
      link: "/docs/api/agents"
    },
    {
      title: "Workflow API",
      description: "Build and execute complex workflows",
      icon: <Workflow className="h-6 w-6 text-green-500" />,
      link: "/docs/api/workflows"
    },
    {
      title: "Analytics API",
      description: "Access performance metrics and analytics",
      icon: <BarChart3 className="h-6 w-6 text-purple-500" />,
      link: "/docs/api/analytics"
    }
  ];

  const resources = [
    {
      title: "Video Tutorials",
      description: "Step-by-step video guides for common tasks",
      icon: <Video className="h-6 w-6 text-red-500" />,
      count: "12 videos",
      link: "/docs/videos"
    },
    {
      title: "Code Examples",
      description: "Ready-to-use code snippets and examples",
      icon: <Code className="h-6 w-6 text-blue-500" />,
      count: "50+ examples",
      link: "/docs/examples"
    },
    {
      title: "SDK Downloads",
      description: "Official SDKs for popular programming languages",
      icon: <Download className="h-6 w-6 text-green-500" />,
      count: "5 languages",
      link: "/docs/sdks"
    },
    {
      title: "Community Forum",
      description: "Get help from our community and support team",
      icon: <Users className="h-6 w-6 text-purple-500" />,
      count: "2.5k members",
      link: "/community"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Complete Documentation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Everything You Need
            <br />
            <span className="text-foreground">to Get Started</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Comprehensive guides, tutorials, and API documentation to help you build 
            powerful AI agents with AffinityBots.
          </p>
          
          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-8">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input 
                placeholder="Search documentation..." 
                className="pl-10 pr-4 py-3"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Start */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Quick Start Guide
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Get up and running in minutes with our step-by-step guide
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {quickStart.map((step, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    {step.icon}
                    <Badge variant="outline" className="text-xs">
                      {step.time}
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{step.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {step.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={step.link}>
                    <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                      Read Guide
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Documentation Categories */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Documentation Categories
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Browse our comprehensive documentation by category
            </p>
          </div>
          
          <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
            {guides.map((category, index) => (
              <Card key={index} className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="text-blue-400">
                      {category.icon}
                    </div>
                    <CardTitle className="text-white text-xl">{category.category}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {category.articles.map((article, articleIndex) => (
                      <Link 
                        key={articleIndex} 
                        href={article.link}
                        className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-700/50 transition-colors duration-200"
                      >
                        <div className="flex items-center space-x-3">
                          <FileText className="h-4 w-4 text-gray-400" />
                          <span className="text-white">{article.title}</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-sm text-gray-400">{article.time}</span>
                          <ArrowRight className="h-4 w-4 text-gray-400" />
                        </div>
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* API Documentation */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              API Documentation
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Integrate AffinityBots into your applications with our powerful API
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {apiDocs.map((doc, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    {doc.icon}
                    <CardTitle className="text-white text-lg">{doc.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    {doc.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Link href={doc.link}>
                    <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                      View Docs
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Resources */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Additional Resources
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Videos, examples, and community resources to help you succeed
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {resources.map((resource, index) => (
              <Card key={index} className="bg-gray-800/30 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    {resource.icon}
                    <CardTitle className="text-white text-lg">{resource.title}</CardTitle>
                  </div>
                  <CardDescription className="text-gray-300">
                    {resource.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="secondary" className="text-xs">
                      {resource.count}
                    </Badge>
                  </div>
                  <Link href={resource.link}>
                    <Button variant="outline" className="w-full border-gray-600 text-white hover:bg-gray-700">
                      Explore
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}
