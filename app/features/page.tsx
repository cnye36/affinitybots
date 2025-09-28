import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Bot, 
  Zap, 
  Shield, 
  Brain, 
  Workflow, 
  MessageSquare, 
  BarChart3, 
  Settings,
  Clock,
  Users,
  Database,
  Lock,
  CheckCircle,
  ArrowRight,
  Sparkles
} from "lucide-react";
import Link from "next/link";

export default function FeaturesPage() {
  const coreFeatures = [
    {
      icon: <Bot className="h-8 w-8 text-blue-500" />,
      title: "AI Agent Creation",
      description: "Create fully functional AI agents in under 1 minute with our intuitive drag-and-drop interface. No coding required.",
      details: [
        "Visual workflow builder",
        "Pre-built agent templates",
        "Custom skill configuration",
        "Real-time testing environment"
      ]
    },
    {
      icon: <Brain className="h-8 w-8 text-purple-500" />,
      title: "Advanced AI Capabilities",
      description: "Powered by state-of-the-art language models with specialized training for business applications.",
      details: [
        "Multi-modal understanding",
        "Context-aware responses",
        "Learning from interactions",
        "Custom model fine-tuning"
      ]
    },
    {
      icon: <Workflow className="h-8 w-8 text-green-500" />,
      title: "Workflow Automation",
      description: "Automate complex business processes with intelligent agents that can handle multi-step tasks.",
      details: [
        "Conditional logic flows",
        "Integration with 100+ tools",
        "Error handling and recovery",
        "Performance monitoring"
      ]
    },
    {
      icon: <MessageSquare className="h-8 w-8 text-orange-500" />,
      title: "Multi-Channel Communication",
      description: "Deploy agents across all your communication channels for seamless customer interactions.",
      details: [
        "Slack, Teams, Discord integration",
        "Email automation",
        "Live chat widgets",
        "Voice and video support"
      ]
    },
    {
      icon: <BarChart3 className="h-8 w-8 text-cyan-500" />,
      title: "Analytics & Insights",
      description: "Comprehensive analytics to track agent performance and optimize your automation strategy.",
      details: [
        "Real-time performance metrics",
        "Conversation analytics",
        "ROI tracking",
        "Custom reporting dashboards"
      ]
    },
    {
      icon: <Shield className="h-8 w-8 text-red-500" />,
      title: "Enterprise Security",
      description: "Bank-level security with compliance certifications to protect your data and customer information.",
      details: [
        "SOC 2 Type II certified",
        "GDPR and CCPA compliant",
        "End-to-end encryption",
        "Role-based access control"
      ]
    }
  ];

  const technicalFeatures = [
    {
      title: "Custom Model Training",
      description: "Train agents on your specific data and use cases for maximum accuracy and relevance.",
      icon: <Brain className="h-6 w-6" />
    },
    {
      title: "API Integration",
      description: "RESTful APIs and webhooks for seamless integration with your existing systems.",
      icon: <Database className="h-6 w-6" />
    },
    {
      title: "Scalable Infrastructure",
      description: "Auto-scaling cloud infrastructure that handles millions of interactions without breaking.",
      icon: <Zap className="h-6 w-6" />
    },
    {
      title: "Real-time Monitoring",
      description: "24/7 monitoring and alerting to ensure your agents are always performing optimally.",
      icon: <BarChart3 className="h-6 w-6" />
    },
    {
      title: "Custom Branding",
      description: "White-label solutions with your branding, colors, and personality.",
      icon: <Settings className="h-6 w-6" />
    },
    {
      title: "Multi-language Support",
      description: "Agents that can communicate fluently in 50+ languages with cultural context.",
      icon: <MessageSquare className="h-6 w-6" />
    }
  ];

  const useCases = [
    {
      title: "Customer Support",
      description: "24/7 intelligent support agents that can handle complex queries and escalate when needed.",
      metrics: "90% query resolution rate"
    },
    {
      title: "Sales Automation",
      description: "AI sales assistants that qualify leads, schedule meetings, and close deals.",
      metrics: "3x faster lead qualification"
    },
    {
      title: "HR & Recruitment",
      description: "Automated screening, scheduling, and initial candidate interactions.",
      metrics: "75% reduction in screening time"
    },
    {
      title: "Content Creation",
      description: "AI writers that create marketing copy, documentation, and social media content.",
      metrics: "10x faster content production"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            <Sparkles className="h-4 w-4 mr-2" />
            Powerful AI Features
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Everything You Need to Build
            <br />
            <span className="text-foreground">Intelligent Agents</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            From simple chatbots to complex workflow automation, AffinityBots provides all the tools 
            you need to create, deploy, and manage AI agents that actually work.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/early-access">
              <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                Start Building Free
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/docs">
              <Button size="lg" variant="outline">
                View Documentation
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Core Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Core Features
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to build, deploy, and scale AI agents for your business
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {coreFeatures.map((feature, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    {feature.icon}
                    <CardTitle className="text-card-foreground text-xl">{feature.title}</CardTitle>
                  </div>
                  <CardDescription className="text-muted-foreground text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {feature.details.map((detail, detailIndex) => (
                      <li key={detailIndex} className="flex items-center text-sm text-muted-foreground">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {detail}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Technical Features */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Technical Excellence
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Built for enterprise scale with developer-friendly tools and robust infrastructure
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {technicalFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-6 bg-card rounded-lg border border-border hover:border-primary/20 transition-all duration-300">
                <div className="text-primary flex-shrink-0 mt-1">
                  {feature.icon}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Use Cases */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Proven Use Cases
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              See how businesses are using AffinityBots to transform their operations
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {useCases.map((useCase, index) => (
              <Card key={index} className="bg-card border-border hover:border-primary transition-all duration-300 hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="text-card-foreground text-lg">{useCase.title}</CardTitle>
                  <CardDescription className="text-muted-foreground">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-primary font-semibold text-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {useCase.metrics}
                </div>
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
