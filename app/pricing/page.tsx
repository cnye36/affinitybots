import { Header } from "@/components/home/Header";
import { CTA } from "@/components/home/CTA";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { CheckoutButton } from "@/components/pricing/CheckoutButton";
import { 
  Check, 
  Star, 
  Zap, 
  ArrowRight,
  Sparkles,
  Crown
} from "lucide-react";
import Link from "next/link";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$19.99",
      period: "/month",
      description: "Perfect for individuals and small teams getting started",
      icon: <Zap className="h-8 w-8 text-blue-500" />,
      popular: false,
      features: [
        "Up to 10 AI agents",
        "3 active workflows*",
        "5,000 AI credits per month",
        "Unlimited integrations",
        "Basic templates",
        "Email support",
        "Standard integrations",
        "Basic analytics",
        "API access"
      ],
      limitations: [],
      cta: "Start Free Trial",
      ctaLink: "#",
      planId: "starter"
    },
    {
      name: "Pro",
      price: "$39.99",
      period: "/month",
      description: "For growing businesses and power users",
      icon: <Star className="h-8 w-8 text-purple-500" />,
      popular: true,
      features: [
        "Up to 50 AI agents",
        "25 active workflows*",
        "25,000 AI credits per month",
        "Unlimited integrations",
        "Advanced templates",
        "Priority support",
        "All integrations",
        "Advanced analytics",
        "API access",
        "Custom branding",
        "Team collaboration"
      ],
      limitations: [],
      cta: "Start Free Trial",
      ctaLink: "#",
      planId: "pro"
    },
    {
      name: "Enterprise",
      price: "Custom",
      description: "For large organizations with custom needs",
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
      limitations: [],
      cta: "Contact Sales",
      ctaLink: "/contact",
      planId: "enterprise"
    }
  ];


  const faqs = [
    {
      question: "What is included in the free trial?",
      answer: "During your 14-day free trial, you get access to test the platform with limited credits. This includes up to 3 agents, 1 active workflow, and 3 integrations. A payment method is required to start your trial, but you won't be charged until after the trial ends."
    },
    {
      question: "What happens after my trial ends?",
      answer: "After your 14-day trial ends, you'll automatically be charged for the plan you selected. If you chose Starter, you'll be charged $19.99/month and your limits will be set to Starter (10 agents, 3 workflows, 5,000 credits/month). If you chose Pro, you'll be charged $39.99/month and keep Pro limits (50 agents, unlimited workflows, 25,000 credits/month). You can cancel anytime before the trial ends to avoid charges."
    },
    {
      question: "What are AI credits?",
      answer: "AI credits are used for each interaction with your agents. The number of credits used depends on the AI model and the length of the conversation. Credits reset monthly on the 1st of each month."
    },
    {
      question: "What happens when I reach my monthly credit limit?",
      answer: "When you reach 90% of your monthly credits, you'll receive a notification with the option to purchase additional credits. At 100%, your agents will be paused until you purchase more credits or wait for the next monthly reset. You can monitor your usage in the dashboard."
    },
    {
      question: "Can I upgrade or downgrade my plan?",
      answer: "Yes! You can upgrade or downgrade your plan at any time from your account settings. Changes take effect immediately, and we'll prorate any charges or credits."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards through Stripe. All payments are secure and encrypted. We don't store your payment information on our servers."
    },
    {
      question: "Is there a refund policy?",
      answer: "Yes, we offer a 30-day money-back guarantee. If you're not satisfied with your subscription, contact us within 30 days of your first payment for a full refund."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto text-center">
          
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
            Choose Your Plan
            <br />
            <span className="text-foreground">Start Your 14-Day Free Trial</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
            Try any plan free for 14 days with full Pro access. 
            Payment method required - you'll be charged automatically after your trial ends.
            Cancel anytime during your trial without being charged.
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
                className={`relative bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-xl flex flex-col h-full ${
                  plan.popular ? 'ring-2 ring-primary lg:scale-105' : ''
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
                    <span className="text-4xl font-bold text-card-foreground">
                      {plan.price}
                    </span>
                    {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    {plan.planId !== "enterprise" && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          14-day free trial
                        </Badge>
                      </div>
                    )}
                  </div>
                  <CardDescription className="text-muted-foreground text-base">
                    {plan.description}
                  </CardDescription>
                </CardHeader>
                
                <CardContent className="flex flex-col flex-1 space-y-6">
                  <div className="flex-1">
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
                  
                  <div className="mt-auto pt-4">
                    {plan.planId === "enterprise" ? (
                      <Link href={plan.ctaLink} className="block">
                        <Button 
                          className="w-full bg-blue-600 hover:bg-blue-700"
                        >
                          {plan.cta}
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </Link>
                    ) : (
                      <CheckoutButton 
                        planId={plan.planId as "starter" | "pro"}
                        cta={plan.cta}
                        popular={plan.popular}
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6 max-w-2xl mx-auto">
            *Active workflows are running or deployed. Unlimited workflow drafts are allowed on all plans.
          </p>
        </div>
      </section>

      {/* Feature Comparison Table */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Compare Plans
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your needs
            </p>
          </div>

          <div className="max-w-6xl mx-auto">
            {/* Desktop Table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b-2 border-border">
                    <th className="text-left py-4 px-6 text-lg font-semibold text-foreground">Feature</th>
                    <th className="text-center py-4 px-6 text-lg font-semibold text-foreground">Starter</th>
                    <th className="text-center py-4 px-6 text-lg font-semibold text-foreground bg-primary/5">
                      <div className="flex flex-col items-center">
                        <span>Pro</span>
                        <Badge className="mt-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs px-2 py-0">
                          Most Popular
                        </Badge>
                      </div>
                    </th>
                    <th className="text-center py-4 px-6 text-lg font-semibold text-foreground">Enterprise</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-border">
                    <td colSpan={4} className="py-3 px-6 text-sm font-semibold text-muted-foreground bg-muted/50">
                      CORE FEATURES
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">AI Agents</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">Up to 10</td>
                    <td className="py-4 px-6 text-center text-foreground bg-primary/5">Up to 50</td>
                    <td className="py-4 px-6 text-center text-foreground">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Active Workflows</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">3</td>
                    <td className="py-4 px-6 text-center text-foreground bg-primary/5">25</td>
                    <td className="py-4 px-6 text-center text-foreground">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Monthly AI Credits</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">5,000</td>
                    <td className="py-4 px-6 text-center text-foreground bg-primary/5">25,000</td>
                    <td className="py-4 px-6 text-center text-foreground">Unlimited</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Draft Workflows</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Integrations</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>

                  <tr className="border-b border-border">
                    <td colSpan={4} className="py-3 px-6 text-sm font-semibold text-muted-foreground bg-muted/50">
                      FEATURES & SUPPORT
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Templates</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">Basic</td>
                    <td className="py-4 px-6 text-center text-foreground bg-primary/5">Advanced</td>
                    <td className="py-4 px-6 text-center text-foreground">Custom</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Email Support</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Priority Support</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Dedicated Support</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Analytics</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">Basic</td>
                    <td className="py-4 px-6 text-center text-foreground bg-primary/5">Advanced</td>
                    <td className="py-4 px-6 text-center text-foreground">Advanced</td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">API Access</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>

                  <tr className="border-b border-border">
                    <td colSpan={4} className="py-3 px-6 text-sm font-semibold text-muted-foreground bg-muted/50">
                      ADVANCED FEATURES
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Custom Branding</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Team Collaboration</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center bg-primary/5">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">White-label Solution</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Custom Model Training</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">SLA Guarantee</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">Advanced Security</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                  <tr className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="py-4 px-6 text-foreground">On-premise Deployment</td>
                    <td className="py-4 px-6 text-center text-muted-foreground">-</td>
                    <td className="py-4 px-6 text-center text-muted-foreground bg-primary/5">-</td>
                    <td className="py-4 px-6 text-center">
                      <Check className="h-5 w-5 text-green-500 inline" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mobile Accordion */}
            <div className="lg:hidden space-y-4">
              {["starter", "pro", "enterprise"].map((plan) => (
                <Card key={plan} className={`bg-card border-border ${plan === "pro" ? "ring-2 ring-primary" : ""}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="capitalize">{plan}</span>
                      {plan === "pro" && (
                        <Badge className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
                          Most Popular
                        </Badge>
                      )}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">AI Agents</span>
                      <span className="font-medium">
                        {plan === "starter" ? "Up to 10" : plan === "pro" ? "Up to 50" : "Unlimited"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Active Workflows</span>
                      <span className="font-medium">
                        {plan === "starter" ? "3" : plan === "pro" ? "25" : "Unlimited"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Monthly AI Credits</span>
                      <span className="font-medium">
                        {plan === "starter" ? "5,000" : plan === "pro" ? "25,000" : "Unlimited"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Custom Branding</span>
                      <span className="font-medium">
                        {plan === "starter" ? "-" : <Check className="h-4 w-4 text-green-500" />}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">Team Collaboration</span>
                      <span className="font-medium">
                        {plan === "starter" ? "-" : <Check className="h-4 w-4 text-green-500" />}
                      </span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border">
                      <span className="text-muted-foreground">White-label</span>
                      <span className="font-medium">
                        {plan === "enterprise" ? <Check className="h-4 w-4 text-green-500" /> : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between py-2">
                      <span className="text-muted-foreground">On-premise</span>
                      <span className="font-medium">
                        {plan === "enterprise" ? <Check className="h-4 w-4 text-green-500" /> : "-"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
