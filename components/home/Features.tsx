import React from "react";

const features = [
  {
    title: "Model Agnostic AI",
    description:
      "Choose from OpenAI, Anthropic, Google Gemini, and more. Switch models anytime for optimal performance",
  },
  {
    title: "Customizable AI Agents",
    description:
      "Design AI employees with unique personalities, skills, and capabilities",
  },
  {
    title: "Knowledge Integration",
    description: "Equip your agents with documents, websites, and custom data",
  },
  {
    title: "Multi-Platform Deployment",
    description:
      "Keep agents private or deploy them to your website and social media",
  },
];

export function Features() {
  return (
    <section id="features" className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-4">Features</h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
            Everything you need to build and deploy AI agents that work for your business
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="relative p-0.5 rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 hover:from-purple-600 hover:to-blue-500 transition-all duration-300"
            >
              <div className="relative bg-background rounded-lg p-4 sm:p-6 h-full">
                <h3 className="text-lg sm:text-xl font-semibold mb-2">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
