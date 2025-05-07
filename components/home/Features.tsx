import React from "react";

const features = [
  {
    title: "Customizable AI Agents",
    description:
      "Design AI employees with unique personalities and capabilities",
  },
  {
    title: "Knowledge Integration",
    description: "Equip your agents with documents, websites, and custom data",
  },
  {
    title: "Multi-Platform Deployment",
    description:
      "Deploy your AI agents to your website, social media, or use in our platform",
  },
];

export function Features() {
  return (
    <section className="grid md:grid-cols-3 gap-8">
      {features.map((feature, index) => (
        <div key={index} className="relative p-6 rounded-lg overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 blur-lg"></div>
          <div className="relative bg-background rounded-lg p-6 h-full">
            <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
            <p className="text-muted-foreground">{feature.description}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
