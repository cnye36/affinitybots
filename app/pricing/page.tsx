import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  Check, 
  X, 
  Star, 
  Zap, 
  Shield, 
  Users, 
  ArrowRight,
  Sparkles,
  Crown,
  Rocket
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Professional",
      price: "$29.99",
      period: "/month",
      description: "Coming after beta - for growing businesses and teams",
      icon: <Star className="h-8 w-8 text-purple-500" />,
      popular: false,
      features: [
        "Up to 25 AI agents",
        "Unlimited active workflows",
        "10,000 AI credits per day",
        "Advanced templates",
        "Priority support",
        "All integrations",
        "Advanced analytics",
        "API access",
        "Custom branding",
        "Team collaboration"
      ],
      limitations: ["Coming after beta"],
      cta: "Get Notified",
      ctaLink: "/early-access"
    },
    {
      name: "Early Beta",
      price: "Free",
      description: "Limited access during our early beta phase",
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      popular: true,
      features: [
        "Up to 5 AI agents",
        "3 active workflows",
        "100 AI credits per day",
        "Basic templates",
        "Email support",
        "Standard integrations",
        "Basic analytics",
        "Community forum access"
      ],
      limitations: [
        "Limited agent count",
        "Workflow restrictions",
        "Daily credit limits"
      ],
      cta: "Join Early Beta",
      ctaLink: "/early-access"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "Coming after beta - for large organizations",
      icon: <Crown className="h-8 w-8 text-yellow-500" />,
      popular: false,
      features: [
        "Unlimited AI agents",
        "Unlimited workflows",
        "Unlimited AI credits",
        "Custom model training",
        "Dedicated support",
        "White-label solution",
        "Advanced security",
        "Custom integrations",
        "SLA guarantee",
        "On-premise deployment"
      ],
      limitations: ["Coming after beta"],
      cta: "Get Notified",
      ctaLink: "/early-access"
    }
  ];


  const faqs = [
    {
      question: "What are AI credits?",
      answer: "AI credits are used for each interaction with your agents. Simple text responses use 1 credit, while complex tasks with multiple steps may use 2-5 credits. You get 100 credits per day in the beta."
    },
    {
      question: "What happens when I reach my daily credit limit?",
      answer: "Your agents will pause until the next day when your credits reset. You can monitor your usage in the dashboard and plan your agent interactions accordingly."
    },
    {
      question: "Can I create more than 5 agents in the beta?",
      answer: "The beta is limited to 5 agents to help us manage server load and gather focused feedback. You can delete and recreate agents as needed to test different configurations."
    },
    {
      question: "What's the difference between active and inactive workflows?",
      answer: "Active workflows are currently running and processing tasks. Inactive workflows are saved but not executing. You can switch between your 3 active workflows as needed."
    },
    {
      question: "When will paid plans be available?",
      answer: "We expect to launch paid plans in Q4 2025. Beta users will get early access and special pricing when we transition from beta to paid plans."
    },
    {
      question: "How long will the beta last?",
      answer: "We're planning a 3-6 month beta period to gather feedback and refine the platform. We'll give all beta users at least 30 days notice before transitioning to paid plans."
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
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Early Beta
            <br />
            <span className="text-foreground">Free for Everyone</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            We're in early beta with limited free access! 
            Get started with 5 agents, 3 workflows, and 100 AI credits per day to help shape the future of AI automation.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-primary lg:scale-105' : ''
                } ${plan.name === "Professional" || plan.name === "Enterprise" ? 'opacity-75' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-4 py-1">
                      <Star className="h-4 w-4 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center pb-8">
                  <div className="flex justify-center mb-4">
                    {plan.icon}
                  </div>
                  <CardTitle className="text-2xl text-card-foreground mb-2">{plan.name}</CardTitle>
                  <div className="mb-4">
                    <span className={`text-4xl font-bold ${plan.name === "Professional" || plan.name === "Enterprise" ? "text-muted-foreground" : "text-card-foreground"}`}>
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                  </div>
                  <CardDescription className="text-muted-foreground text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <Link href={plan.ctaLink} className="block">
                    <Button 
                      className={`w-full ${
                        plan.popular 
                          ? 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700' 
                          : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      {plan.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                  
                  <div>
                    <h4 className="text-card-foreground font-semibold mb-3">What's included:</h4>
                    <ul className="space-y-2">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-muted-foreground">
                          <Check className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  {plan.limitations.length > 0 && (
                    <div>
                      <h4 className="text-card-foreground font-semibold mb-3">Limitations:</h4>
                      <ul className="space-y-2">
                        {plan.limitations.map((limitation, limitationIndex) => (
                          <li key={limitationIndex} className="flex items-center text-sm text-muted-foreground">
                            <X className="h-4 w-4 text-red-500 mr-2 flex-shrink-0" />
                            {limitation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>


      {/* FAQ Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our pricing and plans
            </p>
          </div>
          
          <div className="max-w-3xl mx-auto">
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                  <AccordionTrigger className="text-left text-lg font-semibold text-foreground hover:text-primary transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pt-4 pb-6">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}
