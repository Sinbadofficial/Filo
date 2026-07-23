/** Compress & resize image in the browser before upload (works on phone + desktop). */
export async function compressImageFile(
  file: File,
  options?: { maxWidth?: number; maxHeight?: number; quality?: number }
): Promise<{ blob: Blob; dataUrl: string; mime: string }> {
  const maxWidth = options?.maxWidth ?? 1000;
  const maxHeight = options?.maxHeight ?? 1000;
  const quality = options?.quality ?? 0.72;

  const objectUrl = URL.createObjectURL(file);

  try {
    const img = await loadImage(objectUrl);
    const { width, height } = fitWithin(img.width, img.height, maxWidth, maxHeight);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Could not process image");

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    const mime = "image/jpeg";
    const dataUrl = canvas.toDataURL(mime, quality);
    const blob = await dataUrlToBlob(dataUrl);

    if (blob.size > 1.8 * 1024 * 1024) {
      // Try harder compression
      const smaller = canvas.toDataURL(mime, 0.55);
      return {
        dataUrl: smaller,
        blob: await dataUrlToBlob(smaller),
        mime,
      };
    }

    return { blob, dataUrl, mime };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function fitWithin(w: number, h: number, maxW: number, maxH: number) {
  const ratio = Math.min(maxW / w, maxH / h, 1);
  return {
    width: Math.max(1, Math.round(w * ratio)),
    height: Math.max(1, Math.round(h * ratio)),
  };
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image. Try JPG or PNG."));
    img.src = src;
  });
}

async function dataUrlToBlob(dataUrl: string) {
  const res = await fetch(dataUrl);
  return res.blob();
}
