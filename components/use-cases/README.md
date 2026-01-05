# Use Case Components

Five interactive, polished components for creating engaging use case pages. All components follow the site's blue-to-purple gradient theme with modern glass morphism effects.

## Components Overview

### 1. WorkflowVisualizer
Visual representation of workflow steps with animated data flow.

**Features:**
- Color-coded nodes (Trigger: blue, Agent: purple, Output: green)
- Animated arrows showing data flow
- Responsive (horizontal on desktop, vertical on mobile)
- Glass morphism card design
- Hover effects with glow

**Usage:**
```tsx
import { WorkflowVisualizer } from "@/components/use-cases"

<WorkflowVisualizer
  steps={[
    {
      type: "trigger",
      label: "Form Submitted",
      description: "User fills contact form on website"
    },
    {
      type: "agent",
      label: "Data Processor",
      description: "Extracts and validates customer information"
    },
    {
      type: "output",
      label: "CRM Updated",
      description: "Contact automatically added to HubSpot"
    }
  ]}
/>
```

---

### 2. AgentCard
Interactive 3D flip card for showcasing AI agents.

**Features:**
- 3D flip animation on hover
- Front: Agent name, role, avatar
- Back: Model, tools, description
- Optional click-to-expand modal
- Gradient border matching theme
- Dark/light mode compatible

**Usage:**
```tsx
import { AgentCard } from "@/components/use-cases"

<AgentCard
  agent={{
    name: "Sales Assistant",
    role: "Lead Qualification Specialist",
    model: "GPT-4 Turbo",
    tools: [
      { name: "HubSpot", icon: "/integration-icons/hubspot-icon.png" },
      { name: "Gmail", icon: "/integration-icons/gmail-icon.png" },
      { name: "Google Sheets", icon: "/integration-icons/google-sheets.png" }
    ],
    description: "Automatically qualifies leads, updates CRM records, and sends personalized follow-up emails based on lead behavior and profile data.",
    color: "purple",
    avatar: "/avatars/sales-agent.png" // Optional
  }}
  enableModal={true}
/>
```

**Color Options:**
- `blue` - Blue gradient theme
- `purple` - Purple/pink gradient (default)
- `green` - Green/teal gradient
- `orange` - Orange/amber gradient

---

### 3. IntegrationShowcase
Grid of integration icons with interactive tooltips.

**Features:**
- Responsive grid (6 cols desktop → 2 cols mobile)
- Hover tooltips showing capabilities
- Click to highlight which agents use integration
- Icon support from `/public/integration-icons/`
- Smooth animations and transitions

**Usage:**
```tsx
import { IntegrationShowcase } from "@/components/use-cases"

<IntegrationShowcase
  integrations={[
    {
      name: "Google Drive",
      iconPath: "/integration-icons/google-drive-icon.png",
      capabilities: ["File storage", "Document search", "Sharing"],
      usedBy: ["Research Assistant", "Content Manager", "Data Analyst"]
    },
    {
      name: "Gmail",
      iconPath: "/integration-icons/gmail-icon.png",
      capabilities: ["Email sending", "Inbox management", "Automation"],
      usedBy: ["Sales Assistant", "Customer Support"]
    },
    {
      name: "HubSpot",
      iconPath: "/integration-icons/hubspot-icon.png",
      capabilities: ["CRM", "Contact management", "Deal tracking"],
      usedBy: ["Sales Assistant", "Marketing Automation"]
    }
  ]}
  highlightOnClick={true}
/>
```

---

### 4. MetricCounter
Animated number counter that triggers on scroll into view.

**Features:**
- Count-up animation with easing
- Supports percentages, multipliers, large numbers
- Gradient text effect
- Scroll-triggered animation
- Grid layout option for multiple metrics

**Usage:**
```tsx
import { MetricCounter, MetricCounterGrid } from "@/components/use-cases"

// Single Counter
<MetricCounter
  value={85}
  suffix="%"
  label="Task Accuracy"
  description="Average AI response accuracy across all agents"
  gradientFrom="from-blue-600"
  gradientTo="to-purple-600"
  duration={2000}
/>

// Multiple Counters in Grid
<MetricCounterGrid
  metrics={[
    {
      value: 95,
      suffix: "%",
      label: "Accuracy Rate",
      description: "AI decision accuracy"
    },
    {
      value: 5,
      suffix: "x",
      label: "Faster Processing",
      description: "Compared to manual work"
    },
    {
      value: 10000,
      suffix: "+",
      label: "Tasks Automated",
      description: "Total tasks completed"
    }
  ]}
  columns={3}
/>
```

---

### 5. StepByStepFlow
Interactive vertical stepper with expandable details.

**Features:**
- Numbered steps with progress line
- Click to expand/collapse details
- Gradient progress line (blue → purple → green)
- Responsive (vertical on desktop, accordion on mobile)
- Custom icons per step
- Keyboard accessible

