import sharp from "sharp";
import type { ConvertedFile, SupportedFormat, UploadedImage } from "./imageTypeConvert.type.js";

export function normalizeFormat(value: unknown, fallback: SupportedFormat = "webp"): SupportedFormat | null {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback;
  }
  const normalized = value.trim().toLowerCase();
  if (normalized === "jpg") {
    return "jpeg";
  }
  if (normalized === "jpeg" || normalized === "png" || normalized === "webp" || normalized === "avif" || normalized === "tiff") {
    return normalized;
  }
  return null;
}

export async function convertImages(files: UploadedImage[], outputFormat: SupportedFormat): Promise<ConvertedFile[]> {
  const converted: ConvertedFile[] = [];

  for (const file of files) {
    const originalName = file.originalname.replace(/\.[^.]+$/, "");
    const safeName = originalName.trim().length > 0 ? originalName : "converted-image";
    let pipeline = sharp(file.buffer, { failOn: "none" }).rotate();

    if (outputFormat === "jpeg") {
      pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
    } else if (outputFormat === "png") {
      pipeline = pipeline.png({ compressionLevel: 9 });
    } else if (outputFormat === "webp") {
      pipeline = pipeline.webp({ quality: 90 });
    } else if (outputFormat === "avif") {
      pipeline = pipeline.avif({ quality: 55 });
    } else {
      pipeline = pipeline.tiff({ compression: "lzw" });
    }

    const convertedBuffer = await pipeline.toBuffer();
    const metadata = await sharp(convertedBuffer).metadata();
    if (metadata.format !== outputFormat) {
      throw new Error("Output validation failed.");
    }

    converted.push({
      name: `${safeName}.${outputFormat}`,
      data: convertedBuffer,
    });
  }

  return converted;
}
