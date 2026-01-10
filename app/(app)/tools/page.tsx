"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Grid3x3, List, ChevronLeft, ChevronRight } from "lucide-react";
import { OFFICIAL_MCP_SERVERS, type ServerCategory } from "@/lib/mcp/officialMcpServers";
import { OfficialServerCard } from "@/components/tools/OfficialServerCard";
import { CustomServerCard } from "@/components/tools/CustomServerCard";
import { AddMCPServerModal } from "@/components/tools/AddMCPServerModal";
import { useViewPreference } from "@/hooks/useViewPreference";

const ITEMS_PER_PAGE = 24;

// Category labels for display
const CATEGORY_LABELS: Record<ServerCategory | "all", string> = {
	"all": "All",
	"development": "Development",
	"productivity": "Productivity",
	"project-management": "Project Management",
	"database": "Databases",
	"design": "Design",
	"automation": "Automation",
	"web-scraping": "Web Scraping",
	"search": "Search",
	"monitoring": "Monitoring",
	"ecommerce": "E-commerce",
	"seo": "SEO",
	"finance": "Finance",
	"communication": "Communication",
	"social-media": "Social Media",
};

// Category color gradients - matching the badge colors
const CATEGORY_COLORS: Record<ServerCategory | "all", string> = {
	"all": "from-emerald-500 to-teal-500", // Default green for "All"
	"development": "from-blue-500 to-indigo-600",
	"productivity": "from-orange-500 to-amber-600",
	"project-management": "from-violet-500 to-purple-600",
	"database": "from-cyan-500 to-blue-600",
	"design": "from-pink-500 to-rose-600",
	"automation": "from-slate-500 to-gray-600",
	"web-scraping": "from-lime-500 to-green-600",
	"search": "from-sky-400 to-blue-500",
	"monitoring": "from-red-500 to-orange-600",
	"ecommerce": "from-fuchsia-500 to-pink-600",
	"seo": "from-amber-500 to-yellow-600",
	"finance": "from-teal-600 to-cyan-600",
	"communication": "from-indigo-500 to-blue-600",
	"social-media": "from-red-500 to-rose-600",
};

