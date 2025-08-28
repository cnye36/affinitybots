"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Trash2 } from "lucide-react";
import Link from "next/link";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Memory {
  id: string;
  attribute: string;
  value: unknown;
  extracted_at: string;
  source_message?: string;
}

export default function MemoriesPage() {
  const { id } = useParams();
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchMemories() {
      try {
        setLoading(true);
        const response = await fetch(`/api/assistants/${id}/memories`);

        if (!response.ok) {
          throw new Error(`Failed to fetch memories: ${response.statusText}`);
        }

        const data = await response.json();
        setMemories(data);
      } catch (err) {
        console.error("Error fetching memories:", err);
        setError(
          err instanceof Error ? err.message : "Failed to load memories"
        );
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchMemories();
    }
  }, [id]);

  const handleDeleteMemory = async (memoryId: string) => {
    try {
      const response = await fetch(`/api/agents/${id}/memories/${memoryId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error(`Failed to delete memory: ${response.statusText}`);
      }

      // Remove the deleted memory from the state
      setMemories(memories.filter((memory) => memory.id !== memoryId));
    } catch (err) {
      console.error("Error deleting memory:", err);
      setError(err instanceof Error ? err.message : "Failed to delete memory");
    }
  };

  // Group memories by attribute
  const groupedMemories = memories.reduce<Record<string, Memory[]>>(
    (acc, memory) => {
      if (!acc[memory.attribute]) {
        acc[memory.attribute] = [];
      }
      acc[memory.attribute].push(memory);
      return acc;
    },
    {}
  );

  return (
    <div className="container py-8 max-w-5xl">
      <div className="flex items-center mb-6">
        <Button variant="ghost" size="icon" asChild className="mr-2">
          <Link href={`/agents/${id}`}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Agent Memories</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {loading ? (
        <div className="flex justify-center my-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
        </div>
      ) : memories.length === 0 ? (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              No memories have been stored yet. The agent will remember
              important information as you chat.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedMemories).map(
            ([attribute, attributeMemories]) => (
              <Card key={attribute} className="mb-6">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="capitalize">{attribute}</CardTitle>
                    <Badge variant="outline">{attributeMemories.length}</Badge>
                  </div>
                  <CardDescription>
                    Information about your {attribute}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {attributeMemories.map((memory) => (
                      <div
                        key={memory.id}
                        className="flex items-start justify-between p-3 border rounded-md"
                      >
                        <div>
                          <div className="font-medium">
                            {Array.isArray(memory.value)
                              ? memory.value.join(", ")
                              : typeof memory.value === "object"
                              ? JSON.stringify(memory.value)
                              : String(memory.value)}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            Extracted on{" "}
                            {new Date(memory.extracted_at).toLocaleString()}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteMemory(memory.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )
          )}
        </div>
      )}
    </div>
  );
}
