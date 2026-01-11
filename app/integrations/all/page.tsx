"use client"

import React, { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Header } from "@/components/home/Header"
import { Footer } from "@/components/home/Footer"
import { FeatureCTA } from "@/components/home/FeatureCTA"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { MotionDiv } from "@/components/motion/MotionDiv"
import { ArrowLeft, Search, Lock, Shield, CheckCircle } from "lucide-react"
import { OFFICIAL_MCP_SERVERS, ServerCategory } from "@/lib/mcp/officialMcpServers"
import { Input } from "@/components/ui/input"

export default function AllIntegrationsPage() {
	const [searchQuery, setSearchQuery] = useState("")
	const [selectedCategory, setSelectedCategory] = useState<ServerCategory | "all">("all")

	// Get unique categories
	const categories: (ServerCategory | "all")[] = ["all", ...Array.from(new Set(OFFICIAL_MCP_SERVERS.map(s => s.category)))]

	// Filter integrations
	const filteredIntegrations = OFFICIAL_MCP_SERVERS.filter(integration => {
		const matchesSearch = integration.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
			integration.description?.toLowerCase().includes(searchQuery.toLowerCase())
		const matchesCategory = selectedCategory === "all" || integration.category === selectedCategory
		return matchesSearch && matchesCategory
	})

	const getCategoryLabel = (category: ServerCategory | "all"): string => {
		if (category === "all") return "All"
		return category
			.split("-")
			.map(word => word.charAt(0).toUpperCase() + word.slice(1))
			.join(" ")
	}

	return (
		<div className="min-h-screen bg-background">
			<Header />

			{/* Back Button & Header */}
			<section className="py-12 px-4 border-b border-border">
				<div className="container mx-auto">
					<Link href="/integrations">
						<Button variant="ghost" className="mb-6">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Back to Integrations
						</Button>
					</Link>
					<div className="text-center max-w-4xl mx-auto">
						<h1 className="text-4xl md:text-5xl font-bold mb-4">
							All Integrations
						</h1>
						<p className="text-xl text-muted-foreground mb-8">
							Explore over 50 secure MCP server integrations from official providers
						</p>

						{/* Search Bar */}
						<div className="relative max-w-2xl mx-auto mb-8">
							<Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
							<Input
								type="text"
								placeholder="Search integrations..."
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								className="pl-12 h-12 text-base"
							/>
						</div>

						{/* Category Filter */}
						<div className="flex flex-wrap gap-2 justify-center">
							{categories.map((category) => (
								<Button
									key={category}
									variant={selectedCategory === category ? "default" : "outline"}
									size="sm"
									onClick={() => setSelectedCategory(category)}
									className="rounded-full"
								>
									{getCategoryLabel(category)}
								</Button>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* Security Notice */}
			<section className="py-8 px-4 bg-muted/30">
				<div className="container mx-auto">
					<div className="flex flex-wrap gap-8 justify-center items-center max-w-4xl mx-auto">
						<div className="flex items-center gap-2 text-sm">
							<div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
								<Lock className="h-4 w-4 text-blue-500" />
							</div>
							<span className="text-muted-foreground">OAuth Secured</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center">
								<Shield className="h-4 w-4 text-purple-500" />
							</div>
							<span className="text-muted-foreground">Official Providers</span>
						</div>
						<div className="flex items-center gap-2 text-sm">
							<div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
								<CheckCircle className="h-4 w-4 text-green-500" />
							</div>
							<span className="text-muted-foreground">Vetted & Secure</span>
						</div>
					</div>
				</div>
			</section>

			{/* Integrations Grid */}
			<section className="py-16 px-4">
				<div className="container mx-auto">
					<div className="mb-6">
						<p className="text-sm text-muted-foreground">
							Showing {filteredIntegrations.length} of {OFFICIAL_MCP_SERVERS.length} integrations
						</p>
					</div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
						{filteredIntegrations.map((integration, index) => {
							const logoUrl = integration.logoUrlLight || integration.logoUrl
							const logoDark = integration.logoUrlDark

							return (
								<MotionDiv
									key={integration.serverName}
									initial={{ opacity: 0, y: 20 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true }}
									transition={{ duration: 0.5, delay: Math.min(index * 0.05, 0.5) }}
								>
									<Card className="h-full hover:border-primary/50 transition-all hover:shadow-lg">
										<CardHeader>
											<div className="flex items-start justify-between mb-3">
												<div className="relative w-12 h-12 rounded-lg overflow-hidden bg-white dark:bg-gray-800 p-2 border border-border flex-shrink-0">
													{logoUrl && (
														<Image
															src={logoUrl}
															alt={integration.displayName}
															fill
															className={`object-contain p-1 ${logoDark ? 'dark:hidden' : ''}`}
														/>
													)}
													{logoDark && (
														<Image
															src={logoDark}
															alt={integration.displayName}
															fill
															className="object-contain p-1 hidden dark:block"
														/>
													)}
												</div>
												<Badge variant="outline" className="text-xs">
													{getCategoryLabel(integration.category)}
												</Badge>
											</div>
											<CardTitle className="text-base">{integration.displayName}</CardTitle>
										</CardHeader>
										<CardContent>
											<CardDescription className="text-sm mb-4 line-clamp-3">
												{integration.description || "Connect to access powerful integrations"}
											</CardDescription>
											<div className="flex items-center gap-2 text-xs text-muted-foreground">
												{integration.authType === "oauth" && (
													<Badge variant="secondary" className="text-xs">
														OAuth
													</Badge>
												)}
												{integration.authType === "api_key" && (
													<Badge variant="secondary" className="text-xs">
														API Key
													</Badge>
												)}
												{integration.authType === "none" && (
													<Badge variant="secondary" className="text-xs">
														No Auth
													</Badge>
												)}
											</div>
										</CardContent>
									</Card>
								</MotionDiv>
							)
						})}
					</div>

					{filteredIntegrations.length === 0 && (
						<div className="text-center py-12">
							<p className="text-muted-foreground">No integrations found matching your search.</p>
						</div>
					)}
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
