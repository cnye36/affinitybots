import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import { AnimatedIntegrationDemo } from "@/components/home/AnimatedIntegrationDemo";
import {
  SiGoogle,
  SiNotion,
  SiSlack,
  SiX,
  SiGithub,
  SiHubspot,
  SiSupabase,
} from "react-icons/si";

// Custom Exa logo component
const ExaLogo = () => (
  <svg viewBox="0 0 24 24" className="w-full h-full">
    <defs>
      <linearGradient id="exa-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6366f1" />
        <stop offset="100%" stopColor="#8b5cf6" />
      </linearGradient>
    </defs>
    <path
      d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      stroke="url(#exa-gradient)"
      strokeWidth="2"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const integrations = [
  { name: "Google", logo: <img src="/integration-icons/Google-logo.png" alt="Google" className="w-16 h-16 object-contain" /> },
  { name: "Notion", logo: <SiNotion className="text-gray-800 dark:text-white" /> },
  { name: "Slack", logo: <SiSlack className="text-purple-600" /> },
  { name: "X", logo: <SiX className="text-black dark:text-white" /> },
  { name: "GitHub", logo: <SiGithub className="text-gray-800 dark:text-white" /> },
  { name: "Hubspot", logo: <SiHubspot className="text-orange-500" /> },
  { name: "Supabase", logo: <SiSupabase className="text-green-500" /> },
  { name: "Exa", logo: <ExaLogo /> },
];

export function Integrations() {
  return (
    <section id="integrations" className="py-16 bg-muted/50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10 md:mb-16">
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold mb-3 md:mb-4">
            Connect to Anything
          </h2>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
            AffinityBots is built for flexibility. Choose from leading AI models and switch anytime for optimal performance. 
            Connect your agents to 70+ tools and services via <b>MCP servers</b>—from <b>Google</b> and <b>Slack</b> to <b>Supabase</b>, 
            <b>Redis</b>, and more. Never get locked into one provider or platform.
          </p>
          
          

          {/* Tools Section Header */}
          
        </div>
        <div className="mt-12">
          <AnimatedIntegrationDemo />
        </div>

        <div className="text-center mt-8 text-muted-foreground text-sm">
          
        </div>
      </div>
    </section>
  );
}
