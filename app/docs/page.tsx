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
import Link from "next/link";
import { getAllDocs } from "@/lib/docs";

export default async function DocsPage() {
  const docs = await getAllDocs();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          <Badge variant="secondary" className="mb-6 text-sm">
            <BookOpen className="h-4 w-4 mr-2" />
            Documentation
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            AffinityBots Documentation
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Step-by-step guides to help you build, configure, and deploy powerful AI agents.
          </p>
        </div>
      </section>

      {/* Guides Grid */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {docs.map((doc, index) => (
              <Link key={index} href={`/docs/${doc.slug}`} className="group">
                <Card className="bg-gray-800/50 border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl h-full">
                  <CardHeader>
                    <div className="flex items-center space-x-3 mb-4">
                      <Badge variant="outline" className="text-xs">
                        {doc.category}
                      </Badge>
                    </div>
                    <CardTitle className="text-white text-lg group-hover:text-blue-400 transition-colors">
                      {doc.title}
                    </CardTitle>
                    <CardDescription className="text-gray-300 line-clamp-3">
                      {doc.excerpt}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center text-sm text-gray-400">
                      <Clock className="h-4 w-4 mr-2" />
                      {doc.readTime}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Need More Help?
          </h2>
            <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help.
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
