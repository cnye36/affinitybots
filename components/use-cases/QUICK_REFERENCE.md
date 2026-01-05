# Use Case Components - Quick Reference

## 1. WorkflowVisualizer

**Visual workflow steps with animated arrows**

```tsx
<WorkflowVisualizer
  steps={[
    { type: "trigger", label: "Form Submit", description: "User action" },
    { type: "agent", label: "Processor", description: "AI processes data" },
    { type: "output", label: "CRM Updated", description: "Result saved" }
  ]}
/>
```

**Props:**
- `steps`: Array of workflow steps
  - `type`: "trigger" | "agent" | "output"
  - `label`: Step name
  - `description`: Step description
  - `icon?`: Optional custom icon

**Colors:**
- Trigger: Blue gradient
- Agent: Purple gradient
- Output: Green gradient

---

## 2. AgentCard

**3D flip card with agent details**

```tsx
<AgentCard
  agent={{
    name: "Sales Bot",
    role: "Lead Qualifier",
    model: "GPT-4 Turbo",
    tools: [
      { name: "HubSpot", icon: "/integration-icons/hubspot-icon.png" },
      { name: "Gmail", icon: "/integration-icons/gmail-icon.png" }
    ],
    description: "Qualifies leads and updates CRM",
    color: "purple",
    avatar: "/avatars/sales.png" // Optional
  }}
  enableModal={true} // Optional: click to expand
/>
```

**Props:**
- `agent`: Agent configuration object
  - `name`: Agent name
  - `role`: Role/title
  - `model`: AI model name
  - `tools`: Array of tool objects (name, icon)
  - `description`: What the agent does
  - `color?`: "blue" | "purple" | "green" | "orange"
  - `avatar?`: Optional image URL
- `enableModal?`: Enable click-to-expand modal

**Interaction:**
- Hover: Flip to see details
- Click (if enableModal): Open full modal

---

## 3. IntegrationShowcase

**Grid of integration icons with tooltips**

```tsx
<IntegrationShowcase
  integrations={[
    {
      name: "Google Drive",
      iconPath: "/integration-icons/google-drive-icon.png",
      capabilities: ["File storage", "Search", "Sharing"],
      usedBy: ["Content Manager", "Data Analyst"]
    }
  ]}
  highlightOnClick={true}
/>
```

**Props:**
- `integrations`: Array of integration objects
  - `name`: Integration name
  - `iconPath`: Path to icon image
  - `capabilities`: Array of feature strings
  - `usedBy`: Array of agent names
- `highlightOnClick?`: Enable click-to-highlight

**Grid Columns:**
- Desktop (xl): 6 columns
- Large (lg): 5 columns
- Medium (md): 4 columns
- Small (sm): 3 columns
- Mobile: 2 columns

---

## 4. MetricCounter

**Scroll-triggered animated counter**

```tsx
// Single counter
<MetricCounter
  value={95}
  suffix="%"
  label="Accuracy Rate"
  description="AI decision accuracy"
  gradientFrom="from-blue-600"
  gradientTo="to-purple-600"
  duration={2000}
/>

// Multiple counters in grid
<MetricCounterGrid
  metrics={[
    { value: 95, suffix: "%", label: "Accuracy" },
    { value: 5, suffix: "x", label: "Faster" },
    { value: 10000, suffix: "+", label: "Tasks Done" }
  ]}
  columns={3}
/>
```

**Props (MetricCounter):**
- `value`: Number or string to display
- `suffix?`: Text after number (%, x, +, etc.)
- `prefix?`: Text before number ($, etc.)
- `label`: Main label text
- `description?`: Subtitle text
- `duration?`: Animation duration (ms, default 2000)
- `gradientFrom?`: Tailwind gradient start class
- `gradientTo?`: Tailwind gradient end class

**Props (MetricCounterGrid):**
- `metrics`: Array of metric objects
- `columns?`: 2 | 3 | 4 (default 3)

**Animation:**
- Triggers when scrolled into view
- Count-up with easing function
- Numbers formatted with commas

---

## 5. StepByStepFlow

**Interactive vertical stepper**

```tsx
<StepByStepFlow
  steps={[
    {
      number: 1,
      title: "Data Collection",
      description: "Gather information",
      details: "Agent pulls data from APIs and files...",
      icon: <Database className="w-5 h-5" />
    },
    {
      number: 2,
      title: "AI Processing",
      description: "Analyze and transform",
      details: "GPT-4 processes and extracts insights...",
      icon: <Cpu className="w-5 h-5" />
    }
  ]}
  defaultExpanded={0} // Optional: expand first step
/>
```

