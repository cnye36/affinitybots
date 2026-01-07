"use client"

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from "next/link";
import { AGENT_TEMPLATES } from "./templates";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, Sparkles, Plus, Upload, Wand2, Wand, Bot, ChevronDown } from "lucide-react";
import { AgentCreationDialog } from "@/components/agents/AgentCreationDialog";
import { Input } from "@/components/ui/input";
import { ToolSelector } from "@/components/configuration/ToolSelector";
import { Label } from "@/components/ui/label";
import {
	DropdownMenu,
	DropdownMenuTrigger,
	DropdownMenuContent,
	DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { LLM_OPTIONS } from "@/lib/llm/catalog";
import { Cpu } from "lucide-react";

export default function NewAgentPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [customPrompt, setCustomPrompt] = useState("");
	const [customName, setCustomName] = useState("");
	const [selectedModel, setSelectedModel] = useState<string>("openai:gpt-5.2");
	// No explicit agent type; template clicks only prefill prompt
	const [error, setError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [showCreationDialog, setShowCreationDialog] = useState(false);
	const [enabledMCPServers, setEnabledMCPServers] = useState<string[]>([]);

	// Knowledge upload queue (processed after assistant is created)
	const [knowledgeFiles, setKnowledgeFiles] = useState<File[]>([]);
	const [isDragging, setIsDragging] = useState(false);
	const [isEnhancing, setIsEnhancing] = useState(false);
	const [knowledgeStatuses, setKnowledgeStatuses] = useState<Record<string, { status: 'queued'|'uploading'|'success'|'error'; error?: string }>>({});

	const allowedFileTypes = [
		"application/pdf",
		"text/plain",
		"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
		"text/csv",
		"application/csv",
		"application/vnd.ms-excel",
		"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
		"application/json",
		"text/markdown",
		"application/xml",
		"text/xml",
		"text/html",
	];


	const handleCreateAgent = async (prompt: string) => {
		setIsSubmitting(true);
		setError(null);
		setShowCreationDialog(true);

		try {
			const response = await fetch("/api/agents", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					prompt,
					preferredName: customName || undefined,
					enabledMCPServers,
					selectedModel,
				}),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.error || "Failed to create agent");
			}

			const data = await response.json();
			// If user queued knowledge files, upload them now with status updates
			if (knowledgeFiles.length > 0 && data?.assistant?.assistant_id) {
				// Initialize statuses for any missing
				setKnowledgeStatuses(prev => {
					const next = { ...prev };
					for (const f of knowledgeFiles) {
						if (!next[f.name]) next[f.name] = { status: 'queued' };
					}
					return next;
				});

				const successfulFiles: string[] = [];

				for (const file of knowledgeFiles) {
					setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'uploading' } }));
					const formData = new FormData();
					formData.append("file", file);
					formData.append("assistantId", data.assistant.assistant_id);
					try {
						const resp = await fetch("/api/knowledge", { method: "POST", body: formData });
						if (!resp.ok) {
							let errMsg = `Upload failed (${resp.status})`;
							try {
								const errJson = await resp.json();
								if (errJson?.error) errMsg = errJson.error;
							} catch {}
							setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'error', error: errMsg } }));
							continue;
						}
						setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'success' } }));
						successfulFiles.push(file.name);
					} catch (e) {
						const errMsg = e instanceof Error ? e.message : 'Network error';
						setKnowledgeStatuses(prev => ({ ...prev, [file.name]: { status: 'error', error: errMsg } }));
					}
				}

				// If any uploads succeeded, persist sources to assistant config now
				if (successfulFiles.length > 0) {
					try {
						await fetch(`/api/agents/${data.assistant.assistant_id}`, {
							method: 'PUT',
							headers: { 'Content-Type': 'application/json' },
							body: JSON.stringify({
								config: {
									configurable: {
										knowledge_base: {
											isEnabled: true,
											config: { sources: successfulFiles }
										}
									}
								}
							})
						});
					} catch {}
				}
			}

			const redirectParam = searchParams.get('redirect');
			if (redirectParam && redirectParam.startsWith('/')) {
				try {
					const redirectUrl = new URL(redirectParam, window.location.origin);
					redirectUrl.searchParams.set('agentModal', 'open');
					redirectUrl.searchParams.set('returningFromAgentCreate', '1');
					if (data?.assistant?.assistant_id) {
						redirectUrl.searchParams.set('newAgentId', data.assistant.assistant_id);
					} else {
						redirectUrl.searchParams.delete('newAgentId');
					}
					router.push(`${redirectUrl.pathname}${redirectUrl.search}`);
					return;
				} catch {
					// Fallback to default route if redirect URL is malformed
				}
			}

			router.push("/agents");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to create agent");
			setIsSubmitting(false);
			setShowCreationDialog(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-3xl mx-auto">
					{/* Enhanced Header */}
					<div className="mb-10">
						<div className="flex items-center gap-4 mb-4">
							<Link href="/agents">
								<Button
									variant="ghost"
									size="icon"
									className="hover:bg-primary/10 hover:scale-105 transition-all duration-200"
								>
									<ArrowLeft className="h-4 w-4" />
								</Button>
							</Link>
							<div className="flex-1">
								<h1 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent animate-in fade-in slide-in-from-bottom-4 duration-700">
									Create New Agent
								</h1>
								<p className="text-muted-foreground mt-2 text-base animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
									Design an AI assistant tailored to your needs
								</p>
							</div>
						</div>
					</div>

					<div className="space-y-8">
						{/* Prompt Section - Purple/Violet Theme */}
						<div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
							<div className="absolute -inset-0.5 bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-500 dark:to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300" />
							<div className="relative bg-background border border-violet-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
							<div className="flex items-center justify-between gap-3 mb-4">
								<div className="flex items-center gap-3">
									<div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 backdrop-blur-sm border border-violet-500/30">
										<Sparkles className="h-5 w-5 text-violet-600 dark:text-violet-400" />
									</div>
									<div>
										<h2 className="text-xl font-semibold bg-gradient-to-r from-violet-600 to-purple-600 dark:from-violet-400 dark:to-purple-400 bg-clip-text text-transparent">
											Describe Your AI Agent
										</h2>
										<p className="text-sm text-muted-foreground">Required</p>
									</div>
								</div>
								<DropdownMenu>
									<DropdownMenuTrigger asChild>
										<Button
											variant="outline"
											className="min-w-[180px] justify-between border-violet-500/30 hover:border-violet-500/50 bg-gradient-to-r from-violet-500/10 to-purple-500/10 hover:from-violet-500/20 hover:to-purple-500/20 transition-all duration-200"
										>
											<span className="flex items-center gap-2">
												<Cpu className="h-4 w-4 text-violet-600 dark:text-violet-400" />
												<span className="font-medium text-sm">
													{LLM_OPTIONS.find(opt => opt.id === selectedModel)?.label || "Select Model"}
												</span>
											</span>
											<ChevronDown className="h-4 w-4 opacity-50 ml-2" />
										</Button>
									</DropdownMenuTrigger>
									<DropdownMenuContent align="end" className="w-[240px] max-h-[400px] overflow-y-auto">
										{LLM_OPTIONS.map((model) => (
											<DropdownMenuItem
												key={model.id}
												onClick={() => setSelectedModel(model.id)}
												className={`cursor-pointer ${selectedModel === model.id ? 'bg-violet-500/10' : ''}`}
											>
												<div className="flex items-center justify-between w-full">
													<span className="font-medium">{model.label}</span>
													{selectedModel === model.id && (
														<span className="h-2 w-2 rounded-full bg-violet-500 animate-pulse"></span>
													)}
												</div>
											</DropdownMenuItem>
										))}
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
								<p className="text-muted-foreground mb-4 text-sm leading-relaxed">
									Tell us what you want your AI agent to do. We'll infer the best agent profile, craft a strong system prompt, and set sensible defaults.
								</p>
								<Textarea
									placeholder="Example: I need an agent that can help me with my marketing research."
									value={customPrompt}
									onChange={(e) => setCustomPrompt(e.target.value)}
									className="h-32 mb-4 border-violet-500/20 focus:border-violet-500/50 focus:ring-violet-500/20 bg-violet-500/5 transition-all duration-200"
								/>
								<div className="flex gap-3">
									<Button
										onClick={() => handleCreateAgent(customPrompt)}
										disabled={isSubmitting || !customPrompt.trim()}
										className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white border-0 shadow-lg shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40 transition-all duration-200 font-medium"
									>
										<Bot className="h-4 w-4 mr-2" />
										{isSubmitting ? "Creating your agent..." : "Create Agent"}
									</Button>
									<Button
										type="button"
										variant="outline"
										disabled={isEnhancing || !customPrompt.trim()}
										onClick={async () => {
											try {
												setIsEnhancing(true);
												const res = await fetch('/api/prompt/enhance', {
													method: 'POST',
													headers: { 'Content-Type': 'application/json' },
													body: JSON.stringify({ prompt: customPrompt })
												});
												if (!res.ok) throw new Error('Failed to enhance prompt');
												const data = await res.json();
												if (data?.enhancedPrompt) setCustomPrompt(data.enhancedPrompt);
											} catch (e) {
												console.error(e);
											} finally {
												setIsEnhancing(false);
											}
										}}
										className="border-violet-500/30 hover:border-violet-500 hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-purple-500/10 transition-all duration-200"
										title="Enhance prompt"
									>
										<Wand className={`h-4 w-4 mr-2 ${isEnhancing ? 'animate-spin' : ''}`} />
										{isEnhancing ? 'Enhancing...' : 'Enhance'}
									</Button>
								</div>
							</div>
						</div>

						{/* Templates Section - Blue/Cyan Theme */}
						<div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
							<div className="absolute -inset-0.5 bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-500 dark:to-cyan-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300" />
							<div className="relative bg-background border border-blue-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 backdrop-blur-sm border border-blue-500/30">
										<Wand2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
									</div>
									<div>
										<h3 className="text-xl font-semibold bg-gradient-to-r from-blue-600 to-cyan-600 dark:from-blue-400 dark:to-cyan-400 bg-clip-text text-transparent">
											Start from a Template
										</h3>
										<p className="text-sm text-muted-foreground">Optional - click to populate</p>
									</div>
								</div>
								<div className="flex flex-wrap gap-2.5">
									{AGENT_TEMPLATES.map((template) => (
										<Button
											key={template.id}
											type="button"
											variant="outline"
											size="sm"
											className="rounded-full border-blue-500/30 hover:border-blue-500 hover:bg-gradient-to-r hover:from-blue-500/10 hover:to-cyan-500/10 transition-all duration-200 hover:scale-105 group/template"
											onClick={() => setCustomPrompt(template.basePrompt)}
										>
											<template.icon className="h-4 w-4 mr-2 group-hover/template:rotate-12 transition-transform duration-200" />
											{template.name}
										</Button>
									))}
								</div>
							</div>
						</div>

						{/* Name Field - Indigo/Purple Theme */}
						<div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-400">
							<div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300" />
							<div className="relative bg-background border border-indigo-500/20 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
								<div className="flex items-center gap-3 mb-4">
									<div className="p-2.5 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-sm border border-indigo-500/30">
										<Bot className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
									</div>
									<div>
										<Label className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent">
											Agent Name
										</Label>
										<p className="text-sm text-muted-foreground">Optional - auto-generated if blank</p>
									</div>
								</div>
								<Input
									placeholder="e.g., Prism Atlas"
									value={customName}
									onChange={(e) => setCustomName(e.target.value)}
									className="border-indigo-500/20 focus:border-indigo-500/50 focus:ring-indigo-500/20 bg-indigo-500/5 transition-all duration-200"
								/>
								<p className="text-xs text-muted-foreground mt-2">Leave blank to auto-generate a creative name.</p>
							</div>
						</div>


						{/* Tools Accordion - Amber/Orange Theme */}
						<div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500">
							<div className="absolute -inset-0.5 bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-500 dark:to-orange-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300" />
							<div className="relative bg-background border border-amber-500/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
								<Accordion type="single" collapsible>
									<AccordionItem value="tools" className="border-0">
										<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gradient-to-r hover:from-amber-500/10 hover:to-orange-500/10 dark:hover:from-amber-500/5 dark:hover:to-orange-500/5 transition-all duration-200 group/trigger">
											<div className="flex items-center gap-3 w-full">
												<div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-sm border border-amber-500/30 group-hover/trigger:scale-110 transition-transform duration-200">
													<Plus className="h-5 w-5 text-amber-600 dark:text-amber-400" />
												</div>
												<div className="flex-1 text-left">
													<h3 className="text-lg font-semibold bg-gradient-to-r from-amber-600 to-orange-600 dark:from-amber-400 dark:to-orange-400 bg-clip-text text-transparent">
														Add Tools
													</h3>
													<p className="text-sm text-muted-foreground font-normal">Optional - extend your agent's capabilities</p>
												</div>
												{enabledMCPServers.length > 0 && (
													<span className="px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-medium shadow-lg">
														{enabledMCPServers.length} selected
													</span>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="px-6 pb-4">
											<div className="p-4 bg-gradient-to-br from-amber-500/5 to-orange-500/5 rounded-xl border border-amber-500/10">
												<ToolSelector
													enabledMCPServers={enabledMCPServers}
													onMCPServersChange={setEnabledMCPServers}
												/>
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>
						</div>

						{/* Knowledge Accordion - Emerald/Green Theme */}
						<div className="relative group animate-in fade-in slide-in-from-bottom-4 duration-700 delay-600">
							<div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-500 dark:to-green-500 rounded-2xl opacity-20 group-hover:opacity-30 blur transition duration-300" />
							<div className="relative bg-background border border-emerald-500/20 rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300">
								<Accordion type="single" collapsible>
									<AccordionItem value="knowledge" className="border-0">
										<AccordionTrigger className="px-6 py-4 hover:no-underline hover:bg-gradient-to-r hover:from-emerald-500/10 hover:to-green-500/10 dark:hover:from-emerald-500/5 dark:hover:to-green-500/5 transition-all duration-200 group/trigger">
											<div className="flex items-center gap-3 w-full">
												<div className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 backdrop-blur-sm border border-emerald-500/30 group-hover/trigger:scale-110 transition-transform duration-200">
													<Upload className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
												</div>
												<div className="flex-1 text-left">
													<h3 className="text-lg font-semibold bg-gradient-to-r from-emerald-600 to-green-600 dark:from-emerald-400 dark:to-green-400 bg-clip-text text-transparent">
														Add Knowledge
													</h3>
													<p className="text-sm text-muted-foreground font-normal">Optional - upload documents for context</p>
												</div>
												{knowledgeFiles.length > 0 && (
													<span className="px-3 py-1 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-medium shadow-lg">
														{knowledgeFiles.length} file{knowledgeFiles.length>1?'s':''} queued
													</span>
												)}
											</div>
										</AccordionTrigger>
										<AccordionContent className="px-6 pb-4">
											<div className="p-4 bg-gradient-to-br from-emerald-500/5 to-green-500/5 rounded-xl border border-emerald-500/10">
												<div className="space-y-4">
													<div
														onDragEnter={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); }}
														onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
														onDragLeave={(e) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); }}
														onDrop={(e) => {
															e.preventDefault(); e.stopPropagation(); setIsDragging(false);
															const files = Array.from(e.dataTransfer.files || []);
															const dropped = files.filter((file) => file.name.endsWith('.csv') || file.name.endsWith('.docx') || file.name.endsWith('.html') || file.name.endsWith('.htm') || allowedFileTypes.includes(file.type));
															setKnowledgeFiles((prev) => [...prev, ...dropped]);
														}}
														className={`border-2 border-dashed rounded-xl p-8 text-center transition-all duration-300 cursor-pointer ${
															isDragging
																? 'border-emerald-500 bg-gradient-to-br from-emerald-500/20 to-green-500/20 scale-105'
																: 'border-emerald-500/30 hover:border-emerald-500/50 hover:bg-gradient-to-br hover:from-emerald-500/10 hover:to-green-500/10'
														}`}
													>
														<input
															type="file"
															multiple
															accept=".pdf,.txt,.docx,.csv,.xls,.xlsx,.json,.md,.xml,.html,.htm"
															className="hidden"
															id="kb-upload"
															onChange={(e) => {
																const files = e.target.files ? Array.from(e.target.files) : [];
																const picked = files.filter((file) => file.name.endsWith('.csv') || file.name.endsWith('.docx') || file.name.endsWith('.html') || file.name.endsWith('.htm') || allowedFileTypes.includes(file.type));
																setKnowledgeFiles((prev) => [...prev, ...picked]);
															}}
														/>
														<label htmlFor="kb-upload" className="cursor-pointer">
															<Upload className={`h-10 w-10 mx-auto mb-3 text-emerald-600 dark:text-emerald-400 ${isDragging ? 'animate-bounce' : ''}`} />
															<p className="font-medium mb-1">{isDragging ? 'Drop files here...' : 'Drag & drop files, or click to select'}</p>
															<p className="text-xs text-muted-foreground">Files upload after the agent is created.</p>
														</label>
													</div>

													{knowledgeFiles.length > 0 && (
														<div className="p-4 bg-background rounded-lg border border-emerald-500/20">
															<div className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2">Queued files</div>
															<ul className="space-y-2 max-h-40 overflow-auto pr-1">
																{knowledgeFiles.map((f) => {
																	const st = knowledgeStatuses[f.name]?.status || 'queued';
																	const err = knowledgeStatuses[f.name]?.error;
																	return (
																		<li key={f.name} className="text-xs flex items-start justify-between gap-2 p-2 rounded-md bg-emerald-500/5 border border-emerald-500/10">
																			<span className="truncate flex-1 font-medium">{f.name}</span>
																			<span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${
																				st==='success'?'bg-emerald-500/20 text-emerald-700 dark:text-emerald-300':
																				st==='error'?'bg-red-500/20 text-red-700 dark:text-red-300':
																				st==='uploading'?'bg-amber-500/20 text-amber-700 dark:text-amber-300':
																				'bg-muted text-muted-foreground'
																			}`}>
																				{st}
																			</span>
																			{err && <span className="text-red-600 dark:text-red-400 truncate max-w-[180px]" title={err}>: {err}</span>}
																		</li>
																	);
																})}
															</ul>
														</div>
													)}
												</div>
											</div>
										</AccordionContent>
									</AccordionItem>
								</Accordion>
							</div>
						</div>
					</div>

					{error && (
						<Alert variant="destructive" className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-300">
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>
			</div>

			<AgentCreationDialog
				isOpen={showCreationDialog}
				onClose={() => setShowCreationDialog(false)}
			/>
		</div>
	);
}
