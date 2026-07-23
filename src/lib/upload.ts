const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
  "image/heif",
]);

const EXT_TO_MIME: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};

const MAX_SIZE = 8 * 1024 * 1024; // 8MB raw before convert
const MAX_DATA_URL_CHARS = 2_500_000; // ~1.8MB binary after base64

function getExtension(name: string) {
  const parts = name.split(".");
  return parts.length > 1 ? parts.pop()!.toLowerCase() : "";
}

export function resolveMimeType(file: { type?: string; name?: string }) {
  const raw = (file.type || "").toLowerCase().trim();
  if (raw && ALLOWED_TYPES.has(raw)) return raw === "image/jpg" ? "image/jpeg" : raw;

  const ext = getExtension(file.name || "");
  if (ext && EXT_TO_MIME[ext]) return EXT_TO_MIME[ext];

  // Mobile browsers often send empty MIME for gallery photos
  if (!raw && file.name) return "image/jpeg";
  if (raw.startsWith("image/")) return raw;

  return null;
}

export async function saveUploadedImage(file: File | Blob, filenameHint = "photo.jpg") {
  const name = "name" in file && typeof file.name === "string" ? file.name : filenameHint;
  const mime = resolveMimeType({ type: file.type, name });

  if (!mime) {
    throw new Error("Only image files are allowed (JPEG, PNG, WebP, GIF)");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("Image must be under 8MB. Please choose a smaller photo.");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  if (buffer.length === 0) {
    throw new Error("Empty image file");
  }

  // Store as data URL so it works on Vercel/serverless (no writable filesystem)
  // and survives redeploys. Client should compress before upload.
  const dataUrl = `data:${mime};base64,${buffer.toString("base64")}`;

  if (dataUrl.length > MAX_DATA_URL_CHARS) {
    throw new Error(
      "Image is too large after upload. Please use a smaller photo (under ~1.5MB)."
    );
  }

  // Also try local filesystem for local/dev preview URLs when possible
  if (process.env.VERCEL !== "1" && !process.env.TURSO_DATABASE_URL) {
    try {
      const { writeFile, mkdir } = await import("fs/promises");
      const path = await import("path");
      const { randomUUID } = await import("crypto");
      const ext = getExtension(name) || "jpg";
      const filename = `${randomUUID()}.${ext}`;
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await mkdir(uploadDir, { recursive: true });
      await writeFile(path.join(uploadDir, filename), buffer);
      return `/uploads/${filename}`;
    } catch {
      // Fall through to data URL if filesystem write fails
    }
  }

  return dataUrl;
}

export function isDataUrl(value: string) {
  return value.startsWith("data:image/");
}
