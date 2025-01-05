import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { OpenAIEmbeddings } from "@langchain/openai";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import { Document } from "@langchain/core/documents";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();

    // Verify user has access to this agent
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("*")
      .eq("id", params.id)
      .single();

    if (!agent || agent.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll("files") as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No files provided" }, { status: 400 });
    }

    const embeddings = new OpenAIEmbeddings();
    const documents = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = file.name.toLowerCase();
      let docs: Document[] = [];

      // Handle different file types
      if (filename.endsWith(".pdf")) {
        const blob = new Blob([buffer], { type: "application/pdf" });
        const loader = new WebPDFLoader(blob);
        docs = await loader.load();
      } else if (filename.endsWith(".txt")) {
        const text = new TextDecoder().decode(buffer);
        docs = [new Document({ pageContent: text })];
      } else {
        continue; // Skip unsupported file types for now
      }

      // Split documents into chunks
      const textSplitter = new RecursiveCharacterTextSplitter({
        chunkSize: 1000,
        chunkOverlap: 200,
      });

      const splitDocs = await textSplitter.splitDocuments(docs);

      // Store document metadata
      const { data: docEntry } = await supabase
        .from("documents")
        .insert({
          agent_id: params.id,
          filename: file.name,
          type: file.type,
          size: file.size,
        })
        .select()
        .single();

      if (!docEntry) {
        throw new Error("Failed to create document entry");
      }

      // Store vectors in pgvector
      await SupabaseVectorStore.fromDocuments(
        splitDocs.map((doc: Document) => ({
          ...doc,
          metadata: {
            ...doc.metadata,
            agent_id: params.id,
            document_id: docEntry.id,
          },
        })),
        embeddings,
        {
          client: supabase,
          tableName: "document_vectors",
        }
      );

      documents.push(docEntry);
    }

    return NextResponse.json({ documents });
  } catch (error) {
    console.error("Error processing documents:", error);
    return NextResponse.json(
      { error: "Failed to process documents" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get("documentId");

    if (!documentId) {
      return NextResponse.json(
        { error: "Document ID is required" },
        { status: 400 }
      );
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify user has access to this document through the agent
    const { data: document } = await supabase
      .from("documents")
      .select("agent_id")
      .eq("id", documentId)
      .single();

    if (!document) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    // Verify the document belongs to the correct agent
    if (document.agent_id !== params.id) {
      return NextResponse.json(
        { error: "Document not found" },
        { status: 404 }
      );
    }

    const { data: agent } = await supabase
      .from("agents")
      .select("owner_id")
      .eq("id", document.agent_id)
      .single();

    if (!agent || agent.owner_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Delete document vectors
    await supabase
      .from("document_vectors")
      .delete()
      .eq("metadata->>document_id", documentId);

    // Delete document entry
    await supabase.from("documents").delete().eq("id", documentId);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Failed to delete document" },
      { status: 500 }
    );
  }
}
