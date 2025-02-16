import { createClient } from "@/supabase/server";
import { DallEAPIWrapper } from "@langchain/openai";

export interface ImageGenerationConfig {
  width?: number;
  height?: number;
  defaultImage?: string;
  bucketName?: string;
}

const DEFAULT_CONFIG: ImageGenerationConfig = {
  width: 256,
  height: 256,
  defaultImage: "/default-avatar.png",
  bucketName: "agent-avatars",
};

async function uploadImageToSupabase(
  imageUrl: string,
  fileName: string,
  bucketName: string
): Promise<string> {
  const supabase = await createClient();

  try {
    // Get the current user
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) throw new Error("User must be authenticated to upload images");

    // Fetch the image from the URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image");
    const imageBlob = await response.blob();

    // Upload to Supabase Storage with metadata
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`${user.id}/${fileName}.png`, imageBlob, {
        contentType: "image/png",
        upsert: true,
        duplex: "half",
      });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage
      .from(bucketName)
      .getPublicUrl(`${user.id}/${fileName}.png`);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload image to Supabase:", error);
    throw error;
  }
}

export async function generateImage(
  prompt: string,
  fileName: string,
  config: Partial<ImageGenerationConfig> = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    const tool = new DallEAPIWrapper({
      n: 1,
      model: "dall-e-3",
      apiKey: process.env.OPENAI_API_KEY,
    });

    const imageUrl = await tool.invoke(prompt);

    // Upload to Supabase and get public URL
    const publicUrl = await uploadImageToSupabase(
      imageUrl,
      fileName,
      finalConfig.bucketName!
    );

    return publicUrl;
  } catch (error) {
    console.error("Failed to generate or upload image:", error);
    return finalConfig.defaultImage!;
  }
}

export async function generateAgentAvatar(
  name: string,
  agentType: string
): Promise<string> {
  // Create a unique filename using name and type
  const fileName = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  return generateImage(
    `A professional, stylized avatar icon for a ${agentType} named ${name}. Create a minimalist design with soft, adaptive gradients that transition beautifully between light and dark themes. Use clean geometric shapes and a color palette that reflects the agent's purpose, with subtle depth and a modern, elegant aesthetic. The icon should be simple yet distinctive, capturing the essence of ${name}'s role as a ${agentType}.`,
    fileName
  );
}
