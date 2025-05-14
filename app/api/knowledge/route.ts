import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { CSVLoader } from "@langchain/community/document_loaders/fs/csv";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import * as XLSX from "xlsx";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const agentId = formData.get("agentId") as string;
    console.log("[Knowledge API] Received agentId from formData:", agentId);

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!agentId || agentId.trim() === "") {
      console.error(
        "[Knowledge API] Validation failed: agentId is null, empty, or whitespace. Value:",
        agentId
      );
      return NextResponse.json(
        { error: "Valid agent ID is required" },
        { status: 400 }
      );
    }

    const trimmedAgentId = agentId.trim();
    console.log(
      "[Knowledge API] Trimmed agentId to be used in metadata:",
      trimmedAgentId
    );

    // Create an entry in the 'documents' table
    const supabase = await createClient();
    const { data: documentEntry, error: docError } = await supabase
      .from("documents")
      .insert({
        agent_id: trimmedAgentId,
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

    // Determine file type by extension if MIME type isn't reliable
    if (
      fileName.endsWith(".csv") ||
      fileType === "text/csv" ||
      fileType === "application/csv"
    ) {
      // CSV Processing
      const csvLoader = new CSVLoader(file);
      docs = await csvLoader.load();
      docs = await textSplitter.splitDocuments(docs);
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
    } else {
      // Handle existing file types
      switch (fileType) {
        case "application/pdf":
          const pdfLoader = new PDFLoader(file);
          docs = await pdfLoader.load();
          docs = await textSplitter.splitDocuments(docs);
          break;
        case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        case "application/msword":
          const docxLoader = new DocxLoader(file);
          docs = await docxLoader.load();
          docs = await textSplitter.splitDocuments(docs);
          break;
        case "text/plain":
          const text = await file.text();
          const initialDoc = {
            pageContent: text,
            metadata: {
              source: file.name,
            },
          };
          docs = await textSplitter.splitDocuments([initialDoc]);
          break;
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
    const embeddings = new OpenAIEmbeddings();

    const documentsWithMetadata = docs.map((doc) => {
      const docMetadata = {
        ...doc.metadata,
        filename: file.name,
        agent_id: trimmedAgentId,
        document_id: documentId,
        uploaded_at: new Date().toISOString(),
      };
      console.log("[Knowledge API] Metadata for doc vector:", docMetadata);
      return {
        ...doc,
        metadata: docMetadata,
      };
    });

    await SupabaseVectorStore.fromDocuments(documentsWithMetadata, embeddings, {
      client: supabase,
      tableName: "document_vectors",
      queryName: "match_documents",
    });

    return NextResponse.json({ success: true, filename: file.name });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Error processing document" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const agentId = url.searchParams.get("agentId");
    const filename = url.searchParams.get("filename");

    if (!agentId || !filename) {
      return NextResponse.json(
        { error: "Agent ID and filename are required" },
        { status: 400 }
      );
    }

    const supabase = await createClient();

    // First find the document entry to get its ID
    const { data: documentEntry, error: findError } = await supabase
      .from("documents")
      .select("id")
      .eq("agent_id", agentId)
      .eq("filename", filename)
      .single();

    if (findError || !documentEntry) {
      console.error("[Knowledge API] Error finding document:", findError);
      return NextResponse.json(
        { error: "Document not found in database" },
        { status: 404 }
      );
    }

    const documentId = documentEntry.id;

    // Delete vector embeddings associated with this document
    const { error: vectorDeleteError } = await supabase
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
    const { error: docDeleteError } = await supabase
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
