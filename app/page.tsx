import Link from 'next/link'
import { ThemeToggle } from '@/components/theme-toggle'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="container mx-auto px-4 py-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold">AgentHub By AI-Automated</h1>
        <div className="flex items-center space-x-4">
          <Link href="/signin">
            <Button variant="ghost">Sign In</Button>
          </Link>
          <Link href="/signup">
            <Button>Sign Up</Button>
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="container mx-auto px-4 py-16">
        <section className="text-center mb-16">
          <h2 className="text-4xl md:text-6xl font-extrabold mb-4">
            Build and Manage AI Agent Workflows
          </h2>
          <p className="text-xl md:text-2xl text-muted-foreground mb-8">
            Harness the power of AI to automate and optimize your processes
          </p>
          <Link href="/signup">
            <Button size="lg" className="text-lg px-8 py-6">
              Get Started
            </Button>
          </Link>
        </section>
        <section className="grid md:grid-cols-3 gap-8">
          {[
            { title: "Create Agents", description: "Design custom AI agents tailored to your needs" },
            { title: "Build Workflows", description: "Connect agents to create powerful automation flows" },
            { title: "Monitor & Optimize", description: "Track performance and continuously improve your AI workflows" }
          ].map((feature, index) => (
            <div key={index} className="relative p-6 rounded-lg overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-600 opacity-75 blur-lg"></div>
              <div className="relative bg-background rounded-lg p-6 h-full">
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </div>
            </div>
          ))}
        </section>
      </main>
    </div>
  )
}