export default function ToolsPage() {
	const searchParams = useSearchParams();
	const router = useRouter();
	const [userServers, setUserServers] = useState<any[]>([]);
	const [userAddedServers, setUserAddedServers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [addOpen, setAddOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const { viewMode, setViewMode } = useViewPreference("tools", "grid");

	// Initialize currentPage from URL params or default to 1
	const pageParam = searchParams.get("page");
	const initialPage = pageParam ? parseInt(pageParam, 10) : 1;
	const [currentPage, setCurrentPage] = useState(initialPage);
	const [filterMode, setFilterMode] = useState<"all" | "configured">("all");
	const [selectedCategory, setSelectedCategory] = useState<ServerCategory | "all">("all");

	// Sync currentPage with URL params
	useEffect(() => {
		const pageParam = searchParams.get("page");
		const pageFromUrl = pageParam ? parseInt(pageParam, 10) : 1;
		if (pageFromUrl !== currentPage && pageFromUrl >= 1) {
			setCurrentPage(pageFromUrl);
		}
	}, [searchParams]);

	// Update URL when page changes
	useEffect(() => {
		const params = new URLSearchParams(searchParams.toString());
		if (currentPage === 1) {
			params.delete("page");
		} else {
			params.set("page", currentPage.toString());
		}
		const newUrl = params.toString() ? `/tools?${params.toString()}` : "/tools";
		router.replace(newUrl, { scroll: false });
	}, [currentPage, router, searchParams]);

	// Debounce search term
	useEffect(() => {
		const timer = setTimeout(() => {
			setDebouncedSearch(searchTerm);
		}, 300);

		return () => clearTimeout(timer);
	}, [searchTerm]);

	useEffect(() => {
		async function fetchData() {
			setLoading(true);
			const [userRes, userAddedRes] = await Promise.all([
				fetch("/api/user-mcp-servers").then((r) => r.json()),
				fetch("/api/user-added-servers").then((r) => r.json()),
			]);
			const userList = userRes.servers || [];
			const userAddedList = userAddedRes.servers || [];
			setUserServers(userList);
			setUserAddedServers(userAddedList);
			setLoading(false);
		}
		fetchData();
	}, []);

	const handleSearchChange = useCallback((value: string) => {
		setSearchTerm(value);
		setCurrentPage(1); // Reset to first page on search
	}, []);

	// Helper to check if a server is configured (enabled + has tokens for OAuth)
	const isConfigured = (serverName: string) => {
		const server = OFFICIAL_MCP_SERVERS.find((s) => s.serverName === serverName);
		const serverEntry = userServers.find((s: any) => s.server_slug === serverName);
		if (!serverEntry) return false;
		// For OAuth servers, must be enabled AND have tokens
		if (server?.authType === "oauth") {
			return serverEntry.is_enabled && serverEntry.has_oauth_token;
		}
		// For non-OAuth servers, just check if enabled
		return serverEntry.is_enabled;
	};

	// Filter servers based on search term and category
	const filteredOfficialServers = useMemo(() => {
		return OFFICIAL_MCP_SERVERS.filter((server) => {
			// Category filter
			if (selectedCategory !== "all" && server.category !== selectedCategory) {
				return false;
			}

			// Search filter
			if (!debouncedSearch) return true;
			const searchLower = debouncedSearch.toLowerCase();
			return (
				server.displayName.toLowerCase().includes(searchLower) ||
				server.serverName.toLowerCase().includes(searchLower) ||
				(server.description || "").toLowerCase().includes(searchLower)
			);
		});
	}, [debouncedSearch, selectedCategory]);

	const filteredUserServers = useMemo(() => {
		return userAddedServers.filter((server: any) => {
			if (!debouncedSearch) return true;
			const searchLower = debouncedSearch.toLowerCase();
			return (
				(server.display_name || server.server_slug || "").toLowerCase().includes(searchLower) ||
				(server.server_slug || "").toLowerCase().includes(searchLower) ||
				(server.description || "").toLowerCase().includes(searchLower)
			);
		});
	}, [userAddedServers, debouncedSearch]);

	// Combine and filter servers based on filterMode
	const allServers = useMemo(() => {
		const combined = [...filteredUserServers, ...filteredOfficialServers];

		if (filterMode === "configured") {
			return combined.filter((server: any) => {
				// Check if user-added server
				const isUserAdded = filteredUserServers.some((s: any) => s.id === server.id);
				if (isUserAdded) return true; // User-added servers are always configured

				// Check if official server is configured
				return isConfigured(server.serverName);
			});
		}

		return combined;
	}, [filteredUserServers, filteredOfficialServers, filterMode]);

	const totalPages = Math.ceil(allServers.length / ITEMS_PER_PAGE);
	const paginatedServers = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return allServers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [allServers, currentPage]);

	// Pagination component
	const PaginationControls = () => {
		if (totalPages <= 1) return null;

		return (
			<div className="flex items-center justify-center gap-2">
				<Button
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
					disabled={currentPage === 1}
					className="border-2 hover:border-teal-500/50 hover:bg-teal-500/5"
				>
					<ChevronLeft className="h-4 w-4" />
					Previous
				</Button>

				<div className="flex items-center gap-2">
					{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
						// Show first page, last page, current page, and pages around current
						const showPage = page === 1 ||
							page === totalPages ||
							Math.abs(page - currentPage) <= 1;

						if (!showPage) {
							// Show ellipsis
							if (page === 2 && currentPage > 3) {
								return <span key={page} className="text-muted-foreground">...</span>;
							}
							if (page === totalPages - 1 && currentPage < totalPages - 2) {
								return <span key={page} className="text-muted-foreground">...</span>;
							}
							return null;
						}

						return (
							<Button
								key={page}
								variant={currentPage === page ? "default" : "outline"}
								size="sm"
								onClick={() => setCurrentPage(page)}
								className={currentPage === page ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0" : "border-2 hover:border-teal-500/50 hover:bg-teal-500/10 dark:hover:bg-teal-500/5"}
							>
								{page}
							</Button>
						);
					})}
				</div>

				<Button
					variant="outline"
					size="sm"
					onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
					disabled={currentPage === totalPages}
					className="border-2 hover:border-teal-500/50 hover:bg-teal-500/5"
				>
					Next
					<ChevronRight className="h-4 w-4" />
				</Button>
			</div>
		);
	};

	const refreshData = useCallback(async () => {
		const [userRes, userAddedRes] = await Promise.all([
			fetch("/api/user-mcp-servers").then((r) => r.json()),
			fetch("/api/user-added-servers").then((r) => r.json())
		]);
		const userList = userRes.servers || [];
		const userAddedList = userAddedRes.servers || [];
		setUserServers(userList);
		setUserAddedServers(userAddedList);
	}, []);

	// Refresh data when page becomes visible or when connected query param is present
	useEffect(() => {
		const handleVisibilityChange = () => {
			if (document.visibilityState === 'visible') {
				refreshData();
			}
		};
		document.addEventListener('visibilitychange', handleVisibilityChange);
		
		// Check for connected query param and refresh
		const connected = searchParams.get('connected');
		if (connected === 'true') {
			refreshData();
			// Remove the query param from URL
			const params = new URLSearchParams(searchParams.toString());
			params.delete('connected');
			const newUrl = params.toString() ? `/tools?${params.toString()}` : '/tools';
			router.replace(newUrl, { scroll: false });
		}
		
		return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
	}, [searchParams, router, refreshData]);

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				{/* Enhanced Header */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
						<div>
							<h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-teal-600 to-emerald-600 dark:from-teal-400 dark:to-emerald-400 bg-clip-text text-transparent">
								Integrations
							</h1>
							<p className="text-muted-foreground mt-2 text-base">
								Extend your agents with powerful MCP servers
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Button
								size="sm"
								onClick={() => setAddOpen(true)}
								className="bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Custom MCP Server
							</Button>
						</div>
					</div>
				</div>

				{/* Filter Tabs */}
				<div className="mb-6">
					<div className="inline-flex rounded-lg border border-border p-1 bg-muted">
						<Button
							variant={filterMode === "all" ? "default" : "ghost"}
							size="sm"
							onClick={() => {
								setFilterMode("all");
								setCurrentPage(1);
							}}
							className={filterMode === "all" ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0" : "text-muted-foreground hover:text-foreground"}
						>
							All
						</Button>
						<Button
							variant={filterMode === "configured" ? "default" : "ghost"}
							size="sm"
							onClick={() => {
								setFilterMode("configured");
								setCurrentPage(1);
							}}
							className={filterMode === "configured" ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0" : "text-muted-foreground hover:text-foreground"}
						>
							Configured
						</Button>
					</div>
				</div>

				{/* Search, View Controls, and Pagination */}
				<div className="mb-6 flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
					{/* Search Bar */}
					<div className="flex-1 max-w-md w-full lg:w-auto">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								type="text"
								placeholder="Search integrations..."
								value={searchTerm}
								onChange={(e) => handleSearchChange(e.target.value)}
								className="pl-10 pr-4"
							/>
						</div>
					</div>

					{/* View Toggle and Pagination */}
					<div className="flex items-center gap-3 flex-wrap">
						{/* View Toggle */}
						<div className="flex items-center gap-2">
							<Button
								variant={viewMode === "grid" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("grid")}
								className={viewMode === "grid" ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0" : ""}
							>
								<Grid3x3 className="h-4 w-4" />
							</Button>
							<Button
								variant={viewMode === "list" ? "default" : "outline"}
								size="sm"
								onClick={() => setViewMode("list")}
								className={viewMode === "list" ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0" : ""}
							>
								<List className="h-4 w-4" />
							</Button>
						</div>

						{/* Pagination - Only show if more than 1 page */}
						{totalPages > 1 && (
							<div className="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className="border-2 hover:border-teal-500/50 hover:bg-teal-500/5"
								>
									<ChevronLeft className="h-4 w-4" />
									<span className="hidden sm:inline">Previous</span>
								</Button>

								<div className="flex items-center gap-1">
									{Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
										// Show first page, last page, current page, and pages around current
										const showPage = page === 1 ||
											page === totalPages ||
											Math.abs(page - currentPage) <= 1;

										if (!showPage) {
											// Show ellipsis
											if (page === 2 && currentPage > 3) {
												return <span key={page} className="text-muted-foreground text-sm">...</span>;
											}
											if (page === totalPages - 1 && currentPage < totalPages - 2) {
												return <span key={page} className="text-muted-foreground text-sm">...</span>;
											}
											return null;
										}

										return (
											<Button
												key={page}
												variant={currentPage === page ? "default" : "outline"}
												size="sm"
												onClick={() => setCurrentPage(page)}
												className={currentPage === page ? "bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 text-white border-0 min-w-[2rem] h-8" : "border-2 hover:border-teal-500/50 hover:bg-teal-500/10 dark:hover:bg-teal-500/5 min-w-[2rem] h-8"}
											>
												{page}
											</Button>
										);
									})}
								</div>

								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
									disabled={currentPage === totalPages}
									className="border-2 hover:border-teal-500/50 hover:bg-teal-500/5"
								>
									<span className="hidden sm:inline">Next</span>
									<ChevronRight className="h-4 w-4" />
								</Button>
							</div>
						)}
					</div>
				</div>

				{/* Category Filters */}
				<div className="mb-8">
					<div className="flex justify-center">
						<div className="flex flex-wrap justify-center gap-2 max-w-5xl">
							{(Object.keys(CATEGORY_LABELS) as (ServerCategory | "all")[]).map((category) => (
								<button
									key={category}
									onClick={() => {
										setSelectedCategory(category);
										setCurrentPage(1);
									}}
									className={`
										relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer
										${
											selectedCategory === category
												? `bg-gradient-to-r ${CATEGORY_COLORS[category]} text-white shadow-lg scale-105`
												: "bg-white/50 dark:bg-gray-800/50 text-muted-foreground hover:text-foreground hover:bg-white dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md"
										}
									`}
									style={
										selectedCategory === category
											? { boxShadow: `0 10px 25px -5px ${category === "all" ? "rgba(16, 185, 129, 0.3)" : "currentColor"}` }
											: undefined
									}
								>
									{CATEGORY_LABELS[category]}
								</button>
							))}
						</div>
					</div>
				</div>


				{/* Tools Display */}
				{allServers.length === 0 ? (
					<Card className="relative overflow-hidden border-0 shadow-lg">
						<div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent" />
						<CardContent className="relative py-16 text-center">
							<div className="max-w-md mx-auto space-y-4">
								<div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-teal-500/10 to-emerald-500/10 backdrop-blur-sm mb-2">
									<Search className="h-12 w-12 text-muted-foreground/50" />
								</div>
								<h3 className="text-xl font-semibold text-muted-foreground">
									{filterMode === "configured" ? "No configured tools" : "No tools found"}
								</h3>
								<p className="text-sm text-muted-foreground/70">
									{filterMode === "configured"
										? "Connect to tools to see them here"
										: debouncedSearch
											? "Try adjusting your search term"
											: "Get started by adding a custom MCP server"
									}
								</p>
								{debouncedSearch && (
									<Button
										variant="outline"
										onClick={() => setSearchTerm("")}
										className="border-2 hover:border-teal-500/50 hover:bg-teal-500/5"
									>
										Clear search
									</Button>
								)}
							</div>
						</CardContent>
					</Card>
				) : (
					<>
						{viewMode === "grid" ? (
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
								{paginatedServers.map((server: any) => {
									// Check if it's a user-added server
									const isUserAdded = filteredUserServers.some((s: any) => s.id === server.id);

									if (isUserAdded) {
										return (
											<CustomServerCard
												key={server.id}
												server={server}
												isConfigured={true}
											/>
										);
									} else {
										return (
											<OfficialServerCard
												key={`official-${server.serverName}`}
												server={server}
												isConfigured={isConfigured(server.serverName)}
												onConnected={refreshData}
											/>
										);
									}
								})}
							</div>
						) : (
							<div className="space-y-3">
								{paginatedServers.map((server: any) => {
									// Check if it's a user-added server
									const isUserAdded = filteredUserServers.some((s: any) => s.id === server.id);

									if (isUserAdded) {
										return (
											<CustomServerCard
												key={server.id}
												server={server}
												isConfigured={true}
												compact={true}
											/>
										);
									} else {
										return (
											<OfficialServerCard
												key={`official-${server.serverName}`}
												server={server}
												isConfigured={isConfigured(server.serverName)}
												onConnected={refreshData}
												compact={true}
											/>
										);
									}
								})}
							</div>
						)}

						{/* Bottom Pagination */}
						{totalPages > 1 && (
							<div className="mt-8">
								<PaginationControls />
							</div>
						)}
					</>
				)}
			</div>

			<AddMCPServerModal
				open={addOpen}
				onOpenChange={setAddOpen}
				onAdded={refreshData}
			/>
		</div>
	);
}
