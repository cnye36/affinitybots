import { NextResponse } from "next/server";
import { createClient } from "@/supabase/server";
import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { DocxLoader } from "@langchain/community/document_loaders/fs/docx";
import { TextLoader } from "langchain/document_loaders/fs/text";
import { OpenAIEmbeddings } from "@langchain/openai";
import { SupabaseVectorStore } from "@langchain/community/vectorstores/supabase";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const assistantId = formData.get("assistantId") as string;
    
    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
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
        break;
      case "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        const docxLoader = new DocxLoader(file);
        docs = await docxLoader.load();
        break;
      case "text/plain":
        const text = await file.text();
        const textLoader = new TextLoader(text);
        docs = await textLoader.load();
        break;
      default:
        return NextResponse.json(
          { error: "Unsupported file type" },
          { status: 400 }
        );
    }

    const splitDocs = await textSplitter.splitDocuments(docs);

    // Create embeddings and store in Supabase
    const supabase = await createClient();
    const embeddings = new OpenAIEmbeddings();

    await SupabaseVectorStore.fromDocuments(
      splitDocs.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          filename: file.name,
          assistant_id: assistantId,
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