**Props:**
- `steps`: Array of step objects
  - `number`: Step number (1, 2, 3...)
  - `title`: Step title
  - `description`: Short description
  - `details?`: Expandable long description
  - `icon?`: Optional icon component
- `defaultExpanded?`: Index of step to expand initially

**Interaction:**
- Click step to expand/collapse details
- Desktop: Vertical with progress line
- Mobile: Accordion layout

**Colors:**
- Step 1: Blue
- Middle steps: Purple
- Last step: Green

---

## Common Patterns

### Full Use Case Page Example

```tsx
import {
  WorkflowVisualizer,
  AgentCard,
  IntegrationShowcase,
  MetricCounterGrid,
  StepByStepFlow
} from "@/components/use-cases"

export default function UseCasePage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      {/* Hero */}
      <section className="text-center">
        <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          Your Use Case Title
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Subtitle description
        </p>
      </section>

      {/* Workflow */}
      <section>
        <h2 className="text-2xl font-semibold mb-6 text-center">How It Works</h2>
        <WorkflowVisualizer steps={[...]} />
      </section>

      {/* Metrics */}
      <section>
        <MetricCounterGrid metrics={[...]} />
      </section>

      {/* Agents */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Your AI Team</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <AgentCard agent={...} />
          <AgentCard agent={...} />
          <AgentCard agent={...} />
        </div>
      </section>

      {/* Integrations */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Connected Tools</h2>
        <IntegrationShowcase integrations={[...]} />
      </section>

      {/* Process */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Detailed Process</h2>
        <StepByStepFlow steps={[...]} />
      </section>
    </div>
  )
}
```

### Responsive Grid for AgentCards

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <AgentCard agent={agent1} />
  <AgentCard agent={agent2} />
  <AgentCard agent={agent3} />
</div>
```

### Color Coordination

Match colors across components for cohesive design:

```tsx
// Blue theme
<AgentCard agent={{ ...agent, color: "blue" }} />
<MetricCounter gradientFrom="from-blue-600" gradientTo="to-blue-400" />

// Purple theme (default)
<AgentCard agent={{ ...agent, color: "purple" }} />
<MetricCounter gradientFrom="from-purple-600" gradientTo="to-pink-600" />

// Green theme
<AgentCard agent={{ ...agent, color: "green" }} />
<MetricCounter gradientFrom="from-green-600" gradientTo="to-teal-600" />
```

---

## Icon Resources

### Lucide React Icons

```tsx
import {
  Database,
  Cpu,
  CheckCircle,
  Mail,
  Users,
  FileText,
  Zap,
  Play,
  Settings
} from "lucide-react"

<StepByStepFlow
  steps={[
    { icon: <Database className="w-5 h-5" />, ... },
    { icon: <Cpu className="w-5 h-5" />, ... }
  ]}
/>
```

### Integration Icons

Located in `/public/integration-icons/`:

- Google: drive, gmail, sheets, docs, slides, calendar, bigquery, maps
- Productivity: asana, linear, monday.com, atlassian, figma
- Data: snowflake, alphavantage, coinapi
- Business: hubspot, shopify, apify, ahrefs
- AI: anthropic, openai, google

Format: `"/integration-icons/[name]-icon.png"`

---

## Styling Tips

### Section Spacing

```tsx
<div className="space-y-16"> {/* Between major sections */}
  <section className="space-y-6"> {/* Within section */}
    ...
  </section>
</div>
```

### Centered Headings

```tsx
<h2 className="text-2xl md:text-3xl font-semibold mb-6 text-center">
  Section Title
</h2>
```

### Gradient Text

```tsx
<h1 className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
  Gradient Heading
</h1>
```

### Max Width Containers

```tsx
<div className="max-w-4xl mx-auto">
  <StepByStepFlow steps={...} />
</div>
```

---

## Keyboard Shortcuts

- **Tab**: Navigate between components
- **Enter/Space**: Activate buttons/steps
- **Escape**: Close modals

---

## Performance Tips

1. **Lazy Load Images**: Integration icons use `loading="lazy"`
2. **Scroll Optimization**: MetricCounter uses IntersectionObserver
3. **Animation Performance**: All animations use CSS transforms
4. **Minimize Re-renders**: Components use React.memo internally

---

## Troubleshooting

**Images not showing:**
- Check file exists in `/public/integration-icons/`
- Use absolute path: `/integration-icons/name.png`

**Animations not working:**
- Ensure framer-motion is installed
- Check browser supports CSS transforms

**Dark mode issues:**
- Components auto-adapt via Tailwind dark: variants
- Ensure dark mode is configured in your theme

**TypeScript errors:**
- Import types: `import type { AgentCardData } from "@/components/use-cases"`
- All components are fully typed

---

## Preview

Visit `/use-case-demo` to see all components in action!
