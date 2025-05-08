import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const agentId = formData.get("agentId") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!agentId || agentId.trim() === "") {
      return NextResponse.json(
        { error: "Valid agent ID is required" },
        { status: 400 }
      );
    }

    // Process the file based on its type
    let docs;
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    switch (file.type) {
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
          { error: `Unsupported file type: ${file.type}` },
          { status: 400 }
        );
    }

    // Create embeddings and store in Supabase
    const supabase = await createClient();
    const embeddings = new OpenAIEmbeddings();

    await SupabaseVectorStore.fromDocuments(
      docs.map((doc) => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          filename: file.name,
          agent_id: agentId.trim(),
          uploaded_at: new Date().toISOString(),
        },
      })),
      embeddings,
      {
        client: supabase,
        tableName: "document_vectors",
        queryName: "match_documents",
      }
    );

    return NextResponse.json({ success: true, filename: file.name });
  } catch (error) {
    console.error("Error processing document:", error);
    return NextResponse.json(
      { error: "Error processing document" },
      { status: 500 }
    );
  }
}
