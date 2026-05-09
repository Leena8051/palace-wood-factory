import { mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";

const UPLOAD_ROOT = path.join(process.cwd(), "public", "uploads");

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];
export const ALLOWED_DOC_TYPES = ["application/pdf"];
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

/**
 * Save an uploaded File to disk under public/uploads/orders/{orderId}/.
 * Returns the public URL (relative).
 */
export async function saveOrderFile(
  orderId: string,
  file: File,
): Promise<{ url: string; fileName: string }> {
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`الملف أكبر من ${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB`);
  }
  if (
    !ALLOWED_IMAGE_TYPES.includes(file.type) &&
    !ALLOWED_DOC_TYPES.includes(file.type)
  ) {
    throw new Error("نوع الملف غير مسموح به");
  }

  const dir = path.join(UPLOAD_ROOT, "orders", orderId);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  const ext = path.extname(file.name) || extensionFromMime(file.type);
  const safe = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
  const filePath = path.join(dir, safe);

  const bytes = await file.arrayBuffer();
  await writeFile(filePath, Buffer.from(bytes));

  return {
    url: `/uploads/orders/${orderId}/${safe}`,
    fileName: file.name,
  };
}

function extensionFromMime(mime: string): string {
  const map: Record<string, string> = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/gif": ".gif",
    "application/pdf": ".pdf",
  };
  return map[mime] ?? "";
}

export function inferFileType(mime: string): "DESIGN" | "PRODUCTION_PHOTO" | "OTHER" {
  if (mime === "application/pdf") return "DESIGN";
  if (mime.startsWith("image/")) return "PRODUCTION_PHOTO";
  return "OTHER";
}
