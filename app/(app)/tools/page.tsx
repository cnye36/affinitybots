"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Grid3x3, List, ChevronLeft, ChevronRight } from "lucide-react";
import { OFFICIAL_MCP_SERVERS } from "@/lib/mcp/officialMcpServers";
import { OfficialServerCard } from "@/components/tools/OfficialServerCard";
import { CustomServerCard } from "@/components/tools/CustomServerCard";
import { AddMCPServerModal } from "@/components/tools/AddMCPServerModal";

const ITEMS_PER_PAGE = 12;

export default function ToolsPage() {
	const [userServers, setUserServers] = useState<any[]>([]);
	const [userAddedServers, setUserAddedServers] = useState<any[]>([]);
	const [loading, setLoading] = useState(true);
	const [addOpen, setAddOpen] = useState(false);
	const [searchTerm, setSearchTerm] = useState("");
	const [debouncedSearch, setDebouncedSearch] = useState("");
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [currentPage, setCurrentPage] = useState(1);

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
	const isConfigured = (qualifiedName: string) => {
		const server = OFFICIAL_MCP_SERVERS.find((s) => s.qualifiedName === qualifiedName);
		const serverEntry = userServers.find((s: any) => s.qualified_name === qualifiedName);
		if (!serverEntry) return false;
		// For OAuth servers, must be enabled AND have tokens
		if (server?.authType === "oauth") {
			return serverEntry.is_enabled && serverEntry.has_oauth_token;
		}
		// For non-OAuth servers, just check if enabled
		return serverEntry.is_enabled;
	};

	// Filter servers based on search term
	const filteredOfficialServers = useMemo(() => {
		return OFFICIAL_MCP_SERVERS.filter((server) => {
			if (!debouncedSearch) return true;
			const searchLower = debouncedSearch.toLowerCase();
			return (
				server.displayName.toLowerCase().includes(searchLower) ||
				server.qualifiedName.toLowerCase().includes(searchLower) ||
				(server.description || "").toLowerCase().includes(searchLower)
			);
		});
	}, [debouncedSearch]);

	const filteredUserServers = useMemo(() => {
		return userAddedServers.filter((server: any) => {
			if (!debouncedSearch) return true;
			const searchLower = debouncedSearch.toLowerCase();
			return (
				(server.display_name || server.qualified_name || "").toLowerCase().includes(searchLower) ||
				(server.qualified_name || "").toLowerCase().includes(searchLower) ||
				(server.description || "").toLowerCase().includes(searchLower)
			);
		});
	}, [userAddedServers, debouncedSearch]);

	// Combine and paginate all servers
	const allServers = useMemo(() => {
		return [...filteredUserServers, ...filteredOfficialServers];
	}, [filteredUserServers, filteredOfficialServers]);

	const totalPages = Math.ceil(allServers.length / ITEMS_PER_PAGE);
	const paginatedServers = useMemo(() => {
		const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
		return allServers.slice(startIndex, startIndex + ITEMS_PER_PAGE);
	}, [allServers, currentPage]);

	const refreshData = async () => {
		const [userRes, userAddedRes] = await Promise.all([
			fetch("/api/user-mcp-servers").then((r) => r.json()),
			fetch("/api/user-added-servers").then((r) => r.json())
		]);
		const userList = userRes.servers || [];
		const userAddedList = userAddedRes.servers || [];
		setUserServers(userList);
		setUserAddedServers(userAddedList);
	};

	return (
		<div className="min-h-screen bg-background">
			<div className="container mx-auto px-4 py-8">
				{/* Enhanced Header matching dashboard */}
				<div className="mb-8">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-2">
						<div>
							<h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
								Tools
							</h1>
							<p className="text-muted-foreground mt-2 text-base">
								Extend your agents with powerful integrations
							</p>
						</div>
						<div className="flex items-center gap-3">
							<Button
								size="sm"
								onClick={() => setAddOpen(true)}
								className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300"
							>
								<Plus className="h-4 w-4 mr-2" />
								Add Custom MCP
							</Button>
						</div>
					</div>
				</div>

				{/* Search and View Controls */}
				<div className="mb-8 flex flex-col sm:flex-row gap-4">
					{/* Search Bar */}
					<div className="flex-1 max-w-md">
						<div className="relative">
							<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
							<Input
								type="text"
								placeholder="Search tools..."
								value={searchTerm}
								onChange={(e) => handleSearchChange(e.target.value)}
								className="pl-10 pr-4"
							/>
						</div>
					</div>

					{/* View Toggle */}
					<div className="flex items-center gap-2">
						<Button
							variant={viewMode === "grid" ? "default" : "outline"}
							size="sm"
							onClick={() => setViewMode("grid")}
							className={viewMode === "grid" ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0" : ""}
						>
							<Grid3x3 className="h-4 w-4" />
						</Button>
						<Button
							variant={viewMode === "list" ? "default" : "outline"}
							size="sm"
							onClick={() => setViewMode("list")}
							className={viewMode === "list" ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0" : ""}
						>
							<List className="h-4 w-4" />
						</Button>
					</div>
				</div>

				{/* Tools Display */}
				{allServers.length === 0 ? (
					<Card className="relative overflow-hidden border-0 shadow-lg">
						<div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-amber-500/10 via-orange-500/5 to-transparent" />
						<CardContent className="relative py-16 text-center">
							<div className="max-w-md mx-auto space-y-4">
								<div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-sm mb-2">
									<Search className="h-12 w-12 text-muted-foreground/50" />
								</div>
								<h3 className="text-xl font-semibold text-muted-foreground">
									No tools found
								</h3>
								<p className="text-sm text-muted-foreground/70">
									{debouncedSearch ? "Try adjusting your search term" : "Get started by adding a custom MCP server"}
								</p>
								{debouncedSearch && (
									<Button
										variant="outline"
										onClick={() => setSearchTerm("")}
										className="border-2 hover:border-amber-500/50 hover:bg-amber-500/5"
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
							<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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
												key={`official-${server.qualifiedName}`}
												server={server}
												isConfigured={isConfigured(server.qualifiedName)}
												onConnected={refreshData}
											/>
										);
									}
								})}
							</div>
						) : (
							<div className="space-y-4">
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
												key={`official-${server.qualifiedName}`}
												server={server}
												isConfigured={isConfigured(server.qualifiedName)}
												onConnected={refreshData}
											/>
										);
									}
								})}
							</div>
						)}

						{/* Pagination */}
						{totalPages > 1 && (
							<div className="mt-8 flex items-center justify-center gap-2">
								<Button
									variant="outline"
									size="sm"
									onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
									disabled={currentPage === 1}
									className="border-2 hover:border-amber-500/50 hover:bg-amber-500/5"
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
												className={currentPage === page ? "bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white border-0" : "border-2 hover:border-amber-500/50 hover:bg-amber-500/5"}
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
									className="border-2 hover:border-amber-500/50 hover:bg-amber-500/5"
								>
									Next
									<ChevronRight className="h-4 w-4" />
								</Button>
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
