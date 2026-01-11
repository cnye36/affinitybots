import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

interface FeatureCTAProps {
	title: string
	description: string
}

export function FeatureCTA({ title, description }: FeatureCTAProps) {
	return (
		<section className="py-16 px-4 bg-gradient-to-br from-blue-500/10 via-purple-500/10 to-blue-500/10">
			<div className="container mx-auto text-center">
				<h2 className="text-3xl md:text-4xl font-bold mb-4">{title}</h2>
				<p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
					{description}
				</p>
				<div className="flex flex-col sm:flex-row gap-4 justify-center">
					<Link href="/pricing">
						<Button
							size="sm"
							className="h-10 px-5 rounded-full text-sm tracking-wide bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-sm shadow-blue-500/30"
						>
							Start Free Trial
							<ArrowRight className="ml-2 h-4 w-4" />
						</Button>
					</Link>
					<Link href="/contact">
						<Button
							size="sm"
							variant="outline"
							className="h-10 px-5 rounded-full text-sm tracking-wide border border-slate-300/70 dark:border-slate-700/70 hover:border-slate-400 dark:hover:border-slate-600"
						>
							Talk to Sales
						</Button>
					</Link>
				</div>
			</div>
		</section>
	)
}
