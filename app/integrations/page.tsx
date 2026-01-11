import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { FeatureCTA } from "@/components/home/FeatureCTA"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MotionDiv } from "@/components/motion/MotionDiv"
import Image from "next/image"
import Link from "next/link"
import {
	Shield,
	CheckCircle,
	ArrowRight,
	Sparkles,
	Lock,
	Globe,
	Zap,
	Building2,
	Code,
	Database,
	Palette,
	TrendingUp,
	MessagesSquare,
	Share2,
} from "lucide-react"

export default function IntegrationsPage() {
	const featuredIntegrations = [
		{
			name: "Gmail",
			logo: "/integration-icons/gmail-icon.png",
			category: "Communication",
			description: "Send emails, manage inbox, create drafts with full Gmail integration",
			official: true,
		},
		{
			name: "Slack",
			logo: "/integration-icons/slack-icon.png",
			category: "Communication",
			description: "Post messages, manage channels, and automate team workflows",
			official: true,
		},
		{
			name: "GitHub",
			logo: "/integration-icons/github-mark.png",
			logoDark: "/integration-icons/github-mark-white.png",
			category: "Development",
			description: "Manage repos, issues, PRs, and automate development workflows",
			official: true,
		},
		{
			name: "HubSpot",
			logo: "/integration-icons/hubspot-icon.png",
			category: "CRM",
			description: "Access contacts, deals, and automate your sales pipeline",
			official: true,
		},
		{
			name: "Google Drive",
			logo: "/integration-icons/google-drive-icon.png",
			category: "Productivity",
			description: "Create, search, and manage files in your Drive",
			official: true,
		},
		{
			name: "Notion",
			logo: "/integration-icons/notion-logo-no-background.png",
			category: "Productivity",
			description: "Access pages, databases, and automate Notion workflows",
			official: true,
		},
	]

	const categories = [
		{
			icon: <MessagesSquare className="h-6 w-6" />,
			title: "Communication",
			count: "8+",
			examples: "Gmail, Slack, Discord, Telegram",
			color: "blue",
		},
		{
			icon: <Code className="h-6 w-6" />,
			title: "Development",
			count: "12+",
			examples: "GitHub, GitLab, Linear, Sentry",
			color: "purple",
		},
		{
			icon: <Building2 className="h-6 w-6" />,
			title: "CRM & Sales",
			count: "6+",
			examples: "HubSpot, Salesforce, Pipedrive",
			color: "green",
		},
		{
			icon: <Palette className="h-6 w-6" />,
			title: "Design",
			count: "5+",
			examples: "Figma, Canva, Adobe Creative Cloud",
			color: "pink",
		},
		{
			icon: <Database className="h-6 w-6" />,
			title: "Data & Analytics",
			count: "10+",
			examples: "PostgreSQL, MongoDB, Snowflake",
			color: "cyan",
		},
		{
			icon: <Share2 className="h-6 w-6" />,
			title: "Productivity",
			count: "15+",
			examples: "Google Workspace, Notion, Asana",
			color: "orange",
		},
	]

	const getColorClasses = (color: string) => {
		const colors: Record<string, { bg: string; border: string; text: string; glow: string }> = {
			blue: {
				bg: "from-blue-500/10 to-blue-600/5",
				border: "border-blue-500/20 hover:border-blue-500/40",
				text: "text-blue-500",
				glow: "hover:shadow-blue-500/20",
			},
			purple: {
				bg: "from-purple-500/10 to-purple-600/5",
				border: "border-purple-500/20 hover:border-purple-500/40",
				text: "text-purple-500",
				glow: "hover:shadow-purple-500/20",
			},
			green: {
				bg: "from-green-500/10 to-green-600/5",
				border: "border-green-500/20 hover:border-green-500/40",
				text: "text-green-500",
				glow: "hover:shadow-green-500/20",
			},
			pink: {
				bg: "from-pink-500/10 to-pink-600/5",
				border: "border-pink-500/20 hover:border-pink-500/40",
				text: "text-pink-500",
				glow: "hover:shadow-pink-500/20",
			},
			cyan: {
				bg: "from-cyan-500/10 to-cyan-600/5",
				border: "border-cyan-500/20 hover:border-cyan-500/40",
				text: "text-cyan-500",
				glow: "hover:shadow-cyan-500/20",
			},
			orange: {
				bg: "from-orange-500/10 to-orange-600/5",
				border: "border-orange-500/20 hover:border-orange-500/40",
				text: "text-orange-500",
				glow: "hover:shadow-orange-500/20",
			},
		}
		return colors[color] || colors.blue
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />

			{/* Hero Section */}
			<section className="pt-32 pb-16 px-4">
				<div className="container mx-auto">
					<div className="max-w-4xl mx-auto text-center">
						<MotionDiv
							initial={{ opacity: 0, y: -20 }}
							animate={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8 }}
						>
							<Badge className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
								<Shield className="h-4 w-4 mr-2" />
								50+ Secure Integrations
							</Badge>
							<h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-500 to-purple-600 bg-clip-text text-transparent">
								Connect to Your Favorite Tools
							</h1>
							<p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-3xl mx-auto">
								All integrations are secure MCP (Model Context Protocol) servers - most built by official
								providers, the rest built and audited by our team. No community servers, guaranteed security.
							</p>
							<div className="flex flex-col sm:flex-row gap-4 justify-center">
								<Link href="/pricing">
									<Button
										size="sm"
										className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/30"
									>
										Get Started
										<ArrowRight className="ml-2 h-4 w-4" />
									</Button>
								</Link>
								<Link href="/integrations/all">
									<Button
										size="sm"
										variant="outline"
										className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
									>
										Browse Integrations
									</Button>
								</Link>
							</div>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Security Badges */}
			<section className="py-12 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-blue-500/20 transition-all duration-300 h-full text-center">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-500/10 text-blue-500 mb-4 mx-auto">
										<Lock className="h-6 w-6" />
									</div>
									<CardTitle className="text-lg">OAuth Secured</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										All integrations use OAuth 2.0 authentication for secure, token-based access
									</p>
								</CardContent>
							</Card>
						</MotionDiv>

						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.1 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-purple-500/20 transition-all duration-300 h-full text-center">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-purple-500/10 text-purple-500 mb-4 mx-auto">
										<Shield className="h-6 w-6" />
									</div>
									<CardTitle className="text-lg">Official Providers</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										50+ servers built and maintained directly by service providers
									</p>
								</CardContent>
							</Card>
						</MotionDiv>

						<MotionDiv
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.5, delay: 0.2 }}
							viewport={{ once: true }}
						>
							<Card className="bg-card border-border hover:border-green-500/20 transition-all duration-300 h-full text-center">
								<CardHeader>
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 text-green-500 mb-4 mx-auto">
										<CheckCircle className="h-6 w-6" />
									</div>
									<CardTitle className="text-lg">Security Audited</CardTitle>
								</CardHeader>
								<CardContent>
									<p className="text-sm text-muted-foreground">
										Custom servers built by us are thoroughly security-audited and certified
									</p>
								</CardContent>
							</Card>
						</MotionDiv>
					</div>
				</div>
			</section>

			{/* Featured Integrations */}
			<section id="integrations" className="py-16 px-4">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Featured Integrations
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Connect to the most popular tools and services with one click
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
						{featuredIntegrations.map((integration, index) => (
							<MotionDiv
								key={index}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: index * 0.1 }}
								viewport={{ once: true }}
							>
								<Card className="bg-card border-border hover:border-primary/20 transition-all duration-300 hover:shadow-lg h-full">
									<CardHeader>
										<div className="flex items-center justify-between mb-4">
											<div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-2 border border-border">
												<Image
													src={integration.logo}
													alt={integration.name}
													fill
													className={`object-contain p-1 ${integration.logoDark ? 'dark:hidden' : ''}`}
												/>
												{integration.logoDark && (
													<Image
														src={integration.logoDark}
														alt={integration.name}
														fill
														className="object-contain p-1 hidden dark:block"
													/>
												)}
											</div>
											{integration.official && (
												<Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">
													Official
												</Badge>
											)}
										</div>
										<CardTitle className="text-lg">{integration.name}</CardTitle>
										<Badge variant="outline" className="w-fit text-xs">
											{integration.category}
										</Badge>
									</CardHeader>
									<CardContent>
										<p className="text-sm text-muted-foreground">{integration.description}</p>
									</CardContent>
								</Card>
							</MotionDiv>
						))}
					</div>

					<div className="text-center mt-12">
						<Link href="/integrations/all">
							<Button variant="outline" className="rounded-full">
								Browse All 50+ Integrations
								<ArrowRight className="ml-2 h-4 w-4" />
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Categories */}
			<section className="py-16 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="text-center mb-12">
						<h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
							Integration Categories
						</h2>
						<p className="text-xl text-muted-foreground max-w-2xl mx-auto">
							Integrations organized by use case and industry
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
						{categories.map((category, index) => {
							const colors = getColorClasses(category.color)
							return (
								<MotionDiv
									key={index}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									transition={{ duration: 0.5, delay: index * 0.1 }}
									viewport={{ once: true }}
								>
									<Card className={`bg-gradient-to-br ${colors.bg} backdrop-blur-sm border-2 ${colors.border} transition-all duration-300 hover:shadow-lg ${colors.glow} h-full`}>
										<CardHeader>
											<div className={`${colors.text} mb-2`}>{category.icon}</div>
											<CardTitle className="text-lg flex items-center justify-between">
												{category.title}
												<Badge className={`${colors.text} bg-transparent border ${colors.border}`}>
													{category.count}
												</Badge>
											</CardTitle>
										</CardHeader>
										<CardContent>
											<p className="text-sm text-muted-foreground">{category.examples}</p>
										</CardContent>
									</Card>
								</MotionDiv>
							)
						})}
					</div>
				</div>
			</section>

			{/* Custom HTTP Servers */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="max-w-4xl mx-auto">
						<Card className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border-primary/20">
							<CardHeader>
								<div className="flex items-center gap-3 mb-2">
									<div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10">
										<Globe className="h-6 w-6 text-primary" />
									</div>
									<div>
										<CardTitle className="text-2xl">Need a Custom Integration?</CardTitle>
										<CardDescription className="text-base">
											Add any secure HTTP MCP server to your workspace
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent className="space-y-4">
								<p className="text-foreground">
									While we don't include community-built servers in our marketplace, you can add any secure
									HTTP-based MCP server directly to your workspace. Perfect for:
								</p>
								<ul className="space-y-2">
									<li className="flex items-start">
										<CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">Internal company tools and APIs</span>
									</li>
									<li className="flex items-start">
										<CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">Custom-built MCP servers for your team</span>
									</li>
									<li className="flex items-start">
										<CheckCircle className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
										<span className="text-muted-foreground">
											Third-party servers you trust and have vetted
										</span>
									</li>
								</ul>
								<div className="pt-4">
									<Link href="/docs">
										<Button variant="outline" className="rounded-full">
											Learn How to Add Custom Servers
											<ArrowRight className="ml-2 h-4 w-4" />
										</Button>
									</Link>
								</div>
							</CardContent>
						</Card>
					</div>
				</div>
			</section>

			<FeatureCTA
				title="Ready to Connect Your Tools?"
				description="Start automating with secure, official integrations today"
			/>

			<Footer />
		</div>
	)
}
