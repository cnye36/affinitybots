import {
  Search,
  Pencil,
  MessageSquare,
  BarChart,
  BriefcaseIcon,
  Calendar,
  Share2,
  LineChart,
  Lightbulb,
  Code,
  HeartPulse,
} from "lucide-react";

export const AGENT_TEMPLATES = [
  {
    id: "market-research-analyst",
    name: "Market Research Analyst",
    description:
      "Conducts market research, analyzes competitors, identifies trends, and provides actionable business insights",
    icon: Search,
    defaultModel: "gpt-4o",
    tools: ["web_search", "document_analysis", "data_extraction"],
    basePrompt:
      "I need an agent that can help me with my marketing research and synthesize industry trends, competitor moves, and market size; deliver concise insights with sources and prioritized recommendations.",
    keywords: [
      "market research",
      "competitor analysis",
      "trends",
      "insights",
      "market data",
      "industry analysis",
    ],
  },
  {
    id: "content-strategist",
    name: "Content Strategist",
    description:
      "Develops content strategies, creates editorial calendars, and produces high-quality content across multiple channels",
    icon: Pencil,
    defaultModel: "gpt-4o",
    tools: ["text_generation", "image_analysis", "content_optimization"],
    basePrompt:
      "I need an agent that can help me with my content strategy and turn goals and audience data into channel plans, editorial calendars, and briefs; propose topics and CTAs with measurable KPIs.",
    keywords: [
      "content strategy",
      "editorial",
      "content planning",
      "SEO",
      "content marketing",
    ],
  },
  {
    id: "customer-service-rep",
    name: "Customer Service Representative",
    description:
      "Provides exceptional customer support, handles inquiries, and resolves customer issues professionally",
    icon: MessageSquare,
    defaultModel: "gpt-4o",
    tools: ["conversation", "knowledge_base", "task_management"],
    basePrompt:
      "I need an agent that can help me with my customer support and resolve inquiries empathetically, ask clarifying questions, reference knowledge when needed, and escalate edge cases with clear summaries.",
    keywords: [
      "customer service",
      "support",
      "customer care",
      "problem resolution",
      "customer satisfaction",
    ],
  },
  {
    id: "business-analyst",
    name: "Business Analyst",
    description:
      "Analyzes business data, creates reports, and provides recommendations for business optimization",
    icon: BarChart,
    defaultModel: "gpt-4o",
    tools: ["data_analysis", "visualization", "reporting"],
    basePrompt:
      "I need an agent that can help me with my business analysis and analyze datasets and processes, surface key metrics and anomalies, and recommend improvements with impact estimates.",
    keywords: [
      "business analysis",
      "reporting",
      "optimization",
      "business intelligence",
      "process improvement",
    ],
  },
  
  {
    id: "virtual-assistant",
    name: "Virtual Assistant",
    description:
      "Manages schedules, handles email correspondence, and assists with administrative tasks",
    icon: Calendar,
    defaultModel: "gpt-4o",
    tools: ["task_management", "email_handling", "scheduling"],
    basePrompt:
      "I need an agent that can help me with my executive virtual assistant and manage schedules, email drafts, meeting notes, and task follow‑ups; always confirm details and propose next actions.",
    keywords: [
      "administrative",
      "scheduling",
      "email management",
      "organization",
      "task management",
    ],
  },
  {
    id: "social-media-manager",
    name: "Social Media Manager",
    description:
      "Creates and manages social media content, engages with audience, and develops social media strategies",
    icon: Share2,
    defaultModel: "gpt-4o",
    tools: ["content_creation", "social_media_tools", "analytics"],
    basePrompt:
      "I need an agent that can help me with my social media manager and create platform‑specific posts, hooks, and calendars; suggest visuals and measure engagement with clear experiments.",
    keywords: [
      "social media",
      "content creation",
      "community management",
      "engagement",
      "social strategy",
    ],
  },
  {
    id: "financial-analyst",
    name: "Financial Analyst",
    description:
      "Analyzes financial data, creates financial models, and provides investment recommendations",
    icon: LineChart,
    defaultModel: "gpt-4o",
    tools: ["financial_analysis", "data_modeling", "reporting"],
    basePrompt:
      "I need an agent that can help me with my financial analysis and build concise variance analyses and models, highlight drivers, and produce investor‑ready summaries with assumptions.",
    keywords: [
      "financial analysis",
      "investment",
      "modeling",
      "finance",
      "forecasting",
    ],
  },
  
 
];
