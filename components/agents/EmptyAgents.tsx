"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Bot, Sparkles, Zap, Brain, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";

const features = [
	{
		icon: Brain,
		title: "Advanced Intelligence",
		description: "Powered by state-of-the-art language models",
		gradient: "from-violet-500 to-purple-500",
	},
	{
		icon: MessageSquare,
		title: "Natural Conversations",
		description: "Engage in human-like dialogue with context awareness",
		gradient: "from-blue-500 to-cyan-500",
	},
	{
		icon: Zap,
		title: "Custom Capabilities",
		description: "Integrate tools and knowledge for specialized tasks",
		gradient: "from-emerald-500 to-green-500",
	},
];

export function EmptyAgents() {
	return (
		<div className="relative min-h-[600px] flex items-center justify-center py-16 px-4">
			<div className="relative max-w-4xl mx-auto text-center">
				{/* Main icon */}
				<motion.div
					initial={{ scale: 0, rotate: -180 }}
					animate={{ scale: 1, rotate: 0 }}
					transition={{
						duration: 0.6,
						ease: [0.34, 1.56, 0.64, 1],
					}}
					className="mb-8 flex justify-center"
				>
					<div className="relative bg-primary/10 p-8 rounded-3xl border border-primary/20">
						<Bot className="h-20 w-20 text-primary" />
						<motion.div
							className="absolute -top-2 -right-2 bg-primary/10 rounded-full p-1.5"
							animate={{
								rotate: [0, 10, 0, -10, 0],
								scale: [1, 1.1, 1, 1.1, 1],
							}}
							transition={{
								duration: 2,
								repeat: Infinity,
								ease: "easeInOut",
							}}
						>
							<Sparkles className="h-6 w-6 text-primary" />
						</motion.div>
					</div>
				</motion.div>

				{/* Heading */}
				<motion.h2
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.2 }}
					className="text-4xl md:text-5xl font-bold mb-4"
				>
					Create Your First AI Agent
				</motion.h2>

				{/* Description */}
				<motion.p
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.3 }}
					className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed"
				>
					Transform your workflow with intelligent AI agents that understand context,
					learn from interactions, and execute complex tasks autonomously.
				</motion.p>

				{/* Features grid */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.4 }}
					className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
				>
					{features.map((feature, index) => {
						const IconComponent = feature.icon;
						return (
							<motion.div
								key={index}
								initial={{ opacity: 0, y: 20 }}
								animate={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.5, delay: 0.5 + index * 0.1 }}
								className="group relative rounded-xl border border-border bg-card p-6 hover:shadow-md hover:border-primary/30 transition-all duration-200"
							>
								<div className="relative">
									<div className="inline-flex p-3 rounded-xl bg-primary/10 mb-4">
										<IconComponent className="h-6 w-6 text-primary" />
									</div>
									<h3 className="text-base font-semibold mb-2">{feature.title}</h3>
									<p className="text-sm text-muted-foreground leading-relaxed">
										{feature.description}
									</p>
								</div>
							</motion.div>
						);
					})}
				</motion.div>

				{/* CTA Button */}
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					animate={{ opacity: 1, y: 0 }}
					transition={{ duration: 0.5, delay: 0.8 }}
				>
					<Link href="/agents/new">
						<Button
							size="lg"
							className="group relative overflow-hidden shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 text-base px-8 py-6"
						>
							{/* Shine effect */}
							<div className="absolute top-0 -right-4 w-8 h-full bg-gradient-to-r from-transparent via-white/20 to-transparent transform rotate-12 group-hover:right-full transition-all duration-700 ease-out" />

							<div className="relative flex items-center gap-3">
								<motion.div
									whileHover={{ rotate: 180 }}
									transition={{ duration: 0.3 }}
								>
									<Bot className="h-5 w-5" />
								</motion.div>
								<span className="font-semibold">Create Your First Agent</span>
								<Sparkles className="h-5 w-5 opacity-70 group-hover:opacity-100 transition-opacity" />
							</div>
						</Button>
					</Link>
				</motion.div>

				{/* Subtle hint text */}
				<motion.p
					initial={{ opacity: 0 }}
					animate={{ opacity: 1 }}
					transition={{ duration: 0.5, delay: 1 }}
					className="mt-8 text-sm text-muted-foreground"
				>
					Get started in minutes with our intuitive agent builder
				</motion.p>
			</div>
		</div>
	);
}
