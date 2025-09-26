import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
      name: "Early Beta",
      price: "Free",
      description: "Full access to all features during our early beta phase",
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      popular: true,
      features: [
        "Unlimited AI agents",
        "Unlimited interactions",
        "All templates and features",
        "Priority support",
        "All integrations",
        "Advanced analytics",
        "Full API access",
        "Custom branding",
        "Team collaboration",
        "Direct feedback to our team"
      ],
      limitations: [],
      cta: "Join Early Beta",
      ctaLink: "/early-access"
    },
    {
      name: "Future Professional",
      price: "TBD",
      description: "Coming after beta - for growing businesses and teams",
      icon: <Star className="h-8 w-8 text-purple-500" />,
      popular: false,
      features: [
        "Up to 25 AI agents",
        "10,000 interactions/month",
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
      name: "Future Enterprise",
      price: "TBD",
      description: "Coming after beta - for large organizations",
      icon: <Crown className="h-8 w-8 text-yellow-500" />,
      popular: false,
      features: [
        "Unlimited AI agents",
        "Unlimited interactions",
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
      question: "Can I change plans anytime?",
      answer: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges."
    },
    {
      question: "What happens if I exceed my interaction limit?",
      answer: "We'll notify you when you're approaching your limit. You can either upgrade your plan or purchase additional interactions as needed."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee for all paid plans. If you're not satisfied, we'll refund your payment in full."
    },
    {
      question: "Is there a free trial?",
      answer: "Yes! All paid plans come with a 14-day free trial. No credit card required to get started."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and for Enterprise customers, we can arrange invoicing and bank transfers."
    },
    {
      question: "Do you offer educational discounts?",
      answer: "Yes! We offer 50% off for students and educators. Contact us with your educational credentials to get started."
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
            We're in early beta and it's completely free for everyone! 
            Get full access to all features and help shape the future of AI automation.
          </p>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl ${
                  plan.popular ? 'ring-2 ring-primary scale-105' : ''
                }`}
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
                    <span className="text-4xl font-bold text-card-foreground">{plan.price}</span>
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
          
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {faqs.map((faq, index) => (
                <Card key={index} className="bg-card border-border">
                  <CardHeader>
                    <CardTitle className="text-card-foreground text-lg">{faq.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-muted-foreground">
                      {faq.answer}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </div>
  );
}
