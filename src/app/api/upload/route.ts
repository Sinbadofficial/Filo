import { NextResponse } from "next/server";
import { requireSession } from "@/lib/session";
import { saveUploadedImage } from "@/lib/upload";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const session = await requireSession(["SUPER_ADMIN"]);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const contentType = request.headers.get("content-type") || "";

    // JSON body: { imageBase64: "data:image/jpeg;base64,..." }
    if (contentType.includes("application/json")) {
      const body = (await request.json()) as { imageBase64?: string; imageUrl?: string };
      const value = body.imageBase64 || body.imageUrl;

      if (!value || typeof value !== "string") {
        return NextResponse.json({ error: "No image provided" }, { status: 400 });
      }

      if (value.startsWith("data:image/")) {
        if (value.length > 2_500_000) {
          return NextResponse.json(
            { error: "Image is too large. Please use a smaller photo." },
            { status: 400 }
          );
        }
        return NextResponse.json({ imageUrl: value });
      }

      if (value.startsWith("http://") || value.startsWith("https://") || value.startsWith("/")) {
        return NextResponse.json({ imageUrl: value });
      }

      return NextResponse.json({ error: "Invalid image data" }, { status: 400 });
    }

    // Multipart form upload
    const formData = await request.formData();
    const file = formData.get("file") ?? formData.get("image") ?? formData.get("photo");

    if (!file || typeof file === "string") {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // File or Blob (mobile browsers may send Blob-like objects)
    const blob = file as Blob;
    const filename =
      "name" in file && typeof (file as File).name === "string"
        ? (file as File).name
        : "photo.jpg";

    const imageUrl = await saveUploadedImage(blob, filename);
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Upload failed" },
      { status: 400 }
    );
  }
}
