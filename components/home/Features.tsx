import React from "react";

const features = [
  {
    title: "Customizable AI Agents",
    description:
      "Design AI employees with unique personalities, skills, and capabilities",
  },
  {
    title: "Internal & External Agents",
    description:
      "Create agents for your own use or to interact with your customers",
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
    <section
      id="features"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8"
    >
      {features.map((feature, index) => (
        <div
          key={index}
          className="relative p-4 sm:p-6 rounded-lg overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 blur-lg"></div>
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
    </section>
  );
}
