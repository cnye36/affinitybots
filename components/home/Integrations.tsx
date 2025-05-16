import React from "react";
import { MotionDiv } from "@/components/motion/MotionDiv";
import {
  SiGoogle,
  SiNotion,
  SiSlack,
  SiX,
  SiGithub,
  SiSalesforce,
  SiZapier,
  SiAsana,
  SiWhatsapp,
  SiHubspot,
} from "react-icons/si";

const integrations = [
  { name: "Google", logo: <SiGoogle /> },
  { name: "Notion", logo: <SiNotion /> },
  { name: "Slack", logo: <SiSlack /> },
  { name: "X", logo: <SiX /> },
  { name: "WhatsApp", logo: <SiWhatsapp /> },
  { name: "GitHub", logo: <SiGithub /> },
  { name: "Salesforce", logo: <SiSalesforce /> },
  { name: "Zapier", logo: <SiZapier /> },
  { name: "Hubspot", logo: <SiHubspot /> },
  { name: "Asana", logo: <SiAsana /> },
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
            tools. From <b>Google</b> to <b>Slack</b>, <b>Notion</b>, and more,
            AgentHub (beta) lets you automate workflows with the platforms you
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-6 md:gap-10 items-center justify-center">
            {integrations.map((integration) => (
              <div
                key={integration.name}
                className="flex flex-col items-center"
              >
                <div className="relative w-16 h-16 md:w-20 md:h-20 mb-2 flex items-center justify-center text-4xl md:text-5xl text-primary">
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
