import { createClient } from "@/supabase/server";

export interface ImageGenerationConfig {
  width?: number;
  height?: number;
  defaultImage?: string;
  bucketName?: string;
}

const DEFAULT_CONFIG: ImageGenerationConfig = {
  width: 1024,
  height: 1024,
  defaultImage: "/images/default-avatar.png",
  bucketName: "agent-avatars",
};

// Helper function to create a timeout promise
function createTimeoutPromise(timeoutMs: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
  });
}

async function uploadImageToSupabase(
  imageUrl: string,
  fileName: string,
  bucketName: string
): Promise<string> {
  const supabase = await createClient();

  try {
    console.log(
      `Uploading image to Supabase bucket: ${bucketName}, file: ${fileName}`
    );

    // Get the current user
    const { data } = await supabase.auth.getUser();

    if (!data || !data.user || !data.user.id) {
      console.warn("No authenticated user found, using default user ID");
      // Fall back to a default path if no user is found
      return uploadWithoutUser(imageUrl, fileName, bucketName, supabase);
    }

    const user = data.user;
    console.log(`Authenticated as user: ${user.id.substring(0, 8)}...`);

    // Fetch the image from the URL with timeout
    const response = await Promise.race([
      fetch(imageUrl),
      createTimeoutPromise(30000) // 30 second timeout
    ]);
    
    if (!response.ok) {
      console.error(
        `Failed to fetch image: ${response.status} ${response.statusText}`
      );
      throw new Error("Failed to fetch image");
    }
    
    const imageBlob = await response.blob();
    console.log(`Image fetched successfully: ${imageBlob.size} bytes`);

    // Upload to Supabase Storage with metadata
    const filePath = `${user.id}/${fileName}.png`;
    console.log(`Uploading to path: ${filePath}`);

    const { error, data: uploadData } = await supabase.storage
      .from(bucketName)
      .upload(filePath, imageBlob, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage error:", error);
      throw error;
    }

    console.log(`Upload successful: ${uploadData?.path}`);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    console.log(`Generated public URL: ${publicUrl}`);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload image to Supabase:", error);
    throw error;
  }
}

// Fallback function for when no user is authenticated
async function uploadWithoutUser(
  imageUrl: string,
  fileName: string,
  bucketName: string,
  supabase: Awaited<ReturnType<typeof createClient>>
): Promise<string> {
  try {
    console.log("No authenticated user, uploading to public folder");

    // Use a default folder for images without a user
    const defaultPath = `public/${fileName}.png`;

    // Fetch the image from the URL with timeout
    const response = await Promise.race([
      fetch(imageUrl),
      createTimeoutPromise(30000) // 30 second timeout
    ]);
    
    if (!response.ok) {
      console.error(
        `Failed to fetch image from URL: ${response.status} ${response.statusText}`
      );
      throw new Error("Failed to fetch image");
    }
    
    const imageBlob = await response.blob();
    console.log(`Successfully fetched image: ${imageBlob.size} bytes`);

    // Upload to Supabase Storage
    const { error, data } = await supabase.storage
      .from(bucketName)
      .upload(defaultPath, imageBlob, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      throw error;
    }

    console.log("Successfully uploaded image to public folder:", data?.path);

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(defaultPath);

    console.log(`Got public URL: ${publicUrl}`);
    return publicUrl;
  } catch (error) {
    console.error("Failed to upload image without user:", error);
    throw error;
  }
}

// Retry wrapper for uploadImageToSupabase
async function uploadImageToSupabaseWithRetry(
  imageUrl: string,
  fileName: string,
  bucketName: string,
  maxRetries = 3,
  delayMs = 1000
): Promise<string> {
  let lastError: any;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await uploadImageToSupabase(imageUrl, fileName, bucketName);
    } catch (error: any) {
      lastError = error;
      // Only retry on network errors (ECONNRESET, fetch failed, etc.)
      const isNetworkError =
        error?.code === 'ECONNRESET' ||
        error?.name === 'TypeError' ||
        (error?.message && error.message.includes('fetch failed'));
      if (!isNetworkError || attempt === maxRetries) {
        throw error;
      }
      console.warn(`Upload attempt ${attempt} failed, retrying in ${delayMs}ms...`, error);
      await new Promise(res => setTimeout(res, delayMs));
    }
  }
  throw lastError;
}

export async function generateImage(
  prompt: string,
  fileName: string,
  config: Partial<ImageGenerationConfig> = {}
): Promise<string> {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  try {
    console.log(
      `Generating image with DALL-E 3: ${prompt.substring(0, 50)}...`
    );

    // Make a direct call to OpenAI's image generation API with timeout
    const response = await Promise.race([
      fetch(
        "https://api.openai.com/v1/images/generations",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "dall-e-3",
            prompt,
            n: 1,
            size: `${finalConfig.width}x${finalConfig.height}`,
            response_format: "url",
          }),
        }
      ),
      createTimeoutPromise(60000) // 60 second timeout
    ]);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("OpenAI API error:", errorData);
      throw new Error(
        `OpenAI API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("OpenAI image generation successful");

    // Check if the data has the expected structure
    if (!data || !data.data || !data.data[0] || !data.data[0].url) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Invalid response format from OpenAI API");
    }

    const imageUrl = data.data[0].url;
    console.log(
      `Successfully retrieved image URL: ${imageUrl.substring(0, 50)}...`
    );

    // Upload to Supabase and get public URL with timeout
    const publicUrl = await Promise.race([
      uploadImageToSupabaseWithRetry(
        imageUrl,
        fileName,
        finalConfig.bucketName!
      ),
      createTimeoutPromise(45000) // 45 second timeout for upload
    ]);

    console.log(
      `Successfully uploaded image to Supabase: ${publicUrl.substring(
        0,
        50
      )}...`
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

  try {
    return await generateImage(
      `A professional, stylized avatar icon for a ${agentType} named ${name}. Create a minimalist design with soft, adaptive gradients that transition beautifully between light and dark themes. Use clean geometric shapes and a color palette that reflects the agent's purpose, with subtle depth and a modern, elegant aesthetic. The icon should be simple yet distinctive, capturing the essence of ${name}'s role as a ${agentType}.`,
      fileName
    );
  } catch (error) {
    console.error("Error generating agent avatar:", error);
    return "/images/default-avatar.png";
  }
}
