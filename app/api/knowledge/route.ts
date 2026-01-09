import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { createClient as createServiceClient } from "@supabase/supabase-js";
import { WebPDFLoader } from "@langchain/community/document_loaders/web/pdf";
import mammoth from "mammoth";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as XLSX from "xlsx";
import { getUserPlanType } from "@/lib/subscription/usage";
import { getPlanLimits } from "@/lib/subscription/limits";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    
    const assistantId = (formData.get("assistantId")) as string;
    console.log("[Knowledge API] Received assistantId from formData:", assistantId);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!assistantId || assistantId.trim() === "") {
      console.error(
        "[Knowledge API] Validation failed: assistantId is null, empty, or whitespace. Value:",
        assistantId
      );
      return NextResponse.json(
        { error: "Valid assistant ID is required" },
        { status: 400 }
      );
    }

    const trimmedAssistantId = assistantId.trim();
    console.log(
      "[Knowledge API] Trimmed assistantId to be used in metadata:",
      trimmedAssistantId
    );

    // Validate critical environment variables
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
      console.error("[Knowledge API] Missing NEXT_PUBLIC_SUPABASE_URL env var");
      return NextResponse.json(
        { error: "Server is misconfigured: missing Supabase URL" },
        { status: 500 }
      );
    }
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[Knowledge API] Missing SUPABASE_SERVICE_ROLE_KEY env var");
      return NextResponse.json(
        { error: "Server is misconfigured: missing Supabase service role key" },
        { status: 500 }
      );
    }
    if (!process.env.OPENAI_API_KEY) {
      console.error("[Knowledge API] Missing OPENAI_API_KEY env var");
      return NextResponse.json(
        { error: "Server is misconfigured: missing OpenAI API key" },
        { status: 500 }
      );
    }

    // Authenticate user and check limits
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's plan type and limits
    const planType = await getUserPlanType(user.id);
    const limits = getPlanLimits(planType);

    // Create a service role client to bypass RLS
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Count existing documents for this assistant (excluding URLs)
    const { data: existingDocs } = await serviceClient
      .from("document_vectors")
      .select("metadata")
      .eq("metadata->>assistant_id", trimmedAssistantId)
      .is("metadata->>source_url", null); // Only count uploaded files, not URLs

    const uniqueFilenames = new Set(existingDocs?.map(v => (v.metadata as any)?.filename).filter(Boolean) || []);
    const currentDocCount = uniqueFilenames.size;

    console.log(`[Knowledge API] Current document count: ${currentDocCount}/${limits.maxKnowledgeDocuments}`);

    // Check limit
    if (currentDocCount >= limits.maxKnowledgeDocuments) {
      return NextResponse.json({
        error: `Document limit reached. Your ${limits.displayName} plan allows ${limits.maxKnowledgeDocuments} documents per assistant. Upgrade for more.`,
        currentCount: currentDocCount,
        limit: limits.maxKnowledgeDocuments
      }, { status: 403 });
    }

    // Create an entry in the 'documents' table (no assistant FK required; association is in vectors metadata)
    const { data: documentEntry, error: docError } = await serviceClient
      .from("documents")
      .insert({
        // agent_id is intentionally omitted; moving to assistants-first model
        filename: file.name,
        type: file.type,
        size: file.size,
      })
      .select("id")
      .single();

    if (docError || !documentEntry) {
      console.error("[Knowledge API] Error creating document entry:", docError);
      return NextResponse.json(
        { error: "Failed to create document entry in database" },
        { status: 500 }
      );
    }
    const documentId = documentEntry.id;
    console.log("[Knowledge API] Created document entry with ID:", documentId);

    // Process the file based on its type
    let docs;
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const fileName = file.name.toLowerCase();
    const fileType = file.type;
    const ext = fileName.substring(fileName.lastIndexOf("."));

    // Block code files for now, even if they come in as text/plain
    const blockedCodeExtensions = [
      ".ts", ".tsx", ".js", ".jsx", ".py", ".java", ".go", ".rs",
      ".php", ".rb", ".c", ".cpp", ".h", ".hpp", ".cs", ".sh",
      ".bash", ".zsh", ".swift", ".kt", ".scala", ".sql", ".r",
    ];
    if (blockedCodeExtensions.includes(ext)) {
      return NextResponse.json(
        { error: `Unsupported file type for knowledge: ${ext}. Code files are not yet supported.` },
        { status: 400 }
      );
    }

    // Determine file type by extension if MIME type isn't reliable
    if (
      fileName.endsWith(".csv") ||
      fileType === "text/csv" ||
      fileType === "application/csv"
    ) {
      // CSV Processing - parse as raw text (avoid Node fs loader)
      const csvText = await file.text();
      const initialDoc = {
        pageContent: csvText,
        metadata: {
          source: file.name,
          filetype: "csv",
        },
      };
      docs = await textSplitter.splitDocuments([initialDoc]);
    } else if (
      fileName.endsWith(".xls") ||
      fileName.endsWith(".xlsx") ||
      fileType === "application/vnd.ms-excel" ||
      fileType ===
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // Excel Processing
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer);

      // Process each sheet
      const allSheetDocs = [];
      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        const sheetContent = jsonData
          .map((row: unknown) => JSON.stringify(row))
          .join("\n");

        allSheetDocs.push({
          pageContent: sheetContent,
          metadata: {
            source: file.name,
            sheet: sheetName,
          },
        });
      }

      docs = await textSplitter.splitDocuments(allSheetDocs);
    } else if (fileName.endsWith(".json") || fileType === "application/json") {
      // JSON Processing - handle JSON files as text
      const text = await file.text();
      const initialDoc = {
        pageContent: text,
        metadata: {
          source: file.name,
          filetype: "json",
        },
      };
      docs = await textSplitter.splitDocuments([initialDoc]);
    } else if (fileName.endsWith(".md") || fileType === "text/markdown") {
      // Markdown Processing
      const text = await file.text();
      const initialDoc = {
        pageContent: text,
        metadata: {
          source: file.name,
          filetype: "markdown",
        },
      };
      docs = await textSplitter.splitDocuments([initialDoc]);
    } else if (
      fileName.endsWith(".xml") ||
      fileType === "application/xml" ||
      fileType === "text/xml"
    ) {
      // XML Processing
      const text = await file.text();
      const initialDoc = {
        pageContent: text,
        metadata: {
          source: file.name,
          filetype: "xml",
        },
      };
      docs = await textSplitter.splitDocuments([initialDoc]);
    } else if (
      fileName.endsWith(".docx") ||
      fileType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // DOCX Processing via mammoth
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value || "";
      const initialDoc = {
        pageContent: text,
        metadata: {
          source: file.name,
          filetype: "docx",
        },
      };
      docs = await textSplitter.splitDocuments([initialDoc]);
    } else if (
      fileName.endsWith(".html") ||
      fileName.endsWith(".htm") ||
      fileType === "text/html"
    ) {
      // HTML Processing: naive tag strip for text content
      const raw = await file.text();
      const text = raw.replace(/<script[\s\S]*?<\/script>/gi, " ")
                      .replace(/<style[\s\S]*?<\/style>/gi, " ")
                      .replace(/<[^>]+>/g, " ")
                      .replace(/\s+/g, " ")
                      .trim();
      const initialDoc = {
        pageContent: text,
        metadata: {
          source: file.name,
          filetype: "html",
        },
      };
      docs = await textSplitter.splitDocuments([initialDoc]);
    } else {
      // Handle remaining file types
      switch (fileType) {
        case "application/pdf": {
          const pdfLoader = new WebPDFLoader(file);
          docs = await pdfLoader.load();
          docs = await textSplitter.splitDocuments(docs);
          break;
        }
        case "application/msword": {
          // Legacy .doc not supported reliably in this runtime
          return NextResponse.json(
            { error: `Legacy .doc files are not supported. Please convert to DOCX or PDF.` },
            { status: 400 }
          );
        }
        case "text/plain": {
          const text = await file.text();
          const initialDoc = {
            pageContent: text,
            metadata: {
              source: file.name,
            },
          };
          docs = await textSplitter.splitDocuments([initialDoc]);
          break;
        }
        default:
          return NextResponse.json(
            {
              error: `Unsupported file type: ${fileType} for file ${fileName}`,
            },
            { status: 400 }
          );
      }
    }

    // Create embeddings and store in Supabase
    const embeddings = new OpenAIEmbeddings({ model: "text-embedding-3-small" });

    const documentsWithMetadata = docs.map((doc) => {
      const docMetadata = {
        ...doc.metadata,
        filename: file.name,
        assistant_id: trimmedAssistantId,
        document_id: documentId,
        uploaded_at: new Date().toISOString(),
      };
      console.log("[Knowledge API] Metadata for doc vector:", docMetadata);
      return {
        ...doc,
        metadata: docMetadata,
      };
    });

    try {
      await SupabaseVectorStore.fromDocuments(documentsWithMetadata, embeddings, {
        client: serviceClient,
        tableName: "document_vectors",
        queryName: "match_documents",
      });
    } catch (vectorErr) {
      console.error("[Knowledge API] Error inserting vectors:", vectorErr);
      return NextResponse.json(
        { error: "Failed to store document embeddings. Please try again." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, filename: file.name });
  } catch (error) {
    console.error("[Knowledge API] Error processing document:", error);
    const message = error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const assistantId = url.searchParams.get("assistantId");
    const filename = url.searchParams.get("filename");

    if (!assistantId || !filename) {
      return NextResponse.json(
        { error: "Assistant ID and filename are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const serviceClient = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Locate the document via vectors metadata to support assistants-first model (use service client to bypass RLS)
    const { data: vectorForDoc, error: vectorLookupError } = await serviceClient
      .from("document_vectors")
      .select("metadata")
      .eq("metadata->>assistant_id", assistantId)
      .eq("metadata->>filename", filename)
      .limit(1)
      .maybeSingle();

    if (vectorLookupError || !vectorForDoc?.metadata?.document_id) {
      console.error("[Knowledge API] Error finding document via vectors:", vectorLookupError);
      return NextResponse.json(
        { error: "Document not found for this assistant and filename" },
        { status: 404 }
      );
    }

    const documentId = vectorForDoc.metadata.document_id as string;

    // Delete vector embeddings associated with this document
    const { error: vectorDeleteError } = await serviceClient
      .from("document_vectors")
      .delete()
      .eq("metadata->>document_id", documentId);

    if (vectorDeleteError) {
      console.error(
        "[Knowledge API] Error deleting vector embeddings:",
        vectorDeleteError
      );
      return NextResponse.json(
        { error: "Failed to delete document embeddings" },
        { status: 500 }
      );
    }

    // Delete the document entry
    const { error: docDeleteError } = await serviceClient
      .from("documents")
      .delete()
      .eq("id", documentId);

    if (docDeleteError) {
      console.error(
        "[Knowledge API] Error deleting document entry:",
        docDeleteError
      );
      return NextResponse.json(
        { error: "Failed to delete document entry" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Document '${filename}' successfully removed`,
    });
  } catch (error) {
    console.error("Error deleting document:", error);
    return NextResponse.json(
      { error: "Error deleting document" },
      { status: 500 }
    );
  }
}
