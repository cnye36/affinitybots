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

// Convert base64 string to Uint8Array
function base64ToUint8Array(base64: string): Uint8Array {
  const normalized = base64.replace(/\s/g, "");
  const buffer = Buffer.from(normalized, "base64");
  return new Uint8Array(buffer);
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

// Upload PNG bytes directly to Supabase Storage
async function uploadPngBytesToSupabase(
  pngBytes: Uint8Array,
  fileName: string,
  bucketName: string
): Promise<string> {
  const supabase = await createClient();

  try {
    // Get the current user
    const { data } = await supabase.auth.getUser();

    if (!data || !data.user || !data.user.id) {
      console.warn("No authenticated user found, using default path");
      // Fall back to a default path if no user is found
      const defaultPath = `public/${fileName}.png`;
      const { error } = await supabase.storage
        .from(bucketName)
        .upload(defaultPath, pngBytes, {
          contentType: "image/png",
          upsert: true,
        });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucketName).getPublicUrl(defaultPath);
      return publicUrl;
    }

    const user = data.user;
    const filePath = `${user.id}/${fileName}.png`;

    const { error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, pngBytes, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) throw error;

    const {
      data: { publicUrl },
    } = supabase.storage.from(bucketName).getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error("Failed to upload PNG bytes to Supabase:", error);
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
    console.log(
      `Generating image with gpt-image-1.5: ${prompt.substring(0, 50)}...`
    );

    // Make a direct call to OpenAI's image generation API with timeout
    // gpt-image-1.5 always returns base64 format (doesn't support response_format parameter)
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
            model: "gpt-image-1.5",
            quality: "low",
            prompt,
            n: 1,
            size: `${finalConfig.width}x${finalConfig.height}`,
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

    // gpt-image-1.5 returns base64 in b64_json field
    const first = data?.data?.[0];
    const b64: string | undefined = first?.b64_json;

    if (!b64) {
      console.error("Unexpected API response structure:", data);
      throw new Error("Invalid response format from OpenAI API (expected b64_json)");
    }

    console.log("Successfully retrieved base64 image data");

    // Convert base64 to bytes and upload to Supabase
    const pngBytes = base64ToUint8Array(b64);
    const publicUrl = await Promise.race([
      uploadPngBytesToSupabase(
        pngBytes,
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
  description: string,
  agentType?: string
): Promise<string> {
  // Create a unique filename using name
  const fileName = `${name.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`;

  try {
    // Create a contextual prompt based on the agent's description
    // The description provides the real context about what the agent does
    const contextPrompt = description
      ? `Create a professional, stylized avatar icon for "${name}", an AI agent described as: "${description}".`
      : agentType
      ? `Create a professional, stylized avatar icon for "${name}", a ${agentType} agent.`
      : `Create a professional, stylized avatar icon for "${name}".`;

    const fullPrompt = `${contextPrompt}

MANDATORY BACKGROUND REQUIREMENT - THIS IS CRITICAL:
The background MUST be a very subtle, soft gradient using extremely light pastel colors. 
- ABSOLUTELY NO solid white backgrounds - this is forbidden
- ABSOLUTELY NO pure white (#FFFFFF) - this is forbidden  
- Use a very light gradient with colors like: pale mint green, soft peach, light lavender, cream, very light gray-blue, or soft powder blue
- The gradient should be so light it's barely perceptible but still visible against white UI backgrounds
- Examples of acceptable gradients: cream-to-very-light-gray, pale-mint-to-soft-blue, light-lavender-to-soft-pink
- The entire background must be a gradient, not solid color
- Think: a whisper of color that provides subtle contrast

Design a minimalist, modern icon that visually represents the agent's purpose and domain:
- Clean geometric shapes or abstract symbols that relate to the agent's function
- A cohesive color palette that reflects the agent's purpose and personality
- Subtle depth and modern aesthetics
- Simple yet distinctive design that captures the essence of what this agent does
- The icon should be professional, recognizable, and suitable for use as a small avatar in UI contexts

Remember: The background is a very subtle gradient - never white, never solid color.`;

    return await generateImage(fullPrompt, fileName);
  } catch (error) {
    console.error("Error generating agent avatar:", error);
    return "/images/default-avatar.png";
  }
}
