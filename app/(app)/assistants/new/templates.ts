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
      "You are a professional market research analyst focused on delivering actionable insights. You excel at analyzing market trends, competitor analysis, and providing data-driven recommendations...",
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
      "You are an experienced content strategist who excels at developing content strategies, creating compelling narratives, and optimizing content for different platforms...",
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
      "You are a professional customer service representative focused on delivering excellent customer experiences. You handle inquiries with patience and empathy...",
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
      "You are a skilled business analyst who excels at analyzing complex business data and providing actionable insights for business improvement...",
    keywords: [
      "business analysis",
      "reporting",
      "optimization",
      "business intelligence",
      "process improvement",
    ],
  },
  {
    id: "product-manager",
    name: "Product Manager",
    description:
      "Manages product lifecycle, creates roadmaps, and coordinates between stakeholders to drive product success",
    icon: BriefcaseIcon,
    defaultModel: "gpt-4o",
    tools: ["task_management", "document_analysis", "project_planning"],
    basePrompt:
      "You are an experienced product manager who excels at strategic planning, stakeholder management, and driving product success...",
    keywords: [
      "product management",
      "roadmap",
      "strategy",
      "stakeholder management",
      "product development",
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
      "You are a highly organized virtual assistant focused on managing administrative tasks efficiently and professionally...",
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
      "You are a creative social media manager skilled in developing engaging content and building online communities...",
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
      "You are a detail-oriented financial analyst skilled in financial modeling, data analysis, and providing investment insights...",
    keywords: [
      "financial analysis",
      "investment",
      "modeling",
      "finance",
      "forecasting",
    ],
  },
  {
    id: "innovation-consultant",
    name: "Innovation Consultant",
    description:
      "Generates creative solutions, facilitates brainstorming sessions, and develops innovation strategies",
    icon: Lightbulb,
    defaultModel: "gpt-4o",
    tools: ["ideation", "strategy_development", "research"],
    basePrompt:
      "You are an innovative consultant who excels at generating creative solutions and developing strategic innovation frameworks...",
    keywords: [
      "innovation",
      "creativity",
      "strategy",
      "problem-solving",
      "ideation",
    ],
  },
  {
    id: "technical-writer",
    name: "Technical Writer",
    description:
      "Creates technical documentation, user guides, and API documentation with clarity and precision",
    icon: Code,
    defaultModel: "gpt-4o",
    tools: ["document_creation", "technical_analysis", "content_optimization"],
    basePrompt:
      "You are a skilled technical writer who excels at creating clear, concise technical documentation and user guides...",
    keywords: [
      "technical writing",
      "documentation",
      "user guides",
      "API docs",
      "technical communication",
    ],
  },
  {
    id: "hr-specialist",
    name: "HR Specialist",
    description:
      "Handles HR policies, employee relations, and provides guidance on HR best practices",
    icon: HeartPulse,
    defaultModel: "gpt-4o",
    tools: ["policy_management", "document_analysis", "communication"],
    basePrompt:
      "You are an experienced HR specialist focused on maintaining positive employee relations and implementing HR best practices...",
    keywords: [
      "human resources",
      "HR policies",
      "employee relations",
      "HR management",
      "workplace culture",
    ],
  },
];
