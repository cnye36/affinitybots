import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Clock,
  ArrowRight, 
  Mail,
  Sparkles,
  CheckCircle,
  Zap,
  Users,
  Settings,
  Shield,
  Brain,
  Workflow,
  BarChart3
} from "lucide-react";

export default function DocsPage() {
  const comingSoonFeatures = [
    {
      title: "Building Your First Agent",
      description: "Learn how to create and configure your first AI agent",
      icon: <Brain className="h-6 w-6 text-blue-500" />,
      status: "coming-soon"
    },
    {
      title: "Tool Configuration",
      description: "Connect and configure tools to extend your agent's capabilities",
      icon: <Settings className="h-6 w-6 text-purple-500" />,
      status: "coming-soon"
    },
    {
      title: "Workflow Creation",
      description: "Build complex workflows to automate multi-step processes",
      icon: <Workflow className="h-6 w-6 text-green-500" />,
      status: "coming-soon"
    },
    {
      title: "Best Practices",
      description: "Tips and tricks for getting the most out of your agents",
      icon: <Sparkles className="h-6 w-6 text-yellow-500" />,
      status: "coming-soon"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            <Clock className="h-4 w-4 mr-2" />
            Documentation Coming Soon
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Documentation
            <br />
            <span className="text-foreground">Coming Soon</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're working hard to bring you step-by-step tutorials and guides 
            to help you build, configure, and deploy powerful AI agents with our platform.
          </p>
          
          {/* Email Signup */}
          <div className="max-w-md mx-auto mb-8">
            <div className="flex gap-2">
              <Input 
                placeholder="Enter your email..." 
                className="flex-1"
                type="email"
              />
              <Button className="px-6">
                <Mail className="h-4 w-4 mr-2" />
                Notify Me
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              Get notified when our tutorials and guides are ready
            </p>
          </div>
        </div>
      </section>

      {/* Coming Soon Features */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              What's Coming
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Here's what you can expect in our tutorial guides
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {comingSoonFeatures.map((feature, index) => (
              <Card key={index} className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3 mb-4">
                    {feature.icon}
                    <Badge variant="outline" className="text-xs">
                      Coming Soon
                    </Badge>
                  </div>
                  <CardTitle className="text-white text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-gray-300">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center text-sm text-gray-400">
                    <Clock className="h-4 w-4 mr-2" />
                    In Development
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Progress Section */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Development Progress
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              We're making great progress on our tutorial guides
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-8">
              <Card className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-500" />
                    <CardTitle className="text-white">Planning</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Tutorial structure and content planning completed</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Sparkles className="h-6 w-6 text-blue-500" />
                    <CardTitle className="text-white">Writing</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Currently writing step-by-step tutorials and guides</p>
                </CardContent>
              </Card>

              <Card className="bg-gray-800/30 border-gray-700">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <Clock className="h-6 w-6 text-yellow-500" />
                    <CardTitle className="text-white">Review</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">Final review and testing phase coming soon</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Need Help Now?
          </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              While we're working on the tutorials, feel free to reach out to our support team
            </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" size="lg">
              <Users className="h-4 w-4 mr-2" />
              Contact Support
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="h-4 w-4 mr-2" />
              Join Community
            </Button>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}