**Usage:**
```tsx
import { StepByStepFlow } from "@/components/use-cases"
import { Database, Cpu, CheckCircle } from "lucide-react"

<StepByStepFlow
  steps={[
    {
      number: 1,
      title: "Data Collection",
      description: "Gather information from multiple sources",
      details: "Agent automatically pulls data from APIs, databases, and uploaded files. Supports JSON, CSV, and direct integrations.",
      icon: <Database className="w-5 h-5" />
    },
    {
      number: 2,
      title: "AI Processing",
      description: "Analyze and transform data using AI models",
      details: "GPT-4 and Claude models process information, extract key insights, and apply business logic to make intelligent decisions.",
      icon: <Cpu className="w-5 h-5" />
    },
    {
      number: 3,
      title: "Action Execution",
      description: "Complete tasks and update systems",
      details: "Updates CRM records, sends notifications, generates reports, and triggers downstream workflows automatically.",
      icon: <CheckCircle className="w-5 h-5" />
    }
  ]}
  defaultExpanded={0}
/>
```

---

## Design System

All components follow these design principles:

**Colors:**
- Blue: `#3B82F6` (Trigger, Primary)
- Purple: `#9333EA` (Agent, Accent)
- Green: `#10B981` (Output, Success)
- Gradients: Blue-to-purple throughout

**Effects:**
- Glass morphism: `bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm`
- Borders: 2px solid with opacity
- Shadows: Color-matched glow on hover
- Transitions: 300ms duration

**Typography:**
- Labels: `text-xs` uppercase with tracking
- Titles: `text-lg` to `text-2xl` semibold
- Descriptions: `text-sm` muted foreground

**Spacing:**
- Grid gaps: 4-6 (16-24px)
- Card padding: p-4 to p-6
- Section margins: mb-8 to mb-16

**Responsive Breakpoints:**
- Mobile: < 768px (md)
- Tablet: 768px - 1024px (lg)
- Desktop: > 1024px (xl)

---

## Complete Example Page

```tsx
import {
  WorkflowVisualizer,
  AgentCard,
  IntegrationShowcase,
  MetricCounterGrid,
  StepByStepFlow
} from "@/components/use-cases"

export default function CustomerSupportUseCasePage() {
  return (
    <div className="container mx-auto px-4 py-12">
      {/* Hero Section */}
      <section className="text-center mb-16">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Automated Customer Support
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
          Handle customer inquiries 24/7 with AI agents that understand context and resolve issues instantly.
        </p>
      </section>

      {/* Workflow Visualization */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
        <WorkflowVisualizer
          steps={[
            { type: "trigger", label: "Customer Inquiry", description: "Email, chat, or ticket" },
            { type: "agent", label: "Support Agent", description: "Analyzes and responds" },
            { type: "output", label: "Issue Resolved", description: "Customer notified" }
          ]}
        />
      </section>

      {/* Metrics */}
      <section className="mb-16">
        <MetricCounterGrid
          metrics={[
            { value: 90, suffix: "%", label: "Issue Resolution Rate" },
            { value: 3, suffix: "x", label: "Faster Response Time" },
            { value: 5000, suffix: "+", label: "Tickets Resolved" }
          ]}
          columns={3}
        />
      </section>

      {/* Agent Showcase */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Meet Your Support Team</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AgentCard
            agent={{
              name: "Tier 1 Support",
              role: "Initial Response Specialist",
              model: "GPT-4 Turbo",
              tools: [
                { name: "Zendesk", icon: "/integration-icons/zendesk.png" },
                { name: "Slack", icon: "/integration-icons/slack.png" }
              ],
              description: "Handles initial inquiries and triages complex issues",
              color: "blue"
            }}
            enableModal={true}
          />
          {/* More agents... */}
        </div>
      </section>

      {/* Integrations */}
      <section className="mb-16">
        <h2 className="text-2xl font-semibold mb-6">Integrated Tools</h2>
        <IntegrationShowcase
          integrations={[
            {
              name: "Zendesk",
              iconPath: "/integration-icons/zendesk.png",
              capabilities: ["Ticket management", "Customer history"],
              usedBy: ["Tier 1 Support", "Escalation Agent"]
            }
            // More integrations...
          ]}
        />
      </section>

      {/* Process Flow */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Step-by-Step Process</h2>
        <StepByStepFlow
          steps={[
            {
              number: 1,
              title: "Receive Inquiry",
              description: "Customer submits question via email or chat",
              details: "Agent monitors all channels and immediately acknowledges receipt"
            },
            {
              number: 2,
              title: "Analyze Context",
              description: "Review customer history and issue details",
              details: "AI analyzes past interactions and searches knowledge base"
            },
            {
              number: 3,
              title: "Provide Solution",
              description: "Send personalized response with resolution",
              details: "Agent drafts clear response and updates ticket status"
            }
          ]}
        />
      </section>
    </div>
  )
}
```

---

## Accessibility

All components are built with accessibility in mind:

- Keyboard navigation support (Tab, Enter, Escape)
- ARIA labels for icon-only buttons
- Proper heading hierarchy
- Focus indicators
- Screen reader compatible
- Color contrast compliant (WCAG AA)
- Reduced motion support via `prefers-reduced-motion`

---

## Performance

Optimizations included:

- React.memo for expensive renders
- Framer Motion optimized animations
- Lazy loading for images
- CSS transforms for smooth animations
- IntersectionObserver for scroll triggers
- Debounced state updates

---

## Dark Mode

All components automatically adapt to dark mode using Tailwind's `dark:` variants. No additional configuration needed.
