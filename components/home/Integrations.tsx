import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
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
  { name: "Google", logo: <SiGoogle className="text-blue-500" /> },
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
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Instantly connect your agents to the world's most popular APIs and
            tools. From <b>Google</b> to <b>Slack</b>, <b>Supabase</b>, <b>Redis</b>, and more,
            AffinityBots (beta) lets you automate workflows with the platforms you
            already use. Powered by <b>MCP servers</b> for limitless
            extensibility and reliability.
          </p>
        </div>
        <MotionDiv
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
        >
          <div className="grid grid-cols-4 gap-6 md:gap-10 items-center justify-center">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-center"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-2 flex items-center justify-center text-4xl md:text-5xl">
                  {integration.logo}
                </div>
                <span className="text-sm md:text-base text-muted-foreground font-medium">
                  {integration.name}
                </span>
              </div>
            ))}
          </div>
        </MotionDiv>
        <div className="text-center mt-8 text-muted-foreground text-sm">
          <span>
            <b>Beta:</b> We're starting with the biggest names, but the
            possibilities are nearly limitless. Want a specific integration?{" "}
            <a href="/contact" className="underline hover:text-primary">
              Let us know
            </a>
            !
          </span>
        </div>
      </div>
    </section>
  );
}
