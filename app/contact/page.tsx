"use client";

import { useState } from "react";
import { Header } from "@/components/home/Header";
import { Footer } from "@/components/home/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Mail, Building2, MessageSquare, Send, CheckCircle2, Users, Zap, Shield } from "lucide-react";

export default function ContactPage() {
	const [formData, setFormData] = useState({
		name: "",
		email: "",
		company: "",
		subject: "",
		message: "",
		inquiryType: "general" as "general" | "enterprise" | "support"
	});
	const [loading, setLoading] = useState(false);
	const [submitted, setSubmitted] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setLoading(true);

		// Simulate form submission
		await new Promise(resolve => setTimeout(resolve, 1500));

		setLoading(false);
		setSubmitted(true);

		// Reset form after 3 seconds
		setTimeout(() => {
			setSubmitted(false);
			setFormData({
				name: "",
				email: "",
				company: "",
				subject: "",
				message: "",
				inquiryType: "general"
			});
		}, 3000);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}));
	};

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Header />
			<main className="pt-24 pb-16">
				<div className="container mx-auto px-4">
					{/* Hero Section */}
					<div className="text-center mb-12 md:mb-16">
						<h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-600">
							Contact Us
						</h1>
						<p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
							Have questions about AffinityBots? Want to discuss enterprise solutions? We&apos;re here to help.
						</p>
					</div>

					<div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
						{/* Contact Form */}
						<div className="lg:col-span-2">
							<Card className="border-0 shadow-xl">
								<CardHeader>
									<CardTitle className="text-2xl">Send us a message</CardTitle>
									<CardDescription>
										Fill out the form below and we&apos;ll get back to you as soon as possible.
									</CardDescription>
								</CardHeader>
								<CardContent>
									<form onSubmit={handleSubmit} className="space-y-6">
										{/* Inquiry Type Selection */}
										<div className="grid grid-cols-3 gap-3">
											<button
												type="button"
												onClick={() => setFormData(prev => ({ ...prev, inquiryType: "general" }))}
												className={`p-3 rounded-lg border-2 transition-all ${
													formData.inquiryType === "general"
														? "border-blue-500 bg-blue-500/10"
														: "border-border hover:border-blue-500/50"
												}`}
											>
												<MessageSquare className={`h-5 w-5 mx-auto mb-1 ${
													formData.inquiryType === "general" ? "text-blue-500" : "text-muted-foreground"
												}`} />
												<span className="text-xs font-medium">General</span>
											</button>
											<button
												type="button"
												onClick={() => setFormData(prev => ({ ...prev, inquiryType: "enterprise" }))}
												className={`p-3 rounded-lg border-2 transition-all ${
													formData.inquiryType === "enterprise"
														? "border-purple-500 bg-purple-500/10"
														: "border-border hover:border-purple-500/50"
												}`}
											>
												<Building2 className={`h-5 w-5 mx-auto mb-1 ${
													formData.inquiryType === "enterprise" ? "text-purple-500" : "text-muted-foreground"
												}`} />
												<span className="text-xs font-medium">Enterprise</span>
											</button>
											<button
												type="button"
												onClick={() => setFormData(prev => ({ ...prev, inquiryType: "support" }))}
												className={`p-3 rounded-lg border-2 transition-all ${
													formData.inquiryType === "support"
														? "border-green-500 bg-green-500/10"
														: "border-border hover:border-green-500/50"
												}`}
											>
												<Mail className={`h-5 w-5 mx-auto mb-1 ${
													formData.inquiryType === "support" ? "text-green-500" : "text-muted-foreground"
												}`} />
												<span className="text-xs font-medium">Support</span>
											</button>
										</div>

										{/* Form Fields */}
										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label htmlFor="name" className="block text-sm font-medium mb-2">
													Name *
												</label>
												<Input
													id="name"
													name="name"
													value={formData.name}
													onChange={handleChange}
													required
													placeholder="John Doe"
													className="w-full"
												/>
											</div>
											<div>
												<label htmlFor="email" className="block text-sm font-medium mb-2">
													Email *
												</label>
												<Input
													id="email"
													name="email"
													type="email"
													value={formData.email}
													onChange={handleChange}
													required
													placeholder="john@company.com"
													className="w-full"
												/>
											</div>
										</div>

										<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
											<div>
												<label htmlFor="company" className="block text-sm font-medium mb-2">
													Company
												</label>
												<Input
													id="company"
													name="company"
													value={formData.company}
													onChange={handleChange}
													placeholder="Your Company"
													className="w-full"
												/>
											</div>
											<div>
												<label htmlFor="subject" className="block text-sm font-medium mb-2">
													Subject *
												</label>
												<Input
													id="subject"
													name="subject"
													value={formData.subject}
													onChange={handleChange}
													required
													placeholder="How can we help?"
													className="w-full"
												/>
											</div>
										</div>

										<div>
											<label htmlFor="message" className="block text-sm font-medium mb-2">
												Message *
											</label>
											<Textarea
												id="message"
												name="message"
												value={formData.message}
												onChange={handleChange}
												required
												placeholder="Tell us more about your inquiry..."
												rows={6}
												className="w-full resize-none"
											/>
										</div>

										{/* Submit Button */}
										<Button
											type="submit"
											disabled={loading || submitted}
											className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 py-6"
										>
											{submitted ? (
												<>
													<CheckCircle2 className="mr-2 h-5 w-5" />
													Message Sent!
												</>
											) : loading ? (
												"Sending..."
											) : (
												<>
													<Send className="mr-2 h-5 w-5" />
													Send Message
												</>
											)}
										</Button>
									</form>
								</CardContent>
							</Card>
						</div>

						{/* Contact Information & Enterprise Info */}
						<div className="space-y-6">
							{/* Contact Info Card */}
							<Card className="border-0 shadow-xl">
								<CardHeader>
									<CardTitle className="text-xl">Contact Information</CardTitle>
								</CardHeader>
								<CardContent className="space-y-4">
									<div className="flex items-start gap-3">
										<Mail className="h-5 w-5 text-blue-500 mt-0.5" />
										<div>
											<p className="font-medium">Email</p>
											<a href="mailto:support@affinitybots.com" className="text-sm text-muted-foreground hover:text-blue-500 transition-colors">
												support@affinitybots.com
											</a>
										</div>
									</div>
									<div className="flex items-start gap-3">
										<Building2 className="h-5 w-5 text-purple-500 mt-0.5" />
										<div>
											<p className="font-medium">Enterprise Sales</p>
											<a href="mailto:sales@affinitybots.com" className="text-sm text-muted-foreground hover:text-purple-500 transition-colors">
												sales@affinitybots.com
											</a>
										</div>
									</div>
								</CardContent>
							</Card>

							{/* Enterprise Features Card */}
							<Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500/10 to-blue-500/10">
								<CardHeader>
									<CardTitle className="text-xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-blue-600">
										Enterprise Solutions
									</CardTitle>
									<CardDescription>
										Custom solutions for large organizations
									</CardDescription>
								</CardHeader>
								<CardContent className="space-y-3">
									<div className="flex items-center gap-2 text-sm">
										<Users className="h-4 w-4 text-purple-500" />
										<span>Dedicated account manager</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Zap className="h-4 w-4 text-blue-500" />
										<span>Custom integrations</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Shield className="h-4 w-4 text-purple-500" />
										<span>Advanced security & compliance</span>
									</div>
									<div className="flex items-center gap-2 text-sm">
										<Building2 className="h-4 w-4 text-blue-500" />
										<span>On-premise deployment options</span>
									</div>
								</CardContent>
							</Card>

							{/* Response Time Card */}
							<Card className="border-0 shadow-xl">
								<CardContent className="pt-6">
									<div className="text-center">
										<div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-500/10 mb-3">
											<CheckCircle2 className="h-6 w-6 text-green-500" />
										</div>
										<h3 className="font-semibold mb-1">Quick Response Time</h3>
										<p className="text-sm text-muted-foreground">
											We typically respond within 24 hours on business days.
										</p>
									</div>
								</CardContent>
							</Card>
						</div>
					</div>
				</div>
			</main>
			<Footer />
		</div>
	);
}
