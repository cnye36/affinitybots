/**
 * Utilities for handling file attachments and image compression
 */

export async function compressImage(
	file: File,
	maxWidth: number = 1600,
	maxHeight: number = 1600,
	quality: number = 0.8
): Promise<string> {
	const imageBitmap = await createImageBitmap(file);
	const scale = Math.min(1, maxWidth / imageBitmap.width, maxHeight / imageBitmap.height);
	const targetWidth = Math.round(imageBitmap.width * scale);
	const targetHeight = Math.round(imageBitmap.height * scale);

	const canvas = new OffscreenCanvas(targetWidth, targetHeight);
	const ctx = canvas.getContext("2d");
	if (!ctx) throw new Error("Canvas context missing");

	ctx.drawImage(imageBitmap, 0, 0, targetWidth, targetHeight);
	const blob = await canvas.convertToBlob({ type: "image/jpeg", quality });

	return new Promise<string>((resolve) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.readAsDataURL(blob);
	});
}

export async function readFileAsText(file: File): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsText(file);
	});
}

export async function readFileAsDataURL(file: File): Promise<string> {
	return new Promise<string>((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = reject;
		reader.readAsDataURL(file);
	});
}

export function isImageFile(file: File): boolean {
	return file.type.startsWith("image/");
}

export function isTextFile(file: File): boolean {
	return file.type.startsWith("text/") || file.name.endsWith(".txt") || file.name.endsWith(".md");
}
