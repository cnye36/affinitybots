import Replicate from "replicate";
import { createClient } from "@/supabase/server";

export interface ImageGenerationConfig {
  width?: number;
  height?: number;
  model?: `${string}/${string}:${string}`;
  defaultImage?: string;
  bucketName?: string;
}

const DEFAULT_CONFIG: ImageGenerationConfig = {
  width: 256,
  height: 256,
  model:
    "stability-ai/sdxl:7762fd07cf82c948538e41f63f77d685e02b063e37e496e96eefd46c929f9bdc" as const,
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
    // Fetch the image from the Replicate URL
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error("Failed to fetch image from Replicate");
    const imageBlob = await response.blob();

    // Upload to Supabase Storage
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(`${fileName}.png`, imageBlob, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) throw error;

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(`${fileName}.png`);

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
  const replicate = new Replicate({
    auth: process.env.REPLICATE_API_TOKEN,
  });

  try {
    const output = await replicate.run(finalConfig.model!, {
      input: {
        prompt,
        width: finalConfig.width,
        height: finalConfig.height,
      },
    });

    const imageUrl = Array.isArray(output) ? output[0] : output;

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
    `A minimalist, professional avatar icon for a ${agentType} named ${name}. Simple, clean, modern design.`,
    fileName
  );
}